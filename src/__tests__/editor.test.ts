import { describe, it, expect } from 'vitest';
import { INITIAL_TEMPLATE } from '../data/initialTemplate';
import { resolveElementProperties, resolveProperty, hasViewportOverride } from '../core/resolution';
import { validateEditCommand } from '../core/validation';
import { applyEditCommand } from '../core/pipeline';
import { restoreElementRevision } from '../core/recovery';
import { generateDeterministicAIProposal } from '../core/aiScenarioEngine';
import { EditCommand, TemplateModel } from '../types/template';
import {
  validateTemplateModel,
  serializeTemplate,
  deserializeTemplate,
  cloneTemplate,
  getElementById,
  getSelectedElements,
  getRootElements,
  getChildren,
  getParentElement,
  getAncestors,
  isPropertyAllowed,
  SUPPORTED_ELEMENT_TYPES,
} from '../model';

describe('Scoped AI Template Editor - Core Safety & Contract Tests', () => {
  it('1. AI Selection Authority: Rejects AI command targeting unselected elements', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const activeSelection = ['hero-title'];

    const unauthorizedCommand: EditCommand = {
      source: 'ai',
      targetIds: ['hero-title', 'footer'], // footer is unselected
      viewport: 'all',
      baseRevision: template.version,
      changes: {
        'hero-title': { text: 'Valid Title' },
        footer: { backgroundColor: '#000000' },
      },
    };

    const val = validateEditCommand(unauthorizedCommand, template, activeSelection);
    expect(val.valid).toBe(false);
    expect(val.errors.some((e) => e.includes('Selection Authority'))).toBe(true);
  });

  it('2. Field Whitelisting: Rejects forbidden or arbitrary properties', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const command: EditCommand = {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: template.version,
      changes: {
        'hero-title': {
          ['unsupportedField' as any]: 'malicious payload',
        },
      },
    };

    const val = validateEditCommand(command, template);
    expect(val.valid).toBe(false);
    expect(val.errors.some((e) => e.includes('Forbidden Field Violation'))).toBe(true);
  });

  it('3. Viewport Isolation: Mobile override leaves Desktop and Tablet unchanged', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const initialDesktop = resolveElementProperties(template.elements['hero-title'], 'desktop');
    const initialTablet = resolveElementProperties(template.elements['hero-title'], 'tablet');

    const command: EditCommand = {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'mobile',
      baseRevision: template.version,
      changes: {
        'hero-title': { fontSize: 20 },
      },
    };

    const result = applyEditCommand(template, command);
    expect(result.success).toBe(true);

    const desktopAfter = resolveElementProperties(result.nextTemplate.elements['hero-title'], 'desktop');
    const tabletAfter = resolveElementProperties(result.nextTemplate.elements['hero-title'], 'tablet');
    const mobileAfter = resolveElementProperties(result.nextTemplate.elements['hero-title'], 'mobile');

    expect(mobileAfter.fontSize).toBe(20);
    expect(desktopAfter.fontSize).toBe(initialDesktop.fontSize);
    expect(tabletAfter.fontSize).toBe(initialTablet.fontSize);
  });

  it('4. Canvas & Code Synchronization: Shared canonical state mutations', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const command: EditCommand = {
      source: 'code',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: template.version,
      changes: {
        'hero-title': { text: 'Updated from Code Surface' },
      },
    };

    const result = applyEditCommand(template, command);
    expect(result.success).toBe(true);
    expect(result.nextTemplate.elements['hero-title'].base.text).toBe('Updated from Code Surface');
    expect(result.nextTemplate.version).toBe(template.version + 1);
  });

  it('5. Invalid Code Handling: Preserves valid state on parse/validation failure', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const invalidCommand: EditCommand = {
      source: 'code',
      targetIds: ['non-existent-id-12345'],
      viewport: 'all',
      baseRevision: template.version,
      changes: {},
    };

    const result = applyEditCommand(template, invalidCommand);
    expect(result.success).toBe(false);
    expect(result.nextTemplate.version).toBe(template.version);
  });

  it('6. Independent Per-Element Recovery: Restoring A does not modify B', () => {
    let template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;

    // Step 1: Edit element A
    const resA = applyEditCommand(template, {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: template.version,
      changes: { 'hero-title': { text: 'Title Modified in Step 1' } },
    });
    template = resA.nextTemplate;
    const histEntryAId = resA.historyEntry!.id;

    // Step 2: Edit element B
    const resB = applyEditCommand(template, {
      source: 'canvas',
      targetIds: ['feature-1-title'],
      viewport: 'all',
      baseRevision: template.version,
      changes: { 'feature-1-title': { text: 'Feature 1 Modified in Step 2' } },
    });
    template = resB.nextTemplate;

    // Step 3: Restore Element A back to before Step 1
    const restoreRes = restoreElementRevision(template, 'hero-title', 'all', histEntryAId);
    expect(restoreRes.success).toBe(true);
    template = restoreRes.nextTemplate;

    // Element A must be restored
    expect(template.elements['hero-title'].base.text).toBe('Build Safe Web Experiences with Scoped AI Precision');
    // Element B must retain its Step 2 modification
    expect(template.elements['feature-1-title'].base.text).toBe('Feature 1 Modified in Step 2');
  });

  it('7. Partial Proposal Acceptance: User can accept A and leave B untouched', () => {
    let template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const initialFeature2Radius = template.elements['feature-2'].base.borderRadius;

    // Simulate user accepting only feature-1 item
    const acceptCmd: EditCommand = {
      source: 'ai',
      targetIds: ['feature-1'],
      viewport: 'all',
      baseRevision: template.version,
      changes: {
        'feature-1': { borderRadius: 32 },
      },
    };

    // In a multi-element selection (feature-1 and feature-2 selected), user accepts proposal on feature-1 only
    const activeSelection = ['feature-1', 'feature-2'];
    const result = applyEditCommand(template, acceptCmd, activeSelection);
    expect(result.success).toBe(true);
    expect(result.nextTemplate.elements['feature-1'].base.borderRadius).toBe(32);
    expect(result.nextTemplate.elements['feature-2'].base.borderRadius).toBe(initialFeature2Radius);
  });

  it('8. Stale Revision Conflict: Prevents applying stale edit commands', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const staleCommand: EditCommand = {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: template.version - 5,
      changes: { 'hero-title': { text: 'Stale' } },
    };

    const val = validateEditCommand(staleCommand, template);
    expect(val.valid).toBe(false);
    expect(val.errors.some((e) => e.includes('Stale Revision Conflict'))).toBe(true);
  });

  it('9. Deterministic AI Scenario: Guarantees reproducible proposals', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const prompt = 'Rewrite the selected heading to sound more professional and executive-ready.';

    const p1 = generateDeterministicAIProposal(prompt, ['hero-title'], template, 'all');
    const p2 = generateDeterministicAIProposal(prompt, ['hero-title'], template, 'all');

    expect(p1.items[0].after.text).toBe(p2.items[0].after.text);
    expect(p1.scenarioType).toBe(p2.scenarioType);
  });
});

describe('Phase 2 - Canonical Template Model & Data Layer Tests', () => {
  it('10. Canonical Initial Template Validation: Passes strict model validation', () => {
    const validation = validateTemplateModel(INITIAL_TEMPLATE);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('11. Relational Integrity: Detects broken child or parent references', () => {
    const invalidTemplate: TemplateModel = {
      templateId: 'broken-template',
      name: 'Broken',
      version: 1,
      rootElementIds: ['root-section'],
      elements: {
        'root-section': {
          id: 'root-section',
          name: 'Root',
          type: 'section',
          children: ['ghost-child-id'], // Ghost child that does not exist
          base: {},
          overrides: {},
          revision: 1,
        },
      },
    };

    const val = validateTemplateModel(invalidTemplate);
    expect(val.valid).toBe(false);
    expect(val.errors.some((e) => e.includes('non-existent childId'))).toBe(true);
  });

  it('12. JSON Serialization Roundtrip: Preserves data without distortion', () => {
    const jsonStr = serializeTemplate(INITIAL_TEMPLATE);
    expect(typeof jsonStr).toBe('string');

    const deserialized = deserializeTemplate(jsonStr);
    expect(deserialized.templateId).toBe(INITIAL_TEMPLATE.templateId);
    expect(deserialized.rootElementIds).toEqual(INITIAL_TEMPLATE.rootElementIds);
    expect(Object.keys(deserialized.elements)).toEqual(Object.keys(INITIAL_TEMPLATE.elements));

    const val = validateTemplateModel(deserialized);
    expect(val.valid).toBe(true);
  });

  it('13. Deep Cloning: Modifying cloned template leaves original untouched', () => {
    const clone = cloneTemplate(INITIAL_TEMPLATE);
    clone.elements['hero-title'].base.text = 'Mutated in Clone';

    expect(INITIAL_TEMPLATE.elements['hero-title'].base.text).toBe(
      'Build Safe Web Experiences with Scoped AI Precision'
    );
    expect(clone.elements['hero-title'].base.text).toBe('Mutated in Clone');
  });

  it('14. Pure Selectors: getElementById, getRootElements, getChildren, getAncestors', () => {
    const heroEl = getElementById(INITIAL_TEMPLATE, 'hero');
    expect(heroEl).toBeDefined();
    expect(heroEl?.type).toBe('section');

    const roots = getRootElements(INITIAL_TEMPLATE);
    expect(roots.length).toBe(INITIAL_TEMPLATE.rootElementIds.length);
    expect(roots[0].id).toBe('header');

    const headerChildren = getChildren(INITIAL_TEMPLATE, 'header');
    expect(headerChildren).toHaveLength(1);
    expect(headerChildren[0].id).toBe('header-container');

    const selected = getSelectedElements(INITIAL_TEMPLATE, ['hero-title', 'hero-eyebrow']);
    expect(selected).toHaveLength(2);
    expect(selected.map((s) => s.id)).toEqual(['hero-title', 'hero-eyebrow']);

    const parent = getParentElement(INITIAL_TEMPLATE, 'hero-title');
    expect(parent?.id).toBe('hero-container');

    const ancestors = getAncestors(INITIAL_TEMPLATE, 'hero-title');
    expect(ancestors.map((a) => a.id)).toEqual(['hero', 'hero-container']);
  });

  it('15. Property Boundary Enforcement: isPropertyAllowed respects element types', () => {
    expect(isPropertyAllowed('heading', 'fontSize')).toBe(true);
    expect(isPropertyAllowed('heading', 'text')).toBe(true);
    expect(isPropertyAllowed('button', 'backgroundColor')).toBe(true);
    expect(isPropertyAllowed('button', 'borderRadius')).toBe(true);
    expect(isPropertyAllowed('heading', 'gridColumns')).toBe(false);
  });

  it('16. Responsive Precedence: resolveProperty and hasViewportOverride', () => {
    const heroTitle = INITIAL_TEMPLATE.elements['hero-title'];

    // Mobile override has 28
    const mobileSize = resolveProperty(heroTitle, 'fontSize', 'mobile');
    expect(mobileSize).toBe(28);
    expect(hasViewportOverride(heroTitle, 'mobile', 'fontSize')).toBe(true);

    // Desktop falls back to base (48) since overrides.desktop is undefined
    const desktopSize = resolveProperty(heroTitle, 'fontSize', 'desktop');
    expect(desktopSize).toBe(48);
    expect(hasViewportOverride(heroTitle, 'desktop', 'fontSize')).toBe(false);
  });

  it('17. Supported Element Types: All 14 expected types are valid', () => {
    expect(SUPPORTED_ELEMENT_TYPES).toHaveLength(14);
    expect(SUPPORTED_ELEMENT_TYPES).toContain('heading');
    expect(SUPPORTED_ELEMENT_TYPES).toContain('section');
    expect(SUPPORTED_ELEMENT_TYPES).toContain('container');
    expect(SUPPORTED_ELEMENT_TYPES).toContain('button');
  });
});
