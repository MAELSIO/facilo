/* =========================================================
   OUTIL — Relance de rendez-vous / réduction des no-shows
   Templates déterministes. Voir PLACEHOLDER_AI_CALL pour
   brancher une vraie génération de texte.
   ========================================================= */
(function(){
  "use strict";

  var form = document.getElementById('rdvForm');
  var resultBlock = document.getElementById('resultBlock');
  var formError = document.getElementById('formError');
  var currentMessages = { sms: '', email: '' };
  var currentTab = 'sms';

  /* PLACEHOLDER_AI_CALL
     Remplacez buildSms()/buildEmail() par un appel à votre API
     de génération de texte — même signature (reçoit `data`,
     retourne une chaîne). Voir NOTE-FINALE.md. */
  function buildSms(data){
    var lienTxt = data.lien ? (' ' + data.lien) : '';
    if (data.typeMsg === 'rappel'){
      return data.ton === 'amical'
        ? ("Coucou " + data.client + " ! Petit rappel de votre RDV avec " + data.pro + " " + data.dateRdv + ". À très vite !" + lienTxt)
        : ("Bonjour " + data.client + ", nous vous rappelons votre rendez-vous avec " + data.pro + " " + data.dateRdv + ". Merci de nous prévenir en cas d'empêchement." + lienTxt);
    }
    return data.ton === 'amical'
      ? ("Coucou " + data.client + ", on ne vous a pas vu(e) pour votre RDV " + data.dateRdv + " ! Tout va bien ? Vous pouvez reprendre RDV quand vous voulez." + lienTxt)
      : ("Bonjour " + data.client + ", nous n'avons pas pu vous accueillir pour votre rendez-vous du " + data.dateRdv + ". N'hésitez pas à reprendre RDV." + lienTxt);
  }

  function buildEmail(data){
    var lienTxt = data.lien ? ("\n\nVous pouvez reprendre rendez-vous ici : " + data.lien) : '';
    var signature = "\n\nÀ bientôt,\n" + data.pro;

    if (data.typeMsg === 'rappel'){
      return "Bonjour " + data.client + ",\n\n" +
        "Nous vous confirmons votre rendez-vous " + data.dateRdv + ".\n\n" +
        "Merci de nous prévenir au plus vite en cas d'empêchement, afin que nous puissions proposer ce créneau à un autre client." +
        lienTxt + signature;
    }
    return "Bonjour " + data.client + ",\n\n" +
      "Nous n'avons pas eu le plaisir de vous accueillir pour votre rendez-vous " + data.dateRdv + ".\n\n" +
      "Si c'est un oubli ou un empêchement de dernière minute, pas de souci : n'hésitez pas à reprendre rendez-vous quand cela vous arrange." +
      lienTxt + signature;
  }

  function showTab(tab){
    currentTab = tab;
    document.getElementById('tabSms').setAttribute('aria-selected', tab === 'sms');
    document.getElementById('tabEmail').setAttribute('aria-selected', tab === 'email');
    document.getElementById('msgOutput').textContent = currentMessages[tab];
  }
  document.getElementById('tabSms').addEventListener('click', function(){ showTab('sms'); });
  document.getElementById('tabEmail').addEventListener('click', function(){ showTab('email'); });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.textContent = '';

    var typeMsg = form.querySelector('input[name=typeMsg]:checked').value;
    var pro = document.getElementById('pro').value.trim();
    var client = document.getElementById('client').value.trim();
    var dateRdv = document.getElementById('dateRdv').value.trim();
    var lien = document.getElementById('lien').value.trim();
    var ton = form.querySelector('input[name=ton]:checked').value;

    if (!pro || !client || !dateRdv){
      formError.textContent = "Merci de remplir votre nom, le client et la date du rendez-vous.";
      return;
    }

    var data = { typeMsg: typeMsg, pro: pro, client: client, dateRdv: dateRdv, lien: lien, ton: ton };
    currentMessages.sms = buildSms(data);
    currentMessages.email = buildEmail(data);

    document.getElementById('metaClient').textContent = 'Client : ' + client;
    document.getElementById('metaDate').textContent = typeMsg === 'rappel' ? ('RDV : ' + dateRdv) : ('RDV manqué : ' + dateRdv);

    showTab('sms');
    document.getElementById('msgOutput').classList.add('locked');
    document.getElementById('emailGate').style.display = 'block';
    document.getElementById('resultActions').style.display = 'none';

    resultBlock.classList.add('show');
    window.FacTrack('tool_generated', { tool: 'relance-rdv' });
    setTimeout(function(){ resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  });

  facWireEmailGate({
    formId: 'gateForm', emailInputId: 'gateEmail', consentId: 'gateConsent', statusId: 'gateStatus',
    toolName: 'relance-rdv',
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

})();
