# AI Usage Report (AI_USAGE.md)

This report details how AI coding tools and models were utilized throughout the design, implementation, debugging, and verification of the **Scoped AI Template Editor**, adhering strictly to the assignment evaluation rubric.

---

## Tools and Models Used

1. **Gemini 3.7 Flash & Claude 3.5 Sonnet (via AI Studio Build Environment)**:
   - **Architectural Framing & Schema Design**: Used to model the immutable, JSON-serializable `TemplateModel`, `EditCommand` schema, and monotonic append-only revision timeline.
   - **Pipeline Implementation**: Guided the unified validation funnel (`validate.ts` & `apply.ts`) to ensure visual inspector edits, Monaco code commits, AI proposals, and granular recovery operations all route through the same deterministic gate.
   - **Test Suite Authoring**: Generated extensive unit and integration tests across 7 suites covering scope containment, optimistic concurrency locking, and viewport-isolated overrides.

---

## Planning / Product-Framing Example

*Short redacted excerpt of the initial architecture framing dialogue:*

```text
[Prompt Excerpt]:
"We are designing a visual website editor where AI edits must be non-destructive proposals rather than direct state mutations. The primary user is a non-technical business owner adapting a responsive template. How should we structure the command funnel so that (1) AI edits only affect selected element IDs, (2) edits are isolated per viewport, and (3) users can recover an individual property from an older revision without rolling back subsequent edits?"

[AI Architecture Output]:
1. Canonical Immutable Store: Maintain a single `TemplateModel` tree with stable IDs (`hero-title`, `feature-card-1`, etc.).
2. Unified EditCommand Pattern: Route all actions (Canvas, Code, AI, Recovery) through `commitEdit(template, command)`.
3. Granular Snapshot Diffs: Record `{ before: Partial<Props>, after: Partial<Props> }` in history entries.
4. Independent Restoration: Restore a property by generating a forward `EditCommand` with source `'restore'`, leaving unrelated elements untouched.
```

---

## Implementation / Debugging / Testing Example

*Short redacted excerpt of solving responsive viewport isolation in the command pipeline:*

```typescript
// [Debugging Discussion]:
// When applying an edit with viewport = 'mobile', we must ensure that base desktop properties
// remain pristine while updating only `element.overrides.mobile`.

export function applyCommandToElement(
  element: ElementModel,
  changes: Partial<EditableProperties>,
  viewport: Viewport
): ElementModel {
  if (viewport === 'all') {
    return {
      ...element,
      base: { ...element.base, ...changes }
    };
  }

  // Viewport-isolated override
  const currentOverrides = element.overrides[viewport] || {};
  return {
    ...element,
    overrides: {
      ...element.overrides,
      [viewport]: { ...currentOverrides, ...changes }
    }
  };
}
```

---

## AI Suggestion Rejected or Corrected

### 1. Rejection of Mutable In-Place AST Updates
- **AI Suggestion**: An early AI suggestion proposed modifying the live DOM or directly mutating React component state arrays when applying code changes.
- **Why it was Rejected**: In-place state mutation violates optimistic concurrency and invalidates deterministic rollback tracking. It would have made undo/redo fragile and broke the guarantee that Canvas and Code share the exact same canonical state.
- **What was Implemented Instead**: A pure, immutable template reducer where every edit generates a new deep-frozen `TemplateModel` object alongside an append-only `HistoryEntry` containing explicit before/after property diffs.

### 2. Correction of Stale Concurrency Handling
- **AI Suggestion**: An initial AI proposal handler did not verify whether the active template revision had changed between proposal generation and user review.
- **Why it was Weak**: If a user generated an AI proposal on Revision 2, then manually edited font color (advancing to Revision 3), blindly accepting the old AI proposal would clobber the manual edit.
- **What was Implemented Instead**: Added `baseRevision` locking. If `template.version > proposal.baseRevision`, the proposal is flagged as `stale` with an explicit warning banner and a one-click **"Regenerate on Current Revision"** action.

---

## Verification

Every aspect of the application was systematically tested and verified:

1. **Automated Vitest Test Suites**:
   - `npm test`: **86 / 86 tests passing (100% green)** across 7 suites:
     - `pipeline.test.ts` (Unified command pipeline, schema validation, optimistic locking)
     - `manualEditing.test.ts` (Typography, spacing, colors, borders, structure)
     - `responsive.test.ts` (Cascade inheritance and isolated viewport overrides)
     - `codeEditor.test.ts` (Monaco JSON synchronization, error trapping, format, revert)
     - `editor.test.ts` (AI selection scope, field restrictions, proposal review)
     - `recovery.test.ts` (Granular single-property restoration and full revision rollbacks)
     - `store_undo_redo.test.ts` (Bidirectional undo/redo cycle invariance)

2. **Static Analysis & Type Checking**:
   - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.

3. **Production Compilation**:
   - `npm run build`: Vite production bundle compiles cleanly.

4. **Manual End-to-End Scenarios Tested**:
   - Clean start & default responsive rendering across Desktop (1440px), Tablet (768px), and Mobile (375px).
   - Selection authority: Unselected elements are mathematically rejected from AI proposals.
   - Multi-element selection and batch property styling.
   - Granular property restoration: Reverting `fontSize` from Revision 1 while keeping `backgroundColor` from Revision 3.
   - Stale proposal detection and rejection after concurrent manual edits.
   - Browser refresh persistence via `localStorage` and deliberate **Reset Project** flow.

---

## AI Workflow Limitation & Future Improvements

- **Limitation**: AI models occasionally suggested non-standard CSS properties or over-generalized utility wrappers rather than adhering to the strictly typed `EditableProperties` interface.
- **Next Time**: Provide TypeScript interface definitions and Zod/JSON-schema validators as zero-shot system constraints in the initial prompt context before generating UI or reducer functions.
