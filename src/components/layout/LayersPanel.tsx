import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Heading,
  Type,
  MousePointerClick,
  Sparkles,
  LayoutGrid,
  CreditCard,
  Box,
  MoveUp,
  MoveDown,
  Copy,
  Trash2,
  Eye,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ElementModel, ElementType } from '../../types/template';

const TYPE_ICONS: Record<ElementType, React.ReactNode> = {
  section: <Box className="w-3.5 h-3.5 text-indigo-400" />,
  container: <Layers className="w-3.5 h-3.5 text-sky-400" />,
  heading: <Heading className="w-3.5 h-3.5 text-amber-400" />,
  text: <Type className="w-3.5 h-3.5 text-emerald-400" />,
  button: <MousePointerClick className="w-3.5 h-3.5 text-purple-400" />,
  badge: <Sparkles className="w-3.5 h-3.5 text-pink-400" />,
  card: <CreditCard className="w-3.5 h-3.5 text-blue-400" />,
  grid: <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />,
  'nav-item': <Type className="w-3.5 h-3.5 text-slate-400" />,
  'icon-box': <Box className="w-3.5 h-3.5 text-amber-400" />,
  image: <Box className="w-3.5 h-3.5 text-rose-400" />,
  nav: <Layers className="w-3.5 h-3.5 text-sky-400" />,
  logo: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
  testimonial: <CreditCard className="w-3.5 h-3.5 text-emerald-400" />,
};

interface LayerItemProps {
  elementId: string;
  depth: number;
}

const LayerItem: React.FC<LayerItemProps> = ({ elementId, depth }) => {
  const {
    template,
    selectedIds,
    selectElement,
    hoveredId,
    setHoveredId,
    reorderElement,
    duplicateElement,
    deleteElement,
  } = useEditorStore();

  const [expanded, setExpanded] = useState(true);
  const element = template.elements[elementId];

  if (!element) return null;

  const isSelected = selectedIds.includes(elementId);
  const isHovered = hoveredId === elementId;
  const hasChildren = element.children && element.children.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(elementId, e.shiftKey || e.metaKey || e.ctrlKey);
  };

  return (
    <div className="select-none text-xs">
      <div
        id={`layer-node-${elementId}`}
        onClick={handleSelect}
        onMouseEnter={() => setHoveredId(elementId)}
        onMouseLeave={() => setHoveredId(null)}
        style={{ paddingLeft: `${Math.max(depth * 14 + 8, 8)}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-600/20 text-white font-medium border-l-2 border-blue-500'
            : isHovered
            ? 'bg-[#1a1a1a] text-[#e0e0e0]'
            : 'text-[#888888] hover:bg-[#141414] hover:text-[#cccccc]'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-0.5 hover:text-white text-[#666666] rounded"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <span className="shrink-0">{TYPE_ICONS[element.type] || <Box className="w-3.5 h-3.5" />}</span>

          <span className="truncate text-xs text-[#e0e0e0]">{element.name}</span>

          <span className="text-[10px] font-mono text-[#555555] hidden sm:inline group-hover:text-[#777777]">
            #{element.id}
          </span>
        </div>

        {/* Quick hover actions */}
        <div className="hidden group-hover:flex items-center gap-0.5 text-[#888888]">
          {element.parentId && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reorderElement(elementId, 'up');
                }}
                className="p-1 hover:text-white hover:bg-[#222222] rounded"
                title="Move Up"
              >
                <MoveUp className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reorderElement(elementId, 'down');
                }}
                className="p-1 hover:text-white hover:bg-[#222222] rounded"
                title="Move Down"
              >
                <MoveDown className="w-2.5 h-2.5" />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateElement(elementId);
            }}
            className="p-1 hover:text-white hover:bg-[#222222] rounded"
            title="Duplicate"
          >
            <Copy className="w-2.5 h-2.5" />
          </button>
          {element.id !== 'header' && element.id !== 'hero' && element.id !== 'footer' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(elementId);
              }}
              className="p-1 hover:text-rose-400 hover:bg-rose-950/40 rounded"
              title="Delete"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Children elements */}
      {hasChildren && expanded && (
        <div className="space-y-0.5">
          {element.children!.map((childId) => (
            <LayerItem key={childId} elementId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayersPanel: React.FC = () => {
  const { template, selectedIds, clearSelection } = useEditorStore();

  return (
    <aside
      id="layers-panel"
      className="w-64 bg-[#0d0d0d] border-r border-[#222222] flex flex-col h-full select-none"
    >
      <div className="h-10 px-3 border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#888888]" />
          <span className="text-xs font-semibold text-[#e0e0e0] tracking-tight">Layers</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#161616] text-[#888888] border border-[#262626]">
            {Object.keys(template.elements).length}
          </span>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={clearSelection}
            className="text-[11px] text-[#888888] hover:text-[#e0e0e0] transition-colors"
          >
            Deselect ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-sans">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#555555] px-2 py-1">
          Document Tree
        </div>
        {template.rootElementIds.map((rootId) => (
          <LayerItem key={rootId} elementId={rootId} depth={0} />
        ))}
      </div>

      <div className="p-2.5 border-t border-[#222222] bg-[#0a0a0a] text-[11px] text-[#666666]">
        <span className="font-medium text-[#888888]">Pro Tip:</span> Hold <kbd className="px-1 py-0.5 bg-[#161616] border border-[#2a2a2a] rounded text-[#cccccc] font-mono text-[10px]">Shift</kbd> to select multiple elements.
      </div>
    </aside>
  );
};
