# Sécurité

## Signaler un problème

Ne publiez pas de secret ou de données de voyageurs dans une issue. Utilisez le signalement privé de GitHub s’il est activé, ou contactez le propriétaire du dépôt via un canal privé convenu.

## Configuration

- Gardez `.env.local`, les comptes de service et les clés privées hors de Git.
- Les identifiants Firebase web sont publics ; les règles Firestore/Storage assurent les autorisations.
- Publiez et testez les règles Firebase avec les fonctionnalités qui en dépendent.
- Utilisez `npm ci` et conservez `package-lock.json` pour des installations reproductibles.
- Activez les hooks avec `npm run setup:hooks` sur chaque clone.
- Le contrôle local détecte des formats courants de secrets ; il ne remplace pas une revue de sécurité.

## Réglages GitHub recommandés

Dans les paramètres du dépôt, activez la protection contre les secrets si disponible et protégez `main` : pull request, contrôle CI `verify`, interdiction des force-push et des suppressions de branche. Ces réglages distants ne sont pas activés par les fichiers du dépôt.

## En cas de secret publié

Révoquez ou remplacez d’abord le secret. Supprimer le fichier du dernier commit ne le retire pas de l’historique. Toute réécriture d’historique doit être coordonnée avec les contributeurs.
