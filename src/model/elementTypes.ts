/**
 * Element Type Definitions
 * Finite set of supported element types for the Scoped AI Template Editor
 */

export type ElementType =
  | 'section'
  | 'container'
  | 'text'
  | 'heading'
  | 'button'
  | 'image'
  | 'nav'
  | 'logo'
  | 'card'
  | 'testimonial'
  | 'badge'
  | 'grid'
  | 'nav-item'
  | 'icon-box';

export const SUPPORTED_ELEMENT_TYPES: readonly ElementType[] = [
  'section',
  'container',
  'text',
  'heading',
  'button',
  'image',
  'nav',
  'logo',
  'card',
  'testimonial',
  'badge',
  'grid',
  'nav-item',
  'icon-box',
] as const;

export function isValidElementType(type: unknown): type is ElementType {
  return typeof type === 'string' && (SUPPORTED_ELEMENT_TYPES as readonly string[]).includes(type);
}
