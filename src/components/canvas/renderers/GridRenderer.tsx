import React from 'react';
import { ResolvedElement } from '../../../responsive/types';

interface GridRendererProps {
  element: ResolvedElement;
  style: React.CSSProperties;
  className: string;
  tagBadge: React.ReactNode;
  childrenNodes?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const GridRenderer: React.FC<GridRendererProps> = ({
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
    <div
      id={`canvas-el-${element.id}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative ${className}`}
    >
      {tagBadge}
      {childrenNodes}
    </div>
  );
};
