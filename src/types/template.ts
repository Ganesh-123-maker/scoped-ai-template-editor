/**
 * Canonical Template and Editor Type Definitions
 * Re-exports and unifies canonical model types for the entire application.
 */

export * from '../model';

export type PropertyDiff = {
  elementId: string;
  elementName: string;
  property: keyof import('../model').EditableProperties;
  label: string;
  from: any;
  to: any;
  targetViewport: import('../model').Viewport;
};

export type ChangeSummary = {
  id: string;
  timestamp: number;
  source: import('../model').EditSource;
  elementIds: string[];
  viewport: import('../model').Viewport;
  revision: number;
  diffs: PropertyDiff[];
  summaryText: string;
};
