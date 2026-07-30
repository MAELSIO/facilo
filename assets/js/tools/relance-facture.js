/* =========================================================
   OUTIL — Relance de facture impayée
   Génération 100% déterministe côté navigateur (voir bloc
   PLACEHOLDER_AI_CALL plus bas pour brancher une vraie IA).
   ========================================================= */
(function(){
  "use strict";

  var form = document.getElementById('relanceForm');
  var resultBlock = document.getElementById('resultBlock');
  var levelDesc = document.getElementById('levelDesc');
  var formError = document.getElementById('formError');
  var currentMessages = { email: '', sms: '' };
  var currentTab = 'email';

  var LEVEL_DESCRIPTIONS = {
    '1': "Message léger et bienveillant, comme si c'était un simple oubli.",
    '2': "Ton plus ferme : nouveau délai fixé et conséquences rappelées clairement.",
    '3': "Courrier officiel de mise en demeure, à envoyer si possible en recommandé avec accusé de réception."
  };

  function updateLevelDesc(){
    var level = form.querySelector('input[name=level]:checked').value;
    levelDesc.textContent = LEVEL_DESCRIPTIONS[level];
  }
  form.querySelectorAll('input[name=level]').forEach(function(r){ r.addEventListener('change', updateLevelDesc); });
  updateLevelDesc();

  function fmtDateFR(d){ return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function fmtAmount(n){ return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function daysLate(dueDateVal){
    var d0 = new Date(dueDateVal); d0.setHours(0,0,0,0);
    var d1 = new Date(); d1.setHours(0,0,0,0);
    return Math.round((d1 - d0) / 86400000);
  }

  function buildSubject(data){
    var invoiceRef = data.invoice ? (' ' + data.invoice) : '';
    if (data.level === '1') return 'Petit rappel au sujet de votre facture' + invoiceRef;
    if (data.level === '2') return 'Facture' + invoiceRef + ' : toujours en attente de règlement';
    return 'Mise en demeure de payer — facture' + invoiceRef;
  }

  /* PLACEHOLDER_AI_CALL
     Remplacez le corps de buildEmail()/buildSms() par un appel à votre
     API de génération de texte (voir NOTE-FINALE.md). Gardez la même
     signature (reçoit `data`, retourne une chaîne) pour ne rien changer
     ailleurs dans ce fichier. */
  function buildEmail(data){
    var greeting = data.clientType === 'particulier' ? ('Bonjour ' + data.client + ',') : ('Bonjour,');
    var invoiceRef = data.invoice ? (' (référence ' + data.invoice + ')') : '';
    var lateText = data.days > 0
      ? ("le délai de paiement est dépassé de " + data.days + " jour" + (data.days > 1 ? 's' : '') + " (échéance fixée au " + fmtDateFR(data.dueDate) + ")")
      : ("l'échéance du " + fmtDateFR(data.dueDate) + " approche")
    ;
    var payinfo = data.payinfo ? ("\n\nVoici de nouveau les coordonnées utiles pour régler cette facture :\n" + data.payinfo) : '';
    var signature = "\n\nBien cordialement,\n" + data.artisan + (data.phone ? ("\n" + data.phone) : '');
    var body = '';

    if (data.level === '1'){
      body = greeting + "\n\n" +
        "Un point rapide sur la facture" + invoiceRef + " de " + fmtAmount(data.amount) + " : " + lateText + " et je n'ai pas encore reçu le règlement.\n\n" +
        "Ce genre d'oubli arrive à tout le monde, aucun souci. Pourriez-vous simplement y jeter un œil dans les prochains jours ? Et si ce paiement est déjà parti de votre côté, ce message n'a plus lieu d'être — merci de l'ignorer." +
        payinfo + signature;
    } else if (data.level === '2'){
      var penalite = data.clientType === 'professionnel'
        ? "\n\nSans retour de votre part, sachez que des pénalités de retard ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement deviendront exigibles, comme le prévoit l'article L441-10 du Code de commerce."
        : "\n\nÀ défaut de régularisation, des frais de recouvrement pourront s'appliquer, conformément à nos conditions générales de vente.";
      body = greeting + "\n\n" +
        "Je reviens vers vous une seconde fois au sujet de la facture" + invoiceRef + " de " + fmtAmount(data.amount) + ", toujours en attente de paiement : " + lateText + ".\n\n" +
        "Merci de procéder au règlement sous 8 jours à compter de ce message." +
        penalite + payinfo + signature;
    } else {
      var legalRef = data.clientType === 'professionnel'
        ? "Je vous rappelle qu'en application de l'article L441-10 du Code de commerce, les pénalités de retard et l'indemnité forfaitaire de 40 € pour frais de recouvrement sont d'ores et déjà acquises de plein droit."
        : "À défaut de paiement dans ce délai, des frais de recouvrement pourront être appliqués conformément à nos conditions générales de vente.";
      body = data.client + ",\n\n" +
        "Les relances précédentes concernant la facture" + invoiceRef + " de " + fmtAmount(data.amount) + " étant restées sans effet — " + lateText + " —, je vous adresse cette mise en demeure de payer.\n\n" +
        "Je vous demande de régler l'intégralité de cette somme dans un délai de 8 jours à réception du présent courrier.\n\n" +
        legalRef + "\n\n" +
        "Passé ce délai, et sans nouvelle de votre part, j'engagerai les démarches nécessaires au recouvrement de cette créance, y compris par voie judiciaire si besoin." +
        payinfo + "\n\nJe reste disponible pour trouver une solution rapide avec vous," + signature;
    }
    return body;
  }

  function buildSms(data){
    var invoiceRef = data.invoice ? (' (' + data.invoice + ')') : '';
    var lateText = data.days > 0 ? (data.days + ' j de retard') : ("échéance le " + fmtDateFR(data.dueDate));
    if (data.level === '1') return "Bonjour, un rapide rappel : la facture" + invoiceRef + " de " + fmtAmount(data.amount) + " est encore en attente de règlement (" + lateText + "). Merci d'y penser dès que possible ! " + data.artisan;
    if (data.level === '2') return "Bonjour, la facture" + invoiceRef + " de " + fmtAmount(data.amount) + " n'a toujours pas été réglée (" + lateText + "). Merci de régulariser sous 8 jours pour éviter des frais supplémentaires. " + data.artisan;
    return "Mise en demeure envoyée pour la facture" + invoiceRef + " de " + fmtAmount(data.amount) + ", impayée (" + lateText + "). Un courrier officiel suit. Merci de régulariser sous 8 jours. " + data.artisan;
  }

  function showTab(tab){
    currentTab = tab;
    document.getElementById('tabEmail').setAttribute('aria-selected', tab === 'email');
    document.getElementById('tabSms').setAttribute('aria-selected', tab === 'sms');
    document.getElementById('msgOutput').textContent = currentMessages[tab];
    document.getElementById('msgSubjectRow').style.display = tab === 'email' ? 'flex' : 'none';
  }
  document.getElementById('tabEmail').addEventListener('click', function(){ showTab('email'); });
  document.getElementById('tabSms').addEventListener('click', function(){ showTab('sms'); });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.textContent = '';

    var artisan = document.getElementById('artisan').value.trim();
    var client = document.getElementById('client').value.trim();
    var invoice = document.getElementById('invoice').value.trim();
    var amount = parseFloat(document.getElementById('amount').value);
    var dueDateVal = document.getElementById('dueDate').value;
    var clientType = form.querySelector('input[name=clientType]:checked').value;
    var level = form.querySelector('input[name=level]:checked').value;
    var payinfo = document.getElementById('payinfo').value.trim();
    var phone = document.getElementById('phone').value.trim();

    if (!artisan || !client || !dueDateVal || isNaN(amount) || amount <= 0){
      formError.textContent = "Merci de remplir au minimum votre nom, le client, le montant et la date d'échéance.";
      return;
    }

    var dueDate = new Date(dueDateVal);
    var data = { artisan: artisan, client: client, invoice: invoice, amount: amount, dueDate: dueDate, days: daysLate(dueDateVal), clientType: clientType, level: level, payinfo: payinfo, phone: phone };

    currentMessages.email = buildEmail(data);
    currentMessages.sms = buildSms(data);
    document.getElementById('msgSubject').textContent = buildSubject(data);
    document.getElementById('metaClient').textContent = 'Client : ' + client;
    document.getElementById('metaAmount').textContent = 'Montant : ' + fmtAmount(amount);
    document.getElementById('metaDays').textContent = data.days > 0 ? ('Retard : ' + data.days + ' jour' + (data.days > 1 ? 's' : '')) : "Pas encore en retard";

    showTab('email');
    document.getElementById('msgOutput').classList.add('locked');
    document.getElementById('emailGate').style.display = 'block';
    document.getElementById('resultActions').style.display = 'none';

    resultBlock.classList.add('show');
    window.FacTrack('tool_generated', { tool: 'relance-facture' });
    setTimeout(function(){ resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  });

  facWireEmailGate({
    formId: 'gateForm', emailInputId: 'gateEmail', consentId: 'gateConsent', statusId: 'gateStatus',
    toolName: 'relance-facture',
    onUnlock: function(){
      document.getElementById('msgOutput').classList.remove('locked');
      document.getElementById('resultActions').style.display = 'flex';
      document.getElementById('upsellNudge').classList.add('show');
    }
  });

  document.getElementById('copyMsgBtn').addEventListener('click', function(){
    var btn = this;
    facCopyText(currentMessages[currentTab]).then(function(){
      var original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '<span aria-hidden="true">✓</span> Copié !';
      facShowToast('Message copié dans le presse-papier');
      setTimeout(function(){ btn.classList.remove('copied'); btn.innerHTML = original; }, 1800);
    });
  });
  document.getElementById('copySubjectBtn').addEventListener('click', function(){
    facCopyText(document.getElementById('msgSubject').textContent).then(function(){ facShowToast('Objet copié'); });
  });
  document.getElementById('printMsgBtn').addEventListener('click', function(){ window.print(); });

})();
