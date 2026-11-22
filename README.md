# Mon Chantier

Plans, matériels et budget pour une maison, une entreprise ou un jardin. Tout est en français, les prix sont en FCFA.

- **Plan** : dessin 2D par glisser-déposer (pièces aménagées, machines, portes, fenêtres, toits, clôtures), vue 3D et étapes de construction.
- **Matériels et prix** : catalogue prérempli, quantités et prix modifiables, suivi des achats.
- **Notes** : un bloc-notes.
- **Budget** : total par bâtiment et par catégorie, marge pour imprévus.
- **Couleurs** : 15 palettes, mode clair ou sombre.

## Utilisation

Ouvrir `index.html` dans un navigateur, ou utiliser le site GitHub Pages du dépôt. Aucune installation, aucun serveur : l'application fonctionne hors ligne.

## Vos données

Elles sont d'abord enregistrées dans le navigateur de l'appareil (jamais sur GitHub), donc l'application marche hors ligne.

Page **Compte** : en se connectant, les plans, matériels, notes et réglages sont aussi copiés dans une base **Supabase** et retrouvés sur tous les appareils. Sans compte, un téléphone et un ordinateur ont chacun leurs données ; **Exporter** puis **Importer** permet de les transférer à la main.

### Base de données (Supabase)

- Tables `plans` (un plan par ligne, avec ses matériels et ses étapes), `notes` et `app_settings`, protégées par une règle de sécurité par ligne : chaque utilisateur ne voit et ne modifie que ses propres lignes. Les visiteurs non connectés n'ont aucun accès.
- La clé présente dans `js/cloud.js` est une clé « publiable » : elle est faite pour être publique. Ne jamais y mettre une clé `service_role`.
- Réglages à faire une fois dans le tableau de bord Supabase (Authentication, URL Configuration) : mettre **Site URL** à l'adresse du site GitHub Pages, pour que les liens reçus par email (confirmation du compte, mot de passe oublié) ramènent à l'application.

## Prix

Seuls le ciment et le fer à béton sont tirés de la presse tchadienne (2026). Tous les autres prix sont des estimations de départ à remplacer par vos devis.
