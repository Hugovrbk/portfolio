/* prefs.js — thème (auto / clair / sombre), taille du texte, français / anglais. Aucune dépendance.
   Les réglages sont gardés dans le navigateur (localStorage, clés « pf-… »). ?lang=en ouvre le site en anglais. */
(function () {
  'use strict';
  var S = window.SITE || {}, EN = window.I18N_EN || {}, root = document.documentElement;
  var get = function (k) { try { return localStorage.getItem('pf-' + k) || ''; } catch (e) { return ''; } };
  var put = function (k, v) { try { if (v) localStorage.setItem('pf-' + k, v); else localStorage.removeItem('pf-' + k); } catch (e) { /* ok */ } };
  var G = [['theme', ['', 'light', 'dark']], ['size', ['', 'lg', 'xl']], ['lang', ['fr', 'en']]];
  var st = { theme: get('theme'), size: get('size'), lang: get('lang') === 'en' ? 'en' : 'fr' };
  if (['', 'light', 'dark'].indexOf(st.theme) < 0) st.theme = '';
  if (['', 'lg', 'xl'].indexOf(st.size) < 0) st.size = '';
  var q = /[?&]lang=(en|fr)/.exec(location.search); if (q) { st.lang = q[1]; put('lang', q[1]); }

  /* ---- Traduction : on remplace les textes français par leur équivalent (dictionnaire js/i18n-en.js) ---- */
  var RX = [[/^Voir le projet (.+)$/, 'View the $1 project'], [/^Aperçu de (.+)$/, 'Preview of $1'], [/^Capture de (.+)$/, 'Screenshot of $1'],
    [/^Ouvrir le projet : (.+)$/, 'Open project: $1'], [/^Aperçu : (.+)$/, 'Preview: $1'], [/^Niveau (\d)$/, 'Tier $1'], [/^Agrandir : (.+)$/, 'Enlarge: $1'],
    [/^Votre messagerie devrait s’ouvrir\. Sinon, écrivez directement à (.+)\.$/, 'Your mail app should open. Otherwise, write directly to $1.']];
  var orig = new WeakMap(), origA = new WeakMap(), ATTR = ['alt', 'aria-label', 'title'], titleFr = document.title;
  function tx(s) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), k = m[2].replace(/\s+/g, ' '), r;
    if (!k) return null;
    if (S.roleEn && k === S.role) r = S.roleEn; else r = EN[k];
    for (var i = 0; r === undefined && i < RX.length; i++) if (RX[i][0].test(k)) r = k.replace(RX[i][0], RX[i][1]);
    return r === undefined ? null : m[1] + r + m[3];
  }
  function textNode(n) {
    var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(p.nodeName) || (p.closest && p.closest('[data-i18n-skip]'))) return;
    var r = tx(n.nodeValue); if (r !== null) { orig.set(n, n.nodeValue); n.nodeValue = r; }
  }
  function walk(n) {
    if (n.nodeType === 3) return textNode(n);
    if (n.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(n.nodeName) || n.hasAttribute('data-i18n-skip')) return;
    ATTR.forEach(function (a) {
      if (!n.hasAttribute(a)) return; var v = n.getAttribute(a), r = tx(v);
      if (r !== null) { var o = origA.get(n) || {}; o[a] = v; origA.set(n, o); n.setAttribute(a, r); }
    });
    for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  function restore() {
    var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = tw.nextNode())) if (orig.has(n)) { n.nodeValue = orig.get(n); orig['delete'](n); }
    [].forEach.call(document.querySelectorAll('*'), function (e) { var o = origA.get(e); if (o) { for (var a in o) e.setAttribute(a, o[a]); origA['delete'](e); } });
  }
  var mo = new MutationObserver(function (list) {
    if (st.lang !== 'en') return;
    list.forEach(function (m) { if (m.type === 'characterData') textNode(m.target); else [].forEach.call(m.addedNodes, walk); });
    mo.takeRecords();
  });
  function applyLang() {
    root.lang = st.lang;
    if (st.lang === 'en') {
      walk(document.body);
      document.title = titleFr.split(' — ').map(function (p) { var r = tx(p); return r === null ? p : r.trim(); }).join(' — ');
    } else { restore(); document.title = titleFr; }
    mo.takeRecords();
  }
  function applyTheme() { if (st.theme) root.dataset.theme = st.theme; else delete root.dataset.theme; window.dispatchEvent(new Event('themechange')); }
  function applySize() { if (st.size) root.dataset.size = st.size; else delete root.dataset.size; }
  var APPLY = { theme: applyTheme, size: applySize, lang: applyLang };

  /* ---- Bouton « Aa » et panneau de réglages dans l'en-tête ---- */
  var UI = {
    fr: { title: 'Affichage', btn: 'Réglages d’affichage', theme: 'Thème', size: 'Taille du texte', lang: 'Langue', L: { theme: ['Auto', 'Clair', 'Sombre'], size: ['A', 'A+', 'A++'], lang: ['FR', 'EN'] }, A: { size: ['Normal', 'Grand', 'Très grand'], lang: ['Français', 'English'] } },
    en: { title: 'Display', btn: 'Display settings', theme: 'Theme', size: 'Text size', lang: 'Language', L: { theme: ['Auto', 'Light', 'Dark'], size: ['A', 'A+', 'A++'], lang: ['FR', 'EN'] }, A: { size: ['Normal', 'Large', 'Extra large'], lang: ['Français', 'English'] } }
  };
  var hdr = document.querySelector('.site-header .wrap'), nav = hdr && hdr.querySelector('.nav'), refresh = function () {};
  if (nav) {
    var box = document.createElement('div'), btn = document.createElement('button'), pop = document.createElement('div'), h = document.createElement('h2'), els = {};
    box.className = 'hdr-right'; hdr.insertBefore(box, nav); box.appendChild(nav); box.appendChild(btn);
    btn.type = 'button'; btn.className = 'prefs-btn'; btn.textContent = 'Aa'; btn.setAttribute('popovertarget', 'prefs'); btn.setAttribute('data-i18n-skip', '');
    pop.id = 'prefs'; pop.className = 'prefs'; pop.setAttribute('popover', ''); pop.setAttribute('data-i18n-skip', ''); pop.appendChild(h);
    G.forEach(function (g) {
      var fs = document.createElement('fieldset'), lg = document.createElement('legend'), seg = document.createElement('div'); seg.className = 'seg';
      fs.appendChild(lg); fs.appendChild(seg); pop.appendChild(fs); els[g[0]] = { lg: lg, b: [] };
      g[1].forEach(function (v) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'chip';
        b.addEventListener('click', function () { st[g[0]] = v; put(g[0], v); APPLY[g[0]](); refresh(); });
        seg.appendChild(b); els[g[0]].b.push(b);
      });
    });
    document.body.appendChild(pop);
    refresh = function () {
      var u = UI[st.lang]; h.textContent = u.title; btn.setAttribute('aria-label', u.btn);
      G.forEach(function (g) {
        els[g[0]].lg.textContent = u[g[0]];
        els[g[0]].b.forEach(function (b, i) {
          var on = st[g[0]] === g[1][i]; b.textContent = u.L[g[0]][i]; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
          if (u.A[g[0]]) b.setAttribute('aria-label', u.A[g[0]][i]);
          if (g[0] === 'lang') b.setAttribute('lang', g[1][i]);
        });
      });
    };
  }
  applySize();
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  if (st.lang === 'en') applyLang();
  refresh();
})();
