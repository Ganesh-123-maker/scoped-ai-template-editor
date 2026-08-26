import { EditCommand } from '../commands/types';
import { EditableProperties, ElementModel, TemplateModel, Viewport } from '../types/template';
import { TemplateDiffResult } from './types';

/**
 * Checks shallow equality of two primitive values or objects
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === undefined && b === undefined) return true;
  if (a === null && b === null) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

/**
 * Diffs properties between two objects and returns changed keys and new values.
 * If a property existed in previous but was removed in next, it is marked as `undefined`.
 */
function diffProperties(
  prev: Partial<EditableProperties> = {},
  next: Partial<EditableProperties> = {}
): Partial<EditableProperties> | null {
  const changes: any = {};
  let hasChanges = false;

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]) as Set<keyof EditableProperties>;

  for (const key of allKeys) {
    const valPrev = prev[key];
    const valNext = next[key];

    if (!isEqual(valPrev, valNext)) {
      changes[key] = valNext !== undefined ? valNext : undefined;
      hasChanges = true;
    }
  }

  return hasChanges ? changes : null;
}

/**
 * Computes semantic diffs between two TemplateModels and converts them into
 * a discrete sequence of canonical EditCommands (source = "code").
 */
export function diffTemplates(
  previousTemplate: TemplateModel,
  nextTemplate: TemplateModel,
  baseRevision: number
): TemplateDiffResult {
  const commands: EditCommand[] = [];
  const details: string[] = [];

  let elementsChanged = 0;
  let propertiesChanged = 0;
  let elementsAdded = 0;
  let elementsRemoved = 0;
  let elementsReordered = 0;
  let overridesChanged = 0;

  const prevIds = Object.keys(previousTemplate.elements);
  const nextIds = Object.keys(nextTemplate.elements);

  const prevIdSet = new Set(prevIds);
  const nextIdSet = new Set(nextIds);

  // 1. Identify Removed Elements
  const removedIds = prevIds.filter((id) => !nextIdSet.has(id));
  if (removedIds.length > 0) {
    elementsRemoved += removedIds.length;
    for (const removedId of removedIds) {
      commands.push({
        id: `cmd-code-del-${removedId}-${Date.now()}`,
        source: 'code',
        operation: 'delete',
        targetIds: [removedId],
        viewport: 'all',
        baseRevision,
        summary: `Code edit: Deleted element #${removedId}`,
      });
      details.push(`Deleted element #${removedId} (${previousTemplate.elements[removedId]?.name || 'unnamed'})`);
    }
  }

  // 2. Identify Added Elements
  const addedIds = nextIds.filter((id) => !prevIdSet.has(id));
  if (addedIds.length > 0) {
    elementsAdded += addedIds.length;
    for (const addedId of addedIds) {
      const addedEl = nextTemplate.elements[addedId];
      // If added element has a parent that exists in previous template, generate duplicate/add command
      commands.push({
        id: `cmd-code-add-${addedId}-${Date.now()}`,
        source: 'code',
        operation: 'duplicate',
        targetIds: addedEl.parentId && prevIdSet.has(addedEl.parentId) ? [addedEl.parentId] : [prevIds[0]],
        viewport: 'all',
        baseRevision,
        changes: {
          [addedId]: addedEl.base,
        },
        summary: `Code edit: Added element #${addedId} (${addedEl.name})`,
      });
      details.push(`Added element #${addedId} (${addedEl.name})`);
    }
  }

  // 3. Identify Base Property Modifications on Existing Elements
  const commonIds = prevIds.filter((id) => nextIdSet.has(id));
  const baseChanges: Record<string, Partial<EditableProperties>> = {};
  const baseChangedTargets: string[] = [];

  for (const id of commonIds) {
    const prevEl = previousTemplate.elements[id];
    const nextEl = nextTemplate.elements[id];

    const propDiff = diffProperties(prevEl.base, nextEl.base);
    if (propDiff) {
      baseChanges[id] = propDiff;
      baseChangedTargets.push(id);
      const changedKeys = Object.keys(propDiff);
      propertiesChanged += changedKeys.length;
      details.push(`Updated ${changedKeys.join(', ')} on #${id} (${prevEl.name})`);
    }
  }

  if (baseChangedTargets.length > 0) {
    elementsChanged += baseChangedTargets.length;
    commands.push({
      id: `cmd-code-base-${Date.now()}`,
      source: 'code',
      operation: 'update',
      targetIds: baseChangedTargets,
      viewport: 'all',
      baseRevision,
      changes: baseChanges,
      summary: `Code edit: Updated base properties on ${baseChangedTargets.length} element(s)`,
    });
  }

  // 4. Identify Viewport Overrides Changes
  const viewports: ('desktop' | 'tablet' | 'mobile')[] = ['desktop', 'tablet', 'mobile'];

  for (const vp of viewports) {
    const vpChanges: Record<string, Partial<EditableProperties>> = {};
    const vpChangedTargets: string[] = [];

    for (const id of commonIds) {
      const prevEl = previousTemplate.elements[id];
      const nextEl = nextTemplate.elements[id];

      const prevVpProps = prevEl.overrides?.[vp] || {};
      const nextVpProps = nextEl.overrides?.[vp] || {};

      const vpDiff = diffProperties(prevVpProps, nextVpProps);
      if (vpDiff) {
        vpChanges[id] = vpDiff;
        vpChangedTargets.push(id);
        const changedKeys = Object.keys(vpDiff);
        overridesChanged += changedKeys.length;
        details.push(`Updated [${vp}] override ${changedKeys.join(', ')} on #${id} (${prevEl.name})`);
      }
    }

    if (vpChangedTargets.length > 0) {
      commands.push({
        id: `cmd-code-${vp}-${Date.now()}`,
        source: 'code',
        operation: 'update',
        targetIds: vpChangedTargets,
        viewport: vp,
        baseRevision,
        changes: vpChanges,
        summary: `Code edit: Updated ${vp} overrides on ${vpChangedTargets.length} element(s)`,
      });
    }
  }

  // 5. Identify Structural Reordering (Children order changed)
  for (const id of commonIds) {
    const prevChildren = previousTemplate.elements[id]?.children || [];
    const nextChildren = nextTemplate.elements[id]?.children || [];

    if (
      prevChildren.length === nextChildren.length &&
      prevChildren.length > 1 &&
      JSON.stringify(prevChildren) !== JSON.stringify(nextChildren)
    ) {
      elementsReordered++;
      details.push(`Reordered children in container #${id}`);
      // Find first child that moved and generate reorder
      commands.push({
        id: `cmd-code-reorder-${id}-${Date.now()}`,
        source: 'code',
        operation: 'reorder',
        reorderDirection: 'down',
        targetIds: [nextChildren[0]],
        viewport: 'all',
        baseRevision,
        summary: `Code edit: Reordered children in container #${id}`,
      });
    }
  }

  return {
    commands,
    summary: {
      elementsChanged,
      propertiesChanged,
      elementsAdded,
      elementsRemoved,
      elementsReordered,
      overridesChanged,
    },
    details,
  };
}
