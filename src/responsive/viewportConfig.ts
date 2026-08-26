import { ActiveViewport } from '../model/types';
import { ViewportDefinition } from './types';

/**
 * Central Viewport Configuration
 * Desktop (~1440px), Tablet (~768px), Mobile (~375px)
 */
export const VIEWPORT_CONFIG: Record<ActiveViewport, ViewportDefinition> = {
  desktop: {
    id: 'desktop',
    width: 1440,
    label: 'Desktop',
    shortLabel: 'Desktop',
    description: 'Standard 1440px desktop browser display',
  },
  tablet: {
    id: 'tablet',
    width: 768,
    label: 'Tablet',
    shortLabel: 'Tablet',
    description: '768px tablet & portrait iPad display',
  },
  mobile: {
    id: 'mobile',
    width: 375,
    label: 'Mobile',
    shortLabel: 'Mobile',
    description: '375px modern mobile smartphone display',
  },
} as const;

export const SUPPORTED_ACTIVE_VIEWPORTS: readonly ActiveViewport[] = [
  'desktop',
  'tablet',
  'mobile',
] as const;

export function getViewportWidth(viewport: ActiveViewport): number {
  return VIEWPORT_CONFIG[viewport]?.width ?? 1440;
}

export function getViewportLabel(viewport: ActiveViewport): string {
  return VIEWPORT_CONFIG[viewport]?.label ?? 'Desktop';
}
