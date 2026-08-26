import React from 'react';
import { ResolvedElement } from '../../../responsive/types';

interface TextRendererProps {
  element: ResolvedElement;
  style: React.CSSProperties;
  className: string;
  tagBadge: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const TextRenderer: React.FC<TextRendererProps> = ({
  element,
  style,
  className,
  tagBadge,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <p
      id={`canvas-el-${element.id}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative ${className}`}
    >
      {tagBadge}
      {element.properties.text || ''}
    </p>
  );
};
