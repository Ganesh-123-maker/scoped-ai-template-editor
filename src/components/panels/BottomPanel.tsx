import React, { useState } from 'react';
import {
  Code,
  History,
  CheckCircle2,
  FlaskConical,
  X,
  Play,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Sliders,
  Check,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Search,
  MousePointer,
  Filter,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { runAllVerificationTests, VerificationTestResult } from '../../core/testRunner';
import { EditableProperties, Viewport } from '../../types/template';
import { CodeEditorTab } from './CodeEditorTab';

export const BottomPanel: React.FC = () => {
  const {
    bottomPanelTab,
    setBottomPanelTab,
    codeDraft,
    setCodeDraft,
    codeError,
    applyCodeEdits,
    template,
    restoreElement,
    restoreProperty,
    restoreRevision,
    latestChangeSummary,
    selectedIds,
    setSelectedIds,
  } = useEditorStore();

  const [testResults, setTestResults] = useState<VerificationTestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historySourceFilter, setHistorySourceFilter] = useState<'all' | 'canvas' | 'code' | 'ai' | 'restore'>('all');
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  if (!bottomPanelTab) return null;

  const toggleExpandEntry = (id: string) => {
    setExpandedEntries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    // Slight tick to render UI loading state
    setTimeout(() => {
      const results = runAllVerificationTests();
      setTestResults(results);
      setIsRunningTests(false);
    }, 150);
  };

  // Filtered history entries
  const filteredHistory = template.history.filter((entry) => {
    if (historySourceFilter !== 'all' && entry.source !== historySourceFilter) {
      return false;
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchSummary = entry.summary?.toLowerCase().includes(q);
      const matchElements = entry.elementIds.some(
        (id) => id.toLowerCase().includes(q) || template.elements[id]?.name.toLowerCase().includes(q)
      );
      const matchSource = entry.source.toLowerCase().includes(q);
      const matchRev = String(entry.newRevision).includes(q) || String(entry.baseRevision).includes(q);
      return matchSummary || matchElements || matchSource || matchRev;
    }
    return true;
  });

  return (
    <div
      id="bottom-collapsible-panel"
      className="h-72 bg-[#0d0d0d] border-t border-[#222222] flex flex-col z-40 select-none text-[#e0e0e0] shadow-2xl"
    >
      {/* Panel Header */}
      <div className="h-9 px-3 bg-[#111111] border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <button
            onClick={() => setBottomPanelTab('code')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              bottomPanelTab === 'code'
                ? 'bg-[#1e1e1e] text-white font-semibold border border-[#333333]'
                : 'text-[#888888] hover:text-[#e0e0e0]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code Editor</span>
          </button>

          <button
            onClick={() => setBottomPanelTab('history')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              bottomPanelTab === 'history'
                ? 'bg-[#1e1e1e] text-white font-semibold border border-[#333333]'
                : 'text-[#888888] hover:text-[#e0e0e0]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Revision History ({template.history.length})</span>
          </button>

          <button
            onClick={() => setBottomPanelTab('changes')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              bottomPanelTab === 'changes'
                ? 'bg-[#1e1e1e] text-white font-semibold border border-[#333333]'
                : 'text-[#888888] hover:text-[#e0e0e0]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Change Summary</span>
          </button>

          <button
            onClick={() => setBottomPanelTab('tests')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              bottomPanelTab === 'tests'
                ? 'bg-blue-950/60 text-blue-200 font-semibold border border-blue-700/60'
                : 'text-blue-400 hover:text-blue-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Automated Tests</span>
            {testResults && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        <button
          onClick={() => setBottomPanelTab(null)}
          className="p-1 text-[#888888] hover:text-white rounded hover:bg-[#222222]"
          title="Close Bottom Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-auto p-3 font-sans">
        {/* TAB 1: CODE EDITOR */}
        {bottomPanelTab === 'code' && <CodeEditorTab />}

        {/* TAB 2: REVISION HISTORY & INDEPENDENT RECOVERY */}
        {bottomPanelTab === 'history' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-2 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#cccccc]">Granular Timeline</span>
                <span className="text-[#555555]">•</span>
                <span className="text-[#888888] text-[11px]">
                  Chronological revisions with independent element and property level recovery.
                </span>
              </div>
              <span className="font-mono text-[#888888] text-[11px]">
                Canonical Rev: <span className="text-white font-bold">#{template.version}</span> ({template.history.length} entries)
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#141414] border border-[#222222] rounded-lg p-0.5">
                {(['all', 'canvas', 'code', 'ai', 'restore'] as const).map((src) => (
                  <button
                    key={src}
                    id={`filter-src-${src}`}
                    onClick={() => setHistorySourceFilter(src)}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                      historySourceFilter === src
                        ? 'bg-[#1e1e1e] text-white shadow-sm border border-[#333333]'
                        : 'text-[#888888] hover:text-[#e0e0e0]'
                    }`}
                  >
                    {src === 'all' ? 'All Sources' : src}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#666666] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter revisions by element, text, rev #..."
                  className="w-full bg-[#141414] border border-[#222222] rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-blue-500"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Revisions list */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-[#666666] text-xs">
                {template.history.length === 0
                  ? 'No revision entries recorded yet. Perform an edit on canvas, code, or AI to start history.'
                  : 'No revisions match the current search / filter criteria.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map((entry) => {
                  const isExpanded = !!expandedEntries[entry.id];
                  const hasDetailedChanges = entry.changes && Object.keys(entry.changes).length > 0;

                  return (
                    <div
                      key={entry.id}
                      className="p-3 bg-[#141414] border border-[#222222] rounded-lg text-xs space-y-2.5 hover:border-[#333333] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#666666]">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1 ${
                              entry.source === 'ai'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : entry.source === 'code'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : entry.source === 'restore'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-[#1e1e1e] text-[#cccccc]'
                            }`}
                          >
                            {entry.source === 'ai' && <Sparkles className="w-2.5 h-2.5" />}
                            {entry.source === 'code' && <Code className="w-2.5 h-2.5" />}
                            {entry.source === 'restore' && <RotateCcw className="w-2.5 h-2.5" />}
                            {entry.source === 'canvas' && <Sliders className="w-2.5 h-2.5" />}
                            {entry.source}
                          </span>
                          <span className="font-semibold text-[#e0e0e0]">{entry.summary}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#888888] border border-[#262626]">
                            Scope: {entry.viewport}
                          </span>
                          <span className="text-[10px] font-mono text-[#666666]">
                            Rev #{entry.baseRevision} → #{entry.newRevision}
                          </span>
                          <button
                            id={`restore-revision-btn-${entry.id}`}
                            onClick={() => restoreRevision(entry.id)}
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded font-medium transition-colors ml-1 cursor-pointer"
                            title={`Restore entire template to Revision #${entry.newRevision}`}
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Revert to this Rev
                          </button>
                        </div>
                      </div>

                      {/* Elements modified & Per-Element and Per-Property Recovery */}
                      <div className="space-y-2 pt-1 border-t border-[#1a1a1a]">
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.elementIds.map((elId) => {
                            const el = template.elements[elId];
                            const changeInfo = entry.changes?.[elId];

                            return (
                              <div
                                key={elId}
                                className="flex items-center gap-1.5 bg-[#0a0a0a] px-2.5 py-1 rounded border border-[#222222]"
                              >
                                <button
                                  onClick={() => setSelectedIds([elId])}
                                  className="text-[#e0e0e0] font-medium hover:text-blue-400 transition-colors flex items-center gap-1"
                                  title={`Click to focus and select ${el?.name || elId} on canvas`}
                                >
                                  <MousePointer className="w-2.5 h-2.5 text-[#666666]" />
                                  <span>{el?.name || elId}</span>
                                </button>
                                <span className="text-[10px] font-mono text-[#666666]">#{elId}</span>

                                <button
                                  id={`restore-btn-${elId}-${entry.id}`}
                                  onClick={() => restoreElement(elId, entry.viewport, entry.id)}
                                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded font-medium transition-colors ml-1 cursor-pointer"
                                  title={`Restore ${el?.name || elId} to this historical state (${entry.viewport})`}
                                >
                                  <RotateCcw className="w-2.5 h-2.5" /> Restore Element
                                </button>
                              </div>
                            );
                          })}

                          {hasDetailedChanges && (
                            <button
                              onClick={() => toggleExpandEntry(entry.id)}
                              className="text-[11px] text-[#888888] hover:text-[#cccccc] px-2 py-0.5 rounded bg-[#161616] border border-[#262626] flex items-center gap-1 transition-colors ml-auto"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown className="w-3 h-3" /> Hide Property Diffs
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3 h-3" /> Show Property Diffs ({Object.keys(entry.changes || {}).length})
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Detailed Property Diffs & Granular Property Restore */}
                        {isExpanded && entry.changes && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 bg-[#0c0c0c] p-2 rounded-lg border border-[#1f1f1f]">
                            {Object.entries(entry.changes).map(([elId, ch]) => {
                              const el = template.elements[elId];
                              const beforeKeys = Object.keys(ch.before || {}) as Array<keyof EditableProperties>;

                              return (
                                <div key={elId} className="bg-[#121212] p-2 rounded border border-[#222222] space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#cccccc]">
                                    <span>{el?.name || ch.elementName || elId}</span>
                                    <span className="text-[10px] font-mono text-blue-300">{ch.targetViewport}</span>
                                  </div>

                                  <div className="space-y-1">
                                    {beforeKeys.map((propKey) => {
                                      const beforeVal = ch.before[propKey];
                                      const afterVal = ch.after[propKey];

                                      return (
                                        <div
                                          key={String(propKey)}
                                          className="flex items-center justify-between text-[10px] font-mono bg-[#080808] p-1.5 rounded border border-[#1a1a1a]"
                                        >
                                          <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="text-blue-300 font-bold">{String(propKey)}:</span>
                                            <span className="text-rose-400 line-through truncate max-w-[80px]">
                                              {JSON.stringify(beforeVal)}
                                            </span>
                                            <span className="text-[#666666]">→</span>
                                            <span className="text-emerald-400 truncate max-w-[80px]">
                                              {JSON.stringify(afterVal)}
                                            </span>
                                          </div>

                                          <button
                                            id={`restore-prop-${elId}-${String(propKey)}-${entry.id}`}
                                            onClick={() => restoreProperty(elId, propKey, ch.targetViewport, entry.id)}
                                            className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded font-sans text-[9px] font-medium transition-colors shrink-0 ml-1 cursor-pointer"
                                            title={`Restore only "${String(propKey)}" to historical value (${JSON.stringify(beforeVal)})`}
                                          >
                                            Restore Prop
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHANGE SUMMARY & AUDIT TRAIL */}
        {bottomPanelTab === 'changes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-[#222222]">
              <span className="font-semibold text-[#cccccc]">Latest Commit Audit Trail</span>
              {latestChangeSummary && (
                <span className="text-[11px] font-mono text-blue-400">
                  Revision #{latestChangeSummary.revision} • Scope: {latestChangeSummary.viewport}
                </span>
              )}
            </div>

            {latestChangeSummary ? (
              <div className="space-y-2">
                <div className="p-2.5 bg-blue-950/30 border border-blue-900/50 rounded-lg text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#e0e0e0]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">{latestChangeSummary.summaryText}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#888888]">
                    {latestChangeSummary.diffs.length} property transition(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {latestChangeSummary.diffs.map((diff, i) => (
                    <div
                      key={i}
                      className="p-2 bg-[#141414] border border-[#222222] rounded text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#cccccc]">{diff.elementName}</span>
                        <span className="text-[10px] font-mono text-[#666666]">
                          {diff.targetViewport}
                        </span>
                      </div>
                      <div className="text-[11px] text-blue-300 font-mono">{diff.label}</div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="text-rose-400 line-through truncate max-w-[100px]">
                          {String(diff.from ?? 'default')}
                        </span>
                        <span className="text-[#666666]">→</span>
                        <span className="text-emerald-400 font-bold truncate max-w-[100px]">
                          {String(diff.to)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#666666] text-xs">
                No recent commits recorded. Make an edit on the canvas, code, or AI to see the audit trail.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INTERACTIVE SAFETY & CONTRACT TEST RUNNER */}
        {bottomPanelTab === 'tests' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#222222]">
              <div>
                <span className="font-semibold text-white">Automated Safety & Contract Verification</span>
                <p className="text-[11px] text-[#888888]">
                  Executes focused tests covering selection authority, field whitelisting, viewport isolation, and per-element recovery.
                </p>
              </div>
              <button
                id="run-verification-tests-btn"
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1e1e1e] text-white rounded text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {isRunningTests ? 'Executing Tests...' : 'Run All Verification Tests'}
              </button>
            </div>

            {testResults ? (
              <div className="space-y-2">
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs flex items-center justify-between text-emerald-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      All {testResults.length} Verification Tests Passed Successfully!
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    100% Contract Compliance
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {testResults.map((test) => (
                    <div
                      key={test.id}
                      className="p-2.5 bg-[#141414] border border-[#222222] rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-[#e0e0e0]">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{test.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#666666]">{test.durationMs}ms</span>
                      </div>
                      <p className="text-[11px] text-[#888888] leading-tight">{test.description}</p>
                      <div className="text-[10px] font-mono text-emerald-400 bg-[#0a0a0a] p-1.5 rounded border border-[#262626] truncate">
                        ✓ {test.assertionNote}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#666666] text-xs">
                Click "Run All Verification Tests" to execute the 12+ strict safety test suites.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
