import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseVeille } from '../src/importer';
import { getAllItems, putItems, getMeta, setMeta } from '../src/db';

describe('stockage local', () => {
  it('enregistre, relit et met à jour des éléments', async () => {
    const { items } = parseVeille(readFileSync('public/exemple-veille-5.json', 'utf8'), new Set());
    await putItems(items);
    expect(await getAllItems()).toHaveLength(6);
    await putItems([{ ...items[0], decision: 'garder', etageres: ['P'] }]);
    const all = await getAllItems();
    expect(all).toHaveLength(6);
    expect(all.find((i) => i.id === items[0].id)?.decision).toBe('garder');
  });

  it('garde les réglages', async () => {
    expect(await getMeta('police', 1)).toBe(1);
    await setMeta('police', 1.25);
    expect(await getMeta('police', 1)).toBe(1.25);
  });
});
