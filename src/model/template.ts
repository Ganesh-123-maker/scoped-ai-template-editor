import { TemplateModel } from './types';
import { cloneElement } from './element';

/**
 * Serializes a canonical TemplateModel to a clean, formatted JSON string.
 */
export function serializeTemplate(template: TemplateModel): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Deserializes a JSON string into a validated TemplateModel.
 */
export function deserializeTemplate(jsonString: string): TemplateModel {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Deserialization error: Root JSON payload must be an object.');
  }
  return parsed as TemplateModel;
}

/**
 * Creates a complete deep clone of a TemplateModel.
 */
export function cloneTemplate(template: TemplateModel): TemplateModel {
  const clonedElements: Record<string, typeof template.elements[string]> = {};
  for (const [id, element] of Object.entries(template.elements)) {
    clonedElements[id] = cloneElement(element);
  }

  return {
    templateId: template.templateId,
    name: template.name,
    version: template.version,
    elements: clonedElements,
    rootElementIds: [...template.rootElementIds],
    history: template.history ? template.history.map((h) => ({ ...h })) : undefined,
  };
}
