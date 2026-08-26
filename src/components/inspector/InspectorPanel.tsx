import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Type,
  Palette,
  Layout,
  Maximize,
  MoveUp,
  MoveDown,
  Copy,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCheck,
  XCircle,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { DOCUMENTED_AI_PRESETS } from '../../core/aiScenarioEngine';
import { EditableProperties, ElementModel, Viewport } from '../../types/template';
import {
  resolveProperties,
  hasViewportOverride,
  getPropertyOverrideStatus,
} from '../../responsive/resolve';
import { getCommonEditableProperties, getMultiPropertyValue } from '../../core/selection';

export const InspectorPanel: React.FC = () => {
  const {
    activeInspectorTab,
    setActiveInspectorTab,
    selectedIds,
    template,
    activeViewport,
    editScope,
    setEditScope,
    updateSelectedProperties,
    resetSelectedPropertyOverride,
    activeProposal,
    submitAIInstruction,
    acceptProposalItem,
    rejectProposalItem,
    acceptAllProposalItems,
    rejectAllProposalItems,
    clearActiveProposal,
    reorderElement,
    duplicateElement,
    deleteElement,
  } = useEditorStore();

  const [customAIInput, setCustomAIInput] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const selectedElements = selectedIds
    .map((id) => template.elements[id])
    .filter((el): el is ElementModel => el !== undefined);

  const primaryElement = selectedElements[0];
  const isMultiSelect = selectedElements.length > 1;

  // Common properties across selection
  const commonFields = getCommonEditableProperties(selectedElements);
  const commonFieldSet = new Set(commonFields);

  // Target viewport for inspection
  const targetViewport = editScope === 'all' ? activeViewport : editScope;

  // Helper to get property value & mixed status for current viewport/scope
  const getPropInfo = <T,>(
    field: keyof EditableProperties,
    fallback?: T
  ): { value: T | 'mixed'; isMixed: boolean; isOverridden: boolean; baseValue?: any } => {
    if (selectedElements.length === 0) {
      return { value: fallback as T, isMixed: false, isOverridden: false };
    }

    const { isMixed, value } = getMultiPropertyValue(selectedElements, field, (el) => {
      if (editScope === 'all') {
        return el.base[field] ?? fallback;
      }
      const resolved = resolveProperties(el, targetViewport);
      return resolved[field] ?? fallback;
    });

    const isOverridden =
      editScope !== 'all' &&
      selectedElements.some((el) => hasViewportOverride(el, editScope, field));

    const baseVal = primaryElement?.base[field];

    return {
      value: isMixed ? 'mixed' : (value as T) ?? (fallback as T),
      isMixed,
      isOverridden,
      baseValue: baseVal,
    };
  };

  const handlePropChange = (field: keyof EditableProperties, value: any) => {
    updateSelectedProperties({ [field]: value });
  };

  const handleResetOverride = (field: keyof EditableProperties) => {
    if (editScope === 'all') return;
    resetSelectedPropertyOverride(field, editScope);
  };

  const handleAIExecute = (prompt: string) => {
    if (!prompt.trim()) return;
    submitAIInstruction(prompt);
  };

  return (
    <aside
      id="inspector-panel"
      className="w-80 bg-[#0d0d0d] border-l border-[#222222] flex flex-col h-full select-none text-[#e0e0e0]"
    >
      {/* Tab Switcher */}
      <div className="h-10 px-3 border-b border-[#222222] flex items-center justify-between">
        <div className="flex bg-[#141414] border border-[#222222] rounded-lg p-0.5 w-full">
          <button
            id="inspector-tab-design"
            onClick={() => setActiveInspectorTab('design')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-all ${
              activeInspectorTab === 'design'
                ? 'bg-[#1e1e1e] text-white shadow-sm border border-[#333333]'
                : 'text-[#888888] hover:text-[#e0e0e0]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Design</span>
          </button>
          <button
            id="inspector-tab-ai"
            onClick={() => setActiveInspectorTab('ai')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-all ${
              activeInspectorTab === 'ai'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-blue-400 hover:text-blue-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Co-Pilot</span>
            {activeProposal && activeProposal.status === 'pending' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* DESIGN TAB */}
        {activeInspectorTab === 'design' && (
          <>
            {selectedIds.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#666666]">
                <Sliders className="w-8 h-8 mb-3 text-[#444444]" />
                <h4 className="text-xs font-semibold text-[#888888] mb-1">Select an element</h4>
                <p className="text-[11px] leading-relaxed">
                  Choose an element from the canvas or Layers panel to start editing.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Element Header & Stable ID / Multi-Selection Summary */}
                <div className="bg-[#141414] border border-[#222222] rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                      {isMultiSelect
                        ? `${selectedIds.length} Elements Selected`
                        : primaryElement?.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#888888] border border-[#2a2a2a]">
                      {isMultiSelect ? `${selectedIds.length} items` : `#${primaryElement?.id}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#666666] font-mono">
                    {isMultiSelect ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedElements.map((el) => (
                          <span
                            key={el.id}
                            className="bg-[#1a1a1a] text-[#aaaaaa] px-1.5 py-0.5 rounded text-[9px] border border-[#262626]"
                          >
                            {el.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <>
                        <span className="capitalize">{primaryElement?.type}</span>
                        <span>•</span>
                        <span>Rev #{primaryElement?.revision || template.version}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Scope Switcher */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#888888]">Target Edit Scope:</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        editScope === 'all'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {editScope === 'all' ? '● Shared (Base)' : `● ${editScope} override`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 bg-[#141414] border border-[#222222] rounded-lg p-0.5">
                    {(['all', 'desktop', 'tablet', 'mobile'] as Viewport[]).map((scope) => (
                      <button
                        key={scope}
                        id={`scope-btn-${scope}`}
                        onClick={() => setEditScope(scope)}
                        className={`py-1 rounded text-[11px] font-medium capitalize transition-all ${
                          editScope === scope
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-[#888888] hover:text-[#e0e0e0]'
                        }`}
                        title={
                          scope === 'all'
                            ? 'Edits apply as shared base properties across all screen sizes.'
                            : `Edits apply strictly to ${scope} view, leaving other views untouched.`
                        }
                      >
                        {scope === 'all' ? 'All' : scope}
                      </button>
                    ))}
                  </div>

                  {/* Scope helper badge */}
                  <div className="text-[10px] text-[#777777] bg-[#111111] border border-[#1f1f1f] rounded p-1.5 flex items-center justify-between">
                    <span>
                      {editScope === 'all'
                        ? 'Edits apply to base/shared values.'
                        : `Edits apply strictly to ${editScope} overrides.`}
                    </span>
                    {editScope !== 'all' && (
                      <span className="text-amber-400 font-mono text-[9px] shrink-0 ml-1">
                        Isolated Override
                      </span>
                    )}
                  </div>
                </div>

                {/* CONTENT SECTION (Text / Label / Link) */}
                {commonFieldSet.has('text') || commonFieldSet.has('label') || commonFieldSet.has('href') ? (
                  <div className="space-y-2 border-t border-[#222222] pt-3">
                    <button
                      onClick={() => toggleSection('content')}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-[#cccccc] hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-blue-400" />
                        <span>CONTENT</span>
                      </div>
                      {collapsedSections['content'] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-[#666666]" />
                      )}
                    </button>

                    {!collapsedSections['content'] && (
                      <div className="space-y-2.5 pt-1">
                        {commonFieldSet.has('text') && (() => {
                          const { value, isMixed, isOverridden } = getPropInfo<string>('text', '');
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-[#888888]">
                                <span>Text Content</span>
                                {isOverridden && (
                                  <button
                                    onClick={() => handleResetOverride('text')}
                                    className="text-amber-400 hover:underline text-[9px] flex items-center gap-0.5"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" /> Reset to shared
                                  </button>
                                )}
                              </div>
                              <textarea
                                id="inspector-input-text"
                                value={isMixed ? '' : (value as string)}
                                onChange={(e) => handlePropChange('text', e.target.value)}
                                rows={2}
                                className="w-full bg-[#161616] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-blue-500 font-sans"
                                placeholder={isMixed ? 'Mixed text values' : 'Enter text...'}
                              />
                            </div>
                          );
                        })()}

                        {commonFieldSet.has('label') && (() => {
                          const { value, isMixed } = getPropInfo<string>('label', '');
                          return (
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#888888]">Button Label</label>
                              <input
                                id="inspector-input-label"
                                type="text"
                                value={isMixed ? '' : (value as string)}
                                onChange={(e) => handlePropChange('label', e.target.value)}
                                placeholder={isMixed ? 'Mixed' : 'Button Label'}
                                className="w-full bg-[#161616] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-blue-500 font-sans"
                              />
                            </div>
                          );
                        })()}

                        {commonFieldSet.has('href') && (() => {
                          const { value, isMixed } = getPropInfo<string>('href', '#');
                          return (
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#888888]">Link (href)</label>
                              <input
                                id="inspector-input-href"
                                type="text"
                                value={isMixed ? '' : (value as string)}
                                onChange={(e) => handlePropChange('href', e.target.value)}
                                placeholder="#"
                                className="w-full bg-[#161616] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder-[#555555] focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* TYPOGRAPHY SECTION */}
                {commonFieldSet.has('fontSize') ||
                commonFieldSet.has('fontWeight') ||
                commonFieldSet.has('textAlign') ||
                commonFieldSet.has('color') ? (
                  <div className="space-y-2 border-t border-[#222222] pt-3">
                    <button
                      onClick={() => toggleSection('typography')}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-[#cccccc] hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-amber-400" />
                        <span>TYPOGRAPHY</span>
                      </div>
                      {collapsedSections['typography'] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-[#666666]" />
                      )}
                    </button>

                    {!collapsedSections['typography'] && (
                      <div className="space-y-2.5 pt-1">
                        {/* Font Size */}
                        {commonFieldSet.has('fontSize') && (() => {
                          const { value, isMixed, isOverridden } = getPropInfo<number>('fontSize', 16);
                          const numVal = typeof value === 'number' ? value : 16;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-[#888888]">
                                <span className="flex items-center gap-1">
                                  <span>Font Size</span>
                                  {isOverridden ? (
                                    <span className="text-[9px] text-amber-400 font-mono">
                                      ● {editScope} override
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 font-mono">
                                      ● Shared value
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {isOverridden && (
                                    <button
                                      onClick={() => handleResetOverride('fontSize')}
                                      className="text-amber-400 hover:underline text-[9px] flex items-center gap-0.5"
                                      title="Reset to shared base value"
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                                    </button>
                                  )}
                                  <span className="font-mono text-[#e0e0e0]">
                                    {isMixed ? 'Mixed' : `${numVal}px`}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="10"
                                  max="80"
                                  value={numVal}
                                  onChange={(e) => handlePropChange('fontSize', Number(e.target.value))}
                                  className="flex-1 accent-blue-500 h-1 bg-[#222222] rounded-lg cursor-pointer"
                                />
                                <input
                                  type="number"
                                  min="8"
                                  max="120"
                                  value={isMixed ? '' : numVal}
                                  placeholder={isMixed ? 'Mixed' : undefined}
                                  onChange={(e) => handlePropChange('fontSize', Number(e.target.value))}
                                  className="w-14 bg-[#161616] border border-[#262626] rounded px-1.5 py-0.5 text-center text-xs font-mono text-white"
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Font Weight & Text Align */}
                        <div className="grid grid-cols-2 gap-2">
                          {commonFieldSet.has('fontWeight') && (() => {
                            const { value, isMixed } = getPropInfo<string>('fontWeight', 'normal');
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Weight</label>
                                <select
                                  value={isMixed ? 'mixed' : (value as string)}
                                  onChange={(e) => {
                                    if (e.target.value !== 'mixed') {
                                      handlePropChange('fontWeight', e.target.value);
                                    }
                                  }}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                  {isMixed && <option value="mixed">Mixed</option>}
                                  <option value="normal">Regular (400)</option>
                                  <option value="medium">Medium (500)</option>
                                  <option value="semibold">Semibold (600)</option>
                                  <option value="bold">Bold (700)</option>
                                  <option value="extrabold">Extra Bold (800)</option>
                                </select>
                              </div>
                            );
                          })()}

                          {commonFieldSet.has('textAlign') && (() => {
                            const { value, isMixed } = getPropInfo<string>('textAlign', 'left');
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Alignment</label>
                                <select
                                  value={isMixed ? 'mixed' : (value as string)}
                                  onChange={(e) => {
                                    if (e.target.value !== 'mixed') {
                                      handlePropChange('textAlign', e.target.value);
                                    }
                                  }}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                  {isMixed && <option value="mixed">Mixed</option>}
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Line Height & Letter Spacing */}
                        <div className="grid grid-cols-2 gap-2">
                          {commonFieldSet.has('lineHeight') && (() => {
                            const { value, isMixed } = getPropInfo<any>('lineHeight', 1.3);
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Line Height</label>
                                <input
                                  type="text"
                                  value={isMixed ? '' : (value ?? '')}
                                  placeholder={isMixed ? 'Mixed' : '1.3 / 1.5'}
                                  onChange={(e) => handlePropChange('lineHeight', e.target.value)}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}

                          {commonFieldSet.has('letterSpacing') && (() => {
                            const { value, isMixed } = getPropInfo<string>('letterSpacing', 'normal');
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Letter Spacing</label>
                                <input
                                  type="text"
                                  value={isMixed ? '' : (value ?? '')}
                                  placeholder={isMixed ? 'Mixed' : '-0.02em / normal'}
                                  onChange={(e) => handlePropChange('letterSpacing', e.target.value)}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Text Color */}
                        {commonFieldSet.has('color') && (() => {
                          const { value, isMixed, isOverridden } = getPropInfo<string>('color', '#0f172a');
                          const colorStr = typeof value === 'string' ? value : '#0f172a';
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-[#888888]">
                                <span>Text Color</span>
                                {isOverridden && (
                                  <button
                                    onClick={() => handleResetOverride('color')}
                                    className="text-amber-400 hover:underline text-[9px] flex items-center gap-0.5"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={colorStr.startsWith('#') ? colorStr : '#0f172a'}
                                  onChange={(e) => handlePropChange('color', e.target.value)}
                                  className="w-7 h-7 rounded border border-[#333333] bg-transparent cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={isMixed ? '' : colorStr}
                                  onChange={(e) => handlePropChange('color', e.target.value)}
                                  placeholder={isMixed ? 'Mixed colors' : '#0f172a'}
                                  className="flex-1 bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* APPEARANCE SECTION */}
                {commonFieldSet.has('backgroundColor') ||
                commonFieldSet.has('borderRadius') ||
                commonFieldSet.has('borderWidth') ||
                commonFieldSet.has('borderColor') ||
                commonFieldSet.has('opacity') ||
                commonFieldSet.has('shadow') ? (
                  <div className="space-y-2 border-t border-[#222222] pt-3">
                    <button
                      onClick={() => toggleSection('appearance')}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-[#cccccc] hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-sky-400" />
                        <span>APPEARANCE</span>
                      </div>
                      {collapsedSections['appearance'] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-[#666666]" />
                      )}
                    </button>

                    {!collapsedSections['appearance'] && (
                      <div className="space-y-2.5 pt-1">
                        {/* Background Color */}
                        {commonFieldSet.has('backgroundColor') && (() => {
                          const { value, isMixed, isOverridden } = getPropInfo<string>(
                            'backgroundColor',
                            '#ffffff'
                          );
                          const bgStr = typeof value === 'string' ? value : '#ffffff';
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-[#888888]">
                                <span>Background Color</span>
                                {isOverridden && (
                                  <button
                                    onClick={() => handleResetOverride('backgroundColor')}
                                    className="text-amber-400 hover:underline text-[9px] flex items-center gap-0.5"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={bgStr.startsWith('#') ? bgStr : '#ffffff'}
                                  onChange={(e) => handlePropChange('backgroundColor', e.target.value)}
                                  className="w-7 h-7 rounded border border-[#333333] bg-transparent cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={isMixed ? '' : bgStr}
                                  onChange={(e) => handlePropChange('backgroundColor', e.target.value)}
                                  placeholder={isMixed ? 'Mixed' : 'transparent / #ffffff'}
                                  className="flex-1 bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Border Radius & Border Width */}
                        <div className="grid grid-cols-2 gap-2">
                          {commonFieldSet.has('borderRadius') && (() => {
                            const { value, isMixed, isOverridden } = getPropInfo<number>(
                              'borderRadius',
                              0
                            );
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-[#888888]">
                                  <span>Radius (px)</span>
                                  {isOverridden && (
                                    <button
                                      onClick={() => handleResetOverride('borderRadius')}
                                      className="text-amber-400 hover:underline text-[9px]"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max="999"
                                  value={isMixed ? '' : (value as number)}
                                  placeholder={isMixed ? 'Mixed' : '0'}
                                  onChange={(e) =>
                                    handlePropChange('borderRadius', Number(e.target.value))
                                  }
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}

                          {commonFieldSet.has('borderWidth') && (() => {
                            const { value, isMixed } = getPropInfo<number>('borderWidth', 0);
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Border Width</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="16"
                                  value={isMixed ? '' : (value as number)}
                                  placeholder={isMixed ? 'Mixed' : '0'}
                                  onChange={(e) =>
                                    handlePropChange('borderWidth', Number(e.target.value))
                                  }
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Border Color */}
                        {commonFieldSet.has('borderColor') && (() => {
                          const { value, isMixed } = getPropInfo<string>('borderColor', '#e2e8f0');
                          const bColorStr = typeof value === 'string' ? value : '#e2e8f0';
                          return (
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#888888]">Border Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={bColorStr.startsWith('#') ? bColorStr : '#e2e8f0'}
                                  onChange={(e) => handlePropChange('borderColor', e.target.value)}
                                  className="w-7 h-7 rounded border border-[#333333] bg-transparent cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={isMixed ? '' : bColorStr}
                                  onChange={(e) => handlePropChange('borderColor', e.target.value)}
                                  placeholder={isMixed ? 'Mixed' : '#e2e8f0'}
                                  className="flex-1 bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Opacity & Shadow */}
                        <div className="grid grid-cols-2 gap-2">
                          {commonFieldSet.has('opacity') && (() => {
                            const { value, isMixed } = getPropInfo<number>('opacity', 1);
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Opacity (0-1)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={isMixed ? '' : (value as number)}
                                  placeholder={isMixed ? 'Mixed' : '1'}
                                  onChange={(e) =>
                                    handlePropChange('opacity', Number(e.target.value))
                                  }
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}

                          {commonFieldSet.has('shadow') && (() => {
                            const { value, isMixed } = getPropInfo<string>('shadow', 'none');
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Shadow</label>
                                <select
                                  value={isMixed ? 'mixed' : (value as string)}
                                  onChange={(e) => {
                                    if (e.target.value !== 'mixed') {
                                      handlePropChange('shadow', e.target.value);
                                    }
                                  }}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                  {isMixed && <option value="mixed">Mixed</option>}
                                  <option value="none">None</option>
                                  <option value="sm">Small (sm)</option>
                                  <option value="md">Medium (md)</option>
                                  <option value="lg">Large (lg)</option>
                                  <option value="xl">Extra Large (xl)</option>
                                </select>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* SPACING SECTION */}
                {commonFieldSet.has('paddingTop') ||
                commonFieldSet.has('paddingBottom') ||
                commonFieldSet.has('paddingLeft') ||
                commonFieldSet.has('paddingRight') ||
                commonFieldSet.has('marginTop') ||
                commonFieldSet.has('marginBottom') ? (
                  <div className="space-y-2 border-t border-[#222222] pt-3">
                    <button
                      onClick={() => toggleSection('spacing')}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-[#cccccc] hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <Layout className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SPACING (4-SIDED)</span>
                      </div>
                      {collapsedSections['spacing'] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-[#666666]" />
                      )}
                    </button>

                    {!collapsedSections['spacing'] && (
                      <div className="space-y-2.5 pt-1">
                        <div className="text-[10px] text-[#888888]">Padding (px): Top / Right / Bottom / Left</div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div className="space-y-0.5">
                            <label className="text-[9px] text-[#666666] uppercase block text-center">Top</label>
                            <input
                              type="number"
                              min="0"
                              value={getPropInfo<number>('paddingTop', 0).value === 'mixed' ? '' : getPropInfo<number>('paddingTop', 0).value}
                              placeholder="0"
                              onChange={(e) => handlePropChange('paddingTop', Number(e.target.value))}
                              className="w-full bg-[#161616] border border-[#262626] rounded px-1 py-1 text-xs text-center font-mono text-white"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] text-[#666666] uppercase block text-center">Right</label>
                            <input
                              type="number"
                              min="0"
                              value={getPropInfo<number>('paddingRight', 0).value === 'mixed' ? '' : getPropInfo<number>('paddingRight', 0).value}
                              placeholder="0"
                              onChange={(e) => handlePropChange('paddingRight', Number(e.target.value))}
                              className="w-full bg-[#161616] border border-[#262626] rounded px-1 py-1 text-xs text-center font-mono text-white"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] text-[#666666] uppercase block text-center">Btm</label>
                            <input
                              type="number"
                              min="0"
                              value={getPropInfo<number>('paddingBottom', 0).value === 'mixed' ? '' : getPropInfo<number>('paddingBottom', 0).value}
                              placeholder="0"
                              onChange={(e) => handlePropChange('paddingBottom', Number(e.target.value))}
                              className="w-full bg-[#161616] border border-[#262626] rounded px-1 py-1 text-xs text-center font-mono text-white"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] text-[#666666] uppercase block text-center">Left</label>
                            <input
                              type="number"
                              min="0"
                              value={getPropInfo<number>('paddingLeft', 0).value === 'mixed' ? '' : getPropInfo<number>('paddingLeft', 0).value}
                              placeholder="0"
                              onChange={(e) => handlePropChange('paddingLeft', Number(e.target.value))}
                              className="w-full bg-[#161616] border border-[#262626] rounded px-1 py-1 text-xs text-center font-mono text-white"
                            />
                          </div>
                        </div>

                        {/* Margins */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {commonFieldSet.has('marginTop') && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#888888]">Margin Top (px)</label>
                              <input
                                type="number"
                                min="0"
                                value={getPropInfo<number>('marginTop', 0).value === 'mixed' ? '' : getPropInfo<number>('marginTop', 0).value}
                                placeholder="0"
                                onChange={(e) => handlePropChange('marginTop', Number(e.target.value))}
                                className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                              />
                            </div>
                          )}
                          {commonFieldSet.has('marginBottom') && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#888888]">Margin Bottom (px)</label>
                              <input
                                type="number"
                                min="0"
                                value={getPropInfo<number>('marginBottom', 0).value === 'mixed' ? '' : getPropInfo<number>('marginBottom', 0).value}
                                placeholder="0"
                                onChange={(e) => handlePropChange('marginBottom', Number(e.target.value))}
                                className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* SIZE & LAYOUT SECTION */}
                {commonFieldSet.has('width') ||
                commonFieldSet.has('maxWidth') ||
                commonFieldSet.has('height') ||
                commonFieldSet.has('gap') ||
                commonFieldSet.has('gridColumns') ||
                commonFieldSet.has('alignItems') ||
                commonFieldSet.has('justifyContent') ? (
                  <div className="space-y-2 border-t border-[#222222] pt-3">
                    <button
                      onClick={() => toggleSection('layout')}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-[#cccccc] hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <Maximize className="w-3.5 h-3.5 text-purple-400" />
                        <span>SIZE & LAYOUT</span>
                      </div>
                      {collapsedSections['layout'] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-[#666666]" />
                      )}
                    </button>

                    {!collapsedSections['layout'] && (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          {commonFieldSet.has('width') && (() => {
                            const { value, isMixed } = getPropInfo<string>('width', 'auto');
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Width</label>
                                <input
                                  type="text"
                                  value={isMixed ? '' : (value as string)}
                                  placeholder={isMixed ? 'Mixed' : '100% / auto'}
                                  onChange={(e) => handlePropChange('width', e.target.value)}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}

                          {commonFieldSet.has('maxWidth') && (() => {
                            const { value, isMixed } = getPropInfo<string>('maxWidth', 'none');
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Max Width</label>
                                <input
                                  type="text"
                                  value={isMixed ? '' : (value as string)}
                                  placeholder={isMixed ? 'Mixed' : '640px / 100%'}
                                  onChange={(e) => handlePropChange('maxWidth', e.target.value)}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Gap & Grid Columns */}
                        <div className="grid grid-cols-2 gap-2">
                          {commonFieldSet.has('gap') && (() => {
                            const { value, isMixed } = getPropInfo<number>('gap', 0);
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Gap (px)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={isMixed ? '' : (value as number)}
                                  placeholder={isMixed ? 'Mixed' : '0'}
                                  onChange={(e) => handlePropChange('gap', Number(e.target.value))}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}

                          {commonFieldSet.has('gridColumns') && (() => {
                            const { value, isMixed } = getPropInfo<number>('gridColumns', 3);
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Columns</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={isMixed ? '' : (value as number)}
                                  placeholder={isMixed ? 'Mixed' : '3'}
                                  onChange={(e) =>
                                    handlePropChange('gridColumns', Number(e.target.value))
                                  }
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white"
                                />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Align & Justify */}
                        <div className="grid grid-cols-2 gap-2">
                          {commonFieldSet.has('alignItems') && (() => {
                            const { value, isMixed } = getPropInfo<string>('alignItems', 'start');
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Align</label>
                                <select
                                  value={isMixed ? 'mixed' : (value as string)}
                                  onChange={(e) => {
                                    if (e.target.value !== 'mixed') {
                                      handlePropChange('alignItems', e.target.value);
                                    }
                                  }}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                  {isMixed && <option value="mixed">Mixed</option>}
                                  <option value="start">Start</option>
                                  <option value="center">Center</option>
                                  <option value="end">End</option>
                                  <option value="stretch">Stretch</option>
                                </select>
                              </div>
                            );
                          })()}

                          {commonFieldSet.has('justifyContent') && (() => {
                            const { value, isMixed } = getPropInfo<string>(
                              'justifyContent',
                              'start'
                            );
                            return (
                              <div className="space-y-1">
                                <label className="text-[10px] text-[#888888]">Justify</label>
                                <select
                                  value={isMixed ? 'mixed' : (value as string)}
                                  onChange={(e) => {
                                    if (e.target.value !== 'mixed') {
                                      handlePropChange('justifyContent', e.target.value);
                                    }
                                  }}
                                  className="w-full bg-[#161616] border border-[#262626] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                  {isMixed && <option value="mixed">Mixed</option>}
                                  <option value="start">Start</option>
                                  <option value="center">Center</option>
                                  <option value="end">End</option>
                                  <option value="between">Space Between</option>
                                </select>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* If no common editable fields */}
                {commonFields.length === 0 && (
                  <div className="p-3 bg-[#141414] border border-[#222222] rounded-lg text-center text-[#777777] text-xs">
                    No common editable properties across current selection.
                  </div>
                )}

                {/* STRUCTURAL ACTIONS */}
                {!isMultiSelect && primaryElement && (
                  <div className="space-y-2 border-t border-[#222222] pt-3">
                    <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
                      STRUCTURE & ORDER
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {primaryElement.parentId && (
                        <>
                          <button
                            id="btn-move-up"
                            onClick={() => reorderElement(primaryElement.id, 'up')}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-[#161616] hover:bg-[#222222] text-[#cccccc] rounded text-xs border border-[#262626] transition-colors"
                          >
                            <MoveUp className="w-3 h-3" /> Move Up
                          </button>
                          <button
                            id="btn-move-down"
                            onClick={() => reorderElement(primaryElement.id, 'down')}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-[#161616] hover:bg-[#222222] text-[#cccccc] rounded text-xs border border-[#262626] transition-colors"
                          >
                            <MoveDown className="w-3 h-3" /> Move Down
                          </button>
                        </>
                      )}
                      <button
                        id="btn-duplicate"
                        onClick={() => duplicateElement(primaryElement.id)}
                        className="flex items-center justify-center gap-1.5 py-1.5 bg-[#161616] hover:bg-[#222222] text-[#cccccc] rounded text-xs border border-[#262626] transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Duplicate
                      </button>
                      {primaryElement.id !== 'header' &&
                        primaryElement.id !== 'hero' &&
                        primaryElement.id !== 'footer' && (
                          <button
                            id="btn-delete"
                            onClick={() => deleteElement(primaryElement.id)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 rounded text-xs border border-rose-900/40 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* AI CO-PILOT TAB */}
        {activeInspectorTab === 'ai' && (
          <div className="space-y-4">
            {/* Selection Scope Context Card */}
            <div className="bg-[#141414] border border-blue-900/40 rounded-lg p-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-blue-300 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Selection Authority & Scope</span>
              </div>
              <p className="text-[11px] text-[#aaaaaa] leading-tight mb-2">
                AI proposals strictly respect active selection and chosen viewport scope. Nothing mutates until you approve.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-200 border border-blue-800/50">
                  Target: {selectedIds.length === 0 ? 'None' : `${selectedIds.length} element(s)`}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#cccccc] border border-[#2a2a2a]">
                  Scope: {editScope === 'all' ? 'All Views' : editScope}
                </span>
              </div>
            </div>

            {/* Custom Instruction Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#cccccc] flex items-center justify-between">
                <span>Text Instruction</span>
                <span className="text-[10px] font-normal text-[#666666]">Deterministic Engine</span>
              </label>
              <div className="space-y-2">
                <textarea
                  id="ai-instruction-input"
                  value={customAIInput}
                  onChange={(e) => setCustomAIInput(e.target.value)}
                  placeholder="e.g., Rewrite heading to sound more professional, or Make button more prominent..."
                  rows={2}
                  className="w-full bg-[#161616] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-blue-500"
                />
                <button
                  id="ai-submit-btn"
                  onClick={() => {
                    handleAIExecute(customAIInput);
                    setCustomAIInput('');
                  }}
                  disabled={!customAIInput.trim() || selectedIds.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a1a1a] disabled:text-[#555555] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Scoped Proposal
                </button>
              </div>
            </div>

            {/* Documented Preset Scenarios */}
            <div className="space-y-2 border-t border-[#222222] pt-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#cccccc]">Documented AI Scenarios</span>
                <span className="text-[10px] text-[#666666]">1-Click Test</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {DOCUMENTED_AI_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    id={`ai-preset-${preset.id}`}
                    onClick={() => {
                      if (preset.recommendedScope && preset.recommendedScope !== editScope) {
                        setEditScope(preset.recommendedScope);
                      }
                      handleAIExecute(preset.prompt);
                    }}
                    className="w-full text-left p-2 bg-[#141414] hover:bg-[#1a1a1a] hover:border-[#333333] border border-[#222222] rounded-lg text-xs transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-[#e0e0e0] group-hover:text-blue-300">
                        {preset.label}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-[#1e1e1e] text-[#888888]">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#888888] leading-tight truncate">
                      "{preset.prompt}"
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI PROPOSAL REVIEWER SECTION */}
            {activeProposal && (
              <div
                id="ai-proposal-review-card"
                className="border border-blue-500/40 bg-[#141414] rounded-xl p-3 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Proposed AI Changes</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize ${
                      activeProposal.status === 'accepted'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : activeProposal.status === 'rejected'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : activeProposal.status === 'invalid'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {activeProposal.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-[11px] text-[#cccccc] italic bg-[#0a0a0a] p-2 rounded border border-[#222222]">
                  "{activeProposal.instruction}"
                </div>

                {/* Validation error if any */}
                {activeProposal.validationError && (
                  <div className="p-2 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{activeProposal.validationError}</span>
                  </div>
                )}

                {/* Per-Element Proposal Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeProposal.items.map((item) => (
                    <div
                      key={item.elementId}
                      className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                        item.status === 'accepted'
                          ? 'bg-emerald-950/30 border-emerald-800/60'
                          : item.status === 'rejected'
                          ? 'bg-[#0a0a0a] border-[#222222] opacity-60'
                          : item.status === 'invalid'
                          ? 'bg-rose-950/30 border-rose-800/60'
                          : 'bg-[#0a0a0a] border-[#222222]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#e0e0e0]">{item.elementName}</span>
                        <span className="text-[10px] font-mono text-blue-300">
                          {item.targetViewport}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#888888]">{item.diffExplanation}</p>

                      {/* Before / After Diff comparison */}
                      <div className="grid grid-cols-2 gap-1.5 bg-[#141414] p-1.5 rounded text-[10px] font-mono">
                        <div className="space-y-0.5 overflow-hidden">
                          <span className="text-[#666666] uppercase">Before:</span>
                          <div className="text-rose-400 truncate">
                            {JSON.stringify(item.before).slice(0, 35)}
                          </div>
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          <span className="text-[#666666] uppercase">After:</span>
                          <div className="text-emerald-400 truncate">
                            {JSON.stringify(item.after).slice(0, 35)}
                          </div>
                        </div>
                      </div>

                      {/* Per-Element Accept/Reject Buttons */}
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            id={`ai-item-reject-${item.elementId}`}
                            onClick={() => rejectProposalItem(item.elementId)}
                            className="flex-1 py-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#cccccc] rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 border border-[#2a2a2a]"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                          <button
                            id={`ai-item-accept-${item.elementId}`}
                            onClick={() => acceptProposalItem(item.elementId)}
                            className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Check className="w-3 h-3" /> Accept
                          </button>
                        </div>
                      )}

                      {item.status === 'accepted' && (
                        <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" /> Applied to canonical template
                        </div>
                      )}
                      {item.status === 'rejected' && (
                        <div className="text-[11px] text-[#666666] flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Skipped (Original preserved)
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Batch Actions */}
                {activeProposal.status === 'pending' ||
                activeProposal.status === 'partially_accepted' ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#222222]">
                    <button
                      id="ai-proposal-reject-all"
                      onClick={rejectAllProposalItems}
                      className="flex-1 py-1.5 bg-[#1e1e1e] hover:bg-[#262626] text-[#cccccc] rounded-lg text-xs font-medium transition-colors border border-[#2a2a2a]"
                    >
                      Reject All
                    </button>
                    <button
                      id="ai-proposal-accept-all"
                      onClick={acceptAllProposalItems}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Accept All
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={clearActiveProposal}
                    className="w-full py-1.5 bg-[#1e1e1e] hover:bg-[#262626] text-[#cccccc] rounded-lg text-xs font-medium border border-[#2a2a2a]"
                  >
                    Dismiss Proposal
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
