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

/* ---------------------------------------------------------
   GOOGLE ANALYTICS 4 — mesure la conversion par source
   (campagne email, secteur) en complément de GoatCounter.
   GA4 dépose des cookies (_ga, _ga_*) et N'EST PAS exempté de
   consentement CNIL, contrairement à GoatCounter (cookieless).
   Ne JAMAIS charger ce script avant un clic explicite sur
   "Accepter" — voir initCookieBanner ci-dessous.
   --------------------------------------------------------- */
var FAC_GA_ID = 'G-ZDN67CYETZ';

function facLoadGA4(){
  if (window.gtag) return; // déjà chargé, évite un double chargement
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + FAC_GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', FAC_GA_ID);
}

/* Supprime les cookies GA déjà déposés (cas d'un refus après un accord
   précédent, via "Gérer mes préférences cookies"). */
function facPurgeGA4Cookies(){
  document.cookie.split(';').forEach(function(c){
    var name = c.split('=')[0].trim();
    if (/^_ga/.test(name)){
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname + ';';
    }
  });
}

window.FacTrack = function(eventName, props){
  try{
    if (typeof window.gtag === 'function'){
      window.gtag('event', eventName, props || {});
    }
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
  if (existing){
    if (existing === 'accept') facLoadGA4();
    return;
  }

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
      var choice = btn.getAttribute('data-consent');
      localStorage.setItem(KEY, choice);
      if (choice === 'accept'){
        facLoadGA4();
      } else {
        facPurgeGA4Cookies();
      }
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
   Branché sur une route API de facilo-app.fr (Next.js), qui envoie
   la notification via Resend — deja configure et utilise pour les
   relances automatiques, pas un nouvel outil.
   --------------------------------------------------------- */
function facCaptureLead(toolName, email){
  try{
    var log = JSON.parse(localStorage.getItem('facilo_leads') || '[]');
    log.push({ tool: toolName, email: email, at: new Date().toISOString() });
    localStorage.setItem('facilo_leads', JSON.stringify(log));
  } catch(err){}

  window.FacTrack('lead_captured', { tool: toolName });

  return fetch('https://www.facilo-app.fr/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, tool: toolName })
  }).catch(function(){ /* on ne bloque jamais l'utilisateur si l'appel échoue */ });
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
   NEWSLETTER — capture d'email pour les visiteurs qui ne
   convertissent pas immédiatement (page d'accueil, articles
   d'aide). Même backend que l'email gate (facCaptureLead),
   sans exiger de case de consentement ici : le simple fait de
   remplir et soumettre son email pour recevoir des guides
   constitue le consentement à cet envoi (RGPD, base légale :
   consentement explicite par l'action positive de l'utilisateur).
   --------------------------------------------------------- */
function facWireNewsletterForm(cfg){
  var form = document.getElementById(cfg.formId);
  if (!form) return;
  var emailInput = document.getElementById(cfg.emailInputId);
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

    var submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi...';

    facCaptureLead(cfg.toolName || 'newsletter', email).then(function(){
      statusEl.textContent = 'Merci ! Vous recevrez nos prochains guides par email.';
      statusEl.className = 'gate-status ok';
      submitBtn.textContent = 'Inscrit ✓';
      form.querySelectorAll('input').forEach(function(i){ i.disabled = true; });
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
