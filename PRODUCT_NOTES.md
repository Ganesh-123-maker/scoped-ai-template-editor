# Product Notes (PRODUCT_NOTES.md)

This document provides formal architectural, operational, and UX definitions for the **Scoped AI Template Editor**, detailing the target persona, state model, responsive cascade rules, and security/safety guarantees.

---

## 1. User & Job-to-be-Done

- **Primary Persona**: Non-technical business owners, growth marketers, and designers adapting pre-built responsive web landing pages.
- **Core Job-to-be-Done (JTBD)**: Make high-confidence visual, copy, and layout adjustments to specific landing page sections (e.g., hero headlines, CTA buttons, feature cards) without fear of breaking responsive layouts, corrupting adjacent sections, or losing the ability to selectively undo unwanted AI or manual experiments.
- **Pain Points Solved**:
  - Eliminates "AI halluncinations" that randomly alter unintended page sections.
  - Eliminates responsive breakage where desktop edits silently destroy mobile readability.
  - Eliminates all-or-nothing rollbacks with granular, per-property historical recovery.

---

## 2. Element Boundaries & State Model

### Canonical Template Tree
The application maintains a single, normalized, JSON-serializable `TemplateModel`:
```typescript
interface TemplateModel {
  id: string;
  name: string;
  version: number;          // Monotonically increasing revision integer
  updatedAt: number;
  elements: Record<string, ElementModel>;
  rootElementIds: string[]; // Order of top-level sections
}
```

### Stable Element Hierarchy
Every element possesses a permanent, immutable identifier (e.g., `hero-section`, `hero-title`, `feature-card-1`):
```typescript
interface ElementModel {
  id: string;
  type: 'heading' | 'text' | 'button' | 'card' | 'section' | 'badge' | 'container';
  name: string;
  parentId?: string;
  childrenIds?: string[];
  base: EditableProperties;
  overrides: {
    desktop?: Partial<EditableProperties>;
    tablet?: Partial<EditableProperties>;
    mobile?: Partial<EditableProperties>;
  };
  revision: number;
}
```

### Supported Editable Properties (`EditableProperties`)
- **Content**: `text`, `label`, `href`
- **Typography**: `fontSize`, `fontWeight`, `textAlign`, `color`, `lineHeight`, `letterSpacing`
- **Appearance**: `backgroundColor`, `borderRadius`, `borderWidth`, `borderColor`, `opacity`, `shadow`
- **Spacing (4-Sided)**: `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`, `marginTop`, `marginBottom`
- **Layout & Sizing**: `width`, `height`, `maxWidth`, `display`, `flexDirection`, `alignItems`, `justifyContent`, `gap`

---

## 3. Responsive Inheritance & Resolution Rules

The editor uses an explicit, deterministic cascade model:

$$\text{Resolved Value} = \text{Override}(\text{Active Viewport}) \;\gg\; \text{Override}(\text{Desktop}) \;\gg\; \text{Base Value} \;\gg\; \text{Default}$$

1. **Shared Base (`editScope === 'all'`)**:
   - Edits update `element.base[property]`.
   - Propagates automatically across Desktop, Tablet, and Mobile unless an isolated override exists for that viewport.
2. **Viewport-Isolated Overrides (`editScope === 'mobile' | 'tablet' | 'desktop'`)**:
   - Edits update strictly `element.overrides[viewport][property]`.
   - The base property and all other viewports remain 100% pristine.
3. **Override Reset**:
   - Users can click **"Reset to shared"** on any overridden property to delete `element.overrides[viewport][property]`, immediately restoring inheritance from the shared base.

---

## 4. AI Scoping, Selection Authority & Proposal Contract

### Absolute Selection Authority
The AI engine is strictly sandboxed to the user's active selection:
1. **Scope Invariant**: If element IDs `[A, B]` are selected, the AI engine is mathematically barred from mutating any element $C \notin [A, B]$.
2. **Validator Rejection**: The unified validation pipeline (`validateCommand`) checks `command.elementIds \subseteq selectedIds`. Any proposal attempting to touch an unselected element is rejected with an explicit error.
3. **No Direct Mutation**: The AI engine never mutates the canonical template directly. It produces an `AIProposal` with per-element diffs (`before` vs. `after`).

### Proposal Lifecycle
```text
[User Prompt / 1-Click Preset]
        ↓
[Deterministic AI Scenario Engine]
        ↓
[AIProposal Generated with baseRevision]
        ↓
[User Interactive Review Panel]
   ├── Accept All / Reject All
   ├── Per-Element Accept / Reject
   └── Stale Proposal Detection (Alerts if template.version > baseRevision)
        ↓
[Unified EditCommand Committed to Store]
```

---

## 5. Unified Command Pipeline & Granular Recovery

Every state mutation—whether from the visual inspector, Monaco code editor, AI proposal acceptance, undo/redo, or history rollback—is dispatched as an `EditCommand`:

```typescript
interface EditCommand {
  id: string;
  source: 'inspector' | 'code_editor' | 'ai' | 'restore' | 'undo' | 'redo';
  elementIds: string[];
  viewport: Viewport; // 'all' | 'desktop' | 'tablet' | 'mobile'
  changes: Partial<EditableProperties>;
  timestamp: number;
}
```

### Granular Property-Level Recovery
Unlike traditional document-level undo which discards intermediate progress, the Scoped AI Template Editor supports **Independent Property Restoration**:
- **Mechanism**: The user can open any historical revision in the History Panel, expand an element, and click **"Restore this property"** on a single property (e.g. `fontSize`).
- **Result**: Generates a forward `EditCommand` applying that historical value to the current live revision without disturbing any edits made to other properties or other elements.

---

## 6. Persistence & Reset Architecture

1. **Persistence Mechanism**:
   - Canonical template state and full revision history are automatically synced to browser `localStorage` on every commit under the key:
     `scoped_ai_template_editor_canonical_state_v1`
   - State survives browser refreshes, tab closures, and navigation.
2. **Deliberate Reset Project Flow**:
   - The top header provides a **"Reset Project"** button with a confirmation modal.
   - Clears `localStorage` and re-seeds the pristine canonical template and initial revision history entry.
