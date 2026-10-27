# Médiathèque psy

Petite application web (PWA) pour garder, retrouver et suivre la veille psy du lundi.
Pensée pour un usage TDAH : une carte par écran, peu de texte, actions en un geste.

- **Données 100 % locales** (IndexedDB de l'appareil). Aucun serveur, aucun compte.
- **Ce dépôt est public : il ne contient que du code.** Les jeux de données d'exemple sont fictifs.
- **Aucune donnée de patient**, jamais, y compris dans les notes.

## Avancement

- [x] Étape 1 : import de la veille et mode stories
- [ ] Étape 2 : médiathèque, recherche et filtres
- [ ] Étape 3 : synchronisation (fichier iCloud Drive) et mode hors ligne
- [ ] Étape 4 : exports JSON et Markdown

## Utiliser

```bash
npm install
npm run dev      # développement
npm test         # tests (import, doublons, stockage)
npm run build    # version publiable dans dist/
```

Un exemple de veille à importer : `public/exemple-veille-5.json` (6 éléments fictifs).

## Publication (GitHub Pages)

Dans *Settings > Pages*, choisir **Source : GitHub Actions**. Chaque mise à jour de `main` publie le site.

## Format d'import

Un fichier JSON par semaine : `{ "veille": { "numero", "date" }, "items": [ … ] }`.
Les champs absents sont tolérés. Un élément sans `id` ou sans `titre` est ignoré. Un `id` déjà présent n'est pas réimporté.
Seuls les liens `http(s)` sont conservés.
