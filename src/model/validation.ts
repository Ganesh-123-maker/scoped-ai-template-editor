import { isValidElementType } from './elementTypes';
import { isPropertyAllowed } from './properties';
import { TemplateModel, ValidationResult } from './types';

/**
 * Canonical Template Model Validator
 *
 * Validates the structural integrity, type correctness, relational consistency,
 * and property boundary safety of a TemplateModel.
 */
export function validateTemplateModel(template: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Root structure checks
  if (!template || typeof template !== 'object') {
    return { valid: false, errors: ['Template model must be a non-null object.'] };
  }

  const model = template as Partial<TemplateModel>;

  if (!model.templateId || typeof model.templateId !== 'string') {
    errors.push('Template is missing a valid string "templateId".');
  }

  if (!model.name || typeof model.name !== 'string') {
    errors.push('Template is missing a valid string "name".');
  }

  if (typeof model.version !== 'number' || model.version < 1) {
    errors.push('Template "version" must be a positive integer >= 1.');
  }

  if (!Array.isArray(model.rootElementIds) || model.rootElementIds.length === 0) {
    errors.push('Template must have a non-empty "rootElementIds" array.');
  }

  if (!model.elements || typeof model.elements !== 'object') {
    errors.push('Template must have a valid "elements" dictionary.');
    return { valid: errors.length === 0, errors, warnings };
  }

  const elements = model.elements;
  const elementIds = new Set(Object.keys(elements));

  // 2. Root element existence
  if (Array.isArray(model.rootElementIds)) {
    for (const rootId of model.rootElementIds) {
      if (!elementIds.has(rootId)) {
        errors.push(`Root element ID "${rootId}" does not exist in elements dictionary.`);
      }
    }
  }

  // 3. Per-element structural and property boundary checks
  for (const [id, element] of Object.entries(elements)) {
    if (!element || typeof element !== 'object') {
      errors.push(`Element "${id}" must be a valid object.`);
      continue;
    }

    if (element.id !== id) {
      errors.push(`Element ID mismatch: key "${id}" vs element.id "${element.id}".`);
    }

    if (!element.name || typeof element.name !== 'string') {
      warnings.push(`Element "${id}" has missing or non-string "name".`);
    }

    if (!isValidElementType(element.type)) {
      errors.push(`Element "${id}" has unsupported type "${element.type}".`);
    }

    // Revision check
    if (typeof element.revision !== 'number' || element.revision < 1) {
      warnings.push(`Element "${id}" should have positive revision number.`);
    }

    // Parent existence and bidirectional consistency
    if (element.parentId) {
      if (!elementIds.has(element.parentId)) {
        errors.push(`Element "${id}" references non-existent parentId "${element.parentId}".`);
      } else {
        const parent = elements[element.parentId];
        if (!parent.children || !parent.children.includes(id)) {
          errors.push(
            `Bidirectional integrity error: Element "${id}" has parentId "${element.parentId}", but parent does not list it in "children".`
          );
        }
      }
    }

    // Children existence and bidirectional consistency
    if (element.children) {
      if (!Array.isArray(element.children)) {
        errors.push(`Element "${id}" children property must be an array.`);
      } else {
        for (const childId of element.children) {
          if (!elementIds.has(childId)) {
            errors.push(`Element "${id}" lists non-existent childId "${childId}".`);
          } else {
            const child = elements[childId];
            if (child && child.parentId !== id) {
              errors.push(
                `Bidirectional integrity error: Element "${id}" lists child "${childId}", but child has parentId "${child.parentId}".`
              );
            }
          }
        }
      }
    }

    // Circular reference check
    const visited = new Set<string>();
    let currentParent = element.parentId;
    while (currentParent) {
      if (visited.has(currentParent)) {
        errors.push(`Circular parent hierarchy detected starting at element "${id}".`);
        break;
      }
      visited.add(currentParent);
      currentParent = elements[currentParent]?.parentId;
    }

    // Base properties boundary check
    if (!element.base || typeof element.base !== 'object') {
      errors.push(`Element "${id}" must have a valid "base" properties object.`);
    } else if (isValidElementType(element.type)) {
      for (const propKey of Object.keys(element.base)) {
        if (!isPropertyAllowed(element.type, propKey as any)) {
          warnings.push(
            `Property boundary warning: Property "${propKey}" is not standard for element type "${element.type}" on element "${id}".`
          );
        }
      }
    }

    // Viewport overrides check
    if (element.overrides && typeof element.overrides === 'object') {
      const allowedOverrides = new Set(['desktop', 'tablet', 'mobile']);
      for (const [vpKey, vpOverride] of Object.entries(element.overrides)) {
        if (!allowedOverrides.has(vpKey)) {
          errors.push(`Element "${id}" contains invalid override viewport key "${vpKey}".`);
          continue;
        }
        if (vpOverride && typeof vpOverride === 'object' && isValidElementType(element.type)) {
          for (const propKey of Object.keys(vpOverride)) {
            if (!isPropertyAllowed(element.type, propKey as any)) {
              warnings.push(
                `Override property boundary warning: Property "${propKey}" in "${vpKey}" override is not standard for "${element.type}" on element "${id}".`
              );
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
