import { describe, it, expect } from 'vitest';
import { INITIAL_TEMPLATE } from '../data/initialTemplate';
import { applyEditCommand } from '../core/pipeline';
import { restoreElementRevision, restoreSingleProperty, restoreFullRevision } from '../core/recovery';
import { EditCommand, TemplateModel } from '../types/template';

describe('Phase 8: Revision History & Granular Recovery System', () => {
  it('tracks chronological revisions through the unified commit pipeline', () => {
    let template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const initialVersion = template.version;

    const cmd1: EditCommand = {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: template.version,
      changes: { 'hero-title': { text: 'First Revision Title' } },
    };

    const res1 = applyEditCommand(template, cmd1);
    expect(res1.success).toBe(true);
    template = res1.nextTemplate;

    expect(template.version).toBe(initialVersion + 1);
    expect(template.history.length).toBeGreaterThan(0);
    expect(template.history[0].newRevision).toBe(template.version);
    expect(template.history[0].changes?.['hero-title']?.after.text).toBe('First Revision Title');
  });

  it('performs granular element-level recovery without disturbing other elements', () => {
    let current = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;

    // 1. Edit Element A (hero-title)
    const resA = applyEditCommand(current, {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: current.version,
      changes: { 'hero-title': { text: 'Modified Hero Title' } },
    });
    current = resA.nextTemplate;
    const histEntryA = resA.historyEntry!.id;

    // 2. Edit Element B (feature-1-title)
    const resB = applyEditCommand(current, {
      source: 'canvas',
      targetIds: ['feature-1-title'],
      viewport: 'all',
      baseRevision: current.version,
      changes: { 'feature-1-title': { text: 'Modified Feature 1' } },
    });
    current = resB.nextTemplate;

    // 3. Restore ONLY Element A (hero-title)
    const restoreRes = restoreElementRevision(current, 'hero-title', 'all', histEntryA);
    expect(restoreRes.success).toBe(true);
    current = restoreRes.nextTemplate;

    // Hero title is restored to baseline, but feature-1-title retains modified state
    expect(current.elements['hero-title'].base.text).toBe('Build Safe Web Experiences with Scoped AI Precision');
    expect(current.elements['feature-1-title'].base.text).toBe('Modified Feature 1');
    expect(current.history[0].source).toBe('restore');
  });

  it('performs single-property historical recovery accurately', () => {
    let current = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;

    // Edit two properties on hero-title
    const res1 = applyEditCommand(current, {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: current.version,
      changes: { 'hero-title': { text: 'New Text Title', fontSize: 60 } },
    });
    current = res1.nextTemplate;
    const histId = res1.historyEntry!.id;

    // Restore ONLY fontSize property back to baseline
    const restoreRes = restoreSingleProperty(current, 'hero-title', 'fontSize', 'all', histId);
    expect(restoreRes.success).toBe(true);
    current = restoreRes.nextTemplate;

    expect(current.elements['hero-title'].base.fontSize).toBe(48); // Baseline was 48
    expect(current.elements['hero-title'].base.text).toBe('New Text Title'); // Text retained
  });

  it('restores full template revision via a new validated EditCommand', () => {
    let current = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;

    const res1 = applyEditCommand(current, {
      source: 'canvas',
      targetIds: ['hero-title'],
      viewport: 'all',
      baseRevision: current.version,
      changes: { 'hero-title': { text: 'Changed Heading' } },
    });
    current = res1.nextTemplate;
    const firstHistId = res1.historyEntry!.id;

    const res2 = applyEditCommand(current, {
      source: 'canvas',
      targetIds: ['features-title'],
      viewport: 'all',
      baseRevision: current.version,
      changes: { 'features-title': { text: 'Changed Features' } },
    });
    current = res2.nextTemplate;

    // Restore to revision of first change
    const fullRestoreRes = restoreFullRevision(current, firstHistId);
    expect(fullRestoreRes.success).toBe(true);
    current = fullRestoreRes.nextTemplate;

    expect(current.elements['hero-title'].base.text).toBe('Build Safe Web Experiences with Scoped AI Precision');
    expect(current.version).toBeGreaterThan(res2.nextTemplate.version); // Monotonic increase
  });

  it('safely leaves state untouched when recovery encounters invalid element or stale data', () => {
    const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
    const initialVersion = template.version;

    const invalidRestore = restoreElementRevision(template, 'non-existent-element', 'all', 'fake-hist-id');
    expect(invalidRestore.success).toBe(false);
    expect(invalidRestore.nextTemplate.version).toBe(initialVersion);
  });
});
