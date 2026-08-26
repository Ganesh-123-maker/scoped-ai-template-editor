import React from 'react';
import { ResolvedElement } from '../../../responsive/types';

interface BadgeRendererProps {
  element: ResolvedElement;
  style: React.CSSProperties;
  className: string;
  tagBadge: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const BadgeRenderer: React.FC<BadgeRendererProps> = ({
  element,
  style,
  className,
  tagBadge,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <span
      id={`canvas-el-${element.id}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`inline-flex items-center relative select-none ${className}`}
    >
      {tagBadge}
      {element.properties.text || element.properties.badgeText || 'Badge'}
    </span>
  );
};
