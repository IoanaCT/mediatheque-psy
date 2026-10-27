export type ItemType = 'etude' | 'essai' | 'livre' | 'film' | 'podcast' | 'formation';
export type Shelf = 'P' | 'R';
export type Decision = 'garder' | 'passer' | 'plus_tard';
export type Status = 'a_lire' | 'en_cours' | 'lu' | 'a_relire';

export interface Item {
  id: string;
  veille: number | null;
  veilleDate: string | null;
  type: ItemType;
  titre: string;
  ideeCle?: string;
  chiffreCle?: { valeur: string; legende?: string };
  comparaison?: {
    a: { label: string; valeur: number };
    b: { label: string; valeur: number };
    unite?: string;
  };
  methode?: { type?: string; participants?: number; pays?: string };
  solidite?: 1 | 2 | 3;
  pourquoi: string[];
  limites: string[];
  question?: string;
  themes: string[];
  source?: { revue?: string; lienEtude?: string; lienVulgarisation?: string; dateParution?: string };
  auteur?: string;
  usage?: string; // "P", "R" ou "P R" (usage suggéré par la veille)
  miseEnGarde?: string;
  tempsLectureMin?: number;
  // état personnel
  decision: Decision | null;
  etageres: Shelf[];
  statut: Status;
  favori: boolean;
  note: string;
  importedAt: string;
  updatedAt: string;
}

export interface ImportReport {
  veille: number | null;
  ajoutes: number;
  doublons: number;
  ignores: { index: number; raison: string }[];
}
