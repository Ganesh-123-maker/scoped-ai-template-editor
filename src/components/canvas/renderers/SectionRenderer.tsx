import React from 'react';
import { ResolvedElement } from '../../../responsive/types';

interface SectionRendererProps {
  element: ResolvedElement;
  style: React.CSSProperties;
  className: string;
  tagBadge: React.ReactNode;
  childrenNodes?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  element,
  style,
  className,
  tagBadge,
  childrenNodes,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <section
      id={`canvas-el-${element.id}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative w-full ${className}`}
    >
      {tagBadge}
      {element.properties.text && <div className="mb-2">{element.properties.text}</div>}
      {childrenNodes}
    </section>
  );
};
