import { describe, it, expect } from 'vitest';
import { ElementModel } from '../model/types';
import {
  resolveProperty,
  resolveProperties,
  resolveElement,
  resolveAllElements,
  hasViewportOverride,
  getPropertyOverrideStatus,
} from '../responsive/resolve';
import { VIEWPORT_CONFIG, getViewportWidth, getViewportLabel } from '../responsive/viewportConfig';

describe('Responsive Engine & Viewport Resolution', () => {
  const createElement = (overrides: ElementModel['overrides'] = {}): ElementModel => ({
    id: 'test-heading',
    name: 'Main Heading',
    type: 'heading',
    base: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#0f172a',
      textAlign: 'center',
      paddingTop: 24,
      paddingBottom: 24,
    },
    overrides,
    revision: 1,
  });

  describe('1. Viewport Configuration Constants', () => {
    it('defines Desktop width as 1440px', () => {
      expect(VIEWPORT_CONFIG.desktop.width).toBe(1440);
      expect(getViewportWidth('desktop')).toBe(1440);
      expect(getViewportLabel('desktop')).toBe('Desktop');
    });

    it('defines Tablet width as 768px', () => {
      expect(VIEWPORT_CONFIG.tablet.width).toBe(768);
      expect(getViewportWidth('tablet')).toBe(768);
      expect(getViewportLabel('tablet')).toBe('Tablet');
    });

    it('defines Mobile width as 375px', () => {
      expect(VIEWPORT_CONFIG.mobile.width).toBe(375);
      expect(getViewportWidth('mobile')).toBe(375);
      expect(getViewportLabel('mobile')).toBe('Mobile');
    });
  });

  describe('2. Base Fallback (No Overrides)', () => {
    it('resolves desktop, tablet, and mobile to base property when no overrides exist', () => {
      const el = createElement({});

      expect(resolveProperty(el, 'fontSize', 'desktop')).toBe(48);
      expect(resolveProperty(el, 'fontSize', 'tablet')).toBe(48);
      expect(resolveProperty(el, 'fontSize', 'mobile')).toBe(48);

      const resolvedMobile = resolveProperties(el, 'mobile');
      expect(resolvedMobile.fontSize).toBe(48);
      expect(resolvedMobile.fontWeight).toBe('bold');
      expect(resolvedMobile.color).toBe('#0f172a');
    });
  });

  describe('3. Mobile Override with Strict Non-Leakage', () => {
    it('applies mobile override to mobile only, falling back to base on desktop & tablet', () => {
      const el = createElement({
        mobile: { fontSize: 32 },
      });

      expect(resolveProperty(el, 'fontSize', 'mobile')).toBe(32);
      expect(resolveProperty(el, 'fontSize', 'tablet')).toBe(48);
      expect(resolveProperty(el, 'fontSize', 'desktop')).toBe(48);
    });

    it('does NOT leak mobile override to tablet or desktop', () => {
      const el = createElement({
        mobile: { fontSize: 28, color: '#dc2626' },
      });

      const desktopProps = resolveProperties(el, 'desktop');
      const tabletProps = resolveProperties(el, 'tablet');
      const mobileProps = resolveProperties(el, 'mobile');

      expect(mobileProps.fontSize).toBe(28);
      expect(mobileProps.color).toBe('#dc2626');

      expect(tabletProps.fontSize).toBe(48);
      expect(tabletProps.color).toBe('#0f172a');

      expect(desktopProps.fontSize).toBe(48);
      expect(desktopProps.color).toBe('#0f172a');
    });
  });

  describe('4. Tablet Override with Strict Non-Leakage', () => {
    it('applies tablet override to tablet only, falling back to base on desktop & mobile', () => {
      const el = createElement({
        tablet: { fontSize: 40 },
      });

      expect(resolveProperty(el, 'fontSize', 'tablet')).toBe(40);
      expect(resolveProperty(el, 'fontSize', 'desktop')).toBe(48);
      expect(resolveProperty(el, 'fontSize', 'mobile')).toBe(48); // Strictly falls back to base, never tablet!
    });
  });

  describe('5. Desktop Override with Strict Non-Leakage', () => {
    it('applies desktop override to desktop only, falling back to base on tablet & mobile', () => {
      const el = createElement({
        desktop: { fontSize: 56 },
      });

      expect(resolveProperty(el, 'fontSize', 'desktop')).toBe(56);
      expect(resolveProperty(el, 'fontSize', 'tablet')).toBe(48);
      expect(resolveProperty(el, 'fontSize', 'mobile')).toBe(48);
    });
  });

  describe('6. Distinct Overrides on All Viewports', () => {
    it('resolves distinct values per viewport without cross-talk', () => {
      const el = createElement({
        desktop: { fontSize: 56, paddingTop: 40 },
        tablet: { fontSize: 40, paddingTop: 28 },
        mobile: { fontSize: 28, paddingTop: 16 },
      });

      expect(resolveProperty(el, 'fontSize', 'desktop')).toBe(56);
      expect(resolveProperty(el, 'fontSize', 'tablet')).toBe(40);
      expect(resolveProperty(el, 'fontSize', 'mobile')).toBe(28);

      expect(resolveProperty(el, 'paddingTop', 'desktop')).toBe(40);
      expect(resolveProperty(el, 'paddingTop', 'tablet')).toBe(28);
      expect(resolveProperty(el, 'paddingTop', 'mobile')).toBe(16);
    });
  });

  describe('7. Partial Overrides & Property Merging', () => {
    it('retains un-overridden base properties while overriding specified fields', () => {
      const el = createElement({
        mobile: { fontSize: 24 }, // Only fontSize overridden
      });

      const mobileResolved = resolveProperties(el, 'mobile');

      // Overridden
      expect(mobileResolved.fontSize).toBe(24);

      // Retained from base
      expect(mobileResolved.fontWeight).toBe('bold');
      expect(mobileResolved.color).toBe('#0f172a');
      expect(mobileResolved.textAlign).toBe('center');
      expect(mobileResolved.paddingTop).toBe(24);
      expect(mobileResolved.paddingBottom).toBe(24);
    });
  });

  describe('8. Element Resolution & Immutability', () => {
    it('resolves full ElementModel to ResolvedElement without mutating original', () => {
      const el = createElement({
        mobile: { fontSize: 30 },
      });
      const originalSnapshot = JSON.parse(JSON.stringify(el));

      const resolved = resolveElement(el, 'mobile');

      expect(resolved.id).toBe('test-heading');
      expect(resolved.name).toBe('Main Heading');
      expect(resolved.type).toBe('heading');
      expect(resolved.properties.fontSize).toBe(30);
      expect(resolved.properties.fontWeight).toBe('bold');

      // Verify original is completely untouched
      expect(el).toEqual(originalSnapshot);
    });

    it('resolves a dictionary of elements for a viewport with resolveAllElements', () => {
      const elements: Record<string, ElementModel> = {
        'el-1': createElement({ mobile: { fontSize: 20 } }),
        'el-2': {
          id: 'el-2',
          name: 'Button',
          type: 'button',
          base: { text: 'Click me', backgroundColor: '#3b82f6' },
          overrides: { mobile: { text: 'Tap' } },
          revision: 1,
        },
      };

      const resolvedDict = resolveAllElements(elements, 'mobile');

      expect(resolvedDict['el-1'].properties.fontSize).toBe(20);
      expect(resolvedDict['el-2'].properties.text).toBe('Tap');
      expect(resolvedDict['el-2'].properties.backgroundColor).toBe('#3b82f6');
    });
  });

  describe('9. Override Status & Inspection Helpers', () => {
    it('correctly reports override status and source', () => {
      const el = createElement({
        mobile: { fontSize: 28 },
      });

      expect(hasViewportOverride(el, 'mobile', 'fontSize')).toBe(true);
      expect(hasViewportOverride(el, 'mobile', 'fontWeight')).toBe(false);
      expect(hasViewportOverride(el, 'desktop', 'fontSize')).toBe(false);

      const mobileStatus = getPropertyOverrideStatus(el, 'mobile', 'fontSize');
      expect(mobileStatus.hasOverride).toBe(true);
      expect(mobileStatus.source).toBe('override');
      expect(mobileStatus.value).toBe(28);
      expect(mobileStatus.baseValue).toBe(48);

      const desktopStatus = getPropertyOverrideStatus(el, 'desktop', 'fontSize');
      expect(desktopStatus.hasOverride).toBe(false);
      expect(desktopStatus.source).toBe('base');
      expect(desktopStatus.value).toBe(48);
    });
  });
});
