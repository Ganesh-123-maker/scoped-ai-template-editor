import { EditableProperties, ElementModel, TemplateModel, Viewport } from '../types/template';

/**
 * Origin of an Edit Action in the System
 */
export type EditSource = 'canvas' | 'code' | 'ai' | 'restore';

/**
 * Operation type of an Edit Command
 */
export type EditOperation = 'update' | 'duplicate' | 'delete' | 'reorder';

/**
 * Universal, serializable Edit Command Structure
 * The single contract accepted by the Unified Pipeline across Canvas, Code, AI, and Restore.
 */
export interface EditCommand {
  /** Unique command identifier for idempotency & audit logging */
  id?: string;

  /** System source generating the command */
  source: EditSource;

  /** Explicit target element IDs to modify */
  targetIds: string[];

  /** Viewport scope: 'all' modifies base; specific viewport modifies override */
  viewport: Viewport;

  /** Expected base revision to prevent stale writes */
  baseRevision: number;

  /** Operation type, defaults to 'update' */
  operation?: EditOperation;

  /** Dictionary mapping element ID to new/updated properties (for 'update') */
  changes?: Record<string, Partial<EditableProperties>>;

  /** Reorder direction (for 'reorder' operation) */
  reorderDirection?: 'up' | 'down';

  /** Descriptive human-readable summary of the intent */
  description?: string;

  /** Alternative summary key */
  summary?: string;
}

/**
 * Structured validation error with standard error code
 */
export interface ValidationError {
  code:
    | 'UNKNOWN_ELEMENT'
    | 'INVALID_PROPERTY'
    | 'FORBIDDEN_PROPERTY'
    | 'INVALID_VALUE'
    | 'INVALID_SCOPE'
    | 'STALE_REVISION'
    | 'EMPTY_TARGET'
    | 'DUPLICATE_TARGET'
    | 'INVALID_COMMAND'
    | 'ROOT_DELETION_FORBIDDEN'
    | 'SELECTION_AUTHORITY_VIOLATION'
    | string;
  message: string;
  elementId?: string;
  property?: string;
}

/**
 * Structured validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  elementId?: string;
  property?: string;
}

/**
 * Complete Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

/**
 * Result of committing an EditCommand
 */
export interface CommitResult {
  success: boolean;
  revision?: number;
  changedElementIds?: string[];
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  historyEntryId?: string;
  nextTemplate?: TemplateModel;
  historyEntry?: import('../types/template').HistoryEntry;
  changeSummary?: import('../types/template').ChangeSummary;
}
