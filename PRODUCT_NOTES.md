# Product Notes & Technical Contract

## 1. Primary User, Job, and Definition of a Safe Completed Template Edit

### Primary User
A non-technical or semi-technical small business owner, founder, or marketing operator adapting an existing website template for their company.

### Primary Job
Make high-impact visual, content, and responsive adjustments quickly without breaking other screen sizes, corrupting underlying layouts, or losing the ability to roll back individual mistakes.

### Definition of a Safe Completed Template Edit
An edit is considered safe and completed when:
1. **Validated**: It has passed strict runtime schema validation (target IDs exist, properties are in the allowed whitelist, viewport scope is valid, and base revision matches).
2. **Committed**: It is written to the canonical `TemplateModel` state with an incremented version number.
3. **Isolated**: Viewport overrides do not leak to unselected viewports, and unselected elements remain bit-for-bit identical.
4. **Logged**: A new `HistoryEntry` is generated containing granular element snapshots for future independent recovery.
5. **Persisted**: The resulting state is safely serialized to local persistent storage.

---

## 2. Definitions

- **Element**: A modular, typed UI unit identified by a permanent string ID (e.g. `hero-title`). It defines a semantic `type` (`heading`, `button`, `card`, etc.), a `base` properties object, and an `overrides` dictionary for specific viewports.
- **Group Selection**: An explicit array of stable element IDs (`selectedIds: string[]`). It is never inferred from CSS selectors, DOM ordering, or text matching.
- **Committed Step**: An immutable mutation executed through `applyEditCommand()` that produces a new incremented template revision and corresponding history record.
- **Viewport Scope**: The targeted execution environment for a change: `'all'` (updates shared base properties) or `'desktop' | 'tablet' | 'mobile'` (updates only that viewport's override map).
- **Editable Property Boundary**: The strict whitelist of safe, styling, content, and layout properties defined in `ALLOWED_EDITABLE_FIELDS` (e.g., `text`, `fontSize`, `backgroundColor`, `borderRadius`, `paddingTop`, etc.). Arbitrary keys or code injection attempts are actively blocked.

---

## 3. Canonical State & Responsive Resolution

### Canvas and Code State Sharing
The application maintains a single, unified `TemplateModel` in Zustand.
- The visual canvas (`RenderElement.tsx`) reads directly from this store.
- The code editor reflects this exact JSON representation.
- When an edit is made in code, it is parsed and dispatched through the exact same `applyEditCommand()` pipeline as a canvas or AI edit. If code contains syntax or schema errors, an error banner is displayed and the previous valid state is preserved without mutation.

### Responsive Precedence Order
When rendering an element for an active viewport `V` (`desktop`, `tablet`, or `mobile`):
```text
Resolved Property = element.overrides[V][prop] ?? element.base[prop] ?? default
```
1. **Viewport Override**: Highest precedence. If set, this value is rendered for viewport `V`.
2. **Base / Shared Property**: Applies if no override exists for viewport `V`.
3. **Cascade Rule**: Edits made with scope `all` update the `base` property, naturally flowing to all viewports that do not have an explicit override. Edits made with scope `V` update only `overrides[V]`, leaving all other viewports strictly unchanged.

---

## 4. Deterministic AI Demo & Safety Bounds

### Selection Authority
The AI engine is given the active selection as an explicit constraint. The runtime validator enforces that every element targeted in an AI proposal must be an active member of `activeSelection`. If an AI proposal attempts to modify an unselected element (e.g., background container or footer), the unauthorized item is marked `invalid` and rejected.

### Stale Revision Handling
If an AI proposal or edit command is submitted with a `baseRevision` that does not match `template.version` (e.g., if the user made canvas changes while the proposal was pending), the command is rejected with a `Stale Revision Conflict` error.

---

## 5. Review, Partial Acceptance, and Recovery Policy

### Proposal Review & No Automatic Overwrite
AI output is strictly a proposal. It renders in an isolated review card displaying exact Before / After diffs. No template values mutate prior to explicit user approval.

### Partial Acceptance
In a multi-element proposal (e.g., updating 3 feature cards):
- The user can click **Accept** on Card 1, **Reject** on Card 2, and **Accept** on Card 3.
- The pipeline applies commands only for Cards 1 and 3. Card 2 remains in its exact baseline state.

### Independent Per-Element Recovery Policy
Rather than a destructive global undo that rolls back the entire page and destroys intervening work, the editor supports **Independent Per-Element Recovery**:
- Users can inspect the revision history and click **"Restore This Element"** on any specific historical record.
- The engine fetches the snapshot for that element at that revision and applies a restore command targeting only that element ID and viewport scope.
- All other elements and other viewport overrides remain untouched.
- The restore action itself increments the version and records a new history entry.

---

## 6. One Product Improvement: Change Summary & Audit Trail

### User Problem
When non-technical users apply multi-element edits or accept AI proposals, they often feel uneasy about what exact properties changed across different viewports, leading to hesitation or inadvertent misconfigurations.

### Chosen Feature: Granular Change Summary & Audit Trail
After any commit (Canvas, Code, AI, or Restore), the editor computes a detailed diff record showing exact `from → to` transitions per element and viewport. This appears in the **Change Summary** tab with one-click rollback capability.

### How Success Would Be Tested
1. **User Confidence Metric**: Measure the rate of immediate undos / resets after AI proposals (lower rate indicates higher user confidence).
2. **Task Completion Speed**: Test whether users can review and verify responsive changes 30%+ faster when provided with explicit property diffs compared to manual visual inspection alone.

---

## 7. Cuts, Assumptions, and Next Three Priorities

### Deliberate Cuts
- No third-party AI API keys or non-deterministic LLM calls (strictly local deterministic scenario engine per specifications).
- No external backend database server (used client-side persistent model with localStorage).

### Key Assumptions
- Screen breakpoints adhere to standard responsive widths: Desktop (1440px), Tablet (768px), and Mobile (375px).
- Business owners prioritize safety, predictability, and localized recovery over unbounded generative variability.

### Next Three Improvements in Priority Order
1. **Visual Regression Split Screen**: Side-by-side visual diff overlay showing ghosted before/after outlines directly on the canvas.
2. **Reusable Component Presets**: Ability to save an element's styling as a reusable theme class across multiple sections.
3. **Export to Next.js / Tailwind Codebase**: 1-click ZIP export generating clean TypeScript React components and Tailwind configuration.
