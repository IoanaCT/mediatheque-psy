import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseVeille, safeUrl } from '../src/importer';

const sample = readFileSync('public/exemple-veille-5.json', 'utf8');

describe('import d\'une veille', () => {
  it('importe les 6 éléments d\'exemple', () => {
    const { items, report } = parseVeille(sample, new Set());
    expect(items).toHaveLength(6);
    expect(report).toMatchObject({ veille: 5, ajoutes: 6, doublons: 0 });
    expect(items[0].comparaison?.a.valeur).toBe(33);
    expect(items[0].decision).toBeNull();
  });

  it('tolère les champs absents (podcast minimal)', () => {
    const { items } = parseVeille(sample, new Set());
    const p = items.find((i) => i.type === 'podcast')!;
    expect(p.pourquoi).toEqual([]);
    expect(p.source).toBeUndefined();
    expect(p.solidite).toBeUndefined();
  });

  it('ne réimporte pas les doublons (même id)', () => {
    const first = parseVeille(sample, new Set());
    const ids = new Set(first.items.map((i) => i.id));
    const second = parseVeille(sample, ids);
    expect(second.items).toHaveLength(0);
    expect(second.report.doublons).toBe(6);
  });

  it('ignore un élément sans id ou sans titre, sans bloquer les autres', () => {
    const txt = JSON.stringify({ items: [{ titre: 'sans id' }, { id: 'a', titre: 'ok' }, 'n\'importe quoi'] });
    const { items, report } = parseVeille(txt, new Set());
    expect(items.map((i) => i.id)).toEqual(['a']);
    expect(report.ignores).toHaveLength(2);
  });

  it('refuse un texte qui n\'est pas du JSON ou sans liste items', () => {
    expect(() => parseVeille('coucou', new Set())).toThrow(/JSON/);
    expect(() => parseVeille('{"a":1}', new Set())).toThrow(/items/);
  });

  it('ne garde que les liens http(s)', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('data:text/html,x')).toBeUndefined();
    expect(safeUrl('https://example.org/a')).toBe('https://example.org/a');
  });

  it('normalise un type inconnu et borne la solidité', () => {
    const txt = JSON.stringify({ items: [{ id: 'x', titre: 't', type: 'Étude', solidite: 9 }, { id: 'y', titre: 't', type: 'blog', solidite: 3 }] });
    const { items } = parseVeille(txt, new Set());
    expect(items[0].type).toBe('etude');
    expect(items[0].solidite).toBeUndefined();
    expect(items[1].type).toBe('etude');
    expect(items[1].solidite).toBe(3);
  });
});
