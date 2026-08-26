/**
 * Unified Edit Command & Commit Pipeline
 *
 * All state mutations (Canvas, Code, AI, Restore) flow through this single pipeline.
 */

import { commitEdit, CommitResult, EditCommand, ValidationError } from '../commands';
import {
  ChangeSummary,
  HistoryEntry,
  TemplateModel,
} from '../types/template';

export interface ApplyCommandResult {
  success: boolean;
  nextTemplate: TemplateModel;
  historyEntry?: HistoryEntry;
  changeSummary?: ChangeSummary;
  errors?: string[];
  validationErrors?: ValidationError[];
}

/**
 * Legacy/Core wrapper forwarding to the unified commands architecture
 */
export function applyEditCommand(
  currentTemplate: TemplateModel,
  command: EditCommand,
  activeSelection?: string[]
): ApplyCommandResult {
  const result = commitEdit(currentTemplate, command, activeSelection);

  if (!result.success) {
    return {
      success: false,
      nextTemplate: currentTemplate,
      errors: result.errors?.map((e) => e.message) || ['Command validation failed.'],
      validationErrors: result.errors,
    };
  }

  return {
    success: true,
    nextTemplate: result.nextTemplate!,
    historyEntry: result.historyEntry,
    changeSummary: result.changeSummary,
  };
}

export * from '../commands';

