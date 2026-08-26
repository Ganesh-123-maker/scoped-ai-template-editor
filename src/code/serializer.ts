import { EditableProperties, ElementModel, TemplateModel, Viewport } from '../types/template';

/**
 * Deterministic property ordering for EditableProperties
 */
const CANONICAL_PROPERTY_ORDER: (keyof EditableProperties)[] = [
  'text',
  'label',
  'badgeText',
  'href',
  'src',
  'alt',
  'iconName',
  'fontSize',
  'fontWeight',
  'color',
  'textAlign',
  'lineHeight',
  'letterSpacing',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'borderRadius',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'marginTop',
  'marginBottom',
  'width',
  'maxWidth',
  'minWidth',
  'height',
  'minHeight',
  'display',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'gap',
  'gridColumns',
  'shadow',
  'opacity',
];

/**
 * Sorts object keys deterministically based on canonical order followed by alphabetical
 */
function sortProperties(props: Partial<EditableProperties>): Partial<EditableProperties> {
  const result: any = {};
  const presentKeys = Object.keys(props) as (keyof EditableProperties)[];

  // First canonical keys
  for (const key of CANONICAL_PROPERTY_ORDER) {
    if (key in props && props[key] !== undefined) {
      result[key] = props[key];
    }
  }

  // Any remaining extra keys sorted alphabetically
  const remainingKeys = presentKeys.filter((k) => !CANONICAL_PROPERTY_ORDER.includes(k)).sort();
  for (const key of remainingKeys) {
    if (props[key] !== undefined) {
      result[key] = props[key];
    }
  }

  return result;
}

/**
 * Serializes an ElementModel with deterministic key order
 */
function sortElementModel(element: ElementModel): any {
  const sorted: any = {
    id: element.id,
    name: element.name,
    type: element.type,
  };

  if (element.parentId !== undefined) {
    sorted.parentId = element.parentId;
  }

  if (element.children && element.children.length > 0) {
    sorted.children = [...element.children];
  }

  sorted.base = sortProperties(element.base || {});

  if (element.overrides && Object.keys(element.overrides).length > 0) {
    const overrides: any = {};
    const vpOrder: ('desktop' | 'tablet' | 'mobile')[] = ['desktop', 'tablet', 'mobile'];
    for (const vp of vpOrder) {
      if (element.overrides[vp] && Object.keys(element.overrides[vp]!).length > 0) {
        overrides[vp] = sortProperties(element.overrides[vp]!);
      }
    }
    if (Object.keys(overrides).length > 0) {
      sorted.overrides = overrides;
    }
  }

  if (element.revision !== undefined) {
    sorted.revision = element.revision;
  }

  return sorted;
}

/**
 * Traverses element tree to produce a hierarchical list of element IDs,
 * ensuring deterministic element ordering matching the document structure.
 */
function getHierarchicalElementIds(template: TemplateModel): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  function traverse(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    result.push(id);

    const el = template.elements[id];
    if (el && el.children) {
      for (const childId of el.children) {
        traverse(childId);
      }
    }
  }

  for (const rootId of template.rootElementIds || []) {
    traverse(rootId);
  }

  // Append any orphaned or detached elements in alphabetical order
  const allIds = Object.keys(template.elements).sort();
  for (const id of allIds) {
    if (!visited.has(id)) {
      result.push(id);
    }
  }

  return result;
}

/**
 * Deterministically serializes a canonical TemplateModel into a formatted JSON string.
 * Guarantees that the exact same template state will ALWAYS produce the exact same byte-for-byte string.
 */
export function serializeTemplate(template: TemplateModel): string {
  const elementIds = getHierarchicalElementIds(template);
  const elementsSorted: Record<string, any> = {};

  for (const id of elementIds) {
    const el = template.elements[id];
    if (el) {
      elementsSorted[id] = sortElementModel(el);
    }
  }

  const deterministicObject = {
    templateId: template.templateId,
    name: template.name,
    version: template.version,
    rootElementIds: [...(template.rootElementIds || [])],
    elements: elementsSorted,
  };

  return JSON.stringify(deterministicObject, null, 2);
}
