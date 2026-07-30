/* =========================================================
   OUTIL — Simulateur d'aides et subventions
   Filtrage déterministe sur une base de dispositifs en dur
   (voir PLACEHOLDER_AIDES_DB plus bas pour brancher une vraie
   base de données nationale + régionale + sectorielle,
   voir NOTE-FINALE.md).
   ========================================================= */
(function(){
  "use strict";

  var form = document.getElementById('aidesForm');
  var resultBlock = document.getElementById('resultBlock');
  var formError = document.getElementById('formError');

  /* PLACEHOLDER_AIDES_DB
     Base de démonstration. Chaque dispositif est volontairement
     générique et doit être remplacé par des données à jour
     (France Num, Bpifrance, régions, OPCO, ARS, chambres
     consulaires...). Champs :
       - metiers: ['all'] ou liste de métiers concernés
       - regions: ['all'] ou liste de régions concernées
       - projets: ['all'] ou liste parmi digitalisation/materiel/recrutement/energie
       - ancienneteMax (années, Infinity si aucune limite) : l'aide cible les jeunes entreprises
       - effectifMax (nombre de salariés max, Infinity si aucune limite)
       - type: 'national' | 'regional' | 'sectoriel'
       - montantMax: nombre utilisé pour le total estimé
       - montantLabel: texte affiché
  */
  var AIDES_DB = [
    {
      id: 'france-num',
      nom: "Aide à la digitalisation des TPE (France Num)",
      type: 'national',
      metiers: ['all'], regions: ['all'], projets: ['digitalisation'],
      ancienneteMax: Infinity, effectifMax: 49,
      montantMax: 2500, montantLabel: "Jusqu'à 2 500 €",
      desc: "Diagnostic numérique gratuit et chèque pour financer un site, une caisse connectée ou un logiciel de gestion."
    },
    {
      id: 'acre',
      nom: "Exonération de charges jeune entreprise (ACRE)",
      type: 'national',
      metiers: ['all'], regions: ['all'], projets: ['all'],
      ancienneteMax: 1, effectifMax: Infinity,
      montantMax: 3500, montantLabel: "Jusqu'à 50 % de charges sociales en moins la 1ère année",
      desc: "Réduction des cotisations sociales pendant les premiers mois d'activité pour les entreprises récentes."
    },
    {
      id: 'aide-embauche',
      nom: "Aide à l'embauche d'un premier salarié ou apprenti",
      type: 'national',
      metiers: ['all'], regions: ['all'], projets: ['recrutement'],
      ancienneteMax: Infinity, effectifMax: 10,
      montantMax: 6000, montantLabel: "Jusqu'à 6 000 € par contrat",
      desc: "Aide versée sur un à deux ans pour l'embauche d'un apprenti ou d'un premier salarié en contrat pro."
    },
    {
      id: 'opco-formation',
      nom: "Prise en charge d'une formation par votre OPCO",
      type: 'sectoriel',
      metiers: ['all'], regions: ['all'], projets: ['all'],
      ancienneteMax: Infinity, effectifMax: Infinity,
      montantMax: 1800, montantLabel: "Jusqu'à 100 % du coût pédagogique",
      desc: "Formation du dirigeant ou des salariés financée en tout ou partie par votre opérateur de compétences."
    },
    {
      id: 'renov-energie',
      nom: "Aide à la rénovation énergétique des locaux professionnels",
      type: 'national',
      metiers: ['btp', 'commerce', 'restauration', 'coiffure', 'immobilier'], regions: ['all'], projets: ['energie'],
      ancienneteMax: Infinity, effectifMax: 49,
      montantMax: 10000, montantLabel: "Jusqu'à 10 000 €",
      desc: "Financement de travaux d'isolation, de chauffage ou d'équipements moins énergivores pour votre local."
    },
    {
      id: 'aide-regionale-invest',
      nom: "Aide régionale à l'investissement des TPE",
      type: 'regional',
      metiers: ['all'], regions: ['all'], projets: ['materiel', 'digitalisation', 'energie'],
      ancienneteMax: Infinity, effectifMax: 20,
      montantMax: 8000, montantLabel: "De 2 000 € à 8 000 € selon votre région",
      desc: "Subvention ou avance remboursable pour l'achat de matériel ou la modernisation de votre activité, selon votre conseil régional."
    },
    {
      id: 'credit-impot-formation',
      nom: "Crédit d'impôt formation du chef d'entreprise",
      type: 'national',
      metiers: ['all'], regions: ['all'], projets: ['all'],
      ancienneteMax: Infinity, effectifMax: 10,
      montantMax: 486, montantLabel: "Jusqu'à 486 €",
      desc: "Crédit d'impôt calculé sur les heures de formation suivies par le dirigeant, à déduire de l'impôt sur les sociétés ou le revenu."
    },
    {
      id: 'rge-btp',
      nom: "Accompagnement à la qualification RGE",
      type: 'sectoriel',
      metiers: ['btp'], regions: ['all'], projets: ['all'],
      ancienneteMax: Infinity, effectifMax: 49,
      montantMax: 1200, montantLabel: "Jusqu'à 1 200 € de prise en charge",
      desc: "Accompagnement et financement partiel de la formation menant à la qualification RGE, qui ouvre l'accès aux chantiers aidés."
    },
    {
      id: 'ars-zone-sous-dotee',
      nom: "Aide à l'installation en zone sous-dotée (ARS)",
      type: 'regional',
      metiers: ['sante'], regions: ['all'], projets: ['all'],
      ancienneteMax: 3, effectifMax: Infinity,
      montantMax: 50000, montantLabel: "Jusqu'à 50 000 €",
      desc: "Aide à l'installation pour les professionnels de santé indépendants qui s'installent dans une zone identifiée comme sous-dotée."
    },
    {
      id: 'commerce-proximite',
      nom: "Fonds de soutien au commerce de proximité",
      type: 'regional',
      metiers: ['commerce', 'restauration', 'coiffure'], regions: ['all'], projets: ['materiel', 'digitalisation', 'energie'],
      ancienneteMax: Infinity, effectifMax: 10,
      montantMax: 20000, montantLabel: "Jusqu'à 20 000 €",
      desc: "Subvention locale pour la modernisation, la mise aux normes ou la rénovation de vitrine d'un commerce de centre-ville."
    },
    {
      id: 'pret-honneur',
      nom: "Prêt d'honneur à taux zéro (jeunes entreprises)",
      type: 'national',
      metiers: ['all'], regions: ['all'], projets: ['all'],
      ancienneteMax: 3, effectifMax: Infinity,
      montantMax: 15000, montantLabel: "Jusqu'à 15 000 € à taux zéro",
      desc: "Prêt personnel sans garantie ni intérêt, qui renforce vos fonds propres et facilite l'accès à un prêt bancaire complémentaire."
    },
    {
      id: 'liberal-cpf',
      nom: "Financement CPF pour indépendants et professions libérales",
      type: 'sectoriel',
      metiers: ['liberal', 'sante'], regions: ['all'], projets: ['all'],
      ancienneteMax: Infinity, effectifMax: Infinity,
      montantMax: 1500, montantLabel: "Jusqu'à 1 500 € de droits mobilisables",
      desc: "Droits à la formation mobilisables sur votre compte personnel pour développer ou faire évoluer votre activité."
    }
  ];

  var METIER_LABELS = {
    btp: 'BTP / artisanat', restauration: 'Restauration', coiffure: 'Coiffure / beauté',
    commerce: 'Commerce de proximité', immobilier: 'Immobilier', sante: 'Santé / paramédical indépendant',
    liberal: 'Autre profession libérale'
  };
  var TYPE_LABELS = { national: 'National', regional: 'Régional', sectoriel: 'Sectoriel / OPCO' };

  function fmtEuro(n){ return n.toLocaleString('fr-FR') + ' €'; }

  function matchAide(a, profil){
    if (a.metiers.indexOf('all') === -1 && a.metiers.indexOf(profil.metier) === -1) return false;
    if (a.ancienneteMax < profil.anciennete) return false;
    if (a.effectifMax < profil.effectif) return false;
    if (a.projets.indexOf('all') === -1 && !profil.projets.some(function(p){ return a.projets.indexOf(p) !== -1; })) return false;
    return true;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.textContent = '';

    var metier = document.getElementById('metier').value;
    var region = document.getElementById('region').value;
    var anciennete = parseFloat(document.getElementById('anciennete').value);
    var effectif = parseFloat(document.getElementById('effectif').value);
    var projets = Array.prototype.slice.call(form.querySelectorAll('input[name=projet]:checked')).map(function(i){ return i.value; });

    if (!metier || !region || isNaN(anciennete) || isNaN(effectif) || projets.length === 0){
      formError.textContent = "Merci de compléter tous les champs, dont au moins un type de projet.";
      return;
    }

    var profil = { metier: metier, region: region, anciennete: anciennete, effectif: effectif, projets: projets };
    var matches = AIDES_DB.filter(function(a){ return matchAide(a, profil); })
      .sort(function(a, b){ return b.montantMax - a.montantMax; });

    if (matches.length === 0){
      matches = AIDES_DB.filter(function(a){ return a.metiers.indexOf('all') !== -1 && a.projets.indexOf('all') !== -1; })
        .sort(function(a, b){ return b.montantMax - a.montantMax; })
        .slice(0, 3);
    }

    var total = matches.reduce(function(sum, a){ return sum + a.montantMax; }, 0);

    document.getElementById('totalAmount').textContent = fmtEuro(total);
    document.getElementById('totalCount').textContent = matches.length + ' dispositif' + (matches.length > 1 ? 's' : '') + ' potentiellement accessible' + (matches.length > 1 ? 's' : '');

    var listEl = document.getElementById('aideList');
    listEl.innerHTML = matches.map(function(a){
      return '' +
        '<div class="aide-card">' +
          '<div class="aide-card-main">' +
            '<span class="aide-badge ' + a.type + '">' + TYPE_LABELS[a.type] + '</span>' +
            '<h4>' + a.nom + '</h4>' +
            '<p>' + a.desc + '</p>' +
          '</div>' +
          '<div class="aide-amount">' + fmtEuro(a.montantMax) + '<span>estimation</span></div>' +
        '</div>';
    }).join('');
    listEl.classList.toggle('locked', matches.length > 2);
    document.getElementById('lockMore').style.display = matches.length > 2 ? 'block' : 'none';
    document.getElementById('lockMoreCount').textContent = Math.max(matches.length - 2, 0);

    document.getElementById('emailGate').style.display = 'block';
    document.getElementById('resultActions').style.display = 'none';

    resultBlock.classList.add('show');
    window.FacTrack('tool_generated', { tool: 'simulateur-aides', metier: metier, region: region });
    setTimeout(function(){ resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  });

  facWireEmailGate({
    formId: 'gateForm', emailInputId: 'gateEmail', consentId: 'gateConsent', statusId: 'gateStatus',
    toolName: 'simulateur-aides',
    onUnlock: function(){
      document.getElementById('aideList').classList.remove('locked');
      document.getElementById('lockMore').style.display = 'none';
      document.getElementById('resultActions').style.display = 'flex';
      document.getElementById('upsellNudge').classList.add('show');
    }
  });

  document.getElementById('goOffreBtn').addEventListener('click', function(){
    window.FacTrack('cta_click_offre', { source: 'simulateur-aides' });
  });

})();
