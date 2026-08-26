import { ElementModel, TemplateModel } from './types';

/**
 * Pure Selector Functions for the Canonical Template Model
 */

/**
 * Retrieves a single element by its stable ID.
 */
export function getElementById(
  template: TemplateModel,
  id: string
): ElementModel | undefined {
  if (!template || !template.elements) return undefined;
  return template.elements[id];
}

/**
 * Retrieves an array of all currently selected ElementModels.
 */
export function getSelectedElements(
  template: TemplateModel,
  selectedIds: string[]
): ElementModel[] {
  if (!template || !template.elements || !selectedIds) return [];
  return selectedIds
    .map((id) => template.elements[id])
    .filter((el): el is ElementModel => el !== undefined);
}

/**
 * Retrieves all top-level root elements in their canonical order.
 */
export function getRootElements(template: TemplateModel): ElementModel[] {
  if (!template || !template.rootElementIds || !template.elements) return [];
  return template.rootElementIds
    .map((id) => template.elements[id])
    .filter((el): el is ElementModel => el !== undefined);
}

/**
 * Retrieves the direct child elements of a given parent element in order.
 */
export function getChildren(
  template: TemplateModel,
  parentId: string
): ElementModel[] {
  const parent = getElementById(template, parentId);
  if (!parent || !parent.children || !template.elements) return [];
  return parent.children
    .map((childId) => template.elements[childId])
    .filter((el): el is ElementModel => el !== undefined);
}

/**
 * Retrieves the immediate parent of a given element.
 */
export function getParentElement(
  template: TemplateModel,
  elementId: string
): ElementModel | undefined {
  const element = getElementById(template, elementId);
  if (!element || !element.parentId) return undefined;
  return getElementById(template, element.parentId);
}

/**
 * Retrieves the ancestor chain for an element from root down to immediate parent.
 */
export function getAncestors(
  template: TemplateModel,
  elementId: string
): ElementModel[] {
  const ancestors: ElementModel[] = [];
  let current = getParentElement(template, elementId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ancestors.unshift(current);
    current = getParentElement(template, current.id);
  }

  return ancestors;
}

/**
 * Returns all element IDs present in the template model.
 */
export function getAllElementIds(template: TemplateModel): string[] {
  if (!template || !template.elements) return [];
  return Object.keys(template.elements);
}

/**
 * Checks if an element has any child nodes.
 */
export function hasChildren(template: TemplateModel, elementId: string): boolean {
  const element = getElementById(template, elementId);
  return Boolean(element && element.children && element.children.length > 0);
}
