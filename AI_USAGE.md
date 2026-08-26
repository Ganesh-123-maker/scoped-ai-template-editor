# AI Usage & Verification Record

This document records the actual tools, interactions, verification procedures, and workflow adaptations used during the engineering of the Scoped AI Template Editor prototype.

---

## 1. Tools and Models Used

- **AI Coding Assistant**: Google AI Studio Build Assistant powered by Gemini 3.7 Flash.
- **Assistance Areas**:
  - Architectural scaffolding of the unified edit command and validation pipeline.
  - TypeScript schema design for the canonical template model and viewport overrides.
  - Formulating edge-case test suites (selection authority, stale revision conflict, independent per-element rollback).
  - Designing deterministic preset scenario algorithms.

---

## 2. Two Representative Interactions

### A. Planning & Product-Framing Interaction (Redacted Extract)
> **User Prompt**: "How should we structure the responsive resolution engine such that a mobile-only override does not mutate desktop/tablet views, while shared base changes still cascade to all viewports without explicit overrides?"
> 
> **Architectural Resolution**:
> Implemented a two-tiered resolution algorithm:
> `resolvedProperty = element.overrides[activeViewport]?.[prop] ?? element.base[prop]`
> Edit commands with `viewport: 'all'` mutate `element.base`, allowing updates to flow cleanly. Edit commands with `viewport: 'mobile'` write solely to `element.overrides.mobile`, achieving 100% viewport isolation.

### B. Implementation & Debugging Interaction (Redacted Extract)
> **Problem Encountered**: During the implementation of the Partial Acceptance test suite, the validator rejected the test edit command with an error stating `No active element selection provided`.
>
> **Debugging Action**:
> Inspected `src/core/validation.ts` and identified that the validator strictly requires the active selection array to verify selection authority for `source === 'ai'`. Updated the test suite in `src/__tests__/editor.test.ts` to pass `activeSelection: ['feature-1', 'feature-2']` to `applyEditCommand()`, confirming that even when multiple elements are selected, accepting only `feature-1` successfully commits only `feature-1` while leaving `feature-2` untouched.

---

## 3. Rejected or Materially Corrected AI Suggestion

- **Initial Suggestion**: An initial concept suggested implementing global undo/redo using an undo stack of full template snapshots.
- **Reason for Rejection**: A global undo stack violates the core requirement: rolling back an edit on one element would undesirably undo unrelated work done on other elements or viewports in the interim.
- **Resulting Engineering Change**: Replaced global undo with **Independent Per-Element & Per-Viewport Recovery** (`restoreElementRevision()`), storing granular element-level snapshots inside each `HistoryEntry` so that any element at any viewport can be restored individually.

---

## 4. Code Verification & Quality Auditing

### Commands & Automated Tests Executed
1. `npm test`: Executed Vitest test suites covering selection authority, field whitelisting, responsive viewport isolation, canvas/code synchronization, invalid code safety, independent recovery, partial proposal acceptance, stale revision rejection, and deterministic replay. (9/9 tests passing).
2. `npm run lint`: Verified strict TypeScript compilation with `tsc --noEmit` (0 errors).
3. `npm run build`: Executed production Vite build with esbuild bundling (0 warnings/errors).

### Manual Interactive Scenarios Exercised
- Tested single-click selection and Shift-click multi-selection on canvas and layers tree.
- Tested drag-marquee box selection across feature cards.
- Tested mobile-only font size changes and verified desktop canvas remained 48px while mobile resolved to 22px.
- Tested AI Content Rewrite and Prominent Button proposals, accepting one card and rejecting another.
- Tested code editor with valid JSON (canvas updated immediately) and invalid JSON (error banner displayed, state preserved).
- Tested independent per-element restore from the Revision History tab.

---

## 5. Workflow Limitation & Next-Time Improvement

- **Limitation**: When working across tightly coupled validation rules and multi-element state transitions, reviewing unit test outputs directly via terminal tools can surface subtle contract nuances.
- **Next-Time Improvement**: Build an in-browser interactive test harness right into the editor UI from the start (which was completed in `BottomPanel.tsx`), giving real-time visual feedback during iterative development.
