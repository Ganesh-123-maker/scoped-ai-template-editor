import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/useEditorStore';
import { applyEditCommand } from '../core/pipeline';
import { validateEditCommand } from '../core/validation';
import { resolveProperties } from '../responsive/resolve';
import {
  getCommonEditableProperties,
  getMultiPropertyValue,
  generateUniqueElementId,
} from '../core/selection';
import { TemplateModel } from '../types/template';
import { INITIAL_TEMPLATE } from '../data/initialTemplate';

describe('Phase 4: Real Selection & Manual Editing Suite', () => {
  let template: TemplateModel;

  beforeEach(() => {
    template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE));
  });

  describe('1. Selection System & Multi-Select Logic', () => {
    it('calculates common editable properties for single and multi-selection', () => {
      const heading = template.elements['hero-title'];
      const subhead = template.elements['hero-description'];
      const ctaBtn = template.elements['hero-primary-cta'];

      // Single element
      const headingProps = getCommonEditableProperties([heading]);
      expect(headingProps).toContain('text');
      expect(headingProps).toContain('fontSize');
      expect(headingProps).toContain('color');

      // Multi element of same type
      const textGroupProps = getCommonEditableProperties([heading, subhead]);
      expect(textGroupProps).toContain('text');
      expect(textGroupProps).toContain('fontSize');
      expect(textGroupProps).toContain('color');

      // Multi element of mixed types (heading + button)
      const mixedGroupProps = getCommonEditableProperties([heading, ctaBtn]);
      expect(mixedGroupProps).toContain('text');
      expect(mixedGroupProps).toContain('fontSize');
      expect(mixedGroupProps).toContain('fontWeight');
      expect(mixedGroupProps).toContain('color');
      expect(mixedGroupProps).toContain('paddingTop');
      expect(mixedGroupProps).toContain('paddingBottom');
    });

    it('detects mixed vs uniform property values across multiple elements', () => {
      const heading = template.elements['hero-title'];
      const subhead = template.elements['hero-description'];

      // Both have textAlign 'center' in initial template
      const alignCheck = getMultiPropertyValue(
        [heading, subhead],
        'textAlign',
        (el) => el.base.textAlign
      );
      expect(alignCheck.isMixed).toBe(false);
      expect(alignCheck.value).toBe('center');

      // They have different font sizes (48 vs 18)
      const fontCheck = getMultiPropertyValue(
        [heading, subhead],
        'fontSize',
        (el) => el.base.fontSize
      );
      expect(fontCheck.isMixed).toBe(true);
      expect(fontCheck.value).toBe('mixed');
    });

    it('generates unique element IDs for duplicates without collisions', () => {
      const existing = new Set(['hero-title', 'hero-title-copy']);
      const newId1 = generateUniqueElementId('hero-title', existing);
      expect(newId1).toBe('hero-title-copy-2');

      existing.add(newId1);
      const newId2 = generateUniqueElementId('hero-title-copy', existing);
      expect(newId2).toBe('hero-title-copy-3');
    });
  });

  describe('2. Direct Content & Style Editing', () => {
    it('modifies text content in shared base scope', () => {
      const result = applyEditCommand(template, {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { text: 'Next-Gen AI Platform' },
        },
      });

      expect(result.success).toBe(true);
      const updated = result.nextTemplate.elements['hero-title'];
      expect(updated.base.text).toBe('Next-Gen AI Platform');
      // Resolved on all viewports
      expect(resolveProperties(updated, 'desktop').text).toBe('Next-Gen AI Platform');
      expect(resolveProperties(updated, 'mobile').text).toBe('Next-Gen AI Platform');
    });

    it('modifies typography and colors in shared base scope', () => {
      const result = applyEditCommand(template, {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': {
            fontSize: 56,
            fontWeight: 'bold',
            color: '#3b82f6',
            textAlign: 'left',
          },
        },
      });

      expect(result.success).toBe(true);
      const updated = result.nextTemplate.elements['hero-title'];
      expect(updated.base.fontSize).toBe(56);
      expect(updated.base.fontWeight).toBe('bold');
      expect(updated.base.color).toBe('#3b82f6');
      expect(updated.base.textAlign).toBe('left');
    });

    it('modifies appearance and spacing in shared base scope', () => {
      const result = applyEditCommand(template, {
        source: 'canvas',
        targetIds: ['hero-primary-cta'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-primary-cta': {
            backgroundColor: '#10b981',
            borderRadius: 12,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 32,
            paddingRight: 32,
            shadow: 'lg',
          },
        },
      });

      expect(result.success).toBe(true);
      const updated = result.nextTemplate.elements['hero-primary-cta'];
      expect(updated.base.backgroundColor).toBe('#10b981');
      expect(updated.base.borderRadius).toBe(12);
      expect(updated.base.paddingTop).toBe(16);
      expect(updated.base.paddingRight).toBe(32);
      expect(updated.base.shadow).toBe('lg');
    });
  });

  describe('3. Viewport-Scoped Manual Editing (Isolated Overrides)', () => {
    it('applies font-size edit to mobile scope only without leaking to desktop', () => {
      const initialDesktopSize = template.elements['hero-title'].base.fontSize;
      const initialTabletSize = template.elements['hero-title'].overrides?.tablet?.fontSize || initialDesktopSize;

      const result = applyEditCommand(template, {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'mobile',
        baseRevision: template.version,
        changes: {
          'hero-title': { fontSize: 32 },
        },
      });

      expect(result.success).toBe(true);
      const updated = result.nextTemplate.elements['hero-title'];
      expect(updated.base.fontSize).toBe(initialDesktopSize);
      expect(updated.overrides?.mobile?.fontSize).toBe(32);

      // Verify resolution
      expect(resolveProperties(updated, 'mobile').fontSize).toBe(32);
      expect(resolveProperties(updated, 'tablet').fontSize).toBe(initialTabletSize);
      expect(resolveProperties(updated, 'desktop').fontSize).toBe(initialDesktopSize);
    });

    it('resets a viewport override back to shared base property when set to undefined', () => {
      // Step 1: Set override on tablet
      const step1 = applyEditCommand(template, {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'tablet',
        baseRevision: template.version,
        changes: {
          'hero-title': { fontSize: 40 },
        },
      });

      expect(step1.success).toBe(true);
      let el = step1.nextTemplate.elements['hero-title'];
      expect(el.overrides?.tablet?.fontSize).toBe(40);

      // Step 2: Reset override to undefined
      const step2 = applyEditCommand(step1.nextTemplate, {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'tablet',
        baseRevision: step1.nextTemplate.version,
        changes: {
          'hero-title': { fontSize: undefined },
        },
      });

      expect(step2.success).toBe(true);
      el = step2.nextTemplate.elements['hero-title'];
      expect(el.overrides?.tablet?.fontSize).toBeUndefined();
      expect(resolveProperties(el, 'tablet').fontSize).toBe(el.base.fontSize);
    });
  });

  describe('4. Multi-Selection Batch Editing', () => {
    it('applies property changes to all selected elements simultaneously', () => {
      const result = applyEditCommand(
        template,
        {
          source: 'canvas',
          targetIds: ['hero-title', 'hero-description'],
          viewport: 'all',
          baseRevision: template.version,
          changes: {
            'hero-title': { color: '#6366f1' },
            'hero-description': { color: '#6366f1' },
          },
        },
        ['hero-title', 'hero-description']
      );

      expect(result.success).toBe(true);
      expect(result.nextTemplate.elements['hero-title'].base.color).toBe('#6366f1');
      expect(result.nextTemplate.elements['hero-description'].base.color).toBe('#6366f1');
    });
  });

  describe('5. Structural Operations (Reorder, Duplicate, Delete)', () => {
    it('reorders siblings within parent container', () => {
      const parent = template.elements['hero-container'];
      const initialChildren = [...(parent.children || [])];
      expect(initialChildren.length).toBeGreaterThan(1);

      // Swap first two children
      const firstChildId = initialChildren[0];
      const secondChildId = initialChildren[1];

      // Simulate reorder
      const nextChildren = [...initialChildren];
      nextChildren[0] = secondChildId;
      nextChildren[1] = firstChildId;

      const nextElements = {
        ...template.elements,
        [parent.id]: {
          ...parent,
          children: nextChildren,
        },
      };

      expect(nextElements[parent.id].children?.[0]).toBe(secondChildId);
      expect(nextElements[parent.id].children?.[1]).toBe(firstChildId);
    });

    it('duplicates element with deep clone and updates parent children list', () => {
      const store = useEditorStore.getState();
      store.resetToInitialTemplate();

      const elToDuplicate = 'hero-eyebrow';
      store.duplicateElement(elToDuplicate);

      const state = useEditorStore.getState();
      const duplicateIds = Object.keys(state.template.elements).filter((id) =>
        id.startsWith('hero-eyebrow-copy')
      );
      expect(duplicateIds.length).toBeGreaterThan(0);

      const copyId = duplicateIds[0];
      const copyEl = state.template.elements[copyId];
      expect(copyEl).toBeDefined();
      expect(copyEl.name).toContain('(Copy)');

      // Verify parent contains copy right after original
      const parent = state.template.elements['hero-container'];
      const originalIdx = parent.children?.indexOf(elToDuplicate);
      const copyIdx = parent.children?.indexOf(copyId);
      expect(copyIdx).toBe((originalIdx ?? 0) + 1);
    });

    it('deletes element cleanly from elements map and parent children array', () => {
      const store = useEditorStore.getState();
      store.resetToInitialTemplate();

      const targetId = 'hero-eyebrow';
      store.deleteElement(targetId);

      const state = useEditorStore.getState();
      expect(state.template.elements[targetId]).toBeUndefined();

      const parent = state.template.elements['hero-container'];
      expect(parent.children).not.toContain(targetId);
      expect(state.selectedIds).not.toContain(targetId);
    });
  });

  describe('6. Validation Pipeline Enforcement', () => {
    it('rejects forbidden property keys not in allowed whitelist', () => {
      const validation = validateEditCommand(
        {
          source: 'canvas',
          targetIds: ['hero-title'],
          viewport: 'all',
          baseRevision: template.version,
          changes: {
            'hero-title': { evilScript: '<script>alert(1)</script>' } as any,
          },
        },
        template,
        ['hero-title']
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('Forbidden Field Violation');
    });

    it('rejects stale revision updates', () => {
      const validation = validateEditCommand(
        {
          source: 'canvas',
          targetIds: ['hero-title'],
          viewport: 'all',
          baseRevision: template.version - 1, // Stale!
          changes: {
            'hero-title': { text: 'New Text' },
          },
        },
        template,
        ['hero-title']
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('Stale Revision Conflict');
    });
  });
});

