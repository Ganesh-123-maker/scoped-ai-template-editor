import { ElementType } from './elementTypes';
import { EditableProperties } from './properties';

/**
 * Element Model Definition
 * Represents a single atomic or composite node in the canonical template tree.
 */
export interface ElementModel {
  /** Stable semantic identifier */
  id: string;
  /** Human-readable display label */
  name: string;
  /** Finite element type descriptor */
  type: ElementType;
  /** ID of parent element, or undefined if top-level root */
  parentId?: string;
  /** Ordered list of child element IDs */
  children?: string[];
  /** Base (shared) properties that cascade across all viewports */
  base: EditableProperties;
  /** Viewport-specific overrides with highest precedence per screen size */
  overrides: {
    desktop?: Partial<EditableProperties>;
    tablet?: Partial<EditableProperties>;
    mobile?: Partial<EditableProperties>;
  };
  /** Monotonically increasing revision number for optimistic concurrency */
  revision: number;
  /** Visual display or sibling ordering index */
  order?: number;
}

/**
 * Creates a clean ElementModel with normalized default structures.
 */
export function createElementModel(params: {
  id: string;
  name: string;
  type: ElementType;
  parentId?: string;
  children?: string[];
  base?: EditableProperties;
  overrides?: {
    desktop?: Partial<EditableProperties>;
    tablet?: Partial<EditableProperties>;
    mobile?: Partial<EditableProperties>;
  };
  revision?: number;
  order?: number;
}): ElementModel {
  return {
    id: params.id,
    name: params.name,
    type: params.type,
    parentId: params.parentId,
    children: params.children ? [...params.children] : undefined,
    base: params.base ? { ...params.base } : {},
    overrides: {
      desktop: params.overrides?.desktop ? { ...params.overrides.desktop } : undefined,
      tablet: params.overrides?.tablet ? { ...params.overrides.tablet } : undefined,
      mobile: params.overrides?.mobile ? { ...params.overrides.mobile } : undefined,
    },
    revision: params.revision ?? 1,
    order: params.order,
  };
}

/**
 * Deep clones an ElementModel to prevent accidental mutation.
 */
export function cloneElement(element: ElementModel): ElementModel {
  return {
    ...element,
    children: element.children ? [...element.children] : undefined,
    base: { ...element.base },
    overrides: {
      desktop: element.overrides?.desktop ? { ...element.overrides.desktop } : undefined,
      tablet: element.overrides?.tablet ? { ...element.overrides.tablet } : undefined,
      mobile: element.overrides?.mobile ? { ...element.overrides.mobile } : undefined,
    },
  };
}
