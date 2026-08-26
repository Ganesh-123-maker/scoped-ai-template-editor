import { ElementType } from './elementTypes';

/**
 * Strongly Typed Editable Properties
 * Categorized into Content, Typography, Appearance, Layout, Spacing, and Structural Metadata.
 */
export interface EditableProperties {
  // --- Content ---
  text?: string;
  label?: string;
  badgeText?: string;
  href?: string;
  src?: string;
  alt?: string;
  iconName?: string;

  // --- Typography ---
  fontSize?: number; // In pixels
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | string;
  lineHeight?: number | string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: string;
  color?: string;

  // --- Appearance ---
  backgroundColor?: string;
  opacity?: number; // 0 to 1
  border?: string;
  borderColor?: string;
  borderWidth?: number; // In pixels
  borderRadius?: number; // In pixels
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | string;

  // --- Layout ---
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  height?: string;
  minHeight?: string;
  x?: number;
  y?: number;
  display?: 'block' | 'inline-block' | 'flex' | 'grid' | 'inline-flex' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline' | 'flex-start' | 'flex-end';
  justifyContent?:
    | 'start'
    | 'center'
    | 'end'
    | 'between'
    | 'around'
    | 'evenly'
    | 'flex-start'
    | 'flex-end'
    | 'space-between'
    | 'space-around';
  gap?: number; // In pixels
  gridColumns?: number;

  // --- Spacing ---
  margin?: number | string;
  marginTop?: number;
  marginBottom?: number;
  padding?: number | string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;

  // --- Structural Metadata ---
  parentId?: string;
  children?: string[];
  order?: number;
}

/**
 * Whitelist of all allowed property keys across any element type.
 */
export const ALLOWED_EDITABLE_FIELDS = new Set<keyof EditableProperties>([
  'text',
  'label',
  'badgeText',
  'href',
  'src',
  'alt',
  'iconName',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'letterSpacing',
  'color',
  'backgroundColor',
  'opacity',
  'border',
  'borderColor',
  'borderWidth',
  'borderRadius',
  'shadow',
  'width',
  'maxWidth',
  'height',
  'x',
  'y',
  'display',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'gap',
  'gridColumns',
  'margin',
  'marginTop',
  'marginBottom',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'parentId',
  'children',
  'order',
]);

/**
 * Runtime Property Boundaries by Element Type
 * Defines exactly which properties can be safely edited for each specific element type.
 */
export const editableFieldsByType: Record<ElementType, (keyof EditableProperties)[]> = {
  heading: [
    'text',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'textAlign',
    'letterSpacing',
    'color',
    'marginTop',
    'marginBottom',
    'margin',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'opacity',
  ],
  button: [
    'text',
    'label',
    'href',
    'fontSize',
    'fontWeight',
    'color',
    'backgroundColor',
    'borderColor',
    'borderWidth',
    'borderRadius',
    'shadow',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'width',
    'height',
    'textAlign',
    'opacity',
  ],
  text: [
    'text',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'textAlign',
    'letterSpacing',
    'color',
    'maxWidth',
    'marginTop',
    'marginBottom',
    'margin',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'opacity',
  ],
  badge: [
    'text',
    'badgeText',
    'fontSize',
    'fontWeight',
    'color',
    'backgroundColor',
    'borderColor',
    'borderWidth',
    'borderRadius',
    'letterSpacing',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'marginBottom',
    'opacity',
  ],
  section: [
    'backgroundColor',
    'borderColor',
    'borderWidth',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'padding',
    'width',
    'display',
    'opacity',
  ],
  container: [
    'display',
    'flexDirection',
    'alignItems',
    'justifyContent',
    'gap',
    'maxWidth',
    'width',
    'height',
    'backgroundColor',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'margin',
    'marginTop',
    'marginBottom',
    'textAlign',
    'opacity',
  ],
  card: [
    'backgroundColor',
    'borderColor',
    'borderWidth',
    'borderRadius',
    'shadow',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'maxWidth',
    'width',
    'height',
    'display',
    'flexDirection',
    'alignItems',
    'textAlign',
    'opacity',
  ],
  grid: [
    'display',
    'gridColumns',
    'gap',
    'width',
    'maxWidth',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'opacity',
  ],
  'nav-item': [
    'text',
    'href',
    'fontSize',
    'fontWeight',
    'color',
    'padding',
    'paddingLeft',
    'paddingRight',
    'display',
    'opacity',
  ],
  logo: [
    'text',
    'fontSize',
    'fontWeight',
    'color',
    'letterSpacing',
    'src',
    'alt',
    'width',
    'height',
    'opacity',
  ],
  nav: [
    'display',
    'flexDirection',
    'alignItems',
    'justifyContent',
    'gap',
    'width',
    'opacity',
  ],
  testimonial: [
    'backgroundColor',
    'borderColor',
    'borderWidth',
    'borderRadius',
    'shadow',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'maxWidth',
    'width',
    'opacity',
  ],
  image: [
    'src',
    'alt',
    'width',
    'height',
    'borderRadius',
    'borderColor',
    'borderWidth',
    'opacity',
  ],
  'icon-box': [
    'iconName',
    'color',
    'backgroundColor',
    'borderRadius',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'width',
    'height',
    'opacity',
  ],
};

/**
 * Checks if a property is valid and permitted for a specific element type.
 */
export function isPropertyAllowed(type: ElementType, property: keyof EditableProperties): boolean {
  const allowed = editableFieldsByType[type];
  if (!allowed) return false;
  return allowed.includes(property);
}
