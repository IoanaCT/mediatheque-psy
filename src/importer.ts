import type { Item, ItemType, ImportReport } from './types';

const TYPES: ItemType[] = ['etude', 'essai', 'livre', 'film', 'podcast', 'formation'];

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(str).filter((s): s is string => !!s) : [];

/** Seuls les liens http(s) sont conservés (un JSON importé n'est jamais une source fiable). */
export function safeUrl(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

function normalizeType(v: unknown): ItemType {
  const t = str(v)
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return (TYPES as string[]).includes(t ?? '') ? (t as ItemType) : 'etude';
}

/** Transforme un élément du JSON en Item. Retourne null s'il n'a ni id ni titre exploitable. */
export function normalizeItem(
  raw: unknown,
  veille: number | null,
  veilleDate: string | null,
  now: string,
): Item | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  const id = str(r.id);
  const titre = str(r.titre);
  if (!id || !titre) return null;

  const ck = r.chiffre_cle;
  const chiffreCle =
    ck && str(ck.valeur) ? { valeur: str(ck.valeur)!, legende: str(ck.legende) } : undefined;

  const c = r.comparaison;
  const comparaison =
    c && str(c.a?.label) && num(c.a?.valeur) !== undefined && str(c.b?.label) && num(c.b?.valeur) !== undefined
      ? {
          a: { label: str(c.a.label)!, valeur: num(c.a.valeur)! },
          b: { label: str(c.b.label)!, valeur: num(c.b.valeur)! },
          unite: str(c.unite),
        }
      : undefined;

  const m = r.methode;
  const methode = m
    ? { type: str(m.type), participants: num(m.participants), pays: str(m.pays) }
    : undefined;

  const s = num(r.solidite);
  const solidite = s !== undefined && s >= 1 && s <= 3 ? (Math.round(s) as 1 | 2 | 3) : undefined;

  const so = r.source;
  const source = so
    ? {
        revue: str(so.revue),
        lienEtude: safeUrl(so.lien_etude),
        lienVulgarisation: safeUrl(so.lien_vulgarisation),
        dateParution: str(so.date_parution),
      }
    : undefined;

  return {
    id,
    veille,
    veilleDate,
    type: normalizeType(r.type),
    titre,
    ideeCle: str(r.idee_cle),
    chiffreCle,
    comparaison,
    methode,
    solidite,
    pourquoi: strList(r.pourquoi),
    limites: strList(r.limites),
    question: str(r.question),
    themes: strList(r.themes).map((t) => t.toLowerCase()),
    source,
    auteur: str(r.auteur),
    usage: str(r.usage),
    miseEnGarde: str(r.mise_en_garde),
    tempsLectureMin: num(r.temps_lecture_min),
    decision: null,
    etageres: [],
    statut: 'a_lire',
    favori: false,
    note: '',
    importedAt: now,
    updatedAt: now,
  };
}

/** Lit le texte JSON d'une veille. Lève une Error lisible si le format est inexploitable. */
export function parseVeille(
  text: string,
  existingIds: Set<string>,
  now = new Date().toISOString(),
): { items: Item[]; report: ImportReport } {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Ce texte n'est pas un JSON valide. Vérifie qu'il est copié en entier.");
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
    throw new Error('Format inattendu : il manque la liste « items ».');
  }
  const numero = num(data.veille?.numero) ?? null;
  const date = str(data.veille?.date) ?? null;

  const items: Item[] = [];
  const report: ImportReport = { veille: numero, ajoutes: 0, doublons: 0, ignores: [] };
  const seen = new Set(existingIds);

  data.items.forEach((raw: unknown, index: number) => {
    const item = normalizeItem(raw, numero, date, now);
    if (!item) {
      report.ignores.push({ index: index + 1, raison: 'id ou titre manquant' });
    } else if (seen.has(item.id)) {
      report.doublons++;
    } else {
      seen.add(item.id);
      items.push(item);
      report.ajoutes++;
    }
  });
  return { items, report };
}
