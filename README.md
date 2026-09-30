# Mon Livret

Des livrets d’accueil numériques pour les propriétaires et les conciergeries. Les voyageurs retrouvent les informations de leur séjour depuis un lien ou un QR code, sans application à installer.

## Fonctionnalités

- Création et personnalisation des logements et livrets.
- Informations d’arrivée, Wi-Fi, équipements et bonnes adresses.
- Accès par réservation avec expiration, messagerie et suivi des consultations.
- Suppression d’un logement et de ses données associées, après confirmation.

## Démarrer

**Prérequis :** Node.js 22, npm et un projet Firebase avec Authentication et Firestore configurés. Activez les modes de connexion utilisés (e-mail, Google et connexion anonyme pour les voyageurs).

```sh
npm ci
cp .env.example .env.local
# Renseigner les variables Firebase dans .env.local
npm run setup:hooks
npm run dev
```

Ouvrir [localhost:3000](http://localhost:3000).

Les variables `NEXT_PUBLIC_*` sont visibles dans le navigateur : elles ne doivent jamais contenir de clé privée ou de secret serveur. Les droits d’accès reposent sur les règles Firebase.

## Vérifier et publier

```sh
npm run check    # Secrets, lint, TypeScript et tests
npm run build    # Compilation de production
npm start       # Démarrage de la version compilée
```

Le hook local vérifie le code et les secrets avant chaque push. GitHub Actions relance les vérifications et la compilation. Pousser sur GitHub ne déploie pas les règles Firebase.

Avec Firebase CLI installé et connecté, publiez les règles sur le projet choisi :

```sh
firebase deploy --only firestore:rules,storage --project VOTRE_PROJET_FIREBASE
```

**Les règles Firestore doivent être déployées avec la fonctionnalité de suppression de logement.** Testez les changements de règles sur un projet de test avant la production.

## Structure

- `src/app` : pages publiques, espace propriétaire, guides et API.
- `src/components` : interface réutilisable.
- `src/lib` : logique métier et connexion Firebase.
- `tests` : tests automatisés.
- `firestore.rules` et `storage.rules` : autorisations Firebase.
- `supabase/migrations` : anciennes migrations conservées pour l’historique ; l’application actuelle utilise Firebase.

**Stack :** Next.js, React, TypeScript, Tailwind CSS et Firebase.

Les intégrations calendriers/PMS sont encore annoncées comme à venir. Pour signaler une vulnérabilité, voir [SECURITY.md](SECURITY.md).
