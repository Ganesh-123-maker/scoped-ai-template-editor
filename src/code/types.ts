import { TemplateModel } from '../types/template';
import { EditCommand } from '../commands/types';

/**
 * Structured code validation error with location
 */
export interface CodeError {
  code: string;
  message: string;
  line?: number;
  column?: number;
  elementId?: string;
  property?: string;
}

/**
 * Result of parsing serialized template code
 */
export interface ParseResult {
  success: boolean;
  template?: TemplateModel;
  errors: CodeError[];
  warnings?: CodeError[];
}

/**
 * Summary of diffs between two template states
 */
export interface TemplateDiffResult {
  commands: EditCommand[];
  summary: {
    elementsChanged: number;
    propertiesChanged: number;
    elementsAdded: number;
    elementsRemoved: number;
    elementsReordered: number;
    overridesChanged: number;
  };
  details: string[];
}
