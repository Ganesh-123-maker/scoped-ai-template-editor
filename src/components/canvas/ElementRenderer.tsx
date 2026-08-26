import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { resolveElement } from '../../responsive/resolve';
import { ElementModel } from '../../types/template';
import { HeadingRenderer } from './renderers/HeadingRenderer';
import { TextRenderer } from './renderers/TextRenderer';
import { ButtonRenderer } from './renderers/ButtonRenderer';
import { BadgeRenderer } from './renderers/BadgeRenderer';
import { CardRenderer } from './renderers/CardRenderer';
import { GridRenderer } from './renderers/GridRenderer';
import { ContainerRenderer } from './renderers/ContainerRenderer';
import { SectionRenderer } from './renderers/SectionRenderer';
import { NavItemRenderer } from './renderers/NavItemRenderer';

interface ElementRendererProps {
  elementId: string;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ elementId }) => {
  const {
    template,
    activeViewport,
    selectedIds,
    selectElement,
    hoveredId,
    setHoveredId,
  } = useEditorStore();

  const element: ElementModel | undefined = template.elements[elementId];
  if (!element) return null;

  // Resolve element for the active viewport using the central responsive resolver
  const resolved = resolveElement(element, activeViewport);
  const props = resolved.properties;

  // Handle explicit display: none for this viewport
  if (props.display === 'none') {
    return null;
  }

  const isSelected = selectedIds.includes(elementId);
  const isHovered = hoveredId === elementId && !isSelected;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(elementId, e.shiftKey || e.metaKey || e.ctrlKey);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHoveredId(elementId);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoveredId === elementId) {
      setHoveredId(null);
    }
  };

  // Build responsive inline styles from resolved typed properties
  const style: React.CSSProperties = {
    color: props.color,
    backgroundColor: props.backgroundColor,
    borderColor: props.borderColor,
    borderWidth: props.borderWidth !== undefined ? `${props.borderWidth}px` : undefined,
    borderStyle: props.borderWidth ? 'solid' : undefined,
    borderRadius: props.borderRadius !== undefined ? `${props.borderRadius}px` : undefined,
    fontSize: props.fontSize !== undefined ? `${props.fontSize}px` : undefined,
    fontWeight:
      props.fontWeight === 'extrabold'
        ? 800
        : props.fontWeight === 'bold'
        ? 700
        : props.fontWeight === 'semibold'
        ? 600
        : props.fontWeight === 'medium'
        ? 500
        : 400,
    lineHeight: props.lineHeight !== undefined ? props.lineHeight : undefined,
    letterSpacing: props.letterSpacing,
    textAlign: props.textAlign,
    paddingTop: props.paddingTop !== undefined ? `${props.paddingTop}px` : undefined,
    paddingBottom: props.paddingBottom !== undefined ? `${props.paddingBottom}px` : undefined,
    paddingLeft: props.paddingLeft !== undefined ? `${props.paddingLeft}px` : undefined,
    paddingRight: props.paddingRight !== undefined ? `${props.paddingRight}px` : undefined,
    marginTop: props.marginTop !== undefined ? `${props.marginTop}px` : undefined,
    marginBottom: props.marginBottom !== undefined ? `${props.marginBottom}px` : undefined,
    width: props.width,
    maxWidth: props.maxWidth,
    minWidth: props.minWidth,
    height: props.height,
    display:
      props.display ||
      (resolved.type === 'grid'
        ? 'grid'
        : resolved.type === 'container' || resolved.type === 'section'
        ? 'flex'
        : undefined),
    flexDirection: props.flexDirection,
    alignItems:
      props.alignItems === 'start'
        ? 'flex-start'
        : props.alignItems === 'end'
        ? 'flex-end'
        : props.alignItems,
    justifyContent:
      props.justifyContent === 'start'
        ? 'flex-start'
        : props.justifyContent === 'end'
        ? 'flex-end'
        : props.justifyContent === 'between'
        ? 'space-between'
        : props.justifyContent === 'around'
        ? 'space-around'
        : props.justifyContent,
    gap: props.gap !== undefined ? `${props.gap}px` : undefined,
    gridTemplateColumns:
      props.gridColumns !== undefined
        ? `repeat(${props.gridColumns}, minmax(0, 1fr))`
        : undefined,
    opacity: props.opacity !== undefined ? props.opacity : 1,
    boxShadow:
      props.shadow === 'sm'
        ? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
        : props.shadow === 'md'
        ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
        : props.shadow === 'lg'
        ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
        : props.shadow === 'xl'
        ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        : undefined,
  };

  // Children recursive rendering
  const childrenNodes = resolved.children?.map((childId) => (
    <ElementRenderer key={childId} elementId={childId} />
  ));

  // Visual selection frame
  const selectionClasses = isSelected
    ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-transparent relative z-20 cursor-pointer shadow-md'
    : isHovered
    ? 'ring-1 ring-sky-400 ring-offset-0 relative z-10 cursor-pointer'
    : 'cursor-pointer transition-shadow hover:ring-1 hover:ring-slate-300';

  // Render tag overlay for selected elements
  const tagBadge = isSelected ? (
    <div
      className="absolute -top-5 left-0 z-30 flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none select-none"
    >
      <span>{resolved.name}</span>
      <span className="opacity-75">#{resolved.id}</span>
    </div>
  ) : null;

  // Dispatch to type-specific renderer
  switch (resolved.type) {
    case 'heading':
      return (
        <HeadingRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'text':
      return (
        <TextRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'button':
      return (
        <ButtonRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'badge':
      return (
        <BadgeRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'nav-item':
      return (
        <NavItemRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'card':
      return (
        <CardRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          childrenNodes={childrenNodes}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'grid':
      return (
        <GridRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          childrenNodes={childrenNodes}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'section':
      return (
        <SectionRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          childrenNodes={childrenNodes}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );

    case 'container':
    default:
      return (
        <ContainerRenderer
          element={resolved}
          style={style}
          className={selectionClasses}
          tagBadge={tagBadge}
          childrenNodes={childrenNodes}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );
  }
};
