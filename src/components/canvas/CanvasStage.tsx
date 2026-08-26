import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { TemplateRenderer } from './TemplateRenderer';
import { VIEWPORT_CONFIG } from '../../responsive/viewportConfig';

export const CanvasStage: React.FC = () => {
  const {
    activeViewport,
    template,
    clearSelection,
    setSelectedIds,
    selectedIds,
    selectElement,
    deleteElement,
    duplicateElement,
  } = useEditorStore();
  const [zoom, setZoom] = useState<number>(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMarquee, setIsMarquee] = useState(false);
  const [marqueeBox, setMarqueeBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Keyboard navigation & selection listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const allElementIds = Object.keys(template.elements);
      if (allElementIds.length === 0) return;

      // Escape: Clear selection
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }

      // Tab / Shift+Tab: Cycle through elements
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentId = selectedIds[0];
        const currentIndex = currentId ? allElementIds.indexOf(currentId) : -1;

        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex = currentIndex <= 0 ? allElementIds.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= allElementIds.length - 1 ? 0 : currentIndex + 1;
        }

        selectElement(allElementIds[nextIndex]);
        return;
      }

      // Delete or Backspace: Delete selected element(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length === 1) {
          const targetId = selectedIds[0];
          if (targetId !== 'header' && targetId !== 'hero' && targetId !== 'footer') {
            e.preventDefault();
            deleteElement(targetId);
          }
        }
        return;
      }

      // Cmd+D / Ctrl+D: Duplicate element
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        if (selectedIds.length === 1) {
          e.preventDefault();
          duplicateElement(selectedIds[0]);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [template, selectedIds, clearSelection, selectElement, deleteElement, duplicateElement]);

  // Exact device frame width classes derived from VIEWPORT_CONFIG
  const viewportWidthStyles = {
    desktop: { width: `${VIEWPORT_CONFIG.desktop.width}px`, maxWidth: `${VIEWPORT_CONFIG.desktop.width}px` },
    tablet: { width: `${VIEWPORT_CONFIG.tablet.width}px`, minWidth: `${VIEWPORT_CONFIG.tablet.width}px`, maxWidth: `${VIEWPORT_CONFIG.tablet.width}px` },
    mobile: { width: `${VIEWPORT_CONFIG.mobile.width}px`, minWidth: `${VIEWPORT_CONFIG.mobile.width}px`, maxWidth: `${VIEWPORT_CONFIG.mobile.width}px` },
  };

  const viewportLabels = {
    desktop: `${VIEWPORT_CONFIG.desktop.label} Preview · ${VIEWPORT_CONFIG.desktop.width}px viewport`,
    tablet: `${VIEWPORT_CONFIG.tablet.label} Preview · ${VIEWPORT_CONFIG.tablet.width}px viewport`,
    mobile: `${VIEWPORT_CONFIG.mobile.label} Preview · ${VIEWPORT_CONFIG.mobile.width}px viewport`,
  };

  const handleStageMouseDown = (e: React.MouseEvent) => {
    // If clicked on stage background directly (not on an element)
    if (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-stage-bg') {
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        clearSelection();
      }

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setIsMarquee(true);
        setMarqueeBox({ x1: startX, y1: startY, x2: startX, y2: startY });
      }
    }
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (!isMarquee || !containerRef.current || !marqueeBox) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setMarqueeBox((prev) => (prev ? { ...prev, x2: currentX, y2: currentY } : null));
  };

  const handleStageMouseUp = () => {
    if (isMarquee && marqueeBox) {
      // Find intersecting elements
      const minX = Math.min(marqueeBox.x1, marqueeBox.x2);
      const maxX = Math.max(marqueeBox.x1, marqueeBox.x2);
      const minY = Math.min(marqueeBox.y1, marqueeBox.y2);
      const maxY = Math.max(marqueeBox.y1, marqueeBox.y2);

      // If dragged at least 15px box
      if (maxX - minX > 15 && maxY - minY > 15) {
        const foundIds: string[] = [];
        for (const id of Object.keys(template.elements)) {
          const elNode = document.getElementById(`canvas-el-${id}`);
          if (elNode && containerRef.current) {
            const elRect = elNode.getBoundingClientRect();
            const contRect = containerRef.current.getBoundingClientRect();
            const nodeLeft = elRect.left - contRect.left;
            const nodeTop = elRect.top - contRect.top;
            const nodeRight = nodeLeft + elRect.width;
            const nodeBottom = nodeTop + elRect.height;

            const intersects =
              nodeLeft < maxX && nodeRight > minX && nodeTop < maxY && nodeBottom > minY;

            if (intersects) {
              foundIds.push(id);
            }
          }
        }

        if (foundIds.length > 0) {
          setSelectedIds(Array.from(new Set([...selectedIds, ...foundIds])));
        }
      }
    }
    setIsMarquee(false);
    setMarqueeBox(null);
  };

  return (
    <div
      id="canvas-stage-wrapper"
      className="flex-1 bg-[#0a0a0a] overflow-auto relative flex flex-col items-center select-none"
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      ref={containerRef}
    >
      {/* Floating Zoom & Resolution Controls */}
      <div className="sticky top-3 z-30 flex items-center gap-2 bg-[#111111]/90 backdrop-blur-md border border-[#262626] rounded-full px-3 py-1.5 text-xs text-[#e0e0e0] shadow-xl">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#888888]">
          {activeViewport === 'desktop' && <Monitor className="w-3.5 h-3.5 text-blue-400" />}
          {activeViewport === 'tablet' && <Tablet className="w-3.5 h-3.5 text-sky-400" />}
          {activeViewport === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-amber-400" />}
          <span className="text-[#cccccc]">{viewportLabels[activeViewport]}</span>
        </span>

        <div className="h-3 w-px bg-[#262626] mx-1" />

        <div className="flex items-center gap-1 font-mono text-[11px]">
          <button
            onClick={() => setZoom(Math.max(zoom - 15, 40))}
            className="p-1 hover:text-white rounded hover:bg-[#222222] text-[#888888]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="w-9 text-center font-semibold text-[#e0e0e0]">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(zoom + 15, 150))}
            className="p-1 hover:text-white rounded hover:bg-[#222222] text-[#888888]"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1 hover:text-white rounded hover:bg-[#222222] ml-0.5 text-[#666666]"
            title="Reset to 100%"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Frame */}
      <div
        id="canvas-stage-bg"
        className="w-full flex-1 flex justify-center py-6 px-4"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          id="device-frame"
          style={viewportWidthStyles[activeViewport]}
          className="bg-white shadow-2xl rounded-xl overflow-hidden overflow-x-hidden border border-[#2a2a2a] transition-all duration-300 relative flex flex-col"
        >
          {/* Mock Browser Titlebar for Device */}
          <div className="h-7 bg-slate-100 border-b border-slate-200 px-3 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
              https://preview.aurastudio.io • {activeViewport}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {VIEWPORT_CONFIG[activeViewport].width}px
            </div>
          </div>

          {/* Render Root Template Elements via TemplateRenderer */}
          <main className="w-full flex-1 bg-white">
            <TemplateRenderer />
          </main>
        </div>
      </div>

      {/* Marquee Box Overlay */}
      {isMarquee && marqueeBox && (
        <div
          className="absolute border border-blue-500 bg-blue-500/15 pointer-events-none z-50 rounded"
          style={{
            left: `${Math.min(marqueeBox.x1, marqueeBox.x2)}px`,
            top: `${Math.min(marqueeBox.y1, marqueeBox.y2)}px`,
            width: `${Math.abs(marqueeBox.x2 - marqueeBox.x1)}px`,
            height: `${Math.abs(marqueeBox.y2 - marqueeBox.y1)}px`,
          }}
        />
      )}
    </div>
  );
};
