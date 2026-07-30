/* =========================================================
   OUTIL — Réponse à un avis client
   Détection de ton par mots-clés + templates déterministes.
   Voir PLACEHOLDER_AI_CALL pour brancher une vraie IA.
   ========================================================= */
(function(){
  "use strict";

  var form = document.getElementById('avisForm');
  var resultBlock = document.getElementById('resultBlock');
  var tonDesc = document.getElementById('tonDesc');
  var formError = document.getElementById('formError');
  var currentMessage = '';

  var TON_DESCRIPTIONS = {
    auto: "On analyse le texte de l'avis pour déterminer s'il est plutôt positif ou négatif.",
    positif: "Réponse de remerciement, chaleureuse et courte.",
    negatif: "Réponse posée, qui reconnaît le problème et propose une solution."
  };
  function updateTonDesc(){
    tonDesc.textContent = TON_DESCRIPTIONS[form.querySelector('input[name=ton]:checked').value];
  }
  form.querySelectorAll('input[name=ton]').forEach(function(r){ r.addEventListener('change', updateTonDesc); });
  updateTonDesc();

  var SECTEUR_LABELS = { restaurant: 'Restauration', coiffure: 'Coiffure / beauté', commerce: 'Commerce de proximité', immobilier: 'Immobilier' };

  /* PLACEHOLDER_AI_CALL — heuristique simple de détection de ton.
     À remplacer par une analyse de sentiment via une vraie API IA
     si vous voulez une détection plus fine (voir NOTE-FINALE.md). */
  var NEG_WORDS = ['décevant','deçu','déçu','nul','horrible','mauvais','sale','attente','retard','cher','froid','impoli','erreur','problème','annulé','sans réponse'];
  var POS_WORDS = ['super','excellent','parfait','génial','recommande','merci','top','impeccable','adorable','rapide','professionnel','satisfait'];

  function detectTon(texte){
    var t = texte.toLowerCase();
    var score = 0;
    POS_WORDS.forEach(function(w){ if (t.indexOf(w) !== -1) score++; });
    NEG_WORDS.forEach(function(w){ if (t.indexOf(w) !== -1) score--; });
    return score < 0 ? 'negatif' : 'positif';
  }

  function buildReponse(data){
    var greeting = "Bonjour";
    var sign = data.signataire ? ("\n" + data.signataire + " — " + data.commerce) : ("\nL'équipe " + data.commerce);

    if (data.ton === 'positif'){
      return greeting + ",\n\n" +
        "Merci beaucoup pour ce retour, ça nous touche vraiment ! C'est un plaisir de vous compter parmi nos clients, et on espère vous revoir très bientôt." +
        "\n\nÀ très vite," + sign;
    }
    return greeting + ",\n\n" +
      "Merci d'avoir pris le temps de nous faire ce retour. Nous sommes désolés que votre expérience n'ait pas été à la hauteur de ce que vous étiez en droit d'attendre." +
      "\n\nNous prenons cela très au sérieux : n'hésitez pas à nous contacter directement pour qu'on puisse comprendre ce qui s'est passé et faire en sorte que ça ne se reproduise pas." +
      "\n\nCordialement," + sign;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.textContent = '';

    var avisTexte = document.getElementById('avisTexte').value.trim();
    var commerce = document.getElementById('commerce').value.trim();
    var secteur = document.getElementById('secteur').value;
    var tonChoice = form.querySelector('input[name=ton]:checked').value;
    var signataire = document.getElementById('signataire').value.trim();

    if (!avisTexte || !commerce){
      formError.textContent = "Merci de coller l'avis reçu et d'indiquer le nom de votre établissement.";
      return;
    }

    var ton = tonChoice === 'auto' ? detectTon(avisTexte) : tonChoice;
    var data = { commerce: commerce, secteur: secteur, ton: ton, signataire: signataire };

    currentMessage = buildReponse(data);
    document.getElementById('msgOutput').textContent = currentMessage;
    document.getElementById('metaTon').textContent = 'Ton détecté : ' + (ton === 'positif' ? 'Positif' : 'Négatif');
    document.getElementById('metaSecteur').textContent = SECTEUR_LABELS[secteur];

    document.getElementById('msgOutput').classList.add('locked');
    document.getElementById('emailGate').style.display = 'block';
    document.getElementById('resultActions').style.display = 'none';

    resultBlock.classList.add('show');
    window.FacTrack('tool_generated', { tool: 'reponse-avis' });
    setTimeout(function(){ resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  });

  facWireEmailGate({
    formId: 'gateForm', emailInputId: 'gateEmail', consentId: 'gateConsent', statusId: 'gateStatus',
    toolName: 'reponse-avis',
    onUnlock: function(){
      document.getElementById('msgOutput').classList.remove('locked');
      document.getElementById('resultActions').style.display = 'flex';
      document.getElementById('upsellNudge').classList.add('show');
    }
  });

  document.getElementById('copyMsgBtn').addEventListener('click', function(){
    var btn = this;
    facCopyText(currentMessage).then(function(){
      var original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '<span aria-hidden="true">✓</span> Copié !';
      facShowToast('Réponse copiée dans le presse-papier');
      setTimeout(function(){ btn.classList.remove('copied'); btn.innerHTML = original; }, 1800);
    });
  });

})();
