import React from 'react';
import { ResolvedElement } from '../../../responsive/types';

interface NavItemRendererProps {
  element: ResolvedElement;
  style: React.CSSProperties;
  className: string;
  tagBadge: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const NavItemRenderer: React.FC<NavItemRendererProps> = ({
  element,
  style,
  className,
  tagBadge,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <a
      id={`canvas-el-${element.id}`}
      href={element.properties.href || '#'}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`inline-block relative hover:text-slate-900 transition-colors ${className}`}
    >
      {tagBadge}
      {element.properties.text || 'Nav Item'}
    </a>
  );
};
