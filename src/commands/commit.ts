/**
 * Unified Edit Commit Pipeline
 *
 * Orchestrates the full lifecycle:
 * 1. Command ingestion
 * 2. Strict multi-pass validation (Target, Property, Scope, Value, Revision)
 * 3. Immutable patch generation
 * 4. Atomic state transition
 * 5. Historical audit log generation
 */

import { TemplateModel } from '../types/template';
import { applyEdit } from './apply';
import { CommitResult, EditCommand } from './types';
import { validateCommand } from './validate';

/**
 * Commits an EditCommand atomically against the current canonical template state.
 * If validation fails for ANY reason or on ANY target, the entire operation is rejected,
 * and the state remains 100% unchanged.
 */
export function commitEdit(
  currentTemplate: TemplateModel,
  command: EditCommand,
  activeSelection?: string[]
): CommitResult {
  // 1. Multi-pass validation
  const validation = validateCommand(command, currentTemplate, activeSelection);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
      changedElementIds: [],
    };
  }

  // 2. Pure immutable patch & history generation
  try {
    const applied = applyEdit(currentTemplate, command);

    return {
      success: true,
      revision: applied.nextTemplate.version,
      changedElementIds: applied.changedElementIds,
      historyEntryId: applied.historyEntry.id,
      nextTemplate: applied.nextTemplate,
      historyEntry: applied.historyEntry,
      changeSummary: applied.changeSummary,
      warnings: validation.warnings,
    };
  } catch (err: any) {
    return {
      success: false,
      errors: [
        {
          code: 'INTERNAL_APPLY_ERROR',
          message: `Unexpected error during patch application: ${err.message || String(err)}`,
        },
      ],
      changedElementIds: [],
    };
  }
}
