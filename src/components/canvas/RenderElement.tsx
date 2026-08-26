import React from 'react';
import { ElementRenderer } from './ElementRenderer';

interface RenderElementProps {
  elementId: string;
}

export const RenderElement: React.FC<RenderElementProps> = ({ elementId }) => {
  return <ElementRenderer elementId={elementId} />;
};
