/* script.js — interactions du portfolio (aucune dépendance) */
(function () {
  'use strict';
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. Informations personnelles (site-config.js) */
  $$('[data-site="name"]').forEach(function (e) { e.textContent = S.name || ''; });
  $$('[data-site="role"]').forEach(function (e) { e.textContent = S.role || ''; });
  $$('[data-site="email"]').forEach(function (e) { e.textContent = S.email || ''; if (e.tagName === 'A') e.href = 'mailto:' + S.email; });
  $$('[data-site-link]').forEach(function (a) {
    var url = S[a.getAttribute('data-site-link')];
    if (url) a.href = url; else a.hidden = true;
  });
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  if (S.name) document.title = document.title.replace('Prénom Nom', S.name);

  /* 2. En-tête : filet au défilement */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 3. Navigation : lien actif selon la section visible (page d'accueil) */
  var links = $$('.nav a[href^="#"], .nav a[href*="index.html#"]');
  var targets = links.map(function (a) { return $('#' + a.getAttribute('href').split('#')[1]); });
  if ('IntersectionObserver' in window && targets.every(Boolean) && !$('.d-hero')) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href').split('#')[1] === en.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* 4. Contact : copie de l'e-mail + formulaire qui ouvre le client mail (site 100 % statique) */
  var copy = $('[data-copy-email]');
  if (copy) copy.addEventListener('click', function () {
    var done = function () { copy.textContent = 'Copié'; setTimeout(function () { copy.textContent = 'Copier'; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(S.email).then(done, done); else done();
  });
  var form = $('#contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var f = new FormData(form);
    var body = f.get('message') + '\n\n— ' + f.get('name') + ' (' + f.get('email') + ')';
    location.href = 'mailto:' + encodeURIComponent(S.email || '') + '?subject=' + encodeURIComponent('Contact via le portfolio — ' + f.get('name')) + '&body=' + encodeURIComponent(body);
  });

  /* 5. Captures : agrandissement dans une boîte de dialogue */
  var dlg = document.createElement('dialog');
  dlg.className = 'lb'; dlg.innerHTML = '<button type="button" aria-label="Fermer">Fermer</button><img alt="">';
  document.body.appendChild(dlg);
  if (typeof dlg.showModal === 'function') {
    $$('.shot').forEach(function (b) {
      b.addEventListener('click', function () {
        var im = $('img', b); $('img', dlg).src = im.currentSrc || im.src; $('img', dlg).alt = im.alt; dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.tagName === 'BUTTON') dlg.close(); });
  }

  /* 6. Aperçu interactif : le projet n'est chargé qu'au clic (pages plus rapides) */
  $$('[data-live]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ph = btn.closest('.live-ph'), f = document.createElement('iframe');
      f.src = btn.getAttribute('data-live'); f.title = 'Aperçu interactif du projet'; f.loading = 'lazy';
      ph.replaceWith(f); f.focus();
    });
  });
})();
