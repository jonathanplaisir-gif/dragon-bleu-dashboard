# Dictionnaire des données

## Sources Excel intégrées

| Onglet source | Utilisation dans le dashboard |
|---|---|
| `Références_fondation` | Base SKU principale pour les vues 12 mois, 6 mois, 3 mois, ainsi que les métadonnées produit, statut, priorité et action achat. |
| `Marchés_depuis_9_mars` | Base marché depuis le 09/03/2026, avec exclusion GB. |
| `Synthèse_marques` | Données marque conservées dans `assets/data.js` pour traçabilité. |
| `Dashboard` | Extrait conservé dans `assets/data.js` pour traçabilité des KPIs du classeur source. |
| `Mode emploi` | Notes et règles affichées en bas du dashboard. |

## Périodes

| Période | Dates | CA | Quantités | Source principale |
|---|---:|---|---|---|
| 12 mois | 01/06/2025 au 31/05/2026 | `CA TTC 12m` | `Qtés 12m` | `Références_fondation` |
| 6 mois | 01/12/2025 au 31/05/2026 | `CA TTC 6m` | `Qtés 6m` | `Références_fondation` |
| 3 mois | 01/03/2026 au 31/05/2026 | `CA TTC 3m` | `Qtés 3m` | `Références_fondation` |
| Depuis 09/03/2026 | 09/03/2026 au 31/05/2026 | `CA TTC depuis 9 mars` | `Qtés depuis 9 mars` | `Marchés_depuis_9_mars`, GB exclu |

## Champs principaux

| Champ | Description |
|---|---|
| `Marque` | Marque de la référence ou ligne marché. |
| `Produit` | Nom produit. |
| `SKU` | Identifiant SKU. |
| `Variante` | Variante produit lorsque disponible. |
| `Type produit` | Catégorie ou famille produit. |
| `Prix TTC` | Prix TTC de référence. |
| `Statut fondation` | Classification achat/reassort proposée dans le fichier source. |
| `Priorité` | Priorité achat, par exemple P1, P2, P3. |
| `Action recommandée` | Recommandation opérationnelle issue du fichier source. |
| `Commentaire achat` | Commentaire achat issu du fichier source. |
| `Marché` | Marché de vente pour la période depuis le 09/03/2026. Les vues marchés excluent GB. |

## Règles d’agrégation

- Les métriques affichées sont recalculées côté navigateur selon les filtres actifs.
- Le CA et les quantités sont sommés sur les lignes filtrées.
- Le prix moyen est calculé comme `CA TTC / Quantités`.
- Les compteurs SKU, produits, marques, types et marchés sont des valeurs distinctes.
- Les exports CSV reprennent les lignes filtrées ou agrégées telles qu’affichées dans le dashboard.

## Volumétrie extraite

| Élément | Volume |
|---|---:|
| Lignes `Références_fondation` | 8 799 |
| Lignes `Marchés_depuis_9_mars` intégrées | 3 839 |
| Lignes GB exclues depuis l’onglet marchés | 0 |
| Marques distinctes | 80 |
| Produits distincts | 3 229 |
| SKU distincts | 8 799 |
| Types produit distincts | 111 |
| Marchés disponibles hors GB | DE, ES, FR, IT |
