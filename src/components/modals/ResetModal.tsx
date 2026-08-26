import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';

export const ResetModal: React.FC = () => {
  const { isResetModalOpen, closeResetModal, resetToInitialTemplate } = useEditorStore();

  if (!isResetModalOpen) return null;

  return (
    <div
      id="reset-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={closeResetModal}
    >
      <div
        id="reset-modal-dialog"
        className="bg-[#111111] border border-[#262626] rounded-xl max-w-md w-full p-5 shadow-2xl text-[#e0e0e0] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reset Prototype State?</h3>
              <p className="text-xs text-[#888888]">This action restores pristine baseline data.</p>
            </div>
          </div>
          <button
            onClick={closeResetModal}
            className="p-1 text-[#888888] hover:text-white rounded hover:bg-[#222222]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-[#cccccc] space-y-2 bg-[#0a0a0a] p-3 rounded-lg border border-[#222222]">
          <p>
            Resetting will:
          </p>
          <ul className="list-disc list-inside text-[#888888] space-y-1">
            <li>Revert all canvas and code changes to the default responsive template.</li>
            <li>Clear all revision history logs and local snapshots.</li>
            <li>Purge localStorage cached edits.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={closeResetModal}
            className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#262626] text-[#cccccc] rounded-lg text-xs font-medium transition-colors border border-[#2a2a2a]"
          >
            Cancel
          </button>
          <button
            id="confirm-reset-btn"
            onClick={resetToInitialTemplate}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
};
