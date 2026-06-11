# Dashboard Fondation Dragon Bleu

Dashboard interactif statique généré à partir du fichier `Fichier_Fondation_Dragon_Bleu_(10_06_26).xlsx`.

## Contenu

- `index.html` : page principale du dashboard.
- `assets/styles.css` : styles du dashboard.
- `assets/app.js` : logique interactive, filtres, agrégations, exports CSV.
- `assets/data.js` : données extraites du fichier Excel, encodées en JavaScript.
- `data_dictionary.md` : dictionnaire des champs et règles de calcul.

## Vues disponibles

- Périodes : 12 mois, 6 mois, 3 mois, depuis le 09/03/2026.
- Dimensions : marques, produits, types de produits, marchés hors GB, SKU.
- Filtres : marque, type produit, marché, statut fondation, priorité, recherche produit/SKU.
- Exports : agrégat filtré, lignes filtrées, références complètes, marchés hors GB.

## Publication sur GitHub Pages

1. Créer un nouveau repository GitHub, par exemple `dragon-bleu-dashboard`.
2. Uploader le contenu de ce dossier à la racine du repository.
3. Aller dans **Settings > Pages**.
4. Dans **Build and deployment**, choisir **Deploy from a branch**.
5. Sélectionner la branche `main` et le dossier `/root`, puis enregistrer.
6. Ouvrir l’URL GitHub Pages fournie par GitHub.

Aucun build, framework ou serveur n’est nécessaire. Le dashboard peut aussi être ouvert localement en double-cliquant sur `index.html`.

## Notes de périmètre

- Les vues 12 mois, 6 mois et 3 mois utilisent l’onglet `Références_fondation`.
- Les vues marchés utilisent l’onglet `Marchés_depuis_9_mars`.
- Le marché GB est exclu explicitement des vues marchés. Le fichier fourni ne contenait déjà aucune ligne GB dans l’onglet `Marchés_depuis_9_mars`.
- Les colonnes de stock sont conservées dans les données et exports, mais le fichier source indique que le stock actuel n’était pas disponible dans cette V1.
