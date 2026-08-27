import React from 'react';
import {
  ShieldCheck,
  Workflow,
  Sparkles,
  Layers,
  Code,
  RotateCcw,
  CheckCircle2,
  Sliders,
  X,
  Smartphone,
  Check,
  FileCheck2,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';

export const ArchitectureModal: React.FC = () => {
  const { isArchitectureModalOpen, closeArchitectureModal } = useEditorStore();

  if (!isArchitectureModalOpen) return null;

  return (
    <div
      id="architecture-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={closeArchitectureModal}
    >
      <div
        id="architecture-modal-dialog"
        className="bg-[#111111] border border-[#262626] rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-[#e0e0e0] space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222222] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Scoped AI Template Editor</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                  ARCHITECTURE & DESIGN
                </span>
              </div>
              <p className="text-xs text-[#888888]">
                Deterministic, Scoped, Recoverable, and Bidirectionally Synchronized Design Architecture
              </p>
            </div>
          </div>
          <button
            onClick={closeArchitectureModal}
            className="p-1.5 text-[#888888] hover:text-white rounded-lg hover:bg-[#222222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Command Pipeline Diagram */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Unified Command & Validation Pipeline</span>
          </h4>
          <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl p-4 font-mono text-[11px] space-y-2.5 text-[#cccccc]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
              <div className="bg-[#141414] p-2 rounded border border-[#262626] text-blue-300 flex flex-col items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Manual Edit</span>
              </div>
              <div className="bg-[#141414] p-2 rounded border border-[#262626] text-emerald-300 flex flex-col items-center gap-1">
                <Code className="w-3.5 h-3.5" />
                <span>JSON Code Edit</span>
              </div>
              <div className="bg-[#141414] p-2 rounded border border-[#262626] text-purple-300 flex flex-col items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Proposal</span>
              </div>
              <div className="bg-[#141414] p-2 rounded border border-[#262626] text-amber-300 flex flex-col items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Action</span>
              </div>
            </div>

            <div className="flex justify-center text-blue-400 font-bold text-xs">▼</div>

            <div className="bg-blue-950/40 border border-blue-800/60 p-2.5 rounded text-center text-blue-200 font-semibold text-xs flex items-center justify-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-400" />
              <span>EditCommand Payload (Target IDs, Viewport Scope, Base Revision Lock)</span>
            </div>

            <div className="flex justify-center text-blue-400 font-bold text-xs">▼</div>

            <div className="bg-[#141414] border border-[#2e2e2e] p-2.5 rounded text-center text-[#e0e0e0] flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Unified Validation (Schema, Selection Authority, Viewport Isolation, Bounds)</span>
            </div>

            <div className="flex justify-center text-blue-400 font-bold text-xs">▼</div>

            <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 border border-indigo-700/60 p-3 rounded-lg text-center text-white font-bold text-xs shadow-inner">
              <span>Canonical Template State (Single Source of Truth + Append-Only Revisions)</span>
            </div>

            <div className="flex justify-center text-blue-400 font-bold text-xs">▼</div>

            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="bg-[#141414] p-2 rounded border border-[#262626] text-sky-300">
                Visual Canvas Renderers
              </div>
              <div className="bg-[#141414] p-2 rounded border border-[#262626] text-emerald-300">
                Monaco Code Editor Sync
              </div>
            </div>
          </div>
        </div>

        {/* Core Architectural Principles */}
        <div className="space-y-2.5 pt-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Core System Guarantees</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-[#141414] p-3 rounded-xl border border-[#222222] space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Single Canonical State</span>
              </div>
              <p className="text-[11px] text-[#888888]">
                One immutable TemplateModel governs all components. No secondary state divergence.
              </p>
            </div>

            <div className="bg-[#141414] p-3 rounded-xl border border-[#222222] space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Scoped AI Proposals</span>
              </div>
              <p className="text-[11px] text-[#888888]">
                AI only targets selected elements and active viewport. Zero unprompted mutations.
              </p>
            </div>

            <div className="bg-[#141414] p-3 rounded-xl border border-[#222222] space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Review Before Commit</span>
              </div>
              <p className="text-[11px] text-[#888888]">
                Every AI diff is inspected before committing. Supports granular item acceptance or rejection.
              </p>
            </div>

            <div className="bg-[#141414] p-3 rounded-xl border border-[#222222] space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Granular Property Recovery</span>
              </div>
              <p className="text-[11px] text-[#888888]">
                Restore specific element properties from history without rolling back unrelated work.
              </p>
            </div>

            <div className="bg-[#141414] p-3 rounded-xl border border-[#222222] space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Responsive Viewports</span>
              </div>
              <p className="text-[11px] text-[#888888]">
                Isolated mobile/tablet overrides that never pollute base desktop configurations.
              </p>
            </div>

            <div className="bg-[#141414] p-3 rounded-xl border border-[#222222] space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Bidirectional Code Sync</span>
              </div>
              <p className="text-[11px] text-[#888888]">
                JSON edits update the canvas; canvas and AI edits immediately synchronize into the code editor.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
          <span className="text-[11px] text-[#666666] font-mono">
            Optimistic Concurrency & Monotonic Revision Locking
          </span>
          <button
            onClick={closeArchitectureModal}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
