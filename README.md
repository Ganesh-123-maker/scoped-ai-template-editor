# Scoped AI Template Editor

A controlled AI-assisted visual editor for responsive websites.

AI proposes scoped changes.
Users review them.
Accepted changes pass through validation and become recoverable revisions.

Live Link: https://scoped-ai-template-editor-3.onrender.com/
---

## Overview

Traditional visual website editors offer direct manipulation of UI properties, but manual adjustments across multiple viewports and elements can become tedious. Conversely, modern generative AI website builders often behave like black boxes—applying massive, unpredictable full-page replacements that destroy manual tweaks, fail silently on responsive edge cases, and provide no intuitive rollback or granular recovery.

The **Scoped AI Template Editor** introduces a disciplined, production-grade paradigm: **AI is treated as a scoped proposal generator rather than a direct state mutator**. Users retain complete visual and programmatic authority over their template at all times.

Every operation in the editor—whether initiated by visual inspector controls, JSON code modifications, scoped AI prompts, or revision rollbacks—flows through a single deterministic validation and commit pipeline. This architecture guarantees strict state immutability, optimistic concurrency protection, and seamless bidirectional synchronization between code and canvas.

---

## Key Features

### Visual Editor
- **Precision Element Selection**: Single-click selection, hierarchical parent/child navigation, and canvas hover highlighting with boundary indicators.
- **Multi-Element Selection**: Multi-select sibling or disparate elements (`Shift + Click`) to batch-edit shared properties or issue multi-element AI commands.
- **Direct Property Editing**: Real-time manipulation of typography (font family, size, weight, line height, letter spacing), colors (text, background, border), spacing (padding, margin, gap), flex/grid layouts, borders, and shadows.

### Responsive Preview & Editing
- **Interactive Viewport Modes**: Instant switching between **Desktop** (1280px+), **Tablet** (768px), and **Mobile** (375px) with animated canvas framing.
- **Isolated Viewport Overrides**: Styles configured in Mobile or Tablet modes automatically create isolated responsive overrides without mutating base desktop values.
- **Clean Fallback Cascade**: Unset responsive values automatically inherit from base desktop configurations.

### Code Editor & Bidirectional Synchronization
- **Integrated JSON Code Editor**: Embedded Monaco code editor providing direct access to the canonical template JSON tree.
- **Strict Schema Validation**: Real-time linting, bracket matching, and schema checks preventing malformed JSON, invalid styles, or unknown element IDs from reaching state.
- **Bidirectional Live Sync**: Changes made in the visual canvas or via AI immediately update the code editor; edits committed in code immediately update the canvas.

### Scoped AI Proposal System
- **Deterministic AI Engine**: Generates reproducible, scoped diff objects based strictly on active selection, active viewport, and user prompt.
- **Non-Destructive Proposal Cards**: Displays detailed Before/After diffs for each affected property and viewport.
- **Granular Review Controls**: Accept All, Reject All, or individually accept/reject changes per element.
- **Optimistic Concurrency & Stale Detection**: Proposals track their base revision number; if the template advances before review, the proposal is safely flagged as stale with a one-click regenerate option.
- **Constraint Enforcement**: Out-of-scope prompts (e.g., requesting backend logic or targeting unselected nodes) are cleanly rejected with helpful guidance.

### Revision History & Granular Recovery
- **Append-Only Chronological Timeline**: Every committed change creates a numbered revision tagged with its source (`Manual`, `Code`, `AI`, `Restore`).
- **Comprehensive Diff Inspection**: Inspect exact before/after values, affected element IDs, and timestamps for every revision.
- **Granular Property Restoration**: Surgically restore a single property (e.g., restore `fontSize` from Revision 2 while keeping color changes from Revision 5) without rolling back unrelated work.
- **Full Revision Rollback**: Revert the entire page to any past state by creating a new forward revision, preserving unbroken chronological history.

### Undo / Redo Pipeline
- **Command-Based State Reversals**: Full `Ctrl+Z` / `Ctrl+Y` undo/redo stack across manual edits, code commits, AI proposal applications, and restore operations.

---

## Why Scoped AI?

Most AI-assisted editors fail in production because they blur the boundary between AI generation and state management. When an AI agent directly mutates a live document:
1. Unintended side-effects overwrite adjacent elements and responsive configurations.
2. Users lose visibility into what changed and why.
3. Reviewing diffs becomes impossible before destructive commits take place.
4. History becomes a fragile string of full-state snapshots with no ability to restore individual properties.

This project solves these fundamental problems by cleanly decoupling **Intent**, **Proposal**, **Review**, **Validation**, and **Commit**:

```
Intent  ──▶  Scoped Proposal  ──▶  User Review  ──▶  Validation  ──▶  Commit  ──▶  Canonical State
```

Users visually scope the AI by selecting specific elements and active viewports. The AI generates explicit before/after diff proposals that users can accept, reject, or cherry-pick item-by-item before any change affects the canonical state.

---

## Architecture

Every state mutation in the application flows through a single unified pipeline:

```
                User Action
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
  Visual Edit    JSON Code    AI Proposal
  (Inspector)     (Monaco)     (Accepted)
       │             │             │
       └─────────────┼─────────────┘
                     ▼
                EditCommand
           (Targets, Viewport,
          Changes, BaseRevision)
                     │
                     ▼
             Unified Validation
          (Schema, Bounds, Security)
                     │
                     ▼
                Atomic Commit
                     │
                     ▼
          Canonical Template Model
         (Single Source of Truth)
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
 Visual Canvas   Code Editor    History
 (Live Render)  (Bidirectional) (Append-Only)
                                   │
                                   ▼
                           Granular Recovery
```

### AI Safety Model
1. **Strict Selection Authority**: AI prompts can only modify elements that are currently selected. Unselected nodes are mathematically inaccessible to the AI generator.
2. **Viewport Containment**: Responsive AI commands are confined to the active viewport (e.g., mobile prompts generate mobile overrides, never polluting desktop base styles).
3. **No Direct State Mutation**: AI routines produce isolated JSON proposal objects; they possess zero direct write access to the template store.
4. **Optimistic Revision Locking**: Every proposal records the template `baseRevision` at time of creation. If an external edit advances the revision before proposal acceptance, the proposal is marked as `stale` to prevent race conditions.
5. **Deterministic Execution**: The AI engine is 100% deterministic and reproducible. Given the same template state, selection, viewport, and prompt, it consistently outputs identical, valid proposals.
6. **Zero Code Injection**: The editor completely prohibits `eval()`, `new Function()`, or dynamic script execution. All style and content attributes are verified against strict schema whitelists.

---

## Responsive Editing

The template model implements an inheritance-based responsive styling architecture:

```
Desktop (Base Styles: fontSize = 56px, padding = 48px)
   │
   ├── Tablet Override (fontSize = 44px) ──▶ Inherits desktop padding (48px)
   │
   └── Mobile Override (fontSize = 32px, padding = 24px) ──▶ Custom isolated values
```

- When editing in **Desktop** mode, properties update the primary node definition.
- When editing in **Tablet** or **Mobile** mode, properties are saved inside node `responsive.tablet` or `responsive.mobile` maps.
- Switching between viewports renders exactly how the design behaves at native device breakpoints without cross-viewport style bleed.

---

## Revision History & Recovery

### Append-Only Monotonic Timeline
Unlike basic undo stacks that discard forward history when branching, every commit in the Scoped AI Template Editor is permanently recorded in the revision history with its source (`Manual`, `Code`, `AI`, `Restore`), timestamp, affected nodes, and before/after property snapshots.

### Granular Property Restoration
Traditional editors force a full-document rollback when recovering past changes. This editor allows users to expand any historical revision, inspect individual modified properties, and restore only that specific property (e.g., revert heading `fontSize` without losing subsequent color or layout adjustments).

### Chronological Integrity
Restoring a historical revision or individual property never truncates or rewrites existing history. Instead, the recovery action generates a new `EditCommand` (tagged with source `Restore`) and commits it as a new forward revision.

---

## Demo Flow

For complete step-by-step evaluator instructions, see [DEMO.md](DEMO.md).

1. **Visual Editing**: Select Hero Title & adjust font size/color.
2. **Responsive Editing**: Switch to Mobile, adjust size to `32px`, return to Desktop to verify isolation.
3. **Scoped AI Proposal**: Select 3 Feature Cards and generate proposal for `"Make these cards more rounded"`.
4. **Review Before Commit**: Reject Card 1, accept Cards 2 & 3.
5. **Inspect History**: View the tagged revision and diffs.
6. **Granular Recovery**: Restore a single previous property.
7. **Code Synchronization**: Edit and commit in Monaco JSON editor.
8. **Undo / Redo**: Cycle forward and backward across all changes.

---

## Tech Stack

- **Framework**: React 19 + TypeScript (Strict Mode)
- **State Management**: Zustand (Immutable Canonical State Engine)
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Animation**: Motion (`motion/react`)
- **Build Tool**: Vite 6
- **Test Runner**: Vitest (86 unit and integration tests)

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

### Production Build
```bash
# Type-check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Testing

```bash
# Run all unit and integration tests
npm test

# Run TypeScript static analysis
npm run lint
```

**Test Coverage Summary**:
- **86 / 86 Tests Passing (100% Green)** across 7 suites (`pipeline.test.ts`, `manualEditing.test.ts`, `responsive.test.ts`, `codeEditor.test.ts`, `editor.test.ts`, `recovery.test.ts`, `store_undo_redo.test.ts`).

---

## Template Source

**Template source**: Original implementation created specifically for this assignment. All structural elements, responsive layouts, typography scales, and modular card components were designed from the ground up for deterministic testing and live multi-viewport evaluation.

---

## Assignment Requirement Coverage

| Requirement | Implementation & Architectural Pattern | Evidence & Verification | Automated Test Suite |
| :--- | :--- | :--- | :--- |
| **1. Responsive Template** | Modular, 1-page modern landing page with stable element IDs. | Visual canvas rendering across 1440px, 768px, 375px. | `src/__tests__/manualEditing.test.ts` |
| **2. Stable Element IDs** | Strict string identifiers (`hero-title`, `feature-card-1`, etc.) preserved across mutations. | Verified across manual, code, AI, restore, and reordering. | `src/__tests__/pipeline.test.ts` |
| **3. In-Canvas Editing** | Interactive property inspector manipulating typography, color, spacing, borders, layout. | Direct visual editing with immediate canvas updates. | `src/__tests__/manualEditing.test.ts` |
| **4. In-Code Editing** | Embedded Monaco JSON code editor for direct canonical tree modifications. | Real-time schema linting, format, revert, and canvas sync. | `src/__tests__/codeEditor.test.ts` |
| **5. Responsive Previews & Overrides** | Desktop (1440px), Tablet (768px), and Mobile (375px) with isolated override dictionaries. | Changes made in Mobile/Tablet do not mutate base Desktop values. | `src/__tests__/responsive.test.ts` |
| **6. Single & Group Selection** | Click selection + Additive `Shift + Click` multi-element selection. | Multi-selection badges and batch styling in inspector. | `src/__tests__/editor.test.ts` |
| **7. Scoped AI Engine** | Deterministic scenario engine generating proposals restricted to selected IDs. | AI proposal card showing before/after diffs per element. | `src/__tests__/editor.test.ts` |
| **8. Proposal Review** | Non-destructive review UI with per-element accept/reject and batch controls. | Canvas remains untouched until explicit user acceptance. | `src/__tests__/editor.test.ts` |
| **9. Partial Acceptance** | Multi-element proposals allow accepting subsets (e.g. accept 2 of 3 cards). | Independent element commits and history records. | `src/__tests__/editor.test.ts` |
| **10. Append-Only History** | Monotonic revision timeline logging source, timestamp, diffs, and affected IDs. | Expandable revision history cards with granular property diffs. | `src/__tests__/recovery.test.ts` |
| **11. Granular Property Recovery** | Single-property rollback restoring past values without reverting subsequent edits. | "Restore Property" button creates forward revision for that target. | `src/__tests__/recovery.test.ts` |
| **12. Refresh Persistence** | Synchronizes canonical state and history to `localStorage`. | Survives page refreshes and browser tab reloads. | Integrated store persistence |
| **13. Deliberate Project Reset** | Header "Reset Project" action with confirmation modal. | Re-seeds initial template and cleans local storage safely. | Manual & UI integration |
| **14. Unified Command Validation** | Centralized `validateCommand` gate preventing invalid payloads and stale edits. | Rejects malformed properties, forbidden keys, and unknown IDs. | `src/__tests__/pipeline.test.ts` |
| **15. Automated Test Suite** | 86 unit and integration tests across 7 comprehensive test suites in Vitest. | 100% test pass rate (`86 passed`). | `npm test` |

---

## Limitations

- **Template Node Boundaries**: Edits are constrained to structured template schema components to preserve canonical state guarantees.
- **Deterministic AI Model**: The prototype uses a deterministic rule-based semantic parser and diff engine rather than an external non-deterministic LLM API to guarantee 100% reproducibility and instant evaluation feedback.
- **Client Persistence**: Persistence is managed locally in memory with optional session storage resets.

---

## Future Improvements

- Multi-user real-time CRDT collaboration on top of the `EditCommand` stream.
- Custom component definition creator allowing users to define new modular schema blocks.
- Hybrid LLM streaming integration using the existing `AIProposal` review sandbox.
- Production export to standalone Next.js / Tailwind codebases.
