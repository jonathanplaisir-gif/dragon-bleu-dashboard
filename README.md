# Dashboard Fondation Dragon Bleu - GitHub Pages

Ce dossier contient un dashboard HTML/CSS/JS statique prêt à publier sur GitHub Pages.

## Contenu

- `index.html` : page principale
- `assets/style.css` : styles
- `assets/app.js` : logique interactive
- `data/products.json` : toutes les références SKU du fichier
- `data/brands.json` : synthèse marques
- `data/markets.json` : données marchés depuis le 9 mars
- `data/summary.json` : KPI globaux
- `data/options.json` : listes de filtres

## Publication rapide sur GitHub Pages

1. Crée un repository GitHub public ou privé, par exemple `dragon-bleu-dashboard`.
2. Uploade tous les fichiers de ce dossier à la racine du repository.
3. Va dans `Settings` > `Pages`.
4. Dans `Build and deployment`, choisis `Deploy from a branch`.
5. Sélectionne la branche `main` et le dossier `/root`.
6. Clique sur `Save`.
7. L'URL sera du type `https://USERNAME.github.io/dragon-bleu-dashboard/`.

## Note

Le dashboard charge les fichiers JSON via `fetch()`. Il faut donc l'ouvrir via GitHub Pages ou un petit serveur local, pas directement depuis un fichier `file://`.
