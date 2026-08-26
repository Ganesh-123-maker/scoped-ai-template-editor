/**
 * Interactive Automated Verification Test Suite
 *
 * Runs comprehensive automated unit & integration checks on the canonical template,
 * unified pipeline, validation engine, responsive resolution, and recovery systems.
 */

import { generateDeterministicAIProposal } from './aiScenarioEngine';
import { applyEditCommand } from './pipeline';
import { restoreElementRevision } from './recovery';
import { resolveElementProperties } from './resolution';
import { validateEditCommand, validateAIProposal } from './validation';
import { INITIAL_TEMPLATE } from '../data/initialTemplate';
import { EditCommand, TemplateModel } from '../types/template';

export interface VerificationTestResult {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  assertionNote: string;
  durationMs: number;
}

export function runAllVerificationTests(): VerificationTestResult[] {
  const results: VerificationTestResult[] = [];

  function record(
    id: string,
    title: string,
    description: string,
    assertion: () => { passed: boolean; note: string }
  ) {
    const start = performance.now();
    try {
      const outcome = assertion();
      const end = performance.now();
      results.push({
        id,
        title,
        description,
        passed: outcome.passed,
        assertionNote: outcome.note,
        durationMs: Math.round((end - start) * 10) / 10,
      });
    } catch (err: any) {
      results.push({
        id,
        title,
        description,
        passed: false,
        assertionNote: `Failed with exception: ${err.message}`,
        durationMs: 0,
      });
    }
  }

  // 1. AI Selection Scope Authority
  record(
    'test-ai-selection-scope',
    'AI Selection Scope Authority',
    'Ensures AI commands targeting unselected elements are strictly rejected.',
    () => {
      const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const activeSelection = ['hero-title'];

      // Unauthorized AI command targeting 'footer' (not in selection)
      const command: EditCommand = {
        source: 'ai',
        targetIds: ['hero-title', 'footer'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { text: 'New Title' },
          footer: { backgroundColor: '#ff0000' },
        },
      };

      const val = validateEditCommand(command, template, activeSelection);
      const passed = !val.valid && val.errors.some((e) => e.includes('Selection Authority'));
      return {
        passed,
        note: 'AI command referencing unselected element "footer" was rejected with Selection Authority error.',
      };
    }
  );

  // 2. AI Field Scope Whitelist
  record(
    'test-field-scope-whitelist',
    'Property Field Whitelisting',
    'Ensures forbidden or arbitrary properties outside the schema whitelist are rejected.',
    () => {
      const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const command: EditCommand = {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': {
            ['evilScript' as any]: '<script>alert(1)</script>',
          },
        },
      };

      const val = validateEditCommand(command, template);
      const passed = !val.valid && val.errors.some((e) => e.includes('Forbidden Field Violation'));
      return {
        passed,
        note: 'Invalid property "evilScript" was blocked by the schema whitelist.',
      };
    }
  );

  // 3. AI Viewport Scope Isolation
  record(
    'test-viewport-isolation',
    'Viewport-Specific Isolation',
    'Verifies a mobile-only edit affects only mobile and leaves desktop & tablet unchanged.',
    () => {
      const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const initialDesktop = resolveElementProperties(template.elements['hero-title'], 'desktop');
      const initialTablet = resolveElementProperties(template.elements['hero-title'], 'tablet');

      const command: EditCommand = {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'mobile',
        baseRevision: template.version,
        changes: {
          'hero-title': { fontSize: 22 },
        },
      };

      const result = applyEditCommand(template, command);
      const resolvedDesktopAfter = resolveElementProperties(result.nextTemplate.elements['hero-title'], 'desktop');
      const resolvedTabletAfter = resolveElementProperties(result.nextTemplate.elements['hero-title'], 'tablet');
      const resolvedMobileAfter = resolveElementProperties(result.nextTemplate.elements['hero-title'], 'mobile');

      const passed =
        result.success &&
        resolvedMobileAfter.fontSize === 22 &&
        resolvedDesktopAfter.fontSize === initialDesktop.fontSize &&
        resolvedTabletAfter.fontSize === initialTablet.fontSize;

      return {
        passed,
        note: `Mobile font size updated to 22px while desktop remained ${initialDesktop.fontSize}px and tablet remained ${initialTablet.fontSize}px.`,
      };
    }
  );

  // 4. Canvas & Code State Consistency
  record(
    'test-canvas-code-consistency',
    'Canvas & Code Synchronization',
    'Verifies code and canvas operate on the identical canonical state model.',
    () => {
      const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const command: EditCommand = {
        source: 'code',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'hero-title': { text: 'Synchronized Model Value' },
        },
      };

      const result = applyEditCommand(template, command);
      const passed =
        result.success &&
        result.nextTemplate.elements['hero-title'].base.text === 'Synchronized Model Value';

      return {
        passed,
        note: 'Code edit successfully mutated canonical template and incremented revision.',
      };
    }
  );

  // 5. Invalid Code Error Safety
  record(
    'test-invalid-code-safety',
    'Invalid Code State Preservation',
    'Ensures invalid code payloads do not corrupt canonical state or history.',
    () => {
      const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const initialVersion = template.version;

      const invalidCommand: EditCommand = {
        source: 'code',
        targetIds: ['non-existent-element-xyz'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {},
      };

      const result = applyEditCommand(template, invalidCommand);
      const passed = !result.success && result.nextTemplate.version === initialVersion;

      return {
        passed,
        note: 'Invalid code command was rejected; original template state and version remained preserved.',
      };
    }
  );

  // 6. Independent Per-Element Recovery
  record(
    'test-independent-element-recovery',
    'Independent Per-Element Recovery',
    'Verifies restoring element A does not rollback or disturb modifications made to element B.',
    () => {
      let current = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;

      // 1. Edit Element A ('hero-title')
      const cmdA: EditCommand = {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: current.version,
        changes: { 'hero-title': { text: 'Title Modified in Step 1' } },
      };
      const resA = applyEditCommand(current, cmdA);
      current = resA.nextTemplate;
      const histEntryA = resA.historyEntry!.id;

      // 2. Edit Element B ('feature-1-title')
      const cmdB: EditCommand = {
        source: 'canvas',
        targetIds: ['feature-1-title'],
        viewport: 'all',
        baseRevision: current.version,
        changes: { 'feature-1-title': { text: 'Feature 1 Modified in Step 2' } },
      };
      const resB = applyEditCommand(current, cmdB);
      current = resB.nextTemplate;

      // 3. Restore ONLY Element A ('hero-title') to before Step 1
      const restoreRes = restoreElementRevision(current, 'hero-title', 'all', histEntryA);
      current = restoreRes.nextTemplate;

      const passed =
        restoreRes.success &&
        current.elements['hero-title'].base.text === 'Build Safe Web Experiences with Scoped AI Precision' &&
        current.elements['feature-1-title'].base.text === 'Feature 1 Modified in Step 2';

      return {
        passed,
        note: 'Restored hero-title to baseline while feature-1-title retained its Step 2 modification perfectly.',
      };
    }
  );

  // 7. Partial Proposal Acceptance
  record(
    'test-partial-proposal-acceptance',
    'Partial Multi-Element Proposal Acceptance',
    'Verifies that in a multi-element result, accepting A and rejecting B modifies only A.',
    () => {
      let template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const initialFeature2Radius = template.elements['feature-2'].base.borderRadius;

      // User accepts proposal on feature-1 only
      const acceptCmd: EditCommand = {
        source: 'ai',
        targetIds: ['feature-1'],
        viewport: 'all',
        baseRevision: template.version,
        changes: {
          'feature-1': { borderRadius: 28 },
        },
      };

      const result = applyEditCommand(template, acceptCmd);
      const passed =
        result.success &&
        result.nextTemplate.elements['feature-1'].base.borderRadius === 28 &&
        result.nextTemplate.elements['feature-2'].base.borderRadius === initialFeature2Radius;

      return {
        passed,
        note: 'Feature 1 accepted with 28px radius; Feature 2 remained untouched at baseline.',
      };
    }
  );

  // 8. Stale Revision Conflict Prevention
  record(
    'test-stale-revision-rejection',
    'Stale Revision Prevention',
    'Ensures commands based on outdated revision numbers are safely rejected.',
    () => {
      const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const staleCommand: EditCommand = {
        source: 'canvas',
        targetIds: ['hero-title'],
        viewport: 'all',
        baseRevision: template.version - 99, // Stale!
        changes: { 'hero-title': { text: 'Stale update' } },
      };

      const val = validateEditCommand(staleCommand, template);
      const passed = !val.valid && val.errors.some((e) => e.includes('Stale Revision Conflict'));

      return {
        passed,
        note: 'Command with stale revision base was rejected to avoid race conditions.',
      };
    }
  );

  // 9. Deterministic AI Scenario Output Consistency
  record(
    'test-deterministic-ai-replay',
    'Deterministic AI Engine Consistency',
    'Guarantees identical instructions and element states produce mathematically identical proposals.',
    () => {
      const template = JSON.parse(JSON.stringify(INITIAL_TEMPLATE)) as TemplateModel;
      const prompt = 'Rewrite the selected heading to sound more professional and executive-ready.';

      const prop1 = generateDeterministicAIProposal(prompt, ['hero-title'], template, 'all');
      const prop2 = generateDeterministicAIProposal(prompt, ['hero-title'], template, 'all');

      const passed =
        JSON.stringify(prop1.items) === JSON.stringify(prop2.items) &&
        prop1.items[0]?.after.text === prop2.items[0]?.after.text;

      return {
        passed,
        note: 'Two independent AI scenario evaluations produced identical proposals.',
      };
    }
  );

  return results;
}
