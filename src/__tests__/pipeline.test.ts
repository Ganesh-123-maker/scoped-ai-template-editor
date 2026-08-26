import { describe, it, expect } from 'vitest';
import { commitEdit, validateCommand, applyEdit, EditCommand } from '../commands';
import { INITIAL_TEMPLATE } from '../data/initialTemplate';
import { TemplateModel } from '../types/template';

function cloneTemplate(): TemplateModel {
  return JSON.parse(JSON.stringify(INITIAL_TEMPLATE));
}

describe('Phase 5: Unified Edit Command, Validation & Commit Pipeline', () => {
  describe('1. Command Structure & Serialization', () => {
    it('serializes and deserializes cleanly without losing data', () => {
      const command: EditCommand = {
        id: 'cmd-test-1',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'desktop',
        baseRevision: 1,
        changes: {
          'hero-title': { fontSize: 48, color: '#112233' },
        },
        description: 'Test update font size and color',
      };

      const jsonStr = JSON.stringify(command);
      const parsed = JSON.parse(jsonStr) as EditCommand;

      expect(parsed.id).toBe('cmd-test-1');
      expect(parsed.source).toBe('canvas');
      expect(parsed.targetIds).toEqual(['hero-title']);
      expect(parsed.viewport).toBe('desktop');
      expect(parsed.baseRevision).toBe(1);
      expect(parsed.changes?.['hero-title']?.fontSize).toBe(48);
    });
  });

  describe('2. Multi-Pass Validation Engine', () => {
    it('rejects command with empty targetIds', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-empty',
        source: 'canvas',
        targetIds: [],
        viewport: 'all',
        baseRevision: template.version,
        changes: {},
      };

      const result = validateCommand(command, template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'EMPTY_TARGET')).toBe(true);
    });

    it('rejects command with duplicate targetIds', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-dup',
        source: 'canvas',
        targetIds: ['hero-title', 'hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: { 'hero-title': { text: 'Hello' } },
      };

      const result = validateCommand(command, template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_TARGET')).toBe(true);
    });

    it('rejects command targeting non-existent elements', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-unknown',
        source: 'canvas',
        targetIds: ['ghost-element-999'],
        viewport: 'all',
        baseRevision: template.version,
        changes: { 'ghost-element-999': { text: 'Hello' } },
      };

      const result = validateCommand(command, template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNKNOWN_ELEMENT')).toBe(true);
    });

    it('rejects command with invalid viewport scope', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-scope',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'ultrawide' as any,
        baseRevision: template.version,
        changes: { 'hero-title': { fontSize: 32 } },
      };

      const result = validateCommand(command, template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_SCOPE')).toBe(true);
    });

    it('rejects command with stale baseRevision', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-stale',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version - 1,
        changes: { 'hero-title': { fontSize: 32 } },
      };

      const result = validateCommand(command, template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'STALE_REVISION')).toBe(true);
    });

    it('rejects forbidden property not in whitelist', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-forbidden',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { ['injectedScript' as any]: 'alert(1)' },
        },
      };

      const result = validateCommand(command, template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'FORBIDDEN_PROPERTY')).toBe(true);
    });

    it('rejects invalid property for element type', () => {
      const template = cloneTemplate();
      // 'src' is allowed for image, but not for heading
      const command: EditCommand = {
        id: 'cmd-type-mismatch',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { src: 'https://example.com/pic.png' } as any,
        },
      };

      const result = validateCommand(command, template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_PROPERTY')).toBe(true);
    });

    it('rejects invalid property values (negative padding, invalid opacity, invalid fontSize)', () => {
      const template = cloneTemplate();

      // Negative padding
      const cmdPadding: EditCommand = {
        id: 'cmd-neg-padding',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: { 'hero-title': { paddingTop: -20 } },
      };
      expect(validateCommand(cmdPadding, template).valid).toBe(false);

      // Opacity out of bounds
      const cmdOpacity: EditCommand = {
        id: 'cmd-bad-opacity',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: { 'hero-title': { opacity: 1.5 } },
      };
      expect(validateCommand(cmdOpacity, template).valid).toBe(false);

      // Non-positive fontSize
      const cmdFontSize: EditCommand = {
        id: 'cmd-bad-font',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: { 'hero-title': { fontSize: 0 } },
      };
      expect(validateCommand(cmdFontSize, template).valid).toBe(false);
    });

    it('enforces AI Selection Authority', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-ai-authority',
        source: 'ai',
        targetIds: ['hero-title', 'footer'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { text: 'New Title' },
          footer: { backgroundColor: '#111' },
        },
      };

      // Only 'hero-title' is selected
      const result = validateCommand(command, template, ['hero-title']);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'SELECTION_AUTHORITY_VIOLATION')).toBe(true);
    });
  });

  describe('3. Multi-Element Atomicity (All-or-Nothing)', () => {
    it('rejects entire command if 1 out of 3 elements fails validation, leaving state completely untouched', () => {
      const template = cloneTemplate();
      const initialVersion = template.version;
      const initialHeroText = template.elements['hero-title'].base.text;
      const initialCtaText = template.elements['hero-primary-cta'].base.text;

      const multiCommand: EditCommand = {
        id: 'cmd-atomic-fail',
        source: 'canvas',
        targetIds: ['hero-title', 'hero-primary-cta', 'non-existent-id'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { text: 'Modified Title' },
          'hero-primary-cta': { text: 'Modified CTA' },
          'non-existent-id': { text: 'Invalid' },
        },
      };

      const result = commitEdit(template, multiCommand);
      expect(result.success).toBe(false);
      expect(result.errors && result.errors.length > 0).toBe(true);

      // Verify template is 100% untouched
      expect(template.version).toBe(initialVersion);
      expect(template.elements['hero-title'].base.text).toBe(initialHeroText);
      expect(template.elements['hero-primary-cta'].base.text).toBe(initialCtaText);
    });

    it('applies all element changes when all elements are valid', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-multi-success',
        source: 'canvas',
        targetIds: ['hero-title', 'hero-primary-cta'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { color: '#00ff00' },
          'hero-primary-cta': { color: '#00ff00' },
        },
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      expect(result.nextTemplate).toBeDefined();
      expect(result.nextTemplate!.version).toBe(template.version + 1);
      expect(result.nextTemplate!.elements['hero-title'].base.color).toBe('#00ff00');
      expect(result.nextTemplate!.elements['hero-primary-cta'].base.color).toBe('#00ff00');
      expect(result.changedElementIds).toEqual(['hero-title', 'hero-primary-cta']);
    });
  });

  describe('4. Viewport Scope Resolution in Pipeline', () => {
    it('modifies base properties when viewport is "all" without wiping overrides', () => {
      const template = cloneTemplate();
      // Set an existing mobile override
      template.elements['hero-title'].overrides.mobile = { fontSize: 24 };

      const command: EditCommand = {
        id: 'cmd-base-all',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { fontSize: 60 },
        },
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      expect(result.nextTemplate!.elements['hero-title'].base.fontSize).toBe(60);
      // Mobile override is preserved
      expect(result.nextTemplate!.elements['hero-title'].overrides.mobile?.fontSize).toBe(24);
    });

    it('modifies specific viewport override without affecting base or other viewports', () => {
      const template = cloneTemplate();
      const baseFontSize = template.elements['hero-title'].base.fontSize;
      const initialTabletOverride = template.elements['hero-title'].overrides.tablet;

      const command: EditCommand = {
        id: 'cmd-mobile-override',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'mobile',
        baseRevision: template.version,
        changes: {
          'hero-title': { fontSize: 26 },
        },
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      expect(result.nextTemplate!.elements['hero-title'].base.fontSize).toBe(baseFontSize);
      expect(result.nextTemplate!.elements['hero-title'].overrides.mobile?.fontSize).toBe(26);
      expect(result.nextTemplate!.elements['hero-title'].overrides.tablet).toEqual(initialTabletOverride);
    });

    it('removes override property when undefined is passed', () => {
      const template = cloneTemplate();
      template.elements['hero-title'].overrides.mobile = { fontSize: 26, color: '#fff' };

      const command: EditCommand = {
        id: 'cmd-reset-prop',
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'mobile',
        baseRevision: template.version,
        changes: {
          'hero-title': { fontSize: undefined },
        },
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      expect(result.nextTemplate!.elements['hero-title'].overrides.mobile?.fontSize).toBeUndefined();
      expect(result.nextTemplate!.elements['hero-title'].overrides.mobile?.color).toBe('#fff');
    });
  });

  describe('5. Structural Commands Pipeline', () => {
    it('executes duplicate command cleanly through pipeline', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-dup-1',
        source: 'canvas',
        operation: 'duplicate',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      const newId = result.changedElementIds![0];
      expect(newId).toContain('hero-title');
      expect(result.nextTemplate!.elements[newId]).toBeDefined();
      expect(result.nextTemplate!.elements[newId].name).toBe('Hero Title (Copy)');

      // Verify parent contains new element
      const parentId = template.elements['hero-title'].parentId!;
      expect(result.nextTemplate!.elements[parentId].children).toContain(newId);
    });

    it('executes delete command cleanly through pipeline', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-del-1',
        source: 'canvas',
        operation: 'delete',
        targetIds: ['hero-eyebrow'],
        viewport: 'all',
        baseRevision: template.version,
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      expect(result.nextTemplate!.elements['hero-eyebrow']).toBeUndefined();

      const parentId = template.elements['hero-eyebrow'].parentId!;
      expect(result.nextTemplate!.elements[parentId].children).not.toContain('hero-eyebrow');
    });

    it('rejects root section deletion', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-del-root',
        source: 'canvas',
        operation: 'delete',
        targetIds: ['hero'],
        viewport: 'all',
        baseRevision: template.version,
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(false);
      expect(result.errors?.some((e) => e.code === 'ROOT_DELETION_FORBIDDEN')).toBe(true);
    });

    it('executes reorder command cleanly through pipeline', () => {
      const template = cloneTemplate();
      const parent = template.elements['hero-cta-group'];
      const initialChildren = [...(parent.children || [])];

      const command: EditCommand = {
        id: 'cmd-reorder-1',
        source: 'canvas',
        operation: 'reorder',
        reorderDirection: 'down',
        targetIds: [initialChildren[0]],
        viewport: 'all',
        baseRevision: template.version,
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      const nextChildren = result.nextTemplate!.elements['hero-cta-group'].children!;
      expect(nextChildren[0]).toBe(initialChildren[1]);
      expect(nextChildren[1]).toBe(initialChildren[0]);
    });
  });

  describe('6. History & Change Summary Trail', () => {
    it('creates granular history entry and diffs with proper source tagging', () => {
      const template = cloneTemplate();
      const command: EditCommand = {
        id: 'cmd-history-test',
        source: 'code',
        targetIds: ['hero-title'],
        viewport: 'desktop',
        baseRevision: template.version,
        changes: {
          'hero-title': { text: 'New Hero Text' },
        },
      };

      const result = commitEdit(template, command);
      expect(result.success).toBe(true);
      expect(result.historyEntry).toBeDefined();
      expect(result.historyEntry!.source).toBe('code');
      expect(result.historyEntry!.baseRevision).toBe(template.version);
      expect(result.historyEntry!.newRevision).toBe(template.version + 1);
      expect(result.historyEntry!.changes['hero-title']).toBeDefined();

      expect(result.changeSummary).toBeDefined();
      expect(result.changeSummary!.diffs.length).toBe(1);
      expect(result.changeSummary!.diffs[0].to).toBe('New Hero Text');
    });
  });
});
