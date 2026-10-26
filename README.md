# Portfolio — version statique (GitHub Pages)

Site 100 % HTML / CSS / JavaScript. Aucun PHP, MySQL, WAMP ou serveur nécessaire.

## 0. Ouvrir en local

Extraire le ZIP, puis double-cliquer sur `index.html` (voir `LISEZ-MOI.txt`). Les clips Twitch ne se lancent qu'une fois le site en ligne.

## 1. Personnaliser (2 minutes)

Ouvrez **`js/site-config.js`** et remplacez le nom, le métier, l'e-mail et les liens GitHub / LinkedIn.
Tout le site se met à jour (laisser une valeur vide masque le lien).
Les textes « À propos » se modifient dans `index.html`, les descriptions de projets dans `projet/*.html`.

## 2. Publier sur GitHub Pages

1. Créez un dépôt GitHub (par exemple `portfolio`).
2. Envoyez-y **le contenu de ce dossier** (pas le dossier lui-même) :
   `git init && git add . && git commit -m "Portfolio" && git branch -M main && git remote add origin <url> && git push -u origin main`
   (ou GitHub Desktop ; l'envoi par glisser-déposer web est limité à 100 fichiers à la fois).
3. Dépôt → **Settings → Pages** → Source : *Deploy from a branch* → branche `main`, dossier `/ (root)`.
4. Le site est en ligne sous `https://<pseudo>.github.io/<depot>/`.

Tous les chemins sont relatifs : le site fonctionne aussi bien à la racine que dans un sous-dossier.
Le fichier `.nojekyll` est déjà présent.

## 3. Structure

```
index.html              accueil, projets, à propos, contact
projet/                 une page de présentation par projet
css/  js/  assets/      styles, scripts (site-config.js = vos infos), polices et captures
projects/
  clipmap/                     carte de clips Twitch + jeu « Devine où c'est »
  rankfolio/                   générateur de cartes de rang gaming (éditeur, PDF)
  liggster-shop/               boutique de cartes à collectionner
  student-map/                 carte d'actions étudiantes + médiathèque (FR/EN)
  chanson-de-ta-vie/           boutique de chansons (commande en démo)
  tm-restaurant/normale/       Ming Wok (niveau NORMALE), 9 pages
  tm-restaurant/mieux/         Cosecha (niveau MIEUX), 9 pages
  tm-restaurant/deluxe/        L'Alchimie (niveau DELUXE), FR (racine) + EN (dossier en/)
  camp-nou-parc-des-princes/   carte + clips (données dans data/trip-data.js)
  belgique-miaou/              site du RFC Liège (44 pages) — en dernier
```

## 4. Ce qui diffère des projets d'origine

- **Camp Nou** : fonds de carte Esri (satellite par défaut, clair en second ; le fond sombre CARTO exigeait une clé d’API). Étapes, tracés et clips sont dans `data/trip-data.js` (modifiez ce fichier pour ajouter un jour ou des clips). Administration retirée ; « Proposer un clip » est une démo.
- **Belgica** : chaque page du CMS est figée en HTML. Comptes, connexion et administration retirés ; formulaires en démo.
- **Chanson de ta vie** : la commande est une démo (aucun paiement, aucune donnée envoyée). Les extraits audio n'étaient pas fournis : déposez vos `.mp3` dans `projects/chanson-de-ta-vie/assets/audio/demos/` (`demo-variete.mp3`, `demo-jazz.mp3`, `demo-folk.mp3`) et remplacez `data-audio-todo=` par `data-src=` dans `index.html`.
- **TM Restaurant** : un seul projet, trois niveaux : NORMALE (`normale/`, Ming Wok), MIEUX (`mieux/`, Cosecha) et DELUXE (`deluxe/`, L'Alchimie). Ming Wok et Cosecha sont des sites statiques de 9 pages ; le panier est gardé dans le navigateur (localStorage) et les formulaires sont des démos. Pour DELUXE, la vidéo du hero d'accueil est `uploads/showcase/deluxe/hero.mp4` (Full HD, 2 Mo) et `hero-mobile.mp4` (0,4 Mo, pour téléphones) ; elle tourne en boucle sans son, avec `hero-poster.jpg` en image de secours. Les photos sont hébergées sur Unsplash (image de secours locale si indisponible).

## 5. Dépendances externes (chargées par les visiteurs)

Google Fonts (polices des projets), tuiles de carte CARTO / OpenStreetMap, OSRM (tracés de secours), lecteurs Twitch, photos Unsplash.
Le portfolio lui-même (polices, scripts, images) est entièrement local.

## 6. Sécurité

Aucun secret n'est inclus. Ne publiez jamais les fichiers d'origine `config.php` (clé Twitch) ni `.env`.

## 7. Intro animée

L'accueil commence par une intro (logo qui se remplit, puis rideau qui se lève au défilement ou tout seul), une fois par session. `index.html?intro=1` la rejoue. Elle est ignorée si le visiteur a demandé moins d'animations.
