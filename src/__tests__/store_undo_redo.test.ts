import { describe, it, expect } from 'vitest';
import { useEditorStore } from '../store/useEditorStore';

describe('useEditorStore Undo / Redo & Recovery Actions', () => {
  it('supports undo and redo through the single store pipeline', () => {
    const store = useEditorStore.getState();
    store.resetToInitialTemplate();

    // 1. Initial State
    const initialText = useEditorStore.getState().template.elements['hero-title'].base.text;
    const initialVersion = useEditorStore.getState().template.version;

    // 2. Modify properties via updateSelectedProperties
    useEditorStore.getState().setSelectedIds(['hero-title']);
    useEditorStore.getState().updateSelectedProperties({ text: 'Updated Text via Studio' });

    expect(useEditorStore.getState().template.elements['hero-title'].base.text).toBe('Updated Text via Studio');
    expect(useEditorStore.getState().template.version).toBe(initialVersion + 1);

    // 3. Undo
    const undoSuccess = useEditorStore.getState().undo();
    expect(undoSuccess).toBe(true);
    expect(useEditorStore.getState().template.elements['hero-title'].base.text).toBe(initialText);

    // 4. Redo
    const redoSuccess = useEditorStore.getState().redo();
    expect(redoSuccess).toBe(true);
    expect(useEditorStore.getState().template.elements['hero-title'].base.text).toBe('Updated Text via Studio');
  });
});
