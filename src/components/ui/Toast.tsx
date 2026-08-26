import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useEditorStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      id="app-toast-container"
      className="fixed bottom-5 right-5 z-50 animate-bounce-short pointer-events-auto"
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-xl border text-xs max-w-sm ${
          toast.type === 'success'
            ? 'bg-[#111111] border-emerald-500/50 text-emerald-300'
            : toast.type === 'error'
            ? 'bg-[#111111] border-rose-500/50 text-rose-300'
            : 'bg-[#111111] border-blue-500/50 text-blue-200'
        }`}
      >
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}

        <span className="flex-1 font-medium">{toast.message}</span>

        <button
          onClick={clearToast}
          className="p-0.5 text-[#888888] hover:text-white rounded hover:bg-[#222222] shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
