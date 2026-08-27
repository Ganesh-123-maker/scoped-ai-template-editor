import { isValidElementType, SUPPORTED_ELEMENT_TYPES } from '../model/elementTypes';
import { ALLOWED_EDITABLE_FIELDS, isPropertyAllowed } from '../model/properties';
import { ElementModel, TemplateModel } from '../types/template';
import { CodeError } from './types';

/**
 * Validates a single property value against type boundaries and physical ranges.
 */
export function validatePropertyValue(
  prop: string,
  value: unknown
): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true };
  }

  switch (prop) {
    case 'fontSize':
      if (typeof value !== 'number' || isNaN(value) || value <= 0 || value > 250) {
        return { valid: false, error: `Font size must be a number between 1 and 250, got ${value}.` };
      }
      return { valid: true };

    case 'opacity':
      if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 1) {
        return { valid: false, error: `Opacity must be a number between 0 and 1, got ${value}.` };
      }
      return { valid: true };

    case 'fontWeight':
      if (typeof value === 'number') {
        if (value < 100 || value > 900) {
          return { valid: false, error: `Font weight numeric value must be between 100 and 900, got ${value}.` };
        }
      } else if (typeof value === 'string') {
        const validWeights = new Set(['normal', 'medium', 'semibold', 'bold', 'extrabold', '100', '200', '300', '400', '500', '600', '700', '800', '900']);
        if (!validWeights.has(value)) {
          return { valid: false, error: `Invalid font weight string "${value}".` };
        }
      } else {
        return { valid: false, error: 'Font weight must be a string or number.' };
      }
      return { valid: true };

    case 'textAlign':
      if (typeof value !== 'string' || !['left', 'center', 'right', 'justify'].includes(value)) {
        return { valid: false, error: `Text align must be 'left', 'center', 'right', or 'justify', got "${value}".` };
      }
      return { valid: true };

    case 'borderRadius':
    case 'borderWidth':
    case 'padding':
    case 'paddingTop':
    case 'paddingBottom':
    case 'paddingLeft':
    case 'paddingRight':
    case 'gap':
    case 'gridColumns':
    case 'x':
    case 'y':
      if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 1000) {
        return { valid: false, error: `${prop} must be a non-negative number <= 1000, got ${value}.` };
      }
      return { valid: true };

    case 'margin':
    case 'marginTop':
    case 'marginBottom':
    case 'marginLeft':
    case 'marginRight':
      if (typeof value !== 'number' && typeof value !== 'string') {
        return { valid: false, error: `${prop} must be a number or string.` };
      }
      if (typeof value === 'number' && (isNaN(value) || Math.abs(value) > 1000)) {
        return { valid: false, error: `${prop} number value must be <= 1000.` };
      }
      return { valid: true };

    case 'lineHeight':
    case 'letterSpacing':
    case 'width':
    case 'maxWidth':
    case 'minWidth':
    case 'height':
    case 'minHeight':
      if (typeof value !== 'string' && typeof value !== 'number') {
        return { valid: false, error: `${prop} must be a string or number.` };
      }
      return { valid: true };

    case 'text':
    case 'label':
    case 'badgeText':
    case 'href':
    case 'src':
    case 'alt':
    case 'iconName':
    case 'color':
    case 'backgroundColor':
    case 'borderColor':
    case 'border':
    case 'shadow':
    case 'display':
    case 'flexDirection':
    case 'alignItems':
    case 'justifyContent':
      if (typeof value !== 'string') {
        return { valid: false, error: `${prop} must be a string.` };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Forbidden security tokens that must never appear in template code
 */
const FORBIDDEN_TOKENS = [
  '<script',
  '</script',
  'javascript:',
  'eval(',
  'new Function(',
  'window.',
  'document.',
  'fetch(',
  'localStorage',
  'sessionStorage',
  'import ',
  'require(',
  'process.',
  'globalThis',
];

/**
 * Scans raw code for forbidden JavaScript execution or injection patterns.
 */
export function validateSecurityTokens(source: string): CodeError[] {
  const errors: CodeError[] = [];
  const lower = source.toLowerCase();

  for (const token of FORBIDDEN_TOKENS) {
    const index = lower.indexOf(token.toLowerCase());
    if (index !== -1) {
      // Calculate approximate line and column
      const linesBefore = source.slice(0, index).split('\n');
      const line = linesBefore.length;
      const column = linesBefore[linesBefore.length - 1].length + 1;

      errors.push({
        code: 'FORBIDDEN_EXECUTABLE_CODE',
        message: `Security violation: Template code must not contain executable JavaScript or forbidden token "${token}".`,
        line,
        column,
      });
    }
  }

  return errors;
}

/**
 * Validates the parsed template structure, element types, hierarchy, and properties.
 */
export function validateParsedTemplate(template: any): { valid: boolean; errors: CodeError[]; warnings: CodeError[] } {
  const errors: CodeError[] = [];
  const warnings: CodeError[] = [];

  if (!template || typeof template !== 'object' || Array.isArray(template)) {
    errors.push({
      code: 'INVALID_ROOT',
      message: 'Template root must be a valid JSON object.',
    });
    return { valid: false, errors, warnings };
  }

  // 1. Root fields
  if (!template.templateId || typeof template.templateId !== 'string') {
    errors.push({
      code: 'MISSING_TEMPLATE_ID',
      message: 'Template is missing a valid string "templateId".',
    });
  }

  if (!template.name || typeof template.name !== 'string') {
    errors.push({
      code: 'MISSING_TEMPLATE_NAME',
      message: 'Template is missing a valid string "name".',
    });
  }

  if (typeof template.version !== 'number' || template.version < 1) {
    errors.push({
      code: 'INVALID_VERSION',
      message: 'Template "version" must be a positive integer >= 1.',
    });
  }

  if (!Array.isArray(template.rootElementIds) || template.rootElementIds.length === 0) {
    errors.push({
      code: 'INVALID_ROOT_ELEMENT_IDS',
      message: 'Template must contain a non-empty "rootElementIds" array.',
    });
  }

  if (!template.elements || typeof template.elements !== 'object' || Array.isArray(template.elements)) {
    errors.push({
      code: 'INVALID_ELEMENTS_MAP',
      message: 'Template must contain a valid "elements" object dictionary.',
    });
    return { valid: false, errors, warnings };
  }

  const elements = template.elements as Record<string, any>;
  const elementIds = new Set(Object.keys(elements));

  // 2. Root element existence
  if (Array.isArray(template.rootElementIds)) {
    for (const rootId of template.rootElementIds) {
      if (!elementIds.has(rootId)) {
        errors.push({
          code: 'MISSING_ROOT_ELEMENT',
          message: `Root element ID "${rootId}" does not exist in elements dictionary.`,
          elementId: rootId,
        });
      }
    }
  }

  // 3. Per-element validation
  for (const [key, el] of Object.entries(elements)) {
    if (!el || typeof el !== 'object' || Array.isArray(el)) {
      errors.push({
        code: 'INVALID_ELEMENT_OBJECT',
        message: `Element "${key}" must be a non-null object.`,
        elementId: key,
      });
      continue;
    }

    // ID Match
    if (el.id !== key) {
      errors.push({
        code: 'ELEMENT_ID_MISMATCH',
        message: `Element key "${key}" does not match element.id "${el.id}".`,
        elementId: key,
      });
    }

    // Element Type Check
    if (!el.type || typeof el.type !== 'string' || !isValidElementType(el.type)) {
      errors.push({
        code: 'UNSUPPORTED_ELEMENT_TYPE',
        message: `Unsupported element type: "${el.type || 'undefined'}". Supported types are: ${SUPPORTED_ELEMENT_TYPES.join(', ')}.`,
        elementId: key,
      });
      continue;
    }

    // Name Check
    if (!el.name || typeof el.name !== 'string') {
      warnings.push({
        code: 'MISSING_ELEMENT_NAME',
        message: `Element "${key}" has missing or non-string "name".`,
        elementId: key,
      });
    }

    // Parent ID and Bidirectional Consistency
    if (el.parentId !== undefined) {
      if (typeof el.parentId !== 'string' || !elementIds.has(el.parentId)) {
        errors.push({
          code: 'INVALID_PARENT_ID',
          message: `Element "${key}" references non-existent parentId "${el.parentId}".`,
          elementId: key,
        });
      } else {
        const parent = elements[el.parentId];
        if (parent && (!Array.isArray(parent.children) || !parent.children.includes(key))) {
          errors.push({
            code: 'BIDIRECTIONAL_PARENT_MISMATCH',
            message: `Hierarchy error: Element "${key}" specifies parent "${el.parentId}", but parent does not list it in "children".`,
            elementId: key,
          });
        }
      }
    }

    // Children array and Bidirectional Consistency
    if (el.children !== undefined) {
      if (!Array.isArray(el.children)) {
        errors.push({
          code: 'INVALID_CHILDREN_ARRAY',
          message: `Element "${key}" "children" property must be an array of element ID strings.`,
          elementId: key,
        });
      } else {
        for (const childId of el.children) {
          if (typeof childId !== 'string' || !elementIds.has(childId)) {
            errors.push({
              code: 'MISSING_CHILD_ELEMENT',
              message: `Element "${key}" references non-existent childId "${childId}".`,
              elementId: key,
            });
          } else {
            const child = elements[childId];
            if (child && child.parentId !== key) {
              errors.push({
                code: 'BIDIRECTIONAL_CHILD_MISMATCH',
                message: `Hierarchy error: Element "${key}" lists child "${childId}", but child has parentId "${child.parentId}".`,
                elementId: key,
              });
            }
          }
        }
      }
    }

    // Circular Hierarchy Check
    const hierarchyVisited = new Set<string>();
    let currP = el.parentId;
    while (currP) {
      if (hierarchyVisited.has(currP)) {
        errors.push({
          code: 'CIRCULAR_HIERARCHY',
          message: `Circular parent hierarchy detected starting at element "${key}".`,
          elementId: key,
        });
        break;
      }
      hierarchyVisited.add(currP);
      currP = elements[currP]?.parentId;
    }

    // Base Properties Validation
    if (!el.base || typeof el.base !== 'object' || Array.isArray(el.base)) {
      errors.push({
        code: 'INVALID_BASE_PROPERTIES',
        message: `Element "${key}" must contain a valid "base" properties object.`,
        elementId: key,
      });
    } else {
      for (const [propKey, propVal] of Object.entries(el.base)) {
        if (!ALLOWED_EDITABLE_FIELDS.has(propKey as any)) {
          errors.push({
            code: 'UNKNOWN_PROPERTY',
            message: `Unknown or forbidden property "${propKey}" on element "${key}".`,
            elementId: key,
            property: propKey,
          });
          continue;
        }

        if (!isPropertyAllowed(el.type, propKey as any)) {
          errors.push({
            code: 'INVALID_PROPERTY_FOR_TYPE',
            message: `Property "${propKey}" is not supported for element type "${el.type}" on element "${key}".`,
            elementId: key,
            property: propKey,
          });
          continue;
        }

        const valValidation = validatePropertyValue(propKey as any, propVal);
        if (!valValidation.valid) {
          errors.push({
            code: 'INVALID_PROPERTY_VALUE',
            message: `Invalid value for property "${propKey}" on element "${key}": ${valValidation.error}`,
            elementId: key,
            property: propKey,
          });
        }
      }
    }

    // Overrides Validation
    if (el.overrides !== undefined) {
      if (!el.overrides || typeof el.overrides !== 'object' || Array.isArray(el.overrides)) {
        errors.push({
          code: 'INVALID_OVERRIDES_OBJECT',
          message: `Element "${key}" "overrides" must be an object.`,
          elementId: key,
        });
      } else {
        const allowedViewports = new Set(['desktop', 'tablet', 'mobile']);
        for (const [vpKey, vpVal] of Object.entries(el.overrides)) {
          if (!allowedViewports.has(vpKey)) {
            errors.push({
              code: 'INVALID_VIEWPORT_OVERRIDE',
              message: `Invalid viewport override "${vpKey}" on element "${key}". Allowed overrides are "desktop", "tablet", "mobile".`,
              elementId: key,
            });
            continue;
          }

          if (vpVal !== undefined && (typeof vpVal !== 'object' || Array.isArray(vpVal))) {
            errors.push({
              code: 'INVALID_VIEWPORT_PROPERTIES',
              message: `Override for "${vpKey}" on element "${key}" must be an object.`,
              elementId: key,
            });
            continue;
          }

          if (vpVal) {
            for (const [propKey, propVal] of Object.entries(vpVal)) {
              if (!ALLOWED_EDITABLE_FIELDS.has(propKey as any)) {
                errors.push({
                  code: 'UNKNOWN_OVERRIDE_PROPERTY',
                  message: `Unknown property "${propKey}" in "${vpKey}" override on element "${key}".`,
                  elementId: key,
                  property: propKey,
                });
                continue;
              }

              if (!isPropertyAllowed(el.type, propKey as any)) {
                errors.push({
                  code: 'INVALID_OVERRIDE_PROPERTY_FOR_TYPE',
                  message: `Property "${propKey}" in "${vpKey}" override is not supported for element type "${el.type}" on element "${key}".`,
                  elementId: key,
                  property: propKey,
                });
                continue;
              }

              const valValidation = validatePropertyValue(propKey as any, propVal);
              if (!valValidation.valid) {
                errors.push({
                  code: 'INVALID_OVERRIDE_PROPERTY_VALUE',
                  message: `Invalid value for "${propKey}" in "${vpKey}" override on element "${key}": ${valValidation.error}`,
                  elementId: key,
                  property: propKey,
                });
              }
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
