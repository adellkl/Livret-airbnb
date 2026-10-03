# Emails Mon Livret

Expéditeur, adresse de réponse et compte SMTP : **Mon Livret <monlivret.1@gmail.com>**.

## Service centralisé

Le navigateur appelle `POST /api/account-emails`. Le serveur génère les liens sécurisés avec Firebase Admin, compose un modèle français HTML + texte, puis envoie via Gmail (`smtp.gmail.com:465`, TLS). Les modèles sont dans `src/lib/email/templates.ts` et ne dépendent pas de l’éditeur de modèles Firebase.

| Événement | Déclenchement | Destination du bouton |
| --- | --- | --- |
| Confirmation d’inscription | Après création du compte et du profil par e-mail ; renvoi possible | `/confirmer-adresse` |
| Mot de passe oublié | Formulaire public ou page Sécurité | `/reinitialiser-mot-de-passe` |
| Bienvenue | Première création de profil après connexion Google | Tableau de bord |

L’adresse d’un email de confirmation ou de bienvenue est obtenue depuis le compte Firebase authentifié, jamais depuis un champ fourni par le navigateur. L’API refuse les sujets, expéditeurs, corps ou redirections arbitraires. Les demandes de réinitialisation pour une adresse inconnue renvoient une réponse générique.

Une panne d’envoi ne supprime pas le compte créé. Le renvoi de confirmation reste disponible dans le tableau de bord et la page Sécurité. L’email de bienvenue Google est une tentative lors de la création du profil ; son échec ne doit pas annuler la connexion. Il n’existe pas de file de reprise automatique.

Les liens de contact du site utilisent `src/config/contact.ts`. Le partage de livret par `mailto:` ouvre la messagerie du propriétaire : ce n’est pas un email automatique du serveur. Le dépôt ne contient actuellement aucun autre service d’envoi automatique (réservations, factures ou campagnes).

## Activation en production

Dans les variables d’environnement **Secret / Production** du projet Vercel `livret-airbnb` :

| Variable | Valeur à renseigner |
| --- | --- |
| `GMAIL_APP_PASSWORD` | Mot de passe d’application Google de `monlivret.1@gmail.com` |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` | JSON complet d’un compte de service du projet `livret-airbnb-a871e` autorisé pour Firebase Authentication et Firestore |

Le code accepte aussi les variables serveur séparées `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` et `FIREBASE_ADMIN_PRIVATE_KEY` déjà prévues par l’administration du site.

Les secrets doivent être saisis directement dans Vercel, jamais dans Git, une variable `NEXT_PUBLIC_*`, les captures ou la conversation. Un mot de passe SMTP enregistré dans Firebase n’est pas exportable vers Vercel. Créer une clé serveur confère un accès privilégié au projet ; cette étape doit être réalisée ou approuvée par son propriétaire.

Les liens utilisent `NEXT_PUBLIC_APP_URL` lorsqu’elle est définie, sinon `VERCEL_PROJECT_PRODUCTION_URL`. Le domaine choisi doit être fonctionnel et autorisé dans Firebase Authentication. Le domaine de production vérifié est `https://livret-airbnb-five.vercel.app`. Ne pas utiliser `monlivret.eu` avant sa configuration effective : sa connexion a été refusée lors du contrôle.

Le projet demande Node.js 22. Après ajout des secrets, déployer le code et exécuter le contrôle de réception ci-dessous avant de considérer l’intégration active.

## Fiabilité et limites

- Des transactions Firestore partagées entre les instances limitent les tentatives à 5 par destinataire/heure avec 60 secondes entre deux demandes, 15 par IP/heure et 400 pour le compte Gmail par fenêtre de 24 heures.
- Les collections `email_rate_limits` et `email_deliveries` sont protégées par la règle Firestore de refus par défaut ; seul le serveur Admin y accède. Elles contiennent des empreintes de destinataires/IP et des statuts, aucun secret ni lien d’action.
- Le statut `accepted` signifie que Gmail a accepté le message par SMTP, pas qu’il est arrivé dans la boîte de réception. `failed`, `skipped` et `sending` permettent de distinguer les autres états.
- Un identifiant stable évite les renvois de bienvenue déjà enregistrés comme acceptés. Une panne après acceptation SMTP mais avant écriture Firestore reste une fenêtre de duplication possible.
- Ces protections réduisent les abus ; elles ne suppriment pas les quotas, filtres antispam ou restrictions du fournisseur. Les journaux n’ont pas encore de purge automatique ; prévoir une rétention adaptée si le volume augmente.

## Configuration vérifiée le 3 octobre 2026

- Les secrets `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` et `GMAIL_APP_PASSWORD` sont enregistrés dans Vercel en production.
- La clé serveur importée dans Google Cloud (identifiant `2ce54be699dc6d87d1566d5106c61109294e4320`) a été testée avec succès sur Firebase Authentication et Firestore. Elle expire le **3 octobre 2027** et devra être renouvelée avant cette date. Le téléchargement des clés générées par la console ne fonctionnant pas dans le navigateur intégré, sa paire RSA a été générée localement et seul son certificat public a été importé dans Google Cloud.
- La validation en deux étapes du compte Gmail est activée. Un mot de passe d’application « Mon Livret — Vercel et Firebase » a été créé par le propriétaire. La connexion et l’authentification SMTP ont réussi.
- Le même mot de passe d’application a été enregistré dans le SMTP personnalisé Firebase via l’API officielle : expéditeur/utilisateur `monlivret.1@gmail.com`, serveur `smtp.gmail.com`, port `465`, SSL.
- La langue par défaut Firebase a été enregistrée en français via l’API officielle. La personnalisation des modèles Firebase reste refusée par `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` ; les modèles HTML du serveur sont indépendants de cette restriction.
- Les contrôles et la compilation ont réussi dans une copie basée sur la version distante du site, sans les autres commits locaux non publiés. La réception réelle doit être vérifiée après déploiement ; une connexion SMTP réussie ne suffit pas à prouver la livraison.

## Validation

`npm run check` vérifie les secrets, ESLint, TypeScript et les tests d’emails. Les tests couvrent notamment le relais arbitraire, les requêtes intersites, les entrées invalides, les secrets absents, les liens et les limites d’envoi. `npm run build -- --webpack` compile la version de production.

`npm run preview:emails` génère une galerie locale dans `/tmp/monlivret-email-previews` avec trois modèles et des liens fictifs. Un autre dossier peut être passé en argument.

Après activation :

1. Créer un compte de test contrôlé par email ; vérifier le véritable champ `From`, le `Reply-To`, le français et le rendu mobile.
2. Confirmer l’adresse via le lien reçu ; vérifier Firebase `emailVerified` et l’interface.
3. Vérifier le renvoi, son délai, puis la réinitialisation du mot de passe jusqu’à la reconnexion.
4. Créer un profil par Google ; vérifier la bienvenue et l’absence de second envoi lors d’une connexion ultérieure.
5. Vérifier qu’une réponse au message arrive dans la boîte du projet et contrôler les statuts d’envoi.

Documentation : [liens d’action Firebase Admin](https://firebase.google.com/docs/auth/admin/email-action-links), [Gmail avec Nodemailer](https://nodemailer.com/guides/using-gmail), [mots de passe d’application Google](https://support.google.com/mail/answer/185833?hl=fr).
