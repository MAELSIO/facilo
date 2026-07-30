# Facilo — note finale de livraison

Le contenu détaillé (arborescence, intégrations, priorités) a été transformé en guide pas à pas,
plus lisible qu'un long fichier texte : **ouvrez `guide-demarrage/index.html` dans un navigateur**
(double-clic sur le fichier, ou via `npx serve facilo`).

Le guide couvre, dans l'ordre de priorité réel d'un lancement SaaS (recherché, pas arbitraire) :

1. Informations légales, marque et tarif définitif — bloquant
2. Connecter la capture d'email à un vrai outil d'emailing — bloquant
3. Mettre en place le suivi des conversions (Plausible/Umami) — important
4. Alimenter la vraie base de dispositifs d'aides — important
5. Brancher une vraie IA de génération sur les 4 autres outils — confort

Chaque étape explique où intervenir dans le code, pourquoi elle est classée à ce rang, et
renvoie vers l'étape suivante.

## Arborescence

```
facilo/
├── index.html, offre.html, mentions-legales.html, confidentialite.html, cgv.html, cookies.html
├── outils/                        Les 5 outils gratuits
├── aide/                          Centre d'aide public (15 articles + hub)
├── guide-demarrage/                Guide de démarrage interne (5 étapes + hub) — noindex
└── assets/
    ├── css/style.css
    ├── js/common.js
    └── js/tools/*.js
```
