import React, { useEffect } from 'react';
import { TopToolbar } from './components/layout/TopToolbar';
import { LayersPanel } from './components/layout/LayersPanel';
import { CanvasStage } from './components/canvas/CanvasStage';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { BottomPanel } from './components/panels/BottomPanel';
import { ResetModal } from './components/modals/ResetModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { ArchitectureModal } from './components/modals/ArchitectureModal';
import { Toast } from './components/ui/Toast';
import { useEditorStore } from './store/useEditorStore';

export default function App() {
  const {
    setActiveViewport,
    setBottomPanelTab,
    bottomPanelTab,
    setActiveInspectorTab,
    clearSelection,
    selectedIds,
    deleteElement,
    undo,
    redo,
  } = useEditorStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs / textareas
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Global Undo/Redo shortcuts (working even if focus is outside text inputs)
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
          return;
        }
      }

      if (e.key === 'Escape') {
        clearSelection();
        return;
      }

      if (!isInput) {
        if (e.key === '1') {
          setActiveViewport('desktop');
        } else if (e.key === '2') {
          setActiveViewport('tablet');
        } else if (e.key === '3') {
          setActiveViewport('mobile');
        } else if (e.altKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setBottomPanelTab(bottomPanelTab === 'code' ? null : 'code');
        } else if (e.altKey && e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setBottomPanelTab(bottomPanelTab === 'history' ? null : 'history');
        } else if (e.altKey && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setActiveInspectorTab('ai');
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length === 1) {
          const targetId = selectedIds[0];
          if (targetId !== 'header' && targetId !== 'hero' && targetId !== 'footer') {
            deleteElement(targetId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveViewport,
    setBottomPanelTab,
    bottomPanelTab,
    setActiveInspectorTab,
    clearSelection,
    selectedIds,
    deleteElement,
    undo,
    redo,
  ]);

  return (
    <div id="app-root" className="flex flex-col h-screen w-screen bg-[#0a0a0a] text-[#e0e0e0] overflow-hidden font-sans">
      {/* Top Application Bar */}
      <TopToolbar />

      {/* Main Multi-Panel Editor Studio */}
      <div id="editor-workspace" className="flex-1 flex overflow-hidden relative">
        {/* Left: Hierarchical Layers Tree */}
        <LayersPanel />

        {/* Center: Interactive Device Canvas Preview */}
        <CanvasStage />

        {/* Right: Design & AI Co-Pilot Inspector */}
        <InspectorPanel />
      </div>

      {/* Bottom: Collapsible Code / History / Audit / Test Suite Panel */}
      <BottomPanel />

      {/* Modals & Toasts */}
      <ResetModal />
      <ShortcutsModal />
      <ArchitectureModal />
      <Toast />
    </div>
  );
}
