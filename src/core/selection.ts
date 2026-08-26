import { EditableProperties, ElementModel, ElementType } from '../types/template';
import { editableFieldsByType, isPropertyAllowed } from '../model/properties';

export interface MultiSelectPropertyStatus<T = any> {
  key: keyof EditableProperties;
  label: string;
  isMixed: boolean;
  value: T | 'mixed';
  isApplicableToAll: boolean;
  supportedCount: number;
}

/**
 * Returns list of property keys that are supported by ALL selected elements.
 */
export function getCommonEditableProperties(
  elements: ElementModel[]
): (keyof EditableProperties)[] {
  if (!elements || elements.length === 0) return [];
  if (elements.length === 1) {
    return editableFieldsByType[elements[0].type] || [];
  }

  // Get allowed fields for each element
  const fieldSets = elements.map(
    (el) => new Set<keyof EditableProperties>(editableFieldsByType[el.type] || [])
  );

  // Intersection of all field sets
  const commonFields = Array.from(fieldSets[0]).filter((field) =>
    fieldSets.every((set) => set.has(field))
  );

  return commonFields;
}

/**
 * Checks if a property value is identical across multiple element values, or if it is mixed.
 */
export function getMultiPropertyValue<T = any>(
  elements: ElementModel[],
  propertyKey: keyof EditableProperties,
  getValue: (el: ElementModel) => T | undefined
): { isMixed: boolean; value: T | 'mixed' | undefined } {
  if (!elements || elements.length === 0) {
    return { isMixed: false, value: undefined };
  }

  const values = elements.map(getValue);
  const firstVal = values[0];
  const allIdentical = values.every((v) => v === firstVal);

  if (allIdentical) {
    return { isMixed: false, value: firstVal };
  }

  return { isMixed: true, value: 'mixed' };
}

/**
 * Helper to generate unique stable copy IDs for duplicate operations
 */
export function generateUniqueElementId(baseId: string, existingIds: Set<string>): string {
  // If baseId already ends in -copy or -copy-N, strip it to find root
  const cleanBase = baseId.replace(/-copy(-\d+)?$/, '');
  
  let candidate = `${cleanBase}-copy`;
  if (!existingIds.has(candidate)) {
    return candidate;
  }

  let counter = 2;
  while (existingIds.has(`${cleanBase}-copy-${counter}`)) {
    counter++;
  }

  return `${cleanBase}-copy-${counter}`;
}
