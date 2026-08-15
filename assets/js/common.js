/* =========================================================
   FACILO — script partagé (toutes les pages)
   - Bandeau cookies conforme CNIL (refus = accepter, pas de case pré-cochée)
   - Suivi léger des conversions (compatible Plausible/Umami)
   - Aide à la capture d'email (utilisée par chaque page outil)
   - Toast + copie presse-papier
   ========================================================= */

/* ---------------------------------------------------------
   BASE DU SITE — déduite du chemin de ce script lui-même,
   pour que les liens injectés en JS fonctionnent quel que
   soit le sous-dossier de déploiement (ex: GitHub Pages
   /facilo/, ou la racine d'un domaine personnalisé).
   --------------------------------------------------------- */
window.FACILO_BASE = (function(){
  var el = document.currentScript;
  var src = el && el.getAttribute('src');
  if (!src) return '';
  return src.replace(/assets\/js\/common\.js(\?.*)?$/, '');
})();

/* ---------------------------------------------------------
   ANALYTICS — remplacez ce stub par Plausible ou Umami.
   Exemple Plausible : <script defer data-domain="getfacilo.fr"
     src="https://plausible.io/js/script.js"></script>
   Ce stub se contente de logger en console + d'appeler
   window.plausible / window.umami si le script est chargé,
   pour que les événements ci-dessous fonctionnent sans rien
   changer le jour où l'un des deux est branché.
   --------------------------------------------------------- */
(function loadGoatCounter(){
  var s = document.createElement('script');
  s.async = true;
  s.setAttribute('data-goatcounter', 'https://getfacilo.goatcounter.com/count');
  s.src = '//gc.zgo.at/count.js';
  document.head.appendChild(s);
})();

window.FacTrack = function(eventName, props){
  try{
    if (typeof window.plausible === 'function'){
      window.plausible(eventName, { props: props || {} });
    } else if (window.umami && typeof window.umami.track === 'function'){
      window.umami.track(eventName, props || {});
    } else if (window.goatcounter && typeof window.goatcounter.count === 'function'){
      var propsPart = props && Object.keys(props).length
        ? '/' + Object.keys(props).map(function(k){ return k + '-' + String(props[k]); }).join('/')
        : '';
      window.goatcounter.count({
        path: 'event/' + eventName + propsPart,
        title: eventName,
        event: true
      });
    }
    var log = JSON.parse(localStorage.getItem('facilo_events') || '[]');
    log.push({ event: eventName, props: props || {}, at: new Date().toISOString() });
    if (log.length > 200) log = log.slice(-200);
    localStorage.setItem('facilo_events', JSON.stringify(log));
  } catch(err){ /* le suivi ne doit jamais bloquer l'usage du site */ }
};

/* ---------------------------------------------------------
   BANDEAU COOKIES — CNIL : refuser doit être aussi simple
   qu'accepter, aucune case pré-cochée, choix mémorisé.
   --------------------------------------------------------- */
(function initCookieBanner(){
  var KEY = 'facilo_consent';
  var existing = localStorage.getItem(KEY);
  if (existing) return;

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consentement cookies');
  banner.innerHTML =
    '<div class="cookie-inner">' +
      '<p class="cookie-text">Nous utilisons des cookies et outils de mesure d\'audience respectueux ' +
      'de votre vie privée pour comprendre l\'usage du site (aucune publicité ciblée). ' +
      '<a href="' + window.FACILO_BASE + 'confidentialite.html">En savoir plus</a></p>' +
      '<div class="cookie-actions">' +
        '<button type="button" class="btn btn-ghost" data-consent="refuse">Refuser</button>' +
        '<button type="button" class="btn btn-primary" data-consent="accept">Accepter</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);
  requestAnimationFrame(function(){ banner.classList.add('show'); });

  banner.querySelectorAll('[data-consent]').forEach(function(btn){
    btn.addEventListener('click', function(){
      localStorage.setItem(KEY, btn.getAttribute('data-consent'));
      banner.classList.remove('show');
      setTimeout(function(){ banner.remove(); }, 350);
    });
  });
})();

/* ---------------------------------------------------------
   GESTION DES PRÉFÉRENCES — bouton "Gérer mes préférences
   cookies" (page /cookies.html) : efface le choix mémorisé
   et recharge la page pour réafficher le bandeau.
   --------------------------------------------------------- */
window.facOpenCookieSettings = function(){
  localStorage.removeItem('facilo_consent');
  location.reload();
};

/* ---------------------------------------------------------
   TOAST
   --------------------------------------------------------- */
function facShowToast(text){
  var toast = document.getElementById('facToast');
  if (!toast){
    toast = document.createElement('div');
    toast.id = 'facToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(facShowToast._t);
  facShowToast._t = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
}

/* ---------------------------------------------------------
   COPIE PRESSE-PAPIER (avec repli navigateurs anciens)
   --------------------------------------------------------- */
function facCopyText(text){
  if (navigator.clipboard && window.isSecureContext){
    return navigator.clipboard.writeText(text).catch(function(){ return facFallbackCopy(text); });
  }
  return facFallbackCopy(text);
}
function facFallbackCopy(text){
  return new Promise(function(resolve){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(err){}
    document.body.removeChild(ta);
    resolve();
  });
}

/* ---------------------------------------------------------
   CAPTURE EMAIL — un seul point d'intégration pour les 5 outils.
   Aujourd'hui : stockage local (démo) + webhook de test (FormSubmit,
   sans création de compte). À BRANCHER PLUS TARD sur un vrai outil
   d'emailing (Brevo, Mailchimp, ConvertKit...) — voir NOTE-FINALE.md.
   --------------------------------------------------------- */
var FACILO_LEAD_NOTIFY_EMAIL = 'maelsiohan01@gmail.com';

function facCaptureLead(toolName, email){
  try{
    var log = JSON.parse(localStorage.getItem('facilo_leads') || '[]');
    log.push({ tool: toolName, email: email, at: new Date().toISOString() });
    localStorage.setItem('facilo_leads', JSON.stringify(log));
  } catch(err){}

  window.FacTrack('lead_captured', { tool: toolName });

  /* PLACEHOLDER_EMAIL_INTEGRATION
     Remplacez cet appel par votre vrai endpoint d'emailing
     (webhook Brevo/Mailchimp, ou votre propre API). */
  return fetch('https://formsubmit.co/ajax/' + FACILO_LEAD_NOTIFY_EMAIL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      email: email,
      outil: toolName,
      _subject: 'Nouveau lead Facilo — ' + toolName,
      message: 'Nouvel email capturé sur l\'outil "' + toolName + '" : ' + email
    })
  }).catch(function(){ /* on ne bloque jamais l'utilisateur si le webhook échoue */ });
}

/* ---------------------------------------------------------
   EMAIL GATE — branche un formulaire "email + consentement"
   générique sur n'importe quel outil : valide l'email, exige
   la case de consentement (jamais pré-cochée), capture le lead,
   puis déclenche onUnlock() pour révéler le résultat complet.
   --------------------------------------------------------- */
function facWireEmailGate(cfg){
  var form = document.getElementById(cfg.formId);
  var emailInput = document.getElementById(cfg.emailInputId);
  var consentInput = document.getElementById(cfg.consentId);
  var statusEl = document.getElementById(cfg.statusId);

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var email = emailInput.value.trim();
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!re.test(email)){
      statusEl.textContent = "Merci d'indiquer une adresse email valide.";
      statusEl.className = 'gate-status err';
      return;
    }
    if (!consentInput.checked){
      statusEl.textContent = "Merci de cocher la case de consentement pour continuer.";
      statusEl.className = 'gate-status err';
      return;
    }

    var submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi...';

    facCaptureLead(cfg.toolName, email).then(function(){
      statusEl.textContent = 'Merci ! Votre message complet est débloqué ci-dessous.';
      statusEl.className = 'gate-status ok';
      submitBtn.textContent = 'Débloqué ✓';
      form.querySelectorAll('input').forEach(function(i){ i.disabled = true; });
      if (typeof cfg.onUnlock === 'function') cfg.onUnlock(email);
    });
  });
}

/* ---------------------------------------------------------
   NAVIGATION — surlignage du lien actif (facultatif, léger)
   --------------------------------------------------------- */
(function highlightActiveNav(){
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(function(link){
    if (link.getAttribute('data-nav') === path) link.setAttribute('aria-current', 'page');
  });
})();
