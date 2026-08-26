import React from 'react';
import { ResolvedElement } from '../../../responsive/types';

interface ButtonRendererProps {
  element: ResolvedElement;
  style: React.CSSProperties;
  className: string;
  tagBadge: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const ButtonRenderer: React.FC<ButtonRendererProps> = ({
  element,
  style,
  className,
  tagBadge,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <button
      id={`canvas-el-${element.id}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`inline-flex items-center justify-center select-none transition-colors ${className}`}
    >
      {tagBadge}
      {element.properties.text || 'Button'}
    </button>
  );
};
