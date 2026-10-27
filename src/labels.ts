import type { ItemType } from './types';

export const TYPE_LABEL: Record<ItemType, string> = {
  etude: 'Étude',
  essai: 'Essai',
  livre: 'Livre',
  film: 'Film',
  podcast: 'Podcast',
  formation: 'Formation',
};

export const SHELF_LABEL = { P: 'Personnelle', R: 'Praticienne' } as const;

export const MEDIA_USAGE: Record<string, string> = {
  P: 'Pour moi',
  R: 'À recommander avec prudence',
};

export function usageLabels(usage?: string): string[] {
  return (usage ?? '')
    .split(/\s+/)
    .filter((u) => u in MEDIA_USAGE)
    .map((u) => MEDIA_USAGE[u]);
}

/** Teinte (0-359) stable à partir du thème principal : une couleur par thème. */
export function themeHue(themes: string[]): number {
  const t = themes[0];
  if (!t) return 200;
  let h = 0;
  for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function readingTime(min?: number): string | undefined {
  if (!min) return undefined;
  if (min >= 60) return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
  return `${min} min`;
}
