import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Code,
  Play,
  RotateCcw,
  AlignLeft,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { parseTemplate, diffTemplates } from '../../code';

export const CodeEditorTab: React.FC = () => {
  const {
    codeDraft,
    setCodeDraft,
    codeBaseRevision,
    isCodeDirty,
    codeError,
    codeErrorLocation,
    externalConflictDetected,
    template,
    editScope,
    formatCodeDraft,
    revertCodeDraft,
    applyCodeEdits,
    resolveCodeConflict,
  } = useEditorStore();

  const editorRef = useRef<any>(null);
  const [monacoLoaded, setMonacoLoaded] = useState(false);

  // Compute live pending changes preview
  const liveDiff = React.useMemo(() => {
    if (!isCodeDirty) return null;
    const parsed = parseTemplate(codeDraft);
    if (!parsed.success || !parsed.template) return null;
    return diffTemplates(template, parsed.template, codeBaseRevision);
  }, [codeDraft, isCodeDirty, template, codeBaseRevision]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setMonacoLoaded(true);

    // Custom dark theme configuration
    monaco.editor.defineTheme('scoped-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '9cdcfe' },
        { token: 'string.value.json', foreground: 'ce9178' },
        { token: 'number.json', foreground: 'b5cea8' },
        { token: 'keyword.json', foreground: '569cd6' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#141414',
        'editorLineNumber.foreground': '#444444',
        'editorLineNumber.activeForeground': '#888888',
        'editorGutter.background': '#0d0d0d',
      },
    });
    monaco.editor.setTheme('scoped-dark');

    // Add Ctrl/Cmd + S shortcut to Apply Changes
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      applyCodeEdits();
    });
  };

  // Keyboard shortcut listener for fallback textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      applyCodeEdits();
    }
  };

  return (
    <div id="code-editor-panel-container" className="h-full flex flex-col space-y-2 select-none">
      {/* Code Editor Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-[#e0e0e0]">
            <Code className="w-4 h-4 text-blue-400" />
            <span>CANONICAL TEMPLATE CODE</span>
          </div>

          {/* Sync & Dirty Status Indicator */}
          {externalConflictDetected ? (
            <span
              id="code-conflict-badge"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" /> Conflict Detected (Rev #{template.version})
            </span>
          ) : isCodeDirty ? (
            <span
              id="code-dirty-badge"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/70 text-amber-300 border border-amber-800"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          ) : (
            <span
              id="code-synced-badge"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/80"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Synced (Rev #{codeBaseRevision})
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {liveDiff && liveDiff.commands.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#888888] bg-[#141414] px-2 py-1 rounded border border-[#222222]">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>
                {liveDiff.summary.propertiesChanged + liveDiff.summary.overridesChanged} prop(s),{' '}
                {liveDiff.summary.elementsAdded + liveDiff.summary.elementsRemoved} struct
              </span>
            </div>
          )}

          <button
            id="code-format-btn"
            onClick={formatCodeDraft}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#161616] hover:bg-[#222222] text-[#cccccc] hover:text-white rounded text-xs border border-[#262626] transition-colors"
            title="Format template JSON with deterministic canonical ordering"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Format</span>
          </button>

          <button
            id="code-revert-btn"
            onClick={revertCodeDraft}
            disabled={!isCodeDirty && !externalConflictDetected}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#161616] hover:bg-[#222222] text-[#cccccc] hover:text-white rounded text-xs border border-[#262626] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Discard draft changes and revert to latest committed canonical state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revert</span>
          </button>

          <button
            id="code-apply-btn"
            onClick={applyCodeEdits}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold shadow-sm transition-all ${
              isCodeDirty
                ? 'bg-blue-600 hover:bg-blue-500 text-white ring-1 ring-blue-400/50'
                : 'bg-[#222222] hover:bg-[#2a2a2a] text-[#aaaaaa] hover:text-white border border-[#333333]'
            }`}
            title="Parse, validate, diff, and commit code changes (⌘S)"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>

      {/* External Conflict Banner */}
      {externalConflictDetected && (
        <div
          id="code-conflict-banner"
          className="p-2.5 bg-rose-950/70 border border-rose-800/90 rounded-lg text-xs text-rose-200 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <div>
              <span className="font-semibold text-white">External change detected:</span> Canonical state was updated to
              Revision #{template.version}, but your draft is based on Revision #{codeBaseRevision}.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="code-conflict-reload-btn"
              onClick={() => resolveCodeConflict('reload')}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded font-medium text-xs transition-colors border border-rose-700"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload Latest</span>
            </button>
            <button
              id="code-conflict-keep-btn"
              onClick={() => resolveCodeConflict('keep')}
              className="px-2 py-1 bg-[#1a1a1a] hover:bg-[#252525] text-rose-300 rounded text-xs border border-rose-900/50"
            >
              Keep My Draft
            </button>
          </div>
        </div>
      )}

      {/* Code Error Display */}
      {codeError && (
        <div
          id="code-error-banner"
          className="p-2.5 bg-rose-950/80 border border-rose-800/90 rounded-lg text-rose-300 text-xs flex items-start justify-between gap-2 font-mono"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-sans font-semibold text-rose-200">Validation / Syntax Error</div>
              <div className="whitespace-pre-wrap mt-0.5 text-xs text-rose-300 leading-relaxed">{codeError}</div>
            </div>
          </div>
          {codeErrorLocation?.line && (
            <span className="shrink-0 px-2 py-0.5 bg-rose-900/60 rounded text-[10px] text-rose-200 border border-rose-700/60">
              Line {codeErrorLocation.line}
              {codeErrorLocation.column ? `:${codeErrorLocation.column}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Monaco Code Editor Canvas */}
      <div className="flex-1 min-h-[140px] border border-[#222222] rounded-lg overflow-hidden bg-[#0a0a0a] relative">
        <Editor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={codeDraft}
          onChange={(val) => setCodeDraft(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            folding: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: false,
            renderLineHighlight: 'all',
            padding: { top: 8, bottom: 8 },
          }}
          loading={
            <div className="w-full h-full flex items-center justify-center text-xs text-[#888888] bg-[#0a0a0a]">
              Loading Code Editor...
            </div>
          }
        />

        {/* Fallback Accessible Textarea (if Monaco is mounting) */}
        {!monacoLoaded && (
          <textarea
            id="code-editor-textarea-fallback"
            value={codeDraft}
            onChange={(e) => setCodeDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="absolute inset-0 w-full h-full p-3 font-mono text-xs text-blue-200 bg-[#0a0a0a] resize-none focus:outline-none leading-relaxed z-0"
            aria-label="Code editor fallback"
          />
        )}
      </div>

      {/* Code Editor Footer */}
      <div className="flex items-center justify-between text-[11px] text-[#666666] px-1 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#888888]">
            <FileCode className="w-3 h-3 text-blue-400" />
            <span>JSON</span>
          </span>
          <span>UTF-8</span>
          <span>Base Rev #{codeBaseRevision}</span>
          <span>{Object.keys(template.elements).length} elements</span>
        </div>

        <div className="flex items-center gap-3 font-sans">
          <span className="text-[#555555]">
            <kbd className="px-1 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[10px] text-[#888888]">
              ⌘S / Ctrl+S
            </kbd>{' '}
            to Apply
          </span>
          <span className="text-[#555555]">
            <kbd className="px-1 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[10px] text-[#888888]">
              ⌘F
            </kbd>{' '}
            to Find
          </span>
        </div>
      </div>
    </div>
  );
};
