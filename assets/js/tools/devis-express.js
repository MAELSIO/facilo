/* =========================================================
   OUTIL — Devis express
   Découpe la description en postes ; les prix restent à
   compléter par l'artisan (aucune IA ne doit inventer un prix).
   Voir PLACEHOLDER_AI_CALL pour brancher une vraie génération.
   ========================================================= */
(function(){
  "use strict";

  var form = document.getElementById('devisForm');
  var resultBlock = document.getElementById('resultBlock');
  var formError = document.getElementById('formError');
  var currentMessage = '';

  function fmtDateFR(d){ return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }

  function devisNumber(d){
    return 'DEV-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*900)+100);
  }

  /* PLACEHOLDER_AI_CALL
     Découpage naïf par virgules / retours à la ligne / " et ".
     Remplacez cette fonction par un appel à une IA capable de
     structurer une description libre en postes de devis
     (voir NOTE-FINALE.md) — gardez la même signature. */
  function splitPostes(description){
    return description
      .split(/\n|,| et /i)
      .map(function(s){ return s.trim(); })
      .filter(function(s){ return s.length > 1; });
  }

  function buildDevis(data){
    var today = new Date();
    var validite = new Date(today.getTime() + 90*86400000);
    var postes = splitPostes(data.description);
    var tvaLabel = data.tva === '0' ? 'TVA non applicable, art. 293 B du CGI' : ('TVA ' + data.tva + ' %');

    var lignes = postes.map(function(poste, i){
      var libelle = poste.charAt(0).toUpperCase() + poste.slice(1);
      return (i+1) + '. ' + libelle + '\n   Quantité : à préciser   |   Prix unitaire : ______ €   |   Total : ______ €';
    }).join('\n\n');

    var body =
      'DEVIS N° ' + devisNumber(today) + '\n' +
      'Date : ' + fmtDateFR(today) + '   |   Validité : jusqu\'au ' + fmtDateFR(validite) + '\n\n' +
      'Émetteur : ' + data.entreprise + '\n' +
      'Client : ' + data.clientNom + (data.lieu ? ('\nLieu de la prestation : ' + data.lieu) : '') +
      '\n\n----------------------------------------\nDÉTAIL DES PRESTATIONS\n----------------------------------------\n\n' +
      lignes +
      '\n\n----------------------------------------\n' +
      'Total HT : ______ €\n' + tvaLabel + '\nTotal TTC : ______ €\n' +
      '----------------------------------------\n\n' +
      'Devis gratuit, valable 90 jours. Un acompte pourra être demandé à la signature.\n\n' +
      'Bon pour accord (date et signature du client) :\n\n\n' +
      data.entreprise;

    return body;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.textContent = '';

    var entreprise = document.getElementById('entreprise').value.trim();
    var clientNom = document.getElementById('clientNom').value.trim();
    var description = document.getElementById('description').value.trim();
    var lieu = document.getElementById('lieu').value.trim();
    var tva = document.getElementById('tva').value;

    if (!entreprise || !clientNom || !description){
      formError.textContent = "Merci de remplir votre nom, le client et la description de la prestation.";
      return;
    }

    var data = { entreprise: entreprise, clientNom: clientNom, description: description, lieu: lieu, tva: tva };
    currentMessage = buildDevis(data);
    document.getElementById('msgOutput').textContent = currentMessage;
    document.getElementById('metaClient').textContent = 'Client : ' + clientNom;
    document.getElementById('metaLieu').textContent = lieu ? ('Lieu : ' + lieu) : 'Devis gratuit · 90 jours';

    document.getElementById('msgOutput').classList.add('locked');
    document.getElementById('emailGate').style.display = 'block';
    document.getElementById('resultActions').style.display = 'none';

    resultBlock.classList.add('show');
    window.FacTrack('tool_generated', { tool: 'devis-express' });
    setTimeout(function(){ resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  });

  facWireEmailGate({
    formId: 'gateForm', emailInputId: 'gateEmail', consentId: 'gateConsent', statusId: 'gateStatus',
    toolName: 'devis-express',
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
      facShowToast('Devis copié dans le presse-papier');
      setTimeout(function(){ btn.classList.remove('copied'); btn.innerHTML = original; }, 1800);
    });
  });
  document.getElementById('printMsgBtn').addEventListener('click', function(){ window.print(); });

})();
