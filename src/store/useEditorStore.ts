/**
 * Zustand Editor State Store
 *
 * Implements the single source of truth for the Scoped AI Template Editor,
 * unified pipeline routing, persistence, and state transitions.
 */

import { create } from 'zustand';
import { generateDeterministicAIProposal } from '../core/aiScenarioEngine';
import { commitEdit, CommitResult, EditCommand } from '../commands';
import { restoreElementRevision, restoreSingleProperty, restoreFullRevision } from '../core/recovery';
import { validateAIProposal } from '../core/validation';
import { generateUniqueElementId } from '../core/selection';
import { INITIAL_TEMPLATE } from '../data/initialTemplate';
import { serializeTemplate, parseTemplate, diffTemplates, CodeError } from '../code';
import {
  ActiveViewport,
  AIProposal,
  ChangeSummary,
  EditableProperties,
  ElementModel,
  TemplateModel,
  Viewport,
} from '../types/template';

const STORAGE_KEY = 'scoped_ai_template_editor_canonical_state_v1';

function loadPersistedTemplate(): TemplateModel {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return INITIAL_TEMPLATE;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.templateId && parsed.elements && parsed.rootElementIds && typeof parsed.version === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Malformed persisted template state, restoring initial template:', err);
  }
  return INITIAL_TEMPLATE;
}

function persistTemplate(template: TemplateModel) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
    }
  } catch (err) {
    console.error('Failed to persist template to localStorage:', err);
  }
}

interface EditorState {
  // Template Canonical Source of Truth
  template: TemplateModel;

  // Viewport and Scope
  activeViewport: ActiveViewport;
  editScope: Viewport;

  // Selection
  selectedIds: string[];
  hoveredId: string | null;

  // Panels & Navigation
  bottomPanelTab: 'code' | 'history' | 'changes' | 'tests' | null;
  activeInspectorTab: 'design' | 'ai';

  // AI Proposal Review
  activeProposal: AIProposal | null;

  // Product Improvement: Change Summary & Audit Toast
  latestChangeSummary: ChangeSummary | null;

  // Code Editor State
  codeDraft: string;
  codeBaseRevision: number;
  isCodeDirty: boolean;
  codeError: string | null;
  codeErrorLocation: { line?: number; column?: number } | null;
  externalConflictDetected: boolean;

  // Notification Toast
  toast: { message: string; type: 'success' | 'error' | 'info'; id: number } | null;

  // Modals
  isResetModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  isArchitectureModalOpen: boolean;

  // Actions
  setActiveViewport: (vp: ActiveViewport) => void;
  setEditScope: (scope: Viewport) => void;
  selectElement: (id: string, additive?: boolean) => void;
  toggleElementSelection: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedElements: () => ElementModel[];
  setHoveredId: (id: string | null) => void;
  setBottomPanelTab: (tab: 'code' | 'history' | 'changes' | 'tests' | null) => void;
  setActiveInspectorTab: (tab: 'design' | 'ai') => void;

  // Pipeline Actions
  commitCommand: (command: Omit<EditCommand, 'baseRevision'> & { baseRevision?: number }) => CommitResult;
  updateSelectedProperties: (props: Partial<EditableProperties>) => boolean;
  resetSelectedPropertyOverride: (field: keyof EditableProperties, viewport: Viewport) => boolean;

  // Deterministic AI Actions
  submitAIInstruction: (instruction: string) => void;
  acceptProposalItem: (elementId: string) => void;
  rejectProposalItem: (elementId: string) => void;
  acceptAllProposalItems: () => void;
  rejectAllProposalItems: () => void;
  clearActiveProposal: () => void;

  // Independent Recovery Actions
  restoreElement: (elementId: string, viewport: Viewport, historyEntryId: string) => boolean;
  restoreProperty: (elementId: string, propertyKey: keyof EditableProperties, viewport: Viewport, historyEntryId: string) => boolean;
  restoreRevision: (historyEntryId: string) => boolean;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Code Editor Synchronization
  setCodeDraft: (draft: string) => void;
  formatCodeDraft: () => boolean;
  revertCodeDraft: () => void;
  applyCodeEdits: () => boolean;
  syncCodeDraftFromTemplate: (force?: boolean) => void;
  resolveCodeConflict: (choice: 'reload' | 'keep') => void;

  // Structural Canvas Actions
  reorderElement: (elementId: string, direction: 'up' | 'down') => void;
  duplicateElement: (elementId: string) => void;
  deleteElement: (elementId: string) => void;

  // Reset & Modals
  openResetModal: () => void;
  closeResetModal: () => void;
  resetToInitialTemplate: () => void;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  openArchitectureModal: () => void;
  closeArchitectureModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  const initial = loadPersistedTemplate();

  return {
    template: initial,
    activeViewport: 'desktop',
    editScope: 'all',
    selectedIds: ['hero-title'],
    hoveredId: null,
    bottomPanelTab: null,
    activeInspectorTab: 'design',
    activeProposal: null,
    latestChangeSummary: null,
    codeDraft: serializeTemplate(initial),
    codeBaseRevision: initial.version,
    isCodeDirty: false,
    codeError: null,
    codeErrorLocation: null,
    externalConflictDetected: false,
    toast: null,
    isResetModalOpen: false,
    isShortcutsModalOpen: false,
    isArchitectureModalOpen: false,

    setActiveViewport: (activeViewport) => {
      set({ activeViewport });
    },

    setEditScope: (editScope) => {
      set({ editScope });
    },

    selectElement: (id, additive = false) => {
      const current = get().selectedIds;
      let next: string[];

      if (additive) {
        if (current.includes(id)) {
          next = current.filter((x) => x !== id);
        } else {
          next = [...current, id];
        }
      } else {
        next = [id];
      }

      set({ selectedIds: next });
    },

    toggleElementSelection: (id) => {
      get().selectElement(id, true);
    },

    setSelectedIds: (selectedIds) => {
      set({ selectedIds });
    },

    clearSelection: () => {
      set({ selectedIds: [] });
    },

    isSelected: (id) => {
      return get().selectedIds.includes(id);
    },

    getSelectedElements: () => {
      const state = get();
      return state.selectedIds
        .map((id) => state.template.elements[id])
        .filter((el): el is ElementModel => el !== undefined);
    },

    setHoveredId: (hoveredId) => set({ hoveredId }),

    setBottomPanelTab: (bottomPanelTab) => {
      set({ bottomPanelTab });
      if (bottomPanelTab === 'code') {
        get().syncCodeDraftFromTemplate();
      }
    },

    setActiveInspectorTab: (activeInspectorTab) => set({ activeInspectorTab }),

    commitCommand: (cmd) => {
      const state = get();
      const command: EditCommand = {
        id: cmd.id || `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...cmd,
        baseRevision: cmd.baseRevision ?? state.template.version,
      };

      const result = commitEdit(state.template, command, state.selectedIds);
      if (result.success && result.nextTemplate) {
        persistTemplate(result.nextTemplate);
        const isExternal = command.source !== 'code';

        const nextProposal =
          state.activeProposal &&
          (state.activeProposal.status === 'pending' || state.activeProposal.status === 'partially_accepted') &&
          state.activeProposal.baseRevision < result.nextTemplate.version &&
          command.source !== 'ai'
            ? {
                ...state.activeProposal,
                status: 'stale' as const,
                validationError: 'This proposal is based on an older revision.',
              }
            : state.activeProposal;

        set({
          template: result.nextTemplate,
          latestChangeSummary: result.changeSummary || null,
          codeError: null,
          activeProposal: nextProposal,
        });

        if (isExternal) {
          if (state.isCodeDirty) {
            set({ externalConflictDetected: true });
          } else {
            get().syncCodeDraftFromTemplate(true);
          }
        }
        get().showToast(result.changeSummary?.summaryText || 'Changes committed successfully', 'success');
      } else {
        const errorMsg = result.errors?.[0]?.message || 'Command validation failed';
        get().showToast(errorMsg, 'error');
      }
      return result as any;
    },

    updateSelectedProperties: (props) => {
      const state = get();
      if (state.selectedIds.length === 0) return false;

      const changes: Record<string, Partial<EditableProperties>> = {};
      for (const id of state.selectedIds) {
        changes[id] = { ...props };
      }

      const result = state.commitCommand({
        source: 'canvas',
        targetIds: state.selectedIds,
        viewport: state.editScope,
        baseRevision: state.template.version,
        changes,
      });

      return result.success;
    },

    resetSelectedPropertyOverride: (field, viewport) => {
      const state = get();
      if (state.selectedIds.length === 0 || viewport === 'all') return false;

      const changes: Record<string, Partial<EditableProperties>> = {};
      for (const id of state.selectedIds) {
        changes[id] = { [field]: undefined };
      }

      const result = state.commitCommand({
        source: 'canvas',
        targetIds: state.selectedIds,
        viewport,
        baseRevision: state.template.version,
        changes,
        summary: `Reset ${String(field)} on ${state.selectedIds.length} element(s) in ${viewport} to shared value`,
      });

      return result.success;
    },

    submitAIInstruction: (instruction) => {
      const state = get();
      const rawProposal = generateDeterministicAIProposal(
        instruction,
        state.selectedIds,
        state.template,
        state.editScope
      );

      const validation = validateAIProposal(rawProposal, state.template, state.selectedIds);

      const proposalToSet: AIProposal = {
        ...rawProposal,
        items: validation.validatedItems,
        status: validation.valid ? 'pending' : 'invalid',
        validationError: validation.globalError || (validation.valid ? undefined : 'Proposal failed validation checks.'),
      };

      set({ activeProposal: proposalToSet });

      if (!validation.valid) {
        get().showToast(proposalToSet.validationError || 'AI Proposal validation failed.', 'error');
      } else {
        get().showToast(`AI proposal generated for ${proposalToSet.items.length} element(s). Please review.`, 'info');
      }
    },

    acceptProposalItem: (elementId) => {
      const state = get();
      const proposal = state.activeProposal;
      if (!proposal) return;

      // Safe concurrency guard: detect if proposal was generated on older revision
      if (proposal.baseRevision !== state.template.version) {
        set({
          activeProposal: {
            ...proposal,
            status: 'stale',
            validationError: 'This proposal is based on an older revision.',
          },
        });
        get().showToast('This proposal is based on an older revision. Please generate a new proposal.', 'error');
        return;
      }

      const targetItem = proposal.items.find((i) => i.elementId === elementId);
      if (!targetItem || targetItem.status !== 'pending') return;

      // Apply single item through commit pipeline
      const command: EditCommand = {
        source: 'ai',
        targetIds: [elementId],
        viewport: targetItem.targetViewport,
        baseRevision: proposal.baseRevision,
        changes: {
          [elementId]: targetItem.after,
        },
        summary: `AI accepted: ${targetItem.elementName} (${targetItem.diffExplanation})`,
      };

      const result = state.commitCommand(command);
      if (result.success) {
        const nextItems = proposal.items.map((i) =>
          i.elementId === elementId ? { ...i, status: 'accepted' as const } : i
        );
        const anyPending = nextItems.some((i) => i.status === 'pending');
        set({
          activeProposal: {
            ...proposal,
            items: nextItems,
            status: anyPending ? 'partially_accepted' : 'accepted',
          },
        });
      }
    },

    rejectProposalItem: (elementId) => {
      const state = get();
      const proposal = state.activeProposal;
      if (!proposal) return;

      const nextItems = proposal.items.map((i) =>
        i.elementId === elementId ? { ...i, status: 'rejected' as const } : i
      );
      const anyPending = nextItems.some((i) => i.status === 'pending');
      const allRejected = nextItems.every((i) => i.status === 'rejected');

      set({
        activeProposal: {
          ...proposal,
          items: nextItems,
          status: allRejected ? 'rejected' : anyPending ? 'partially_accepted' : 'accepted',
        },
      });
      get().showToast(`Proposal rejected for ${elementId}. No changes made.`, 'info');
    },

    acceptAllProposalItems: () => {
      const state = get();
      const proposal = state.activeProposal;
      if (!proposal) return;

      // Safe concurrency guard: detect if proposal was generated on older revision
      if (proposal.baseRevision !== state.template.version) {
        set({
          activeProposal: {
            ...proposal,
            status: 'stale',
            validationError: 'This proposal is based on an older revision.',
          },
        });
        get().showToast('This proposal is based on an older revision. Please generate a new proposal.', 'error');
        return;
      }

      const pendingItems = proposal.items.filter((i) => i.status === 'pending' || i.status === 'accepted');
      if (pendingItems.length === 0) return;

      const changes: Record<string, Partial<EditableProperties>> = {};
      const targetIds: string[] = [];

      for (const item of pendingItems) {
        changes[item.elementId] = item.after;
        targetIds.push(item.elementId);
      }

      const command: EditCommand = {
        source: 'ai',
        targetIds,
        viewport: proposal.viewport,
        baseRevision: proposal.baseRevision,
        changes,
        summary: `AI Applied: "${proposal.instruction}" across ${targetIds.length} element(s)`,
      };

      const result = state.commitCommand(command);
      if (result.success) {
        set({
          activeProposal: {
            ...proposal,
            status: 'accepted',
            items: proposal.items.map((i) => ({ ...i, status: 'accepted' })),
          },
        });
      }
    },

    rejectAllProposalItems: () => {
      const state = get();
      if (!state.activeProposal) return;
      set({
        activeProposal: {
          ...state.activeProposal,
          status: 'rejected',
          items: state.activeProposal.items.map((i) => ({ ...i, status: 'rejected' })),
        },
      });
      get().showToast('AI Proposal rejected. Template remains completely untouched.', 'info');
    },

    clearActiveProposal: () => {
      set({ activeProposal: null });
    },

    restoreElement: (elementId, viewport, historyEntryId) => {
      const state = get();
      const result = restoreElementRevision(state.template, elementId, viewport, historyEntryId);
      if (result.success) {
        persistTemplate(result.nextTemplate);
        set({
          template: result.nextTemplate,
          latestChangeSummary: result.changeSummary,
        });
        get().syncCodeDraftFromTemplate();
        get().showToast(result.changeSummary?.summaryText || 'Element revision restored', 'success');
        return true;
      } else {
        get().showToast(result.errors?.[0] || 'Restore failed', 'error');
        return false;
      }
    },

    restoreProperty: (elementId, propertyKey, viewport, historyEntryId) => {
      const state = get();
      const result = restoreSingleProperty(state.template, elementId, propertyKey, viewport, historyEntryId);
      if (result.success) {
        persistTemplate(result.nextTemplate);
        set({
          template: result.nextTemplate,
          latestChangeSummary: result.changeSummary,
        });
        get().syncCodeDraftFromTemplate();
        get().showToast(result.changeSummary?.summaryText || `Property ${String(propertyKey)} restored`, 'success');
        return true;
      } else {
        get().showToast(result.errors?.[0] || 'Property restore failed', 'error');
        return false;
      }
    },

    restoreRevision: (historyEntryId) => {
      const state = get();
      const result = restoreFullRevision(state.template, historyEntryId);
      if (result.success) {
        persistTemplate(result.nextTemplate);
        set({
          template: result.nextTemplate,
          latestChangeSummary: result.changeSummary,
        });
        get().syncCodeDraftFromTemplate();
        get().showToast(result.changeSummary?.summaryText || 'Full revision restored', 'success');
        return true;
      } else {
        get().showToast(result.errors?.[0] || 'Full revision restore failed', 'error');
        return false;
      }
    },

    canUndo: () => {
      const history = get().template.history || [];
      return history.length > 0 && history[0]?.source !== undefined;
    },

    canRedo: () => {
      // In append-only chronological history architectures, every action creates a new revision.
      // Redo can revert the most recent 'restore' or rollback operation.
      const history = get().template.history || [];
      return history.length > 1 && history[0]?.source === 'restore';
    },

    undo: () => {
      const state = get();
      const history = state.template.history || [];
      if (history.length === 0) {
        get().showToast('No history available to undo', 'info');
        return false;
      }

      const topEntry = history[0];
      // Undo topEntry by rolling back its changes through the validation pipeline
      const targetIds = topEntry.elementIds.filter((id) => state.template.elements[id]);
      if (targetIds.length === 0) {
        get().showToast('Cannot undo: Elements no longer exist', 'error');
        return false;
      }

      const rollbackChanges: Record<string, Partial<EditableProperties>> = {};
      for (const id of targetIds) {
        if (topEntry.changes?.[id]?.before) {
          rollbackChanges[id] = topEntry.changes[id].before;
        } else if (topEntry.snapshot?.[id]) {
          rollbackChanges[id] = topEntry.snapshot[id].base;
        }
      }

      const undoCommand: EditCommand = {
        source: 'restore',
        targetIds,
        viewport: topEntry.viewport || 'all',
        baseRevision: state.template.version,
        changes: rollbackChanges,
        summary: `Undo: Reverted "${topEntry.summary || 'Previous action'}"`,
      };

      const result = state.commitCommand(undoCommand);
      if (result.success) {
        get().showToast(`✓ Undid: ${topEntry.summary || 'Previous edit'}`, 'success');
        return true;
      }
      return false;
    },

    redo: () => {
      const state = get();
      const history = state.template.history || [];
      if (history.length < 2 || history[0]?.source !== 'restore') {
        get().showToast('No restore action available to redo', 'info');
        return false;
      }

      const prevRestore = history[0];
      const targetIds = prevRestore.elementIds.filter((id) => state.template.elements[id]);
      const redoChanges: Record<string, Partial<EditableProperties>> = {};

      for (const id of targetIds) {
        if (prevRestore.changes?.[id]?.before) {
          redoChanges[id] = prevRestore.changes[id].before;
        }
      }

      const redoCommand: EditCommand = {
        source: 'restore',
        targetIds,
        viewport: prevRestore.viewport || 'all',
        baseRevision: state.template.version,
        changes: redoChanges,
        summary: `Redo: Reapplied changes reverted by previous undo`,
      };

      const result = state.commitCommand(redoCommand);
      if (result.success) {
        get().showToast('✓ Redid previous action', 'success');
        return true;
      }
      return false;
    },

    setCodeDraft: (codeDraft) => {
      const state = get();
      const isDirty = codeDraft !== serializeTemplate(state.template);
      set({
        codeDraft,
        isCodeDirty: isDirty,
        codeError: null,
        codeErrorLocation: null,
      });
    },

    formatCodeDraft: () => {
      const state = get();
      try {
        const parsed = parseTemplate(state.codeDraft);
        if (parsed.success && parsed.template) {
          const formatted = serializeTemplate(parsed.template);
          set({ codeDraft: formatted, codeError: null, codeErrorLocation: null });
          get().showToast('Code formatted with deterministic structure', 'info');
          return true;
        } else {
          // Fallback to standard formatted JSON if valid JSON
          const rawParsed = JSON.parse(state.codeDraft);
          const formatted = JSON.stringify(rawParsed, null, 2);
          set({ codeDraft: formatted });
          get().showToast('Code JSON formatted', 'info');
          return true;
        }
      } catch (e: any) {
        get().showToast(`Cannot format invalid JSON: ${e.message}`, 'error');
        return false;
      }
    },

    revertCodeDraft: () => {
      const state = get();
      const cleanSerialized = serializeTemplate(state.template);
      set({
        codeDraft: cleanSerialized,
        codeBaseRevision: state.template.version,
        isCodeDirty: false,
        codeError: null,
        codeErrorLocation: null,
        externalConflictDetected: false,
      });
      get().showToast('Code reverted to latest committed canonical state', 'info');
    },

    applyCodeEdits: () => {
      const state = get();

      // 1. Conflict / Stale baseRevision check
      if (state.codeBaseRevision !== state.template.version) {
        const msg = `Conflict detected: Your code was based on Revision #${state.codeBaseRevision}, but the editor is now on Revision #${state.template.version}. Reload the latest template before applying.`;
        set({
          codeError: msg,
          externalConflictDetected: true,
        });
        get().showToast(`Conflict: Stale base revision #${state.codeBaseRevision}`, 'error');
        return false;
      }

      // 2. Parse and validate code strictly
      const parseResult = parseTemplate(state.codeDraft);
      if (!parseResult.success) {
        const firstErr = parseResult.errors[0];
        const loc = firstErr?.line ? ` (Line ${firstErr.line}${firstErr.column ? `, Col ${firstErr.column}` : ''})` : '';
        const errMsg = `${firstErr?.message || 'Invalid template code'}${loc}`;
        set({
          codeError: errMsg,
          codeErrorLocation: firstErr ? { line: firstErr.line, column: firstErr.column } : null,
        });
        get().showToast(firstErr?.message || 'Code validation failed', 'error');
        return false;
      }

      const nextTemplate = parseResult.template!;

      // 3. Diff templates to generate EditCommands
      const diffResult = diffTemplates(state.template, nextTemplate, state.template.version);
      if (diffResult.commands.length === 0) {
        set({
          isCodeDirty: false,
          codeError: null,
          codeErrorLocation: null,
          externalConflictDetected: false,
        });
        get().showToast('No changes detected in code.', 'info');
        return true;
      }

      // 4. Sequentially execute commands through the pipeline
      let current = state.template;
      let lastSummary = null;

      for (const cmd of diffResult.commands) {
        const commitRes = commitEdit(current, cmd, state.selectedIds);
        if (!commitRes.success || !commitRes.nextTemplate) {
          const err = commitRes.errors?.[0]?.message || 'Validation failed applying code edits.';
          set({
            codeError: err,
            codeErrorLocation: null,
          });
          get().showToast(err, 'error');
          return false;
        }
        current = commitRes.nextTemplate;
        lastSummary = commitRes.changeSummary;
      }

      // 5. Persist and update single source of truth
      persistTemplate(current);
      const newSerialized = serializeTemplate(current);

      set({
        template: current,
        codeDraft: newSerialized,
        codeBaseRevision: current.version,
        isCodeDirty: false,
        codeError: null,
        codeErrorLocation: null,
        externalConflictDetected: false,
        latestChangeSummary: lastSummary || null,
      });

      const totalProps = diffResult.summary.propertiesChanged + diffResult.summary.overridesChanged;
      const totalStruct =
        diffResult.summary.elementsAdded + diffResult.summary.elementsRemoved + diffResult.summary.elementsReordered;
      get().showToast(
        `✓ Code changes applied: ${totalProps} prop(s), ${totalStruct} structural change(s) (Rev #${current.version})`,
        'success'
      );
      return true;
    },

    syncCodeDraftFromTemplate: (force = false) => {
      const state = get();
      if (state.isCodeDirty && !force) {
        if (state.codeBaseRevision !== state.template.version) {
          set({ externalConflictDetected: true });
        }
        return;
      }

      const serialized = serializeTemplate(state.template);
      set({
        codeDraft: serialized,
        codeBaseRevision: state.template.version,
        isCodeDirty: false,
        codeError: null,
        codeErrorLocation: null,
        externalConflictDetected: false,
      });
    },

    resolveCodeConflict: (choice) => {
      if (choice === 'reload') {
        get().syncCodeDraftFromTemplate(true);
        get().showToast('Reloaded latest template into code editor', 'info');
      } else {
        set({ externalConflictDetected: false });
        get().showToast('Retained draft code with conflict awareness', 'info');
      }
    },

    reorderElement: (elementId, direction) => {
      const state = get();
      const el = state.template.elements[elementId];
      if (!el || !el.parentId) return;

      const command: EditCommand = {
        id: `cmd-reorder-${Date.now()}`,
        source: 'canvas',
        operation: 'reorder',
        reorderDirection: direction,
        targetIds: [elementId],
        viewport: 'all',
        baseRevision: state.template.version,
        summary: `Reordered ${el.name} ${direction}`,
      };

      state.commitCommand(command);
    },

    duplicateElement: (elementId) => {
      const state = get();
      const el = state.template.elements[elementId];
      if (!el) return;

      const command: EditCommand = {
        id: `cmd-duplicate-${Date.now()}`,
        source: 'canvas',
        operation: 'duplicate',
        targetIds: [elementId],
        viewport: 'all',
        baseRevision: state.template.version,
        summary: `Duplicated ${el.name}`,
      };

      const result = state.commitCommand(command);
      if (result.success && result.changedElementIds && result.changedElementIds.length > 0) {
        set({ selectedIds: [result.changedElementIds[0]] });
        get().syncCodeDraftFromTemplate();
      }
    },

    deleteElement: (elementId) => {
      const state = get();
      const el = state.template.elements[elementId];
      if (!el) return;

      const command: EditCommand = {
        id: `cmd-delete-${Date.now()}`,
        source: 'canvas',
        operation: 'delete',
        targetIds: [elementId],
        viewport: 'all',
        baseRevision: state.template.version,
        summary: `Deleted ${el.name}`,
      };

      const result = state.commitCommand(command);
      if (result.success) {
        set({
          selectedIds: state.selectedIds.filter((id) => id !== elementId),
        });
      }
    },

    openResetModal: () => set({ isResetModalOpen: true }),
    closeResetModal: () => set({ isResetModalOpen: false }),

    resetToInitialTemplate: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      const freshTemplate = JSON.parse(JSON.stringify(INITIAL_TEMPLATE));
      set({
        template: freshTemplate,
        activeViewport: 'desktop',
        editScope: 'all',
        selectedIds: ['hero-title'],
        activeProposal: null,
        latestChangeSummary: null,
        codeError: null,
        isResetModalOpen: false,
      });
      get().syncCodeDraftFromTemplate();
      get().showToast('Template reset to pristine canonical state.', 'info');
    },

    openShortcutsModal: () => set({ isShortcutsModalOpen: true }),
    closeShortcutsModal: () => set({ isShortcutsModalOpen: false }),

    openArchitectureModal: () => set({ isArchitectureModalOpen: true }),
    closeArchitectureModal: () => set({ isArchitectureModalOpen: false }),

    showToast: (message, type = 'info') => {
      set({ toast: { message, type, id: Date.now() } });
    },
    clearToast: () => set({ toast: null }),
  };
});
