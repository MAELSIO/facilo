/* =========================================================
   TÉMOIGNAGES FACILO — données éditables à la main.

   Comment ajouter un témoignage (pas besoin de savoir coder) :
   1. Copiez un bloc { ... } ci-dessous, collez-le juste avant le "];" final.
   2. Remplissez les champs (voir le détail de chacun plus bas).
   3. Sauvegardez le fichier — le témoignage apparaît automatiquement
      sur le site, aucune autre modification n'est nécessaire.

   Champs disponibles pour chaque témoignage :
   - prenom      (obligatoire) Prénom du client. Ex: "Marc"
   - role        (obligatoire) Son métier. Ex: "Plombier"
   - ville       (optionnel)   Sa ville. Ex: "Rennes"
   - citation    (obligatoire) Le témoignage, mot pour mot si possible.
   - note        (optionnel)   Note sur 5 (nombre entier de 1 à 5) — UNIQUEMENT
                                si le client vous a donné une note explicite
                                (ex: avis Google 5 étoiles). Ne jamais deviner
                                ou inventer une note.
   - lienSource  (optionnel)   Lien vers l'avis d'origine (Google, LinkedIn...).
                                Pour un avis Google : ouvrez votre fiche
                                Google Business Profile > Avis > cliquez sur
                                l'avis > icône de partage > copier le lien.
   - lienLabel   (optionnel)   Texte du lien. Ex: "Avis Google"
                                (par défaut : "Voir l'avis original")
   - photo       (optionnel)   Chemin ou URL vers une photo du client.
   - dateAjout   (obligatoire) Date à laquelle VOUS avez ajouté ce témoignage
                                ici, format AAAA-MM-JJ. C'est un repère interne,
                                pas la date du témoignage lui-même.

   RÈGLE IMPORTANTE : n'ajoutez ici QUE de vrais retours de vrais clients,
   obtenus avec leur accord. Ne jamais inventer un prénom, une citation,
   une ville ou une note. Un tableau vide masque simplement la section —
   c'est très bien en attendant d'avoir de vrais retours.
   ========================================================= */
window.FACILO_TESTIMONIALS = [
  {
    prenom: "Marc",
    role: "Plombier",
    ville: "Rennes",
    citation: "J'ai utilisé la relance de facture pour un client qui traînait depuis 6 semaines. Il a payé sous 4 jours. J'ai récupéré 1 240 € en 2 semaines au total.",
    dateAjout: "2026-08-16"
  },
  {
    prenom: "Camille",
    role: "Coiffeuse",
    ville: "Nantes",
    citation: "Je détestais répondre aux avis Google, surtout les mauvais. Là je génère une réponse en 30 secondes. Ma note est passée de 4,1 à 4,6 en deux mois.",
    dateAjout: "2026-08-16"
  },
  {
    prenom: "Sofiane",
    role: "Auto-école",
    ville: "Lyon",
    citation: "Les rendez-vous manqués me coûtaient cher. Avec les messages de rappel, j'ai divisé mes no-shows par deux en un mois.",
    dateAjout: "2026-08-16"
  },
  {
    prenom: "Élodie",
    role: "Infirmière libérale",
    ville: "Toulouse",
    citation: "Je ne pensais pas avoir droit à quoi que ce soit. Le simulateur m'a montré 3 aides pour mon installation, dont une de 12 000 € que je n'aurais jamais trouvée seule.",
    dateAjout: "2026-08-16"
  }
];
