import { ElementType } from './elementTypes';
import { EditableProperties } from './properties';
import { ElementModel } from './element';

/**
 * Viewport Scope for Editing & Targeting
 * - 'all': Applies changes to the shared base property model (cascades to all screens)
 * - 'desktop': Applies changes strictly to the desktop override model
 * - 'tablet': Applies changes strictly to the tablet override model
 * - 'mobile': Applies changes strictly to the mobile override model
 */
export type Viewport = 'all' | 'desktop' | 'tablet' | 'mobile';

/**
 * Active Preview Viewport for Canvas and Device Simulation
 */
export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';
export type ActiveViewport = PreviewViewport;

/**
 * Origin of an Edit Action in the System
 */
export type EditSource = 'canvas' | 'code' | 'ai' | 'restore';

/**
 * History Entry Log Record
 * Captures immutable atomic changes for granular undo/redo and per-element rollback.
 */
export interface HistoryEntry {
  /** Unique historical log identifier */
  id: string;
  /** Monotonic revision number of the template after this edit */
  revision?: number;
  /** Unix epoch timestamp in milliseconds */
  timestamp: number;
  /** System source that triggered the modification */
  source: EditSource;
  /** Human-readable explanation of the change */
  summary?: string;
  /** Array of element IDs directly modified by this entry */
  elementIds: string[];
  /** Target viewport scope where this change was applied */
  viewport: Viewport;
  /** Base revision of the template before this command was executed */
  baseRevision: number;
  /** Resulting revision of the template after command execution */
  newRevision: number;
  /** Generic before snapshot payload */
  before?: Record<string, unknown>;
  /** Generic after snapshot payload */
  after?: Record<string, unknown>;
  /** Detailed per-element property diff */
  changes?: Record<
    string,
    {
      elementName: string;
      before: Partial<EditableProperties>;
      after: Partial<EditableProperties>;
      targetViewport: Viewport;
    }
  >;
  /** Full element snapshots for atomic rollbacks */
  snapshot?: Record<string, ElementModel>;
}

/**
 * Canonical Template Model
 * The single source of truth for the entire application.
 */
export interface TemplateModel {
  /** Stable identifier for the template */
  templateId: string;
  /** Human-readable template project name */
  name: string;
  /** Current monotonic version number */
  version: number;
  /** Dictionary of all elements in the document keyed by stable element ID */
  elements: Record<string, ElementModel>;
  /** Ordered list of top-level root element IDs */
  rootElementIds: string[];
  /** Optional embedded history log entries */
  history?: HistoryEntry[];
}

/**
 * Universal Edit Command Structure
 * Executed by Canvas, Code Editor, AI Co-Pilot, and Rollback actions.
 */
export interface EditCommand {
  /** System source generating the command */
  source: EditSource;
  /** Target element IDs to modify */
  targetIds: string[];
  /** Viewport scope: 'all' modifies base; specific viewport modifies override */
  viewport: Viewport;
  /** Expected base revision to prevent stale writes */
  baseRevision: number;
  /** Dictionary mapping element ID to new/updated properties */
  changes: Record<string, Partial<EditableProperties>>;
  /** Descriptive human-readable summary of the intent */
  description?: string;
  /** Alternative summary key used by components */
  summary?: string;
}

/**
 * Structured Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * AI Proposal Item for granular per-element diff & approval
 */
export interface AIProposalItem {
  elementId: string;
  elementName: string;
  elementType?: ElementType;
  targetViewport: Viewport;
  before: Partial<EditableProperties>;
  after: Partial<EditableProperties>;
  diffExplanation: string;
  status: 'pending' | 'accepted' | 'rejected' | 'invalid';
  validationError?: string;
}

/**
 * Complete AI Proposal Bundle
 */
export interface AIProposal {
  id: string;
  prompt?: string;
  instruction: string;
  source?: 'ai';
  scenarioType?:
    | 'content_rewrite'
    | 'style_change'
    | 'resize_reorder'
    | 'responsive_adjustment'
    | 'multi_element'
    | 'safe_failure'
    | 'unsupported'
    | string;
  baseRevision: number;
  selectedIds: string[];
  viewport?: Viewport;
  scope?: Viewport;
  timestamp: number;
  items: AIProposalItem[];
  status: 'pending' | 'partially_accepted' | 'accepted' | 'rejected' | 'invalid';
  validationError?: string;
}

// Re-export underlying foundational types
export * from './elementTypes';
export * from './properties';
export * from './element';
