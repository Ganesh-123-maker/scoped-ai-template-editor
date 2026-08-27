import React from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Undo2,
  Redo2,
  Code,
  History,
  CheckCircle2,
  Keyboard,
  Layers,
  Sparkles,
  FlaskConical,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ActiveViewport, Viewport } from '../../types/template';
import { VIEWPORT_CONFIG } from '../../responsive/viewportConfig';

export const TopToolbar: React.FC = () => {
  const {
    activeViewport,
    setActiveViewport,
    editScope,
    setEditScope,
    template,
    bottomPanelTab,
    setBottomPanelTab,
    activeInspectorTab,
    setActiveInspectorTab,
    openResetModal,
    openShortcutsModal,
    openArchitectureModal,
    selectedIds,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore();

  const viewportOptions: Array<{ id: ActiveViewport; label: string; width: string; icon: React.ReactNode }> = [
    { id: 'desktop', label: VIEWPORT_CONFIG.desktop.label, width: `${VIEWPORT_CONFIG.desktop.width}px`, icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'tablet', label: VIEWPORT_CONFIG.tablet.label, width: `${VIEWPORT_CONFIG.tablet.width}px`, icon: <Tablet className="w-3.5 h-3.5" /> },
    { id: 'mobile', label: VIEWPORT_CONFIG.mobile.label, width: `${VIEWPORT_CONFIG.mobile.width}px`, icon: <Smartphone className="w-3.5 h-3.5" /> },
  ];

  const hasUndo = canUndo();
  const hasRedo = canRedo();

  return (
    <header
      id="top-toolbar"
      className="h-14 bg-[#0d0d0d] text-[#e0e0e0] border-b border-[#222222] px-4 flex items-center justify-between select-none z-30"
    >
      {/* Left: Branding & Status & Undo/Redo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">Scoped AI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161616] text-blue-400 border border-[#2a2a2a]">
                PROTOTYPE
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-[#222222] mx-1 hidden sm:block" />

        {/* Quick Undo / Redo controls */}
        <div className="flex items-center bg-[#141414] border border-[#222222] rounded-lg p-0.5 shadow-inner">
          <button
            id="top-undo-btn"
            onClick={() => undo()}
            disabled={!hasUndo}
            className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
              hasUndo
                ? 'text-[#cccccc] hover:text-white hover:bg-[#1e1e1e] cursor-pointer'
                : 'text-[#444444] cursor-not-allowed'
            }`}
            title="Undo last change (Ctrl+Z / Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="top-redo-btn"
            onClick={() => redo()}
            disabled={!hasRedo}
            className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
              hasRedo
                ? 'text-[#cccccc] hover:text-white hover:bg-[#1e1e1e] cursor-pointer'
                : 'text-[#444444] cursor-not-allowed'
            }`}
            title="Redo previous restore (Ctrl+Y / Cmd+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-[#888888]">
          <span className="font-mono text-[#cccccc]">Rev #{template.version}</span>
          <span className="text-[#444444]">•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
            <CheckCircle2 className="w-3 h-3" /> Auto-Saved
          </span>
          <span className="text-[#444444]">•</span>
          <span className="flex items-center gap-1 text-[#888888] text-[11px]">
            <ShieldCheck className="w-3 h-3 text-blue-400" /> Scoped Safety Active
          </span>
        </div>
      </div>

      {/* Center: Viewport Switcher */}
      <div className="flex items-center bg-[#141414] border border-[#222222] rounded-lg p-0.5 shadow-inner">
        {viewportOptions.map((vp) => {
          const isActive = activeViewport === vp.id;
          return (
            <button
              key={vp.id}
              id={`viewport-btn-${vp.id}`}
              onClick={() => setActiveViewport(vp.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#1e1e1e] text-white shadow-sm border border-[#333333]'
                  : 'text-[#888888] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
              }`}
              title={`Switch preview to ${vp.label} (${vp.width})`}
            >
              {vp.icon}
              <span className="hidden sm:inline">{vp.label}</span>
              <span className="text-[10px] text-[#666666] font-mono hidden md:inline">{vp.width}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Panels, AI Switcher, Shortcuts, Reset */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Inspector Tab switcher on mobile/tablet */}
        <div className="flex xl:hidden bg-[#141414] border border-[#222222] rounded-lg p-0.5">
          <button
            onClick={() => setActiveInspectorTab('design')}
            className={`px-2 py-1 rounded text-xs font-medium ${
              activeInspectorTab === 'design' ? 'bg-[#1e1e1e] text-white' : 'text-[#888888]'
            }`}
          >
            Design
          </button>
          <button
            onClick={() => setActiveInspectorTab('ai')}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
              activeInspectorTab === 'ai' ? 'bg-blue-600 text-white' : 'text-[#888888]'
            }`}
          >
            <Sparkles className="w-3 h-3" /> AI
          </button>
        </div>

        {/* Bottom Panel Toggles */}
        <div className="flex items-center bg-[#141414] border border-[#222222] rounded-lg p-0.5">
          <button
            id="panel-btn-code"
            onClick={() => setBottomPanelTab(bottomPanelTab === 'code' ? null : 'code')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomPanelTab === 'code'
                ? 'bg-[#1e1e1e] text-blue-300 border border-[#333333]'
                : 'text-[#888888] hover:text-[#e0e0e0]'
            }`}
            title="Toggle JSON / Model Code Editor"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Code</span>
          </button>

          <button
            id="panel-btn-history"
            onClick={() => setBottomPanelTab(bottomPanelTab === 'history' ? null : 'history')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomPanelTab === 'history'
                ? 'bg-[#1e1e1e] text-blue-300 border border-[#333333]'
                : 'text-[#888888] hover:text-[#e0e0e0]'
            }`}
            title="View Revision History & Independent Restore"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">History</span>
            {template.history.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#1e1e1e] border border-[#333333] text-[10px] flex items-center justify-center text-[#cccccc] font-mono">
                {template.history.length}
              </span>
            )}
          </button>

          <button
            id="panel-btn-tests"
            onClick={() => setBottomPanelTab(bottomPanelTab === 'tests' ? null : 'tests')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              bottomPanelTab === 'tests'
                ? 'bg-blue-950/60 text-blue-200 border border-blue-800/60'
                : 'text-blue-400 hover:text-blue-300 hover:bg-[#1a1a1a]'
            }`}
            title="Open Interactive Safety & Contract Verification Test Suite"
          >
            <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Verify Tests</span>
          </button>
        </div>

        {/* Architecture, Shortcuts & Reset */}
        <button
          id="architecture-info-btn"
          onClick={openArchitectureModal}
          className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1a1a1a] rounded-md transition-colors flex items-center gap-1 text-xs"
          title="View Architecture Pipeline & Safety Guarantees"
        >
          <Workflow className="w-4 h-4 text-blue-400" />
          <span className="hidden lg:inline text-[#cccccc]">Architecture</span>
        </button>

        <button
          id="shortcuts-btn"
          onClick={openShortcutsModal}
          className="p-1.5 text-[#888888] hover:text-[#e0e0e0] hover:bg-[#1a1a1a] rounded-md transition-colors"
          title="Keyboard Shortcuts Guide"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          id="reset-demo-btn"
          onClick={openResetModal}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/40 rounded-md transition-colors font-medium"
          title="Reset to pristine initial canonical template"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
