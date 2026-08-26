import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, closeShortcutsModal } = useEditorStore();

  if (!isShortcutsModalOpen) return null;

  const shortcuts = [
    { key: 'Shift + Click', desc: 'Add or remove element from multi-selection' },
    { key: 'Drag Canvas Background', desc: 'Marquee box multi-select elements' },
    { key: 'Tab / Shift + Tab', desc: 'Navigate selectable elements with keyboard' },
    { key: '1 / 2 / 3', desc: 'Switch Viewports (Desktop, Tablet, Mobile)' },
    { key: 'Alt + C', desc: 'Toggle Code Editor panel' },
    { key: 'Alt + H', desc: 'Toggle Revision History panel' },
    { key: 'Alt + A', desc: 'Switch to AI Co-Pilot Tab' },
  ];

  return (
    <div
      id="shortcuts-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={closeShortcutsModal}
    >
      <div
        id="shortcuts-modal-dialog"
        className="bg-[#111111] border border-[#262626] rounded-xl max-w-md w-full p-5 shadow-2xl text-[#e0e0e0] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Keyboard Shortcuts & Navigation</h3>
          </div>
          <button
            onClick={closeShortcutsModal}
            className="p-1 text-[#888888] hover:text-white rounded hover:bg-[#222222]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#0a0a0a] border border-[#222222] text-xs"
            >
              <span className="text-[#cccccc]">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333333] rounded text-blue-300 font-mono text-[11px] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={closeShortcutsModal}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
