import { ActiveViewport, EditableProperties, ElementModel, ElementType, PreviewViewport, Viewport } from '../model/types';

/**
 * Viewport Configuration Interface
 */
export interface ViewportDefinition {
  id: ActiveViewport;
  width: number;
  label: string;
  shortLabel: string;
  description: string;
}

/**
 * Resolved Element Model
 * Fully flattened, ready for deterministic rendering on a specific viewport.
 */
export interface ResolvedElement {
  id: string;
  name: string;
  type: ElementType;
  parentId?: string;
  children?: string[];
  properties: EditableProperties;
  revision: number;
  order?: number;
}

/**
 * Property Override Status
 */
export interface PropertyOverrideStatus<T = any> {
  property: keyof EditableProperties;
  value: T;
  source: 'override' | 'base';
  hasOverride: boolean;
  activeViewport: ActiveViewport;
  baseValue: T;
  overrideValue?: T;
}
