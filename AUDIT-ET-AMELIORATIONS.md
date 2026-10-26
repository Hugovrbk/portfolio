# Audit et améliorations du portfolio

Analyse faite sur le code du site principal (accueil, 8 pages projet, 404, CSS, JS) et sur des rendus desktop, mobile et mode sombre. Les sites de démonstration du dossier `projects/` n'ont pas été modifiés.

## Ce qui est déjà bien
- Identité visuelle cohérente, polices et scripts hébergés en local, images WebP avec dimensions déclarées, chargement différé des captures.
- Bases d'accessibilité solides : lien d'évitement, focus visible, mode sombre, respect de « réduire les animations », filtres avec `aria-pressed`.
- Pages projet claires : objectif, réalisations, technologies, captures, aperçu interactif, et honnêteté sur ce qui diffère du projet d'origine.

## Corrigé dans cette version
| Problème | Correction |
|---|---|
| Titre, e-mail et GitHub affichaient « Prénom Nom » / `exemple.be` dans le HTML : c'est ce que voient les aperçus de lien (Slack, WhatsApp, LinkedIn) et les moteurs de recherche. | Valeurs réelles écrites dans toutes les pages. `site-config.js` reste prioritaire, et le titre se met toujours à jour via le dernier segment « … — Nom ». |
| Aucune balise de partage ni `theme-color`. | Balises Open Graph, Twitter et `theme-color` clair/sombre ajoutées à l'accueil. |
| Les points de la texture passaient derrière le paragraphe d'introduction et le rendaient moins lisible. | Texture quasi absente derrière la colonne de texte (calée sur sa largeur réelle). |
| L'écran d'intro était `aria-hidden` mais contenait le bouton « Passer », et la page derrière restait accessible au clavier. | Intro non masquée, reste de la page inerte pendant l'intro, focus sur « Passer ». Sécurité ajoutée : si `intro.js` ne se charge pas, l'intro disparaît après 4 s au lieu de bloquer le site. |
| TM Restaurant chargeait d'un coup les 3 sites (dont la vidéo de 2 Mo de L'Alchimie). | Seule la bande visible et la suivante sont chargées. |
| Le bouton « Copier » affichait « Copié » même en cas d'échec. | Vraie détection de réussite, solution de repli, message « Copie impossible » si besoin. |
| Le formulaire ouvrait la messagerie sans retour, avec des sauts de ligne mal encodés. | Message de confirmation, adresse non encodée, retours à la ligne `\r\n`. |
| Les tags (PHP, MySQL, Mollie…) laissaient croire que ces technologies tournent dans la démo. | Phrase d'explication sous « Mes projets ». |

## Non fait : à regarder ensuite
- **Image et URL de partage** : `og:image`, `og:url`, `canonical` et `sitemap.xml` demandent l'adresse finale du site, que je n'ai pas.
- **404 sur GitHub Pages** : `404.html` utilise des chemins relatifs, donc sur une adresse introuvable *imbriquée* (ex. `/portfolio/a/b`) la page peut s'afficher sans style.
- **Ordre des projets** : sur l'accueil, TM Restaurant est en premier, mais dans les boutons « précédent / suivant » des pages projet il se trouve entre Chanson de ta vie et Camp Nou.
- **`projects/tm-restaurant.zip`** (2,7 Mo) : archive oubliée qui sera publiée avec le site. Elle n'est pas dans ce ZIP ; supprimez-la du dépôt : `git rm projects/tm-restaurant.zip`.
- **Doublons d'images** dans `belgique-miaou/multimedia/img/sponsors` et `sponsor` (mêmes fichiers deux ou trois fois).
- **Contenu** : une adresse e-mail plus sobre que `hugolepigeon@gmail.com`, une photo, la ville, un CV et vos disponibilités dans « À propos » renforceraient la page pour un recruteur.
- Une bascule manuelle clair / sombre (aujourd'hui, uniquement selon le système).
