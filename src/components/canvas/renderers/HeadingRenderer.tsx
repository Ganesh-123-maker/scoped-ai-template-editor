import React from 'react';
import { ResolvedElement } from '../../../responsive/types';

interface HeadingRendererProps {
  element: ResolvedElement;
  style: React.CSSProperties;
  className: string;
  tagBadge: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const HeadingRenderer: React.FC<HeadingRendererProps> = ({
  element,
  style,
  className,
  tagBadge,
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
      className={`block relative ${className}`}
    >
      {tagBadge}
      {element.properties.text || 'Heading'}
    </div>
  );
};
