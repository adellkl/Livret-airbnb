# Référencement de Mon Livret

## Ce qui est en place

- Titres, descriptions, URL canoniques et aperçus Open Graph/Twitter propres aux six pages publiques.
- Une adresse canonique unique, définie par `NEXT_PUBLIC_APP_URL` (par défaut `https://monlivret.eu`). Les URL temporaires Vercel ne sont jamais utilisées comme domaine canonique.
- Un sitemap `/sitemap.xml` contenant uniquement les pages publiques, sans logements, réservations ou identifiants voyageurs.
- Un `/robots.txt` qui permet aux moteurs de lire les directives `noindex` des pages privées. Le blocage de crawl ne remplace pas `noindex`.
- Des directives `noindex` en HTML et dans l’en-tête HTTP des guides, espaces propriétaire/admin, pages de compte et API.
- Des données structurées Organization, WebSite et WebApplication sur l’accueil. Aucun faux avis ni résultat commercial inventé.
- Un titre H1 unique sur l’accueil, des liens internes vers les fonctionnalités, tarifs et informations légales.
- Les versions de développement et de preview Vercel ne sont pas indexables. Sur les autres hébergeurs, définir `SEO_INDEXABLE=false` pour les environnements de test construits en production.

`noindex` est une consigne aux moteurs, pas un contrôle d’accès. L’authentification et les règles Firebase restent indispensables.

## Mise en ligne

1. Renseigner `NEXT_PUBLIC_APP_URL` avec le domaine final en HTTPS, puis reconstruire et déployer le site. Vérifier également les variables Firebase requises.
2. Configurer chez l’hébergeur les redirections permanentes HTTP vers HTTPS et du domaine secondaire (`www` ou sans `www`) vers le domaine choisi. Éviter toute boucle de redirection.
3. Dans Google Search Console, ajouter une propriété Domaine et valider le DNS. Autre possibilité : validation d’une propriété URL via `GOOGLE_SITE_VERIFICATION`, suivie d’un nouveau déploiement.
4. Envoyer `https://monlivret.eu/sitemap.xml` dans Search Console. Adapter l’adresse si le domaine change.
5. Vérifier l’accueil, les fonctionnalités et les tarifs dans l’inspection d’URL, puis demander leur indexation.
6. Ajouter le site dans Bing Webmaster Tools si souhaité (`BING_SITE_VERIFICATION`), puis envoyer le sitemap.
7. Vérifier les données structurées et les aperçus sociaux sur l’URL en ligne. Le balisage ne garantit pas l’affichage d’un résultat enrichi.

Ces opérations nécessitent l’accès au domaine et aux comptes des moteurs ; elles ne sont pas effectuées par un commit ou un push.

## Suivi et contenu

- Surveiller l’indexation, les requêtes, les impressions, les clics et les Core Web Vitals dans Search Console.
- Décrire les fonctionnalités réellement disponibles et garder les tarifs à jour.
- Publier ensuite des contenus utiles et originaux : préparer l’arrivée, rédiger les consignes du Wi-Fi, organiser les informations d’une conciergerie. Éviter les pages dupliquées par ville sans contenu spécifique.
- Les comptes voyageurs et les livrets ne doivent jamais servir de pages d’acquisition.
- Aucun traceur publicitaire ou analytics n’est ajouté par cette configuration.

## Vérification locale

```sh
npm run build
npm start -- --port 3100
# Dans un autre terminal :
node scripts/verify-seo.mjs http://localhost:3100
```

Le contrôle vérifie les pages publiques, les balises canoniques, les directives privées, le sitemap et les données structurées sur le HTML réellement servi. Il attend une compilation indexable (`SEO_INDEXABLE` différent de `false`, hors preview).

Références : [Google — noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Google — données structurées](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
