import { ElementModel, TemplateModel } from '../types/template';
import { CodeError, ParseResult } from './types';
import { validateParsedTemplate, validateSecurityTokens } from './validator';

/**
 * Extracts line and column number from JSON syntax error message if available
 */
function extractJsonErrorLocation(source: string, error: Error): { line?: number; column?: number } {
  const message = error.message;
  // Match "at position 123" or "line 4 column 2"
  const posMatch = message.match(/at position (\d+)/i);
  if (posMatch) {
    const position = parseInt(posMatch[1], 10);
    const linesBefore = source.slice(0, position).split('\n');
    return {
      line: linesBefore.length,
      column: linesBefore[linesBefore.length - 1].length + 1,
    };
  }

  const lineColMatch = message.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }

  return {};
}

/**
 * Parses, sanitizes, and strictly validates serialized template code.
 * Rejects invalid JSON, security risks, invalid structure, unsupported element types,
 * unknown properties, invalid responsive overrides, and broken hierarchies.
 */
export function parseTemplate(source: string): ParseResult {
  if (!source || typeof source !== 'string' || source.trim() === '') {
    return {
      success: false,
      errors: [
        {
          code: 'EMPTY_SOURCE',
          message: 'Template code is empty.',
          line: 1,
          column: 1,
        },
      ],
    };
  }

  // 1. Security check: prohibit executable JavaScript or malicious tokens
  const securityErrors = validateSecurityTokens(source);
  if (securityErrors.length > 0) {
    return {
      success: false,
      errors: securityErrors,
    };
  }

  // 2. Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(source);
  } catch (err: any) {
    const location = extractJsonErrorLocation(source, err);
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_JSON_SYNTAX',
          message: `JSON Syntax Error: ${err.message}`,
          line: location.line,
          column: location.column,
        },
      ],
    };
  }

  // 3. Semantic & Structural validation
  const validation = validateParsedTemplate(parsed);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  // 4. Construct clean normalized TemplateModel
  const normalizedElements: Record<string, ElementModel> = {};
  for (const [id, rawEl] of Object.entries(parsed.elements as Record<string, any>)) {
    normalizedElements[id] = {
      id: rawEl.id,
      name: rawEl.name,
      type: rawEl.type,
      parentId: rawEl.parentId,
      children: rawEl.children ? [...rawEl.children] : undefined,
      base: { ...rawEl.base },
      overrides: rawEl.overrides
        ? {
            desktop: rawEl.overrides.desktop ? { ...rawEl.overrides.desktop } : undefined,
            tablet: rawEl.overrides.tablet ? { ...rawEl.overrides.tablet } : undefined,
            mobile: rawEl.overrides.mobile ? { ...rawEl.overrides.mobile } : undefined,
          }
        : {},
      revision: typeof rawEl.revision === 'number' ? rawEl.revision : 1,
    };
  }

  const template: TemplateModel = {
    templateId: parsed.templateId,
    name: parsed.name,
    version: parsed.version,
    rootElementIds: [...parsed.rootElementIds],
    elements: normalizedElements,
  };

  return {
    success: true,
    template,
    errors: [],
    warnings: validation.warnings,
  };
}
