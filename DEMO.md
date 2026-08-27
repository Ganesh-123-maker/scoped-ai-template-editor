# Evaluator Demo Guide — Scoped AI Template Editor

This guide walks an evaluator through the core capabilities of the Scoped AI Template Editor in under 2 minutes.

---

## Demo Objective

Demonstrate that:
1. **AI proposes changes rather than directly mutating the page.**
2. **AI operations are strictly scoped** to the user's active selection and active viewport.
3. **Users can review, partially accept, or reject AI proposals before committing.**
4. **Code and canvas are bidirectionally synchronized.**
5. **Revision history supports granular, single-property recovery without destroying work.**
6. **All operations share a single unified command and validation pipeline.**

---

## Starting State

- Open the application.
- The canvas displays a modern, fully responsive SaaS landing page template.
- Active viewport: **Desktop** (1280px).
- Selection: None (empty state indicates *"Select an element to start editing"*).

---

## Step-by-Step Action Script

### 1. Visual Selection & Manual Editing
1. Click the main **Hero Heading** ("Build better products, faster.") on the canvas.
2. In the right-hand **Properties** inspector, change the **Font Size** slider from `56px` to `64px`.
3. Change the **Color** to `#3b82f6` (blue).
4. **Result**: Canvas updates immediately. A new revision is logged in the bottom history bar.

---

### 2. Responsive Viewport Isolation
1. Click the **Mobile** viewport button (phone icon, 375px) in the top toolbar.
2. Notice the canvas smoothly animates into a mobile frame.
3. Select the **Hero Heading** on Mobile and change **Font Size** to `32px`.
4. Switch back to the **Desktop** viewport button.
5. **Result**: Desktop font size remains at `64px`. The mobile override is completely isolated and does not pollute desktop base styling.

---

### 3. Multi-Element Selection & Scoped AI Proposal
1. While in Desktop mode, select the 3 feature cards by holding `Shift` and clicking **Card 1**, **Card 2**, and **Card 3** (or select them from the left Layers tree).
2. Look at the right panel: The AI Edit box explicitly shows:
   - `Selected: 3 elements`
   - `Scope: Desktop`
3. Click the preset prompt: **"Make these cards more rounded"** (or type it in) and click **Generate Proposal**.
4. **Result**:
   - The canvas **does not change**.
   - An **AI Proposal** card appears with 3 discrete proposed diffs (`borderRadius: 8px → 16px`).
   - Status displays `Proposal Ready · 3 scoped changes`.

---

### 4. Review Before Commit (Partial Accept / Reject)
1. On **Card 1**, click the **Reject** button.
2. On **Card 2**, click the **Accept** button.
3. On **Card 3**, click the **Accept** button.
4. **Result**:
   - Card 1 remains at `8px` corner radius.
   - Cards 2 and 3 smoothly animate to `16px` corner radius.
   - A single atomic commit is created containing only the accepted changes.

---

### 5. Revision History & Granular Property Recovery
1. In the bottom panel, click the **History** tab.
2. Notice the chronological revision list with source tags (`✦ AI`, `● Manual`, `◇ Code`).
3. Click on the earlier **Manual Edit** revision where you changed the Hero Heading color and font size.
4. In the revision details, locate the `color` property change.
5. Click **[Restore Property]** next to `color`.
6. **Result**: Only the heading color reverts to its previous value (`#ffffff`); the larger font size (`64px`) and the AI card corner radiuses remain intact.

---

### 6. Bidirectional Code Editor Synchronization
1. Switch to the **Code** tab in the bottom panel.
2. Notice the real-time JSON representation matches all canvas edits.
3. Locate the `Hero Title` node and change `"text": "Build better products, faster."` to `"text": "Build modern products, faster."`.
4. Click **[Commit Code Changes]**.
5. **Result**: The visual canvas text updates immediately, and the code tab reflects `CODE Synced with Canvas`.

---

### 7. Full Undo / Redo Pipeline
1. Press `Ctrl + Z` (or `Cmd + Z` on Mac) three times.
2. Observe the code commit, granular restore, and AI corner radius changes successively reverse.
3. Press `Ctrl + Y` (or `Cmd + Shift + Z`) three times to re-apply all operations.
4. **Result**: Both the canvas and the code editor stay in 100% lockstep without state divergence.

---

## Key Takeaways for Evaluators

| Requirement | Implementation in Prototype |
| :--- | :--- |
| **No Auto-Applying AI** | AI proposals are displayed as review cards with explicit before/after values. Canvas is never mutated without user acceptance. |
| **Strict Scoping** | AI operations are mathematically restricted to active selected element IDs and the active viewport. |
| **Concurrency Safety** | Proposals generated on older revisions are detected and locked as `stale` if the document version advances. |
| **Granular Recovery** | Single-property historical restoration without full-document rollbacks. |
| **Single Command Pipeline** | Visual, Code, AI, and Recovery actions all pass through `EditCommand` &rarr; `validateCommand` &rarr; `commitEdit`. |
