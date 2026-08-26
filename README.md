# Scoped AI Template Editor

A production-grade, browser-based Website Builder prototype featuring **deterministic scoped AI edits**, **two-way canvas-code synchronization**, **isolated responsive viewport overrides**, and **granular per-element & per-viewport revision recovery**.

---

## 1. Overview

In standard web editors, AI prompts and manual edits can dangerously rewrite more than the user intended, silently break mobile/tablet breakpoints, overwrite previous manual work, or leave the author unsure of what changed.

The **Scoped AI Template Editor** introduces a formal contract where:
- **Single Source of Truth**: A typed, JSON-serializable template model powers the canvas, code editor, AI demo, history, and persistence.
- **Selection is Authority**: AI proposals and edits are mathematically constrained to only the currently selected element IDs and whitelisted editable fields.
- **Deterministic AI Co-Pilot**: Text instructions generate reproducible, typed proposal diffs. Nothing mutates until the user explicitly accepts.
- **Partial Acceptance**: In multi-element proposals, users can accept or reject each element independently.
- **Independent Per-Element Recovery**: Users can restore a specific past revision for a single element and viewport without rolling back unrelated elements or views.

---

## 2. Setup & Execution

### Prerequisites
- Node.js 18+
- npm 9+

### Commands

```bash
# Install dependencies
npm install

# Start local development server (binds to http://localhost:3000)
npm run dev

# Run automated Vitest test suite
npm test

# Run TypeScript validation / linting
npm run lint

# Build production bundle
npm run build
```

---

## 3. Chosen Responsive Template

- **Template Name**: Aura Intelligence Platform (Responsive One-Page SaaS / Agency Landing Page)
- **License / Source**: Original bespoke design created specifically for this candidate prototype.
- **Component Hierarchy & Stable IDs**:
  - `header`: Sticky Top Navigation (`logo`, `nav-container`, `header-cta`)
  - `hero`: Hero Section (`hero-eyebrow`, `hero-title`, `hero-description`, `hero-primary-cta`, `hero-secondary-cta`, `hero-metric-card`)
  - `features`: 3-Column Features Grid (`features-title`, `features-subtitle`, `feature-1`, `feature-2`, `feature-3`)
  - `testimonial`: Social Proof (`testimonial-card`, `testimonial-quote`, `testimonial-author`, `testimonial-role`)
  - `final-cta`: Conversion Banner (`final-cta-title`, `final-cta-desc`, `final-cta-button`)
  - `footer`: Site Footer (`footer-brand`, `footer-copyright`, `footer-status`)

---

## 4. Interactive Demo Walkthrough

1. **Load**: The application loads the canonical template model from memory or cached localStorage state.
2. **Preview Responsive Breakpoints**: Use the top toolbar to switch between **Desktop (1440px)**, **Tablet (768px)**, and **Mobile (375px)** previews.
3. **Select Elements**:
   - Single-click any element on the visual canvas or layers tree.
   - Multi-select via **Shift-click**, **Cmd/Ctrl-click**, or **drag-marquee** across the canvas.
4. **Manual Canvas Editing**: Use the **Design Inspector** on the right to edit text content, font sizes, weights, background/border colors, corner radius, padding, or margins.
5. **Responsive Scope Isolation**:
   - Toggle `Apply changes to: [ Mobile ]`.
   - Change font size on the Hero Title. Notice that mobile updates to your chosen size while Desktop and Tablet views remain intact.
6. **Deterministic AI Co-Pilot**:
   - Select `hero-title` or all 3 feature cards.
   - Switch to the **AI Co-Pilot** tab.
   - Click a documented preset (e.g., *"Rewrite Heading (Executive / B2B)"* or *"Make Button More Prominent"*), or enter a custom instruction.
7. **Proposal Review & Partial Acceptance**:
   - The AI generates a structured before/after diff.
   - Click **Accept** or **Reject** on individual element cards. The template updates immediately upon acceptance without touching rejected items.
8. **Two-Way Code Editing**:
   - Click `</> Code` in the top toolbar to open the synchronized code editor.
   - Modify a property (e.g., change `text` or `fontSize`) and click **Apply Code Changes**.
   - Intentionally enter invalid JSON syntax to verify that the editor shows an error banner and safely preserves the previous valid state.
9. **Revision History & Independent Recovery**:
   - Click `◷ History` to inspect the chronological timeline.
   - Locate an earlier revision and click **"Restore This Element"** next to a specific element. Only that element at that viewport scope restores—all other work remains untouched.
10. **Automated Test Suite**:
    - Click `Verify Tests` in the toolbar to run the interactive in-browser test runner, verifying all 12+ safety rules with live assertion notes.

---

## 5. Architecture & Requirement Mapping

```text
                      CANONICAL TEMPLATE MODEL (Zustand + Storage)
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
        CANVAS STAGE             CODE SURFACE            AI CO-PILOT
      (RenderElement)           (JSON Editor)         (Scenario Engine)
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
                              EDIT COMMAND PIPELINE
                                      │
                              STRICT VALIDATION
                  ├── 1. Target ID Existence
                  ├── 2. Selection Authority (AI scope check)
                  ├── 3. Field Whitelist Verification
                  ├── 4. Viewport Scope Check
                  └── 5. Stale Revision Check
                                      │
                               COMMIT & PATCH
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
            REVISION HISTORY                        PERSISTENCE
       (Independent Recovery)                      (localStorage)
```

| Assignment Requirement | Architecture Implementation |
| :--- | :--- |
| **Stable Element IDs** | Typed `ElementModel` keyed by deterministic string IDs (e.g., `#hero-title`, `#feature-1`). |
| **Canonical Source of Truth** | JSON-serializable `TemplateModel` in `src/store/useEditorStore.ts`. |
| **Responsive Viewports** | Device frames for Desktop (1440px), Tablet (768px), and Mobile (375px) in `src/components/canvas/CanvasStage.tsx`. |
| **Selection Authority** | Selection stored as `selectedIds: string[]`. AI commands referencing unselected targets are rejected in `src/core/validation.ts`. |
| **Canvas & Code Sync** | Two-way reactive synchronization between `RenderElement.tsx` and Monaco-style JSON code surface. |
| **Deterministic AI Engine** | Pure function in `src/core/aiScenarioEngine.ts` matching instructions to structured typed proposals. |
| **Before/After Review** | Visual diff review card with independent `Accept` and `Reject` buttons per element in `src/components/inspector/InspectorPanel.tsx`. |
| **Partial Acceptance** | Multi-element proposals allow accepting item A while rejecting item B. |
| **Granular History Recovery** | Per-element, per-viewport restore in `src/core/recovery.ts` without full-page rollbacks. |
| **Persistence & Reset** | Safe localStorage persistence with corrupt state fallback and deliberate reset confirmation. |
| **Automated Testing** | Vitest suite (`npm test`) + live in-browser test runner in `src/core/testRunner.ts`. |

---

## 6. Testing

Run automated tests:
```bash
npm test
```
All 9 core safety & contract integration test suites verify:
- Selection authority enforcement
- Property whitelisting
- Viewport override isolation
- Canvas/code synchronization
- Invalid code error recovery
- Independent per-element recovery
- Partial proposal acceptance
- Stale revision conflict rejection
- Deterministic AI replay consistency

---

## 7. Known Limitations & Next 3 Improvements

1. **Asset Upload Pipeline**: Currently utilizes semantic vector icons and SVG markers; next iteration will add direct image upload with automatic WebP compression.
2. **Drag-and-Drop Canvas Reordering**: Canvas supports layer-tree reordering and keyboard moves; visual drag-to-dock grid handles are planned next.
3. **Branching Revisions**: Current history operates as a linear stack with per-element checkpoints; future work will support named branches and visual visual regression comparison.
