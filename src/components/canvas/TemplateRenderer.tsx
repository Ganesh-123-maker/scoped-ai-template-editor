import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { ElementRenderer } from './ElementRenderer';

/**
 * TemplateRenderer
 * Iterates over the canonical template's rootElementIds and renders each element tree.
 */
export const TemplateRenderer: React.FC = () => {
  const { template } = useEditorStore();

  return (
    <div className="w-full flex flex-col items-center">
      {template.rootElementIds.map((rootId) => (
        <ElementRenderer key={rootId} elementId={rootId} />
      ))}
    </div>
  );
};
