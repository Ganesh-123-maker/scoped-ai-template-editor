/**
 * Strict Unified Validation Engine
 *
 * Enforces the safety contract across Canvas, Code, AI, and Restore pipelines.
 */

import { validateCommand } from '../commands/validate';
import { ALLOWED_EDITABLE_FIELDS } from '../model/properties';
import {
  AIProposal,
  AIProposalItem,
  EditCommand,
  EditableProperties,
  TemplateModel,
  ValidationResult,
  Viewport,
} from '../types/template';

// Re-export allowed fields
export { ALLOWED_EDITABLE_FIELDS };
export const VALID_VIEWPORTS = new Set<Viewport>(['all', 'desktop', 'tablet', 'mobile']);

/**
 * Validates an EditCommand against the canonical template state.
 */
export function validateEditCommand(
  command: EditCommand,
  currentTemplate: TemplateModel,
  activeSelection?: string[]
): ValidationResult {
  const result = validateCommand(command as any, currentTemplate, activeSelection);
  return {
    valid: result.valid,
    errors: result.errors.map((e) => `${e.code}: ${e.message}`),
    warnings: result.warnings?.map((w) => `${w.code}: ${w.message}`),
  };
}


/**
 * Validates an AI Proposal before presenting it for user review.
 */
export function validateAIProposal(
  proposal: AIProposal,
  currentTemplate: TemplateModel,
  activeSelection: string[]
): {
  valid: boolean;
  validatedItems: AIProposalItem[];
  globalError?: string;
} {
  if (!proposal) {
    return { valid: false, validatedItems: [], globalError: 'Proposal payload is missing.' };
  }

  const selectionSet = new Set(activeSelection);
  let hasItemErrors = false;
  let globalError: string | undefined;

  // Check base revision
  if (proposal.baseRevision !== currentTemplate.version) {
    globalError = `Stale Proposal: Generated on version ${proposal.baseRevision}, but template is now version ${currentTemplate.version}.`;
  }

  // Check selected IDs matches
  for (const selectedId of proposal.selectedIds) {
    if (!selectionSet.has(selectedId)) {
      globalError = `Selection Mismatch: Proposal contains unselected element "${selectedId}".`;
      break;
    }
  }

  const validatedItems: AIProposalItem[] = proposal.items.map((item) => {
    const itemErrors: string[] = [];

    // Check element existence
    if (!currentTemplate.elements[item.elementId]) {
      itemErrors.push(`Element "${item.elementId}" does not exist in template.`);
    }

    // Check selection authority
    if (!selectionSet.has(item.elementId)) {
      itemErrors.push(`Element "${item.elementId}" is not in active selection.`);
    }

    // Check fields in after payload
    for (const key of Object.keys(item.after || {})) {
      if (!ALLOWED_EDITABLE_FIELDS.has(key as keyof EditableProperties)) {
        itemErrors.push(`Forbidden field "${key}" in proposal.`);
      }
    }

    if (itemErrors.length > 0) {
      hasItemErrors = true;
      return {
        ...item,
        status: 'invalid',
        validationError: itemErrors.join(' | '),
      };
    }

    return item;
  });

  return {
    valid: !globalError && !hasItemErrors,
    validatedItems,
    globalError,
  };
}
