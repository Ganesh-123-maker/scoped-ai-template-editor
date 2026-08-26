import { ActiveViewport, EditableProperties, ElementModel, PreviewViewport } from '../model/types';
import { PropertyOverrideStatus, ResolvedElement } from './types';

/**
 * Responsive Resolution Engine
 *
 * Contract & Invariants:
 * 1. Desktop: desktop override -> base
 * 2. Tablet: tablet override -> base
 * 3. Mobile: mobile override -> base
 * 4. STRICTLY NO CROSS-VIEWPORT FALL-THROUGH:
 *    Mobile never falls through to Tablet.
 *    Tablet never falls through to Desktop.
 *    Desktop never falls through to Mobile.
 * 5. Base serves as the shared universal fallback when a specific viewport override is undefined.
 * 6. Partial property overrides safely retain base values for un-overridden fields.
 * 7. Resolution is pure and immutable: it never mutates the original ElementModel.
 */

/**
 * Helper to deep-merge a base object/value with a viewport override object/value.
 * If override value is a nested object, keys are merged recursively.
 * If override is a primitive, it replaces the base primitive.
 */
function mergePropertyValue(baseVal: any, overrideVal: any): any {
  if (overrideVal === undefined) {
    return baseVal;
  }
  if (baseVal === undefined) {
    return overrideVal;
  }
  if (
    typeof baseVal === 'object' &&
    baseVal !== null &&
    !Array.isArray(baseVal) &&
    typeof overrideVal === 'object' &&
    overrideVal !== null &&
    !Array.isArray(overrideVal)
  ) {
    const merged: Record<string, any> = { ...baseVal };
    for (const [k, v] of Object.entries(overrideVal)) {
      if (v !== undefined) {
        merged[k] = mergePropertyValue(baseVal[k], v);
      }
    }
    return merged;
  }
  return overrideVal;
}

/**
 * Resolves a single property value for an element at a given viewport.
 */
export function resolveProperty<K extends keyof EditableProperties>(
  element: ElementModel,
  property: K,
  viewport: ActiveViewport | PreviewViewport
): EditableProperties[K] {
  if (!element) return undefined;

  const override = element.overrides?.[viewport];
  const overrideVal = override?.[property];

  if (overrideVal !== undefined) {
    const baseVal = element.base?.[property];
    return mergePropertyValue(baseVal, overrideVal);
  }

  return element.base?.[property];
}

/**
 * Resolves all effective properties for an element at a given viewport.
 * Produces a clean, flattened EditableProperties object.
 */
export function resolveProperties(
  element: ElementModel,
  viewport: ActiveViewport | PreviewViewport
): EditableProperties {
  if (!element) return {};

  const base = element.base || {};
  const override = element.overrides?.[viewport] || {};

  const resolved: EditableProperties = { ...base };

  for (const [key, val] of Object.entries(override)) {
    if (val !== undefined) {
      (resolved as any)[key] = mergePropertyValue((base as any)[key], val);
    }
  }

  return resolved;
}

/**
 * Resolves an ElementModel into a fully flattened ResolvedElement.
 */
export function resolveElement(
  element: ElementModel,
  viewport: ActiveViewport | PreviewViewport
): ResolvedElement {
  if (!element) {
    throw new Error('Cannot resolve an undefined or null element.');
  }

  return {
    id: element.id,
    name: element.name,
    type: element.type,
    parentId: element.parentId,
    children: element.children ? [...element.children] : undefined,
    properties: resolveProperties(element, viewport),
    revision: element.revision,
    order: element.order,
  };
}

/**
 * Resolves an entire dictionary of elements for a given viewport.
 */
export function resolveAllElements(
  elements: Record<string, ElementModel>,
  viewport: ActiveViewport | PreviewViewport
): Record<string, ResolvedElement> {
  const resolved: Record<string, ResolvedElement> = {};
  for (const [id, element] of Object.entries(elements)) {
    resolved[id] = resolveElement(element, viewport);
  }
  return resolved;
}

/**
 * Checks whether a specific property has an explicit viewport override.
 */
export function hasViewportOverride(
  element: ElementModel,
  viewport: ActiveViewport | PreviewViewport,
  property: keyof EditableProperties
): boolean {
  if (!element || !element.overrides || !element.overrides[viewport]) return false;
  return element.overrides[viewport]![property] !== undefined;
}

/**
 * Checks if an element has any overrides on the given viewport.
 */
export function hasAnyViewportOverride(
  element: ElementModel,
  viewport: ActiveViewport | PreviewViewport
): boolean {
  if (!element || !element.overrides || !element.overrides[viewport]) return false;
  const ov = element.overrides[viewport]!;
  return Object.keys(ov).length > 0;
}

/**
 * Returns comprehensive override status metadata for inspection UI.
 */
export function getPropertyOverrideStatus<K extends keyof EditableProperties>(
  element: ElementModel,
  viewport: ActiveViewport,
  property: K
): PropertyOverrideStatus<EditableProperties[K]> {
  const baseValue = element.base?.[property];
  const overrideValue = element.overrides?.[viewport]?.[property];
  const hasOverride = overrideValue !== undefined;
  const effectiveValue = hasOverride
    ? mergePropertyValue(baseValue, overrideValue)
    : baseValue;

  return {
    property,
    value: effectiveValue,
    source: hasOverride ? 'override' : 'base',
    hasOverride,
    activeViewport: viewport,
    baseValue,
    overrideValue,
  };
}

// Backward compatibility alias for resolveElementProperties
export const resolveElementProperties = resolveProperties;
