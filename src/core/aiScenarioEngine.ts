/**
 * Deterministic AI Scenario Engine
 *
 * Provides deterministic text-to-edit proposals based on:
 * - Current user instruction
 * - Currently selected element IDs and types
 * - Current property values
 * - Selected viewport scope
 * - Current template revision
 *
 * The exact same input & state always produces the exact same proposal.
 */

import {
  AIProposal,
  AIProposalItem,
  EditableProperties,
  ElementModel,
  TemplateModel,
  Viewport,
} from '../types/template';

export interface AIScenarioPreset {
  id: string;
  category: string;
  label: string;
  prompt: string;
  recommendedScope: Viewport;
  description: string;
  targetTypes: string[];
}

export const DOCUMENTED_AI_PRESETS: AIScenarioPreset[] = [
  {
    id: 'content-pro-headline',
    category: 'Content Rewrite',
    label: 'Rewrite Heading (Executive / B2B)',
    prompt: 'Rewrite the selected heading to sound more professional and executive-ready.',
    recommendedScope: 'all',
    description: 'Generates concise, high-value enterprise positioning copy.',
    targetTypes: ['heading', 'text'],
  },
  {
    id: 'content-punchy-cta',
    category: 'Content Rewrite',
    label: 'High-Converting CTA Button',
    prompt: 'Rewrite button copy to be urgent, punchy, and conversion-focused.',
    recommendedScope: 'all',
    description: 'Transforms generic button labels into active value promises.',
    targetTypes: ['button', 'badge'],
  },
  {
    id: 'style-prominent-button',
    category: 'Style Change',
    label: 'Make Button More Prominent',
    prompt: 'Make the selected button more prominent with dark contrast and generous padding.',
    recommendedScope: 'all',
    description: 'Increases contrast, padding, corner radius, and font weight.',
    targetTypes: ['button'],
  },
  {
    id: 'style-modern-card',
    category: 'Style Change',
    label: 'Modern Card Elevation & Radius',
    prompt: 'Apply modern border-radius, clean surface color, and crisp borders to selected cards.',
    recommendedScope: 'all',
    description: 'Refines card surfaces with mathematically balanced styling.',
    targetTypes: ['card', 'container', 'section'],
  },
  {
    id: 'resize-spacious',
    category: 'Move & Resize',
    label: 'Increase Card Width & Spacing',
    prompt: 'Make the selected card wider with generous breathing room and padding.',
    recommendedScope: 'all',
    description: 'Expands container width and increases internal padding.',
    targetTypes: ['card', 'container', 'heading'],
  },
  {
    id: 'responsive-mobile-headline',
    category: 'Responsive Scope',
    label: 'Mobile-Only Heading Optimization',
    prompt: 'Make the selected heading smaller and centered on mobile view.',
    recommendedScope: 'mobile',
    description: 'Applies viewport-isolated mobile font size and alignment overrides.',
    targetTypes: ['heading', 'text'],
  },
  {
    id: 'multi-rounded-features',
    category: 'Multi-Element',
    label: 'Unify Radius Across Selected Cards',
    prompt: 'Make all selected feature cards more rounded with subtle borders.',
    recommendedScope: 'all',
    description: 'Applies uniform aesthetic values across multi-element group selection.',
    targetTypes: ['card', 'container'],
  },
  {
    id: 'safety-unsupported',
    category: 'Safe Failure',
    label: 'Unsupported Instruction Test',
    prompt: 'Connect the website to the moon and deploy rocket thrusters.',
    recommendedScope: 'all',
    description: 'Safely rejects out-of-scope requests without mutating state.',
    targetTypes: ['heading', 'button', 'card'],
  },
  {
    id: 'safety-unselected-target',
    category: 'Safety Audit',
    label: 'Unselected Target Injection Test',
    prompt: 'Simulate AI attempting to modify an unselected background element.',
    recommendedScope: 'all',
    description: 'Tests selection authority validator rejection.',
    targetTypes: ['heading', 'button', 'card'],
  },
];

export function generateDeterministicAIProposal(
  instruction: string,
  selectedIds: string[],
  template: TemplateModel,
  viewport: Viewport
): AIProposal {
  const normInstruction = (instruction || '').trim().toLowerCase();
  const baseRevision = template.version;
  const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Safe Failure 1: Empty selection
  if (!selectedIds || selectedIds.length === 0) {
    return {
      id: proposalId,
      instruction,
      scenarioType: 'safe_failure',
      selectedIds: [],
      viewport,
      baseRevision,
      status: 'invalid',
      validationError: 'No elements selected. Please select at least one element on the canvas or layer tree.',
      items: [],
      timestamp: Date.now(),
    };
  }

  // Safe Failure 2: Explicit out-of-scope / fantasy requests
  if (
    normInstruction.includes('moon') ||
    normInstruction.includes('rocket') ||
    normInstruction.includes('crypto') ||
    normInstruction.includes('hack') ||
    normInstruction.includes('arbitrary code')
  ) {
    return {
      id: proposalId,
      instruction,
      scenarioType: 'unsupported',
      selectedIds: [...selectedIds],
      viewport,
      baseRevision,
      status: 'invalid',
      validationError:
        'Unsupported instruction: The template editor supports deterministic visual, typographic, layout, and content edits only.',
      items: [],
      timestamp: Date.now(),
    };
  }

  // Safe Failure 3: Unselected Target Injection simulation
  if (normInstruction.includes('unselected') || normInstruction.includes('simulate ai attempting')) {
    // Deliberately attempts to target 'footer' or an element NOT in selection
    const unselectedId = Object.keys(template.elements).find((id) => !selectedIds.includes(id)) || 'footer';
    const fakeTarget = template.elements[unselectedId];

    return {
      id: proposalId,
      instruction,
      scenarioType: 'safe_failure',
      selectedIds: [...selectedIds, unselectedId], // Deliberate injection
      viewport,
      baseRevision,
      status: 'pending',
      items: [
        ...selectedIds.map((id) => {
          const el = template.elements[id];
          return {
            elementId: id,
            elementName: el?.name || id,
            elementType: el?.type || 'text',
            targetViewport: viewport,
            status: 'pending' as const,
            before: { fontSize: el?.base.fontSize },
            after: { fontSize: 24 },
            diffExplanation: 'Standard update',
          };
        }),
        {
          elementId: unselectedId,
          elementName: fakeTarget?.name || 'Unselected Target',
          elementType: fakeTarget?.type || 'section',
          targetViewport: viewport,
          status: 'pending' as const,
          before: { backgroundColor: fakeTarget?.base.backgroundColor },
          after: { backgroundColor: '#ff0000' },
          diffExplanation: 'UNAUTHORIZED TARGET INJECTION',
        },
      ],
      timestamp: Date.now(),
    };
  }

  // Build real deterministic proposal items for selected elements
  const items: AIProposalItem[] = [];

  for (const elementId of selectedIds) {
    const el = template.elements[elementId];
    if (!el) continue;

    const currentBase = el.base;
    const currentOverride = (viewport !== 'all' ? el.overrides[viewport as 'desktop' | 'tablet' | 'mobile'] : {}) || {};
    const beforeProps: Partial<EditableProperties> = {};
    const afterProps: Partial<EditableProperties> = {};
    let diffExplanation = '';

    // Determine transformation based on instruction keywords and element type
    if (
      normInstruction.includes('headline') ||
      normInstruction.includes('heading') ||
      normInstruction.includes('professional') ||
      normInstruction.includes('executive')
    ) {
      // Content Rewrite (Heading)
      beforeProps.text = currentBase.text;
      beforeProps.fontWeight = currentBase.fontWeight;
      afterProps.text = generateExecutiveCopy(el.id, currentBase.text || '');
      afterProps.fontWeight = 'bold';
      diffExplanation = 'Elevated messaging to professional enterprise phrasing with bold weight.';
    } else if (
      normInstruction.includes('button') ||
      normInstruction.includes('cta') ||
      normInstruction.includes('punchy') ||
      normInstruction.includes('converting')
    ) {
      // Content / Style Rewrite (Button)
      beforeProps.text = currentBase.text;
      beforeProps.backgroundColor = currentBase.backgroundColor;
      beforeProps.color = currentBase.color;
      beforeProps.paddingLeft = currentBase.paddingLeft;
      beforeProps.paddingRight = currentBase.paddingRight;
      beforeProps.paddingTop = currentBase.paddingTop;
      beforeProps.paddingBottom = currentBase.paddingBottom;
      beforeProps.borderRadius = currentBase.borderRadius;

      afterProps.text = generatePunchyButtonCopy(el.id, currentBase.text || '');
      afterProps.backgroundColor = '#0f172a'; // Deep slate
      afterProps.color = '#ffffff';
      afterProps.paddingLeft = 24;
      afterProps.paddingRight = 24;
      afterProps.paddingTop = 14;
      afterProps.paddingBottom = 14;
      afterProps.borderRadius = 10;
      diffExplanation = 'Optimized CTA text for conversion, added high-contrast background and 24px padding.';
    } else if (
      normInstruction.includes('prominent') ||
      normInstruction.includes('contrast') ||
      normInstruction.includes('dark accent')
    ) {
      // Style Change: Prominent
      beforeProps.backgroundColor = currentBase.backgroundColor;
      beforeProps.color = currentBase.color;
      beforeProps.fontWeight = currentBase.fontWeight;
      beforeProps.shadow = currentBase.shadow;

      afterProps.backgroundColor = '#18181b';
      afterProps.color = '#f8fafc';
      afterProps.fontWeight = 'bold';
      afterProps.shadow = 'lg';
      diffExplanation = 'Applied high-contrast dark surface with bold typography and elevated drop shadow.';
    } else if (
      normInstruction.includes('rounded') ||
      normInstruction.includes('radius') ||
      normInstruction.includes('modern card') ||
      normInstruction.includes('corner')
    ) {
      // Multi-element / Card radius
      beforeProps.borderRadius = currentBase.borderRadius;
      beforeProps.borderColor = currentBase.borderColor;
      beforeProps.borderWidth = currentBase.borderWidth;
      beforeProps.backgroundColor = currentBase.backgroundColor;

      afterProps.borderRadius = 20;
      afterProps.borderWidth = 1;
      afterProps.borderColor = '#e2e8f0';
      afterProps.backgroundColor = '#ffffff';
      diffExplanation = 'Adjusted corner radius to 20px with crisp 1px neutral border.';
    } else if (
      normInstruction.includes('wider') ||
      normInstruction.includes('resize') ||
      normInstruction.includes('spacing') ||
      normInstruction.includes('padding')
    ) {
      // Move / Resize / Spacing
      beforeProps.paddingTop = currentBase.paddingTop;
      beforeProps.paddingBottom = currentBase.paddingBottom;
      beforeProps.paddingLeft = currentBase.paddingLeft;
      beforeProps.paddingRight = currentBase.paddingRight;
      beforeProps.maxWidth = currentBase.maxWidth;

      afterProps.paddingTop = Math.min((currentBase.paddingTop || 16) + 12, 48);
      afterProps.paddingBottom = Math.min((currentBase.paddingBottom || 16) + 12, 48);
      afterProps.paddingLeft = Math.min((currentBase.paddingLeft || 20) + 12, 56);
      afterProps.paddingRight = Math.min((currentBase.paddingRight || 20) + 12, 56);
      afterProps.maxWidth = '100%';
      diffExplanation = 'Expanded padding by +12px on all sides and maximized container width.';
    } else if (
      normInstruction.includes('mobile') ||
      normInstruction.includes('responsive') ||
      normInstruction.includes('smaller') ||
      viewport === 'mobile'
    ) {
      // Responsive scope adjustment
      const currentFontSize = currentOverride.fontSize ?? currentBase.fontSize ?? 32;
      beforeProps.fontSize = currentFontSize;
      beforeProps.textAlign = currentOverride.textAlign ?? currentBase.textAlign ?? 'left';

      afterProps.fontSize = Math.max(Math.round(currentFontSize * 0.75), 18);
      afterProps.textAlign = 'center';
      diffExplanation = `Scaled down font size to ${afterProps.fontSize}px and centered alignment for mobile viewport.`;
    } else {
      // Default intelligent polish
      if (el.type === 'heading') {
        beforeProps.fontSize = currentBase.fontSize;
        beforeProps.fontWeight = currentBase.fontWeight;
        afterProps.fontSize = (currentBase.fontSize || 36) + 4;
        afterProps.fontWeight = 'extrabold';
        diffExplanation = 'Enriched heading hierarchy with +4px font size and extra-bold weight.';
      } else if (el.type === 'button') {
        beforeProps.borderRadius = currentBase.borderRadius;
        beforeProps.fontWeight = currentBase.fontWeight;
        afterProps.borderRadius = 12;
        afterProps.fontWeight = 'bold';
        diffExplanation = 'Refined button corner radius to 12px and bold typography.';
      } else {
        beforeProps.paddingTop = currentBase.paddingTop;
        beforeProps.paddingBottom = currentBase.paddingBottom;
        afterProps.paddingTop = (currentBase.paddingTop || 16) + 8;
        afterProps.paddingBottom = (currentBase.paddingBottom || 16) + 8;
        diffExplanation = 'Optimized internal vertical padding (+8px).';
      }
    }

    items.push({
      elementId,
      elementName: el.name,
      elementType: el.type,
      targetViewport: viewport,
      status: 'pending',
      before: beforeProps,
      after: afterProps,
      diffExplanation,
    });
  }

  let scenarioType: AIProposal['scenarioType'] = 'content_rewrite';
  if (normInstruction.includes('button') || normInstruction.includes('style') || normInstruction.includes('contrast')) {
    scenarioType = 'style_change';
  } else if (normInstruction.includes('resize') || normInstruction.includes('wider') || normInstruction.includes('spacing')) {
    scenarioType = 'resize_reorder';
  } else if (viewport === 'mobile' || normInstruction.includes('mobile') || normInstruction.includes('tablet')) {
    scenarioType = 'responsive_adjustment';
  } else if (selectedIds.length > 1) {
    scenarioType = 'multi_element';
  }

  return {
    id: proposalId,
    instruction,
    scenarioType,
    selectedIds: [...selectedIds],
    viewport,
    baseRevision,
    status: 'pending',
    items,
    timestamp: Date.now(),
  };
}

function generateExecutiveCopy(id: string, current: string): string {
  if (id.includes('hero-title')) return 'Enterprise Intelligence with Guaranteed Scope Isolation';
  if (id.includes('hero-description'))
    return 'Deploy production web components with deterministic AI workflows, granular per-element recovery, and seamless responsive previews.';
  if (id.includes('feature-1-title')) return 'Deterministic State Engine';
  if (id.includes('feature-2-title')) return 'Scoped AI Co-Pilot';
  if (id.includes('feature-3-title')) return 'Per-Element Instant Rollback';
  if (id.includes('final-cta-title')) return 'Ready to modernize your digital presence?';
  return current ? `${current} — Optimized for Performance` : 'Precision Engineered Solution';
}

function generatePunchyButtonCopy(id: string, current: string): string {
  if (id.includes('primary') || id.includes('cta')) return 'Start Free 14-Day Trial →';
  if (id.includes('secondary')) return 'Explore Interactive Demo';
  return current ? `${current} Now →` : 'Get Started Instantly';
}
