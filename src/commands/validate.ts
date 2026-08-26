/**
 * Strict Unified Command Validation Engine
 *
 * Validates EditCommands against the canonical template model, enforcing:
 * - Target existence and integrity
 * - Type-specific property boundaries
 * - Value ranges and runtime constraints
 * - Viewport scope correctness
 * - Monotonic revision locks (stale edit prevention)
 * - Multi-element atomicity
 */

import {
  ALLOWED_EDITABLE_FIELDS,
  isPropertyAllowed,
} from '../model/properties';
import { TemplateModel } from '../types/template';
import { EditCommand, ValidationError, ValidationResult, ValidationWarning } from './types';

const VALID_VIEWPORTS = new Set(['all', 'desktop', 'tablet', 'mobile']);
const VALID_TEXT_ALIGNS = new Set(['left', 'center', 'right', 'justify']);
const VALID_SHADOWS = new Set(['none', 'sm', 'md', 'lg', 'xl', '2xl']);

/**
 * Validates an EditCommand against the canonical template state.
 */
export function validateCommand(
  command: EditCommand,
  currentTemplate: TemplateModel,
  activeSelection?: string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Sanity check on command object
  if (!command || typeof command !== 'object') {
    return {
      valid: false,
      errors: [{ code: 'INVALID_COMMAND', message: 'EditCommand payload is empty or invalid.' }],
    };
  }

  // 2. Viewport scope validation
  if (!command.viewport || !VALID_VIEWPORTS.has(command.viewport)) {
    errors.push({
      code: 'INVALID_SCOPE',
      message: `Invalid viewport scope "${command.viewport}". Allowed scopes are 'all', 'desktop', 'tablet', 'mobile'.`,
    });
  }

  // 3. Stale Revision Lock validation
  if (typeof command.baseRevision !== 'number' || command.baseRevision !== currentTemplate.version) {
    errors.push({
      code: 'STALE_REVISION',
      message: `Stale Revision Conflict: Command base revision (${command.baseRevision}) does not match current template revision (${currentTemplate.version}).`,
    });
  }

  // 4. Target IDs validation
  if (!Array.isArray(command.targetIds) || command.targetIds.length === 0) {
    errors.push({
      code: 'EMPTY_TARGET',
      message: 'No target element IDs specified in edit command.',
    });
  } else {
    // Check for duplicate target IDs
    const seenIds = new Set<string>();
    for (const targetId of command.targetIds) {
      if (seenIds.has(targetId)) {
        errors.push({
          code: 'DUPLICATE_TARGET',
          message: `Duplicate target element ID "${targetId}" found in command targetIds.`,
          elementId: targetId,
        });
      }
      seenIds.add(targetId);

      // Check existence in template
      if (!currentTemplate.elements[targetId]) {
        errors.push({
          code: 'UNKNOWN_ELEMENT',
          message: `Target element with ID "${targetId}" does not exist in template model.`,
          elementId: targetId,
        });
      }
    }
  }

  // 5. Selection Authority (for AI-generated commands)
  if (command.source === 'ai' && activeSelection && activeSelection.length > 0) {
    const selectionSet = new Set(activeSelection);
    for (const targetId of command.targetIds || []) {
      if (!selectionSet.has(targetId)) {
        errors.push({
          code: 'SELECTION_AUTHORITY_VIOLATION',
          message: `AI Selection Authority Violation: Target element "${targetId}" is outside the active selection.`,
          elementId: targetId,
        });
      }
    }
  }

  // If target validation or revision failed, return immediately to avoid crashing downstream checks
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const operation = command.operation || 'update';

  // 6. Operation-specific validation
  switch (operation) {
    case 'delete': {
      for (const targetId of command.targetIds) {
        if (
          currentTemplate.rootElementIds.includes(targetId) ||
          targetId === 'header' ||
          targetId === 'hero' ||
          targetId === 'footer'
        ) {
          errors.push({
            code: 'ROOT_DELETION_FORBIDDEN',
            message: `Root section "${targetId}" cannot be deleted.`,
            elementId: targetId,
          });
        }
      }
      break;
    }

    case 'reorder': {
      if (!command.reorderDirection || (command.reorderDirection !== 'up' && command.reorderDirection !== 'down')) {
        errors.push({
          code: 'INVALID_COMMAND',
          message: 'Reorder command must specify reorderDirection as "up" or "down".',
        });
      }
      for (const targetId of command.targetIds) {
        const el = currentTemplate.elements[targetId];
        if (!el.parentId || !currentTemplate.elements[el.parentId]) {
          errors.push({
            code: 'INVALID_COMMAND',
            message: `Element "${targetId}" has no valid parent container to reorder within.`,
            elementId: targetId,
          });
        }
      }
      break;
    }

    case 'duplicate': {
      // Duplication requires targets to exist (already checked in step 4)
      break;
    }

    case 'update':
    default: {
      if (!command.changes || typeof command.changes !== 'object' || Object.keys(command.changes).length === 0) {
        errors.push({
          code: 'INVALID_COMMAND',
          message: 'Update command must contain a non-empty "changes" dictionary.',
        });
        break;
      }

      // Validate each target's requested property updates
      for (const targetId of command.targetIds) {
        const element = currentTemplate.elements[targetId];
        const props = command.changes[targetId];

        if (!props || typeof props !== 'object') {
          errors.push({
            code: 'INVALID_COMMAND',
            message: `Missing property changes payload for target element "${targetId}".`,
            elementId: targetId,
          });
          continue;
        }

        for (const [propKey, value] of Object.entries(props)) {
          const key = propKey as keyof typeof element.base;

          // A. Global Whitelist check
          if (!ALLOWED_EDITABLE_FIELDS.has(key as any)) {
            errors.push({
              code: 'FORBIDDEN_PROPERTY',
              message: `Forbidden Field Violation: Property "${propKey}" is not in the allowed editable fields whitelist.`,
              elementId: targetId,
              property: propKey,
            });
            continue;
          }

          // B. Element Type Property Boundary check
          if (!isPropertyAllowed(element.type, key as any)) {
            errors.push({
              code: 'INVALID_PROPERTY',
              message: `Property "${propKey}" is not supported for element type "${element.type}" on element "${targetId}".`,
              elementId: targetId,
              property: propKey,
            });
            continue;
          }

          // C. Value Validation (if value is not undefined/reset)
          if (value !== undefined && value !== null) {
            validatePropertyValue(targetId, propKey, value, errors, warnings);
          }
        }
      }
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates individual property values against type constraints and physical boundaries
 */
function validatePropertyValue(
  elementId: string,
  property: string,
  value: unknown,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  switch (property) {
    case 'fontSize': {
      if (typeof value !== 'number' || isNaN(value) || value <= 0) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Font size must be a positive number greater than 0, got ${value}.`,
          elementId,
          property,
        });
      } else if (value < 8 || value > 160) {
        warnings.push({
          code: 'EXTREME_VALUE',
          message: `Font size ${value}px on "${elementId}" is outside recommended range (8px - 160px).`,
          elementId,
          property,
        });
      }
      break;
    }

    case 'opacity': {
      if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 1) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Opacity must be a number between 0 and 1, got ${value}.`,
          elementId,
          property,
        });
      }
      break;
    }

    case 'textAlign': {
      if (typeof value !== 'string' || !VALID_TEXT_ALIGNS.has(value)) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Text alignment must be 'left', 'center', 'right', or 'justify', got "${value}".`,
          elementId,
          property,
        });
      }
      break;
    }

    case 'paddingTop':
    case 'paddingBottom':
    case 'paddingLeft':
    case 'paddingRight':
    case 'padding':
    case 'marginTop':
    case 'marginBottom':
    case 'margin':
    case 'borderWidth':
    case 'borderRadius':
    case 'gap': {
      if (typeof value === 'number' && (isNaN(value) || value < 0)) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Dimension property "${property}" cannot be negative, got ${value}.`,
          elementId,
          property,
        });
      }
      break;
    }

    case 'gridColumns': {
      if (typeof value !== 'number' || isNaN(value) || value < 1 || !Number.isInteger(value)) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Grid columns must be an integer >= 1, got ${value}.`,
          elementId,
          property,
        });
      }
      break;
    }

    case 'shadow': {
      if (typeof value === 'string' && !VALID_SHADOWS.has(value) && !value.includes('px') && !value.includes('rgba')) {
        warnings.push({
          code: 'CUSTOM_SHADOW',
          message: `Custom shadow "${value}" used on "${elementId}".`,
          elementId,
          property,
        });
      }
      break;
    }

    case 'color':
    case 'backgroundColor':
    case 'borderColor': {
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Color property "${property}" must be a valid non-empty string.`,
          elementId,
          property,
        });
      } else if (value.includes('<script>') || value.includes('javascript:')) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Forbidden script injection pattern in color property "${property}".`,
          elementId,
          property,
        });
      }
      break;
    }

    default:
      break;
  }
}
