/**
 * Granular Per-Element & Per-Viewport Recovery Engine
 *
 * Contract:
 * - Restores a specific prior revision for ONLY the chosen element and viewport scope.
 * - Does NOT perform a global rollback.
 * - Unrelated elements remain unchanged.
 * - Other viewports on the same element remain unchanged.
 * - The restore action itself creates a new verifiable history entry.
 */

import { EditCommand, EditableProperties, TemplateModel, Viewport } from '../types/template';
import { ApplyCommandResult, applyEditCommand } from './pipeline';

export function restoreElementRevision(
  currentTemplate: TemplateModel,
  elementId: string,
  targetViewport: Viewport,
  historyEntryId: string
): ApplyCommandResult {
  const targetElement = currentTemplate.elements[elementId];
  if (!targetElement) {
    return {
      success: false,
      nextTemplate: currentTemplate,
      errors: [`Cannot restore: Element "${elementId}" not found in current template.`],
    };
  }

  // Find history entry
  const historyEntry = currentTemplate.history.find((h) => h.id === historyEntryId);
  if (!historyEntry) {
    return {
      success: false,
      nextTemplate: currentTemplate,
      errors: [`History entry "${historyEntryId}" not found.`],
    };
  }

  const snapshot = historyEntry.snapshot?.[elementId];
  const changeRecord = historyEntry.changes?.[elementId];

  if (!snapshot && !changeRecord) {
    return {
      success: false,
      nextTemplate: currentTemplate,
      errors: [`No snapshot or change record for element "${elementId}" in history entry "${historyEntryId}".`],
    };
  }

  // Determine what properties to restore
  const restoredChanges: Partial<EditableProperties> = {};

  if (targetViewport === 'all') {
    // If restoring all views, restore the base properties that were in place before this history entry
    if (changeRecord && changeRecord.before) {
      for (const [key, value] of Object.entries(changeRecord.before)) {
        (restoredChanges as any)[key] = value;
      }
    } else if (snapshot) {
      for (const [key, value] of Object.entries(snapshot.base)) {
        (restoredChanges as any)[key] = value;
      }
    }
  } else {
    // If restoring a specific viewport (desktop, tablet, or mobile)
    const vp = targetViewport as 'desktop' | 'tablet' | 'mobile';
    if (changeRecord && changeRecord.before && changeRecord.targetViewport === targetViewport) {
      for (const [key, value] of Object.entries(changeRecord.before)) {
        (restoredChanges as any)[key] = value;
      }
    } else if (snapshot && snapshot.overrides && snapshot.overrides[vp]) {
      for (const [key, value] of Object.entries(snapshot.overrides[vp]!)) {
        (restoredChanges as any)[key] = value;
      }
    } else if (snapshot) {
      // Fallback to snapshot base property if no override existed
      for (const [key, value] of Object.entries(snapshot.base)) {
        (restoredChanges as any)[key] = value;
      }
    }
  }

  // Construct edit command
  const command: EditCommand = {
    source: 'restore',
    targetIds: [elementId],
    viewport: targetViewport,
    baseRevision: currentTemplate.version,
    changes: {
      [elementId]: restoredChanges,
    },
    summary: `Restored ${targetElement.name} (${targetViewport === 'all' ? 'All views' : targetViewport}) to rev #${historyEntry.baseRevision}`,
  };

  return applyEditCommand(currentTemplate, command);
}
