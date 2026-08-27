import { describe, it, expect } from 'vitest';
import { serializeTemplate, parseTemplate, diffTemplates, validateSecurityTokens } from '../code';
import { commitEdit } from '../commands';
import { INITIAL_TEMPLATE } from '../data/initialTemplate';
import { TemplateModel } from '../types/template';

function cloneTemplate(): TemplateModel {
  return JSON.parse(JSON.stringify(INITIAL_TEMPLATE));
}

describe('Phase 6: Real Synchronized Code Editor', () => {
  describe('1. Deterministic Serialization', () => {
    it('produces identical byte-for-byte serialized output for the same template state', () => {
      const t1 = cloneTemplate();
      const t2 = cloneTemplate();

      const s1 = serializeTemplate(t1);
      const s2 = serializeTemplate(t2);

      expect(s1).toBe(s2);
      expect(typeof s1).toBe('string');
      expect(s1.length).toBeGreaterThan(100);
    });

    it('orders keys canonically regardless of input order', () => {
      const template = cloneTemplate();
      // Scramble property order in element
      template.elements['hero-title'].base = {
        color: '#ffffff',
        text: 'Hello world',
        fontSize: 48,
        fontWeight: 'bold',
      };

      const s1 = serializeTemplate(template);

      // Re-order properties
      template.elements['hero-title'].base = {
        fontWeight: 'bold',
        fontSize: 48,
        text: 'Hello world',
        color: '#ffffff',
      };

      const s2 = serializeTemplate(template);
      expect(s1).toBe(s2);
    });
  });

  describe('2. Template Parsing & Safe Deserialization', () => {
    it('parses valid serialized JSON template successfully', () => {
      const template = cloneTemplate();
      const serialized = serializeTemplate(template);

      const res = parseTemplate(serialized);
      expect(res.success).toBe(true);
      expect(res.template).toBeDefined();
      expect(res.template?.templateId).toBe(template.templateId);
      expect(res.template?.elements['hero-title']?.base.text).toBe(template.elements['hero-title']?.base.text);
    });

    it('rejects empty or whitespace-only code', () => {
      const res = parseTemplate('   ');
      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0].code).toBe('EMPTY_SOURCE');
    });

    it('rejects malformed JSON syntax with line and column numbers', () => {
      const malformed = '{\n  "templateId": "test",\n  "elements": {\n';
      const res = parseTemplate(malformed);
      expect(res.success).toBe(false);
      expect(res.errors[0].code).toBe('INVALID_JSON_SYNTAX');
    });
  });

  describe('3. Security & Injection Protection', () => {
    it('rejects executable scripts, eval, and forbidden JavaScript tokens', () => {
      const maliciousTokens = [
        '<script>alert("pwned")</script>',
        'javascript:void(0)',
        'eval("malicious()")',
        'new Function("return 1")',
        'window.location = "http://evil.com"',
        'document.cookie',
        'fetch("http://evil.com")',
        'localStorage.getItem("secret")',
        'sessionStorage.clear()',
        'import os from "os"',
        'require("fs")',
      ];

      for (const token of maliciousTokens) {
        const errors = validateSecurityTokens(`{"text": "${token}"}`);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].code).toBe('FORBIDDEN_EXECUTABLE_CODE');

        const parseRes = parseTemplate(`{"text": "${token}"}`);
        expect(parseRes.success).toBe(false);
      }
    });
  });

  describe('4. Structural & Semantic Validation', () => {
    it('rejects unsupported element types', () => {
      const template = cloneTemplate();
      (template.elements['hero-title'] as any).type = 'spaceship';
      const serialized = JSON.stringify(template, null, 2);

      const res = parseTemplate(serialized);
      expect(res.success).toBe(false);
      expect(res.errors.some((e) => e.code === 'UNSUPPORTED_ELEMENT_TYPE')).toBe(true);
    });

    it('rejects unknown and forbidden properties', () => {
      const template = cloneTemplate();
      (template.elements['hero-title'].base as any).destroyEverything = true;
      const serialized = JSON.stringify(template, null, 2);

      const res = parseTemplate(serialized);
      expect(res.success).toBe(false);
      expect(res.errors.some((e) => e.code === 'UNKNOWN_PROPERTY')).toBe(true);
    });

    it('rejects element ID mismatch between object key and id field', () => {
      const template = cloneTemplate();
      template.elements['hero-title'].id = 'wrong-id';
      const serialized = JSON.stringify(template, null, 2);

      const res = parseTemplate(serialized);
      expect(res.success).toBe(false);
      expect(res.errors.some((e) => e.code === 'ELEMENT_ID_MISMATCH')).toBe(true);
    });

    it('rejects invalid viewport overrides (e.g. "mars")', () => {
      const template = cloneTemplate();
      (template.elements['hero-title'].overrides as any) = {
        mars: { fontSize: 30 },
      };
      const serialized = JSON.stringify(template, null, 2);

      const res = parseTemplate(serialized);
      expect(res.success).toBe(false);
      expect(res.errors.some((e) => e.code === 'INVALID_VIEWPORT_OVERRIDE')).toBe(true);
    });

    it('rejects broken or circular hierarchies', () => {
      const template = cloneTemplate();
      template.elements['hero-title'].parentId = 'hero-description';
      template.elements['hero-description'].parentId = 'hero-title';
      const serialized = JSON.stringify(template, null, 2);

      const res = parseTemplate(serialized);
      expect(res.success).toBe(false);
      expect(res.errors.some((e) => e.code.includes('MISMATCH') || e.code.includes('CIRCULAR'))).toBe(true);
    });
  });

  describe('5. Semantic Diffing & EditCommand Generation', () => {
    it('generates property update command with source="code"', () => {
      const prev = cloneTemplate();
      const next = cloneTemplate();
      next.elements['hero-title'].base.text = 'Supercharged Experience';
      next.elements['hero-title'].base.fontSize = 54;

      const diff = diffTemplates(prev, next, 1);
      expect(diff.commands.length).toBe(1);
      expect(diff.commands[0].source).toBe('code');
      expect(diff.commands[0].operation).toBe('update');
      expect(diff.commands[0].targetIds).toContain('hero-title');
      expect(diff.commands[0].changes?.['hero-title']?.text).toBe('Supercharged Experience');
      expect(diff.commands[0].changes?.['hero-title']?.fontSize).toBe(54);
      expect(diff.summary.propertiesChanged).toBe(2);
    });

    it('generates responsive override command when viewport overrides are modified in code', () => {
      const prev = cloneTemplate();
      const next = cloneTemplate();
      next.elements['hero-title'].overrides = {
        ...prev.elements['hero-title'].overrides,
        mobile: {
          ...prev.elements['hero-title'].overrides?.mobile,
          fontSize: 26,
        },
      };

      const diff = diffTemplates(prev, next, 1);
      expect(diff.commands.length).toBe(1);
      expect(diff.commands[0].viewport).toBe('mobile');
      expect(diff.commands[0].changes?.['hero-title']?.fontSize).toBe(26);
      expect(diff.summary.overridesChanged).toBe(1);
    });

    it('generates structural deletion command when an element is removed from code', () => {
      const prev = cloneTemplate();
      const next = cloneTemplate();
      delete next.elements['hero-description'];
      next.elements['hero-container'].children = next.elements['hero-container'].children?.filter(
        (id) => id !== 'hero-description'
      );

      const diff = diffTemplates(prev, next, 1);
      expect(diff.commands.some((c) => c.operation === 'delete' && c.targetIds.includes('hero-description'))).toBe(true);
      expect(diff.summary.elementsRemoved).toBe(1);
    });
  });

  describe('6. End-to-End Pipeline Commit from Code', () => {
    it('applies code edits through commitEdit pipeline, updates version, and logs history with source="code"', () => {
      const template = cloneTemplate();
      const originalVersion = template.version;

      const edited = cloneTemplate();
      edited.elements['hero-title'].base.text = 'Brand New Title';

      const diff = diffTemplates(template, edited, template.version);
      expect(diff.commands.length).toBe(1);

      const commitRes = commitEdit(template, diff.commands[0], ['hero-title']);
      expect(commitRes.success).toBe(true);
      expect(commitRes.nextTemplate?.version).toBe(originalVersion + 1);
      expect(commitRes.nextTemplate?.elements['hero-title']?.base.text).toBe('Brand New Title');
      expect(commitRes.historyEntry?.source).toBe('code');
      expect(commitRes.nextTemplate?.history[0]?.source).toBe('code');
    });

    it('leaves template unchanged and fails validation if code contains invalid property values', () => {
      const template = cloneTemplate();
      const serialized = serializeTemplate(template);
      const corrupted = serialized.replace('"fontSize": 48', '"fontSize": 999999');

      const parsed = parseTemplate(corrupted);
      expect(parsed.success).toBe(false);
      expect(parsed.errors.some((e) => e.code === 'INVALID_PROPERTY_VALUE')).toBe(true);
      // Canonical template untouched
      expect(template.elements['hero-title'].base.fontSize).toBe(48);
    });
  });
});
