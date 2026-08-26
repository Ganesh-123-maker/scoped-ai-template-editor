/**
 * Immutable Patch & State Transition Engine
 *
 * Applies validated EditCommands immutably to produce the next canonical TemplateModel,
 * comprehensive before/after diffs, and historical audit entries.
 */

import { generateUniqueElementId } from '../core/selection';
import {
  ChangeSummary,
  EditableProperties,
  ElementModel,
  HistoryEntry,
  PropertyDiff,
  TemplateModel,
} from '../types/template';
import { EditCommand } from './types';

export interface ApplyResult {
  nextTemplate: TemplateModel;
  historyEntry: HistoryEntry;
  changeSummary: ChangeSummary;
  changedElementIds: string[];
}

/**
 * Applies a validated EditCommand immutably.
 * Assumes the command has already passed strict validation.
 */
export function applyEdit(currentTemplate: TemplateModel, command: EditCommand): ApplyResult {
  const nextVersion = currentTemplate.version + 1;
  const nextElements: Record<string, ElementModel> = { ...currentTemplate.elements };
  const historyChanges: HistoryEntry['changes'] = {};
  const snapshots: Record<string, ElementModel> = {};
  const diffs: PropertyDiff[] = [];
  const changedElementIds: string[] = [];

  const operation = command.operation || 'update';

  switch (operation) {
    case 'duplicate': {
      for (const targetId of command.targetIds) {
        const el = currentTemplate.elements[targetId];
        if (!el) continue;

        snapshots[targetId] = JSON.parse(JSON.stringify(el));
        const existingIds = new Set(Object.keys(nextElements));
        const newId = generateUniqueElementId(el.id, existingIds);

        const duplicated: ElementModel = {
          ...JSON.parse(JSON.stringify(el)),
          id: newId,
          name: `${el.name} (Copy)`,
          revision: nextVersion,
        };

        nextElements[newId] = duplicated;
        changedElementIds.push(newId);

        // Update parent's children array
        if (el.parentId && nextElements[el.parentId]) {
          const parent = nextElements[el.parentId];
          const oldChildren = parent.children ? [...parent.children] : [];
          const originalIndex = oldChildren.indexOf(targetId);

          let newChildren: string[];
          if (originalIndex !== -1) {
            newChildren = [
              ...oldChildren.slice(0, originalIndex + 1),
              newId,
              ...oldChildren.slice(originalIndex + 1),
            ];
          } else {
            newChildren = [...oldChildren, newId];
          }

          nextElements[el.parentId] = {
            ...parent,
            revision: nextVersion,
            children: newChildren,
          };
        }

        diffs.push({
          elementId: newId,
          elementName: duplicated.name,
          property: 'text',
          label: 'Duplicated Element',
          from: null,
          to: newId,
          targetViewport: command.viewport,
        });

        historyChanges[newId] = {
          elementName: duplicated.name,
          before: {},
          after: { ...duplicated.base },
          targetViewport: command.viewport,
        };
      }
      break;
    }

    case 'delete': {
      for (const targetId of command.targetIds) {
        const el = currentTemplate.elements[targetId];
        if (!el) continue;

        snapshots[targetId] = JSON.parse(JSON.stringify(el));
        delete nextElements[targetId];
        changedElementIds.push(targetId);

        // Clean up parent's children
        if (el.parentId && nextElements[el.parentId]) {
          const parent = nextElements[el.parentId];
          nextElements[el.parentId] = {
            ...parent,
            revision: nextVersion,
            children: parent.children?.filter((id) => id !== targetId),
          };
        }

        diffs.push({
          elementId: targetId,
          elementName: el.name,
          property: 'text',
          label: 'Deleted Element',
          from: el.name,
          to: null,
          targetViewport: command.viewport,
        });

        historyChanges[targetId] = {
          elementName: el.name,
          before: { ...el.base },
          after: {},
          targetViewport: command.viewport,
        };
      }
      break;
    }

    case 'reorder': {
      const direction = command.reorderDirection || 'up';
      for (const targetId of command.targetIds) {
        const el = currentTemplate.elements[targetId];
        if (!el || !el.parentId || !nextElements[el.parentId]) continue;

        snapshots[targetId] = JSON.parse(JSON.stringify(el));
        const parent = nextElements[el.parentId];
        if (!parent.children) continue;

        const children = [...parent.children];
        const idx = children.indexOf(targetId);
        if (idx === -1) continue;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= children.length) continue;

        // Swap positions
        const temp = children[idx];
        children[idx] = children[targetIdx];
        children[targetIdx] = temp;

        nextElements[parent.id] = {
          ...parent,
          revision: nextVersion,
          children,
        };

        changedElementIds.push(targetId);
        diffs.push({
          elementId: targetId,
          elementName: el.name,
          property: 'order',
          label: `Reordered ${direction}`,
          from: idx,
          to: targetIdx,
          targetViewport: command.viewport,
        });

        historyChanges[targetId] = {
          elementName: el.name,
          before: { order: idx },
          after: { order: targetIdx },
          targetViewport: command.viewport,
        };
      }
      break;
    }

    case 'update':
    default: {
      const changesMap = command.changes || {};
      for (const targetId of command.targetIds) {
        const existingElement = currentTemplate.elements[targetId];
        if (!existingElement) continue;

        snapshots[targetId] = JSON.parse(JSON.stringify(existingElement));
        const propertyChanges = changesMap[targetId] || {};
        const beforeProps: Partial<EditableProperties> = {};
        const afterProps: Partial<EditableProperties> = {};

        const updatedElement: ElementModel = {
          ...existingElement,
          revision: nextVersion,
          base: { ...existingElement.base },
          overrides: {
            desktop: existingElement.overrides.desktop ? { ...existingElement.overrides.desktop } : undefined,
            tablet: existingElement.overrides.tablet ? { ...existingElement.overrides.tablet } : undefined,
            mobile: existingElement.overrides.mobile ? { ...existingElement.overrides.mobile } : undefined,
          },
        };

        if (command.viewport === 'all') {
          // Shared Base mutation
          for (const [key, value] of Object.entries(propertyChanges)) {
            const propKey = key as keyof EditableProperties;
            const prevVal = existingElement.base[propKey];
            (beforeProps as any)[propKey] = prevVal;
            (afterProps as any)[propKey] = value;
            (updatedElement.base as any)[propKey] = value;

            diffs.push({
              elementId: targetId,
              elementName: existingElement.name,
              property: propKey,
              label: formatPropertyLabel(propKey),
              from: prevVal,
              to: value,
              targetViewport: 'all',
            });
          }
        } else {
          // Specific Viewport override mutation
          const vp = command.viewport as 'desktop' | 'tablet' | 'mobile';
          const existingOverrides = updatedElement.overrides[vp] ? { ...updatedElement.overrides[vp] } : {};

          for (const [key, value] of Object.entries(propertyChanges)) {
            const propKey = key as keyof EditableProperties;
            const prevVal = existingOverrides[propKey] ?? existingElement.base[propKey];
            (beforeProps as any)[propKey] = prevVal;
            (afterProps as any)[propKey] = value;

            if (value === undefined) {
              delete (existingOverrides as any)[propKey];
            } else {
              (existingOverrides as any)[propKey] = value;
            }

            diffs.push({
              elementId: targetId,
              elementName: existingElement.name,
              property: propKey,
              label: formatPropertyLabel(propKey),
              from: prevVal,
              to: value,
              targetViewport: vp,
            });
          }

          if (Object.keys(existingOverrides).length === 0) {
            updatedElement.overrides[vp] = undefined;
          } else {
            updatedElement.overrides[vp] = existingOverrides;
          }
        }

        nextElements[targetId] = updatedElement;
        changedElementIds.push(targetId);

        historyChanges[targetId] = {
          elementName: existingElement.name,
          before: beforeProps,
          after: afterProps,
          targetViewport: command.viewport,
        };
      }
      break;
    }
  }

  // Create immutable history entry
  const historyEntry: HistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    revision: nextVersion,
    timestamp: Date.now(),
    source: command.source,
    summary: command.summary || command.description || generateSummaryText(command, diffs),
    elementIds: changedElementIds,
    viewport: command.viewport,
    baseRevision: currentTemplate.version,
    newRevision: nextVersion,
    changes: historyChanges,
    snapshot: snapshots,
  };

  // Create change summary
  const changeSummary: ChangeSummary = {
    id: `summary-${Date.now()}`,
    timestamp: Date.now(),
    source: command.source,
    elementIds: changedElementIds,
    viewport: command.viewport,
    revision: nextVersion,
    diffs,
    summaryText: historyEntry.summary || 'Template updated',
  };

  const nextTemplate: TemplateModel = {
    ...currentTemplate,
    version: nextVersion,
    elements: nextElements,
    history: [historyEntry, ...(currentTemplate.history || [])],
  };

  return {
    nextTemplate,
    historyEntry,
    changeSummary,
    changedElementIds,
  };
}

function formatPropertyLabel(prop: keyof EditableProperties): string {
  const labels: Record<string, string> = {
    text: 'Text Content',
    badgeText: 'Badge Text',
    label: 'Label',
    fontSize: 'Font Size',
    fontWeight: 'Font Weight',
    color: 'Text Color',
    backgroundColor: 'Background Color',
    borderColor: 'Border Color',
    borderWidth: 'Border Width',
    borderRadius: 'Corner Radius',
    paddingTop: 'Padding Top',
    paddingBottom: 'Padding Bottom',
    paddingLeft: 'Padding Left',
    paddingRight: 'Padding Right',
    marginTop: 'Margin Top',
    marginBottom: 'Margin Bottom',
    width: 'Width',
    maxWidth: 'Max Width',
    textAlign: 'Text Alignment',
    lineHeight: 'Line Height',
    letterSpacing: 'Letter Spacing',
    shadow: 'Box Shadow',
    opacity: 'Opacity',
    gap: 'Gap Spacing',
    gridColumns: 'Grid Columns',
  };
  return labels[prop] || String(prop);
}

function generateSummaryText(command: EditCommand, diffs: PropertyDiff[]): string {
  const vpLabel = command.viewport === 'all' ? 'All Views' : `${capitalize(command.viewport)} view`;
  const count = command.targetIds.length;
  const countText = count === 1 ? '1 element' : `${count} elements`;

  if (command.operation === 'duplicate') {
    return `Duplicated ${countText}`;
  }
  if (command.operation === 'delete') {
    return `Deleted ${countText}`;
  }
  if (command.operation === 'reorder') {
    return `Reordered ${countText} ${command.reorderDirection || ''}`;
  }

  if (command.source === 'ai') {
    return `AI Proposal applied to ${countText} (${vpLabel})`;
  }
  if (command.source === 'code') {
    return `Code edit applied to ${countText} (${vpLabel})`;
  }
  if (command.source === 'restore') {
    return `Restored revision on ${countText} (${vpLabel})`;
  }

  if (diffs.length === 1) {
    return `Updated ${diffs[0].label} on ${diffs[0].elementName} (${vpLabel})`;
  }

  return `Manual edit applied to ${countText} (${vpLabel})`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
