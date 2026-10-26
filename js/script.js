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
  if (S.name) document.title = document.title.replace(/(—\s*)[^—]+$/, '$1' + S.name);

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
    var say = function (t) { copy.textContent = t; setTimeout(function () { copy.textContent = 'Copier'; }, 1800); };
    var legacy = function () {
      var t = document.createElement('textarea'); t.value = S.email || ''; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* ignoré */ } t.remove(); say(ok ? 'Copié' : 'Copie impossible');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(S.email || '').then(function () { say('Copié'); }, legacy); else legacy();
  });
  var form = $('#contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var f = new FormData(form);
    var body = f.get('message') + '\n\n— ' + f.get('name') + ' (' + f.get('email') + ')';
    var st = $('.form-status', form); if (st) st.textContent = 'Votre messagerie devrait s’ouvrir. Sinon, écrivez directement à ' + (S.email || '') + '.';
    location.href = 'mailto:' + (S.email || '') + '?subject=' + encodeURIComponent('Contact via le portfolio — ' + f.get('name')) + '&body=' + encodeURIComponent(body.replace(/\r?\n/g, '\r\n'));
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

  /* 7. Filtres de projets (accueil) : les rangées restantes gardent l'alternance gauche / droite */
  var chips = $$('.chip[data-filter]'), rows = $$('.proj[data-cat]');
  if (chips.length) {
    var applyFilter = function (k) {
      var n = 0, tri0 = $('.tri'); if (tri0) tri0.hidden = !(k === 'all' || k === 'site');
      rows.forEach(function (r) { var show = k === 'all' || r.dataset.cat === k; r.hidden = !show; if (show) { r.classList.toggle('alt', n % 2 === 0); n++; } });
      chips.forEach(function (c) { var on = c.dataset.filter === k; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { applyFilter(c.dataset.filter); }); });
  }

  /* 8. Projet à niveaux : onglets de l'aperçu interactif (un seul niveau visible à la fois) */
  var tabs = $$('[data-tier-tab]'), panes = $$('[data-tier-pane]');
  if (tabs.length) {
    var pick = function (k) {
      tabs.forEach(function (t) { var on = t.dataset.tierTab === k; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
      panes.forEach(function (p) { p.hidden = p.dataset.tierPane !== k; });
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { pick(t.dataset.tierTab); }); });
    var m = /^#niveau-(normale|mieux|deluxe)$/.exec(location.hash);
    if (m) pick(m[1]);
  }

  /* 9. TM Restaurant : écran divisé en 3 bandes, qui se déplient une à une au défilement */
  var tri = $('.tri');
  if (tri) {
    var track = $('.tri-track', tri), bands = $$('.tri-band', tri);
    var load = function (b) {
      var f = $('iframe', b);
      if (!f || f.src) return;
      f.addEventListener('load', function () { f.classList.add('is-ready'); });
      f.src = f.getAttribute('data-src');
    };
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tri.classList.add('tri--static');
    } else {
      var K = 7, queued = false;
      var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
      var ease = function (t) { return t * t * (3 - 2 * t); };
      var hh = 72;
      var measure = function () { hh = header ? header.offsetHeight : 72; tri.style.setProperty('--hh', hh + 'px'); };
      var update = function () {
        queued = false;
        if (tri.hidden) return;
        var r = track.getBoundingClientRect(), stageH = window.innerHeight - hh, max = r.height - stageH;
        var p = max > 0 ? clamp((hh - r.top) / max) : 0;
        var open = ease(clamp(p / 0.12));          /* au début : trois bandes égales */
        var f = clamp((p - 0.12) / 0.76) * 2;      /* bande mise en avant : 0, 1 puis 2 */
        if (r.top < window.innerHeight * 1.2) load(bands[0]);
        bands.forEach(function (b, i) {
          var near = Math.max(0, 1 - Math.abs(f - i));
          b.style.flexGrow = (1 + open * K * near).toFixed(3);
          if (open > 0.05 && Math.abs(f - i) < 1.3) load(b);
        });
      };
      var queue = function () { if (!queued) { queued = true; requestAnimationFrame(update); } };
      measure(); update();
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', function () { measure(); queue(); });
    }
  }

  /* 10. Accueil : texture pointillée en bandes diagonales, la forme réagit à la souris */
  var cv = $('.hero-tex');
  if (cv && cv.getContext) {
    var hero = cv.parentNode, ctx = cv.getContext('2d');
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, dpr = 1, step = 3, cols = 0, rows = 0, rnd, jx, jy, col = '#3a46f0', img, u32, rgba = 0xFFF0463A, stacked = false, tb = 0, tr = 0;
    var cur = { x: 0.5, y: 0.5 }, tgt = { x: 0.5, y: 0.5 }, running = false;
    var smooth = function (a, b, v) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    var build = function () {
      cols = Math.ceil(W / step); rows = Math.ceil(H / step);
      rnd = new Float32Array(cols * rows); jx = new Float32Array(cols * rows); jy = new Float32Array(cols * rows);
      var a = 1337;
      var rand = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      for (var i = 0; i < rnd.length; i++) { rnd[i] = rand(); jx[i] = (rand() - 0.5) * step; jy[i] = (rand() - 0.5) * step; }
    };
    var draw = function () {
      u32.fill(0);
      var cw = cv.width, ch = cv.height, sz = Math.max(1, Math.round(step * 0.7 * dpr));
      var narrow = stacked;
      var R = narrow ? Math.min(W * 0.8, (H - tb) * 0.75) : Math.min(W * 0.5, H * 0.9);
      var cx = W * (narrow ? 0.5 : 0.66) + (cur.x - 0.5) * W * 0.1;
      var cy = (narrow ? tb + (H - tb) * 0.5 : H * 0.46) + (cur.y - 0.5) * H * 0.1;
      var ang = 0.785 + (cur.x - 0.5) * 0.5 + (cur.y - 0.5) * 0.3;
      var ca = Math.cos(ang), sa = Math.sin(ang);
      var P = R * 0.56, phase = (cur.x - 0.5) * 1.1 + (cur.y - 0.5) * 0.6;
      var mx = cur.x * W, my = cur.y * H, sg = R * 0.4, sg2 = 2 * sg * sg, far = 9 * sg * sg * 0.5 * 2, str = R * 0.3;
      var dmul = narrow ? 0.9 : 1.15, fl = tr || W * 0.3, fh = fl + W * 0.16;
      var x0 = Math.max(0, Math.floor((cx - R * 1.1) / step)), x1 = Math.min(cols - 1, Math.ceil((cx + R * 1.1) / step));
      var y0 = Math.max(0, Math.floor((cy - R * 1.1) / step)), y1 = Math.min(rows - 1, Math.ceil((cy + R * 1.1) / step));
      for (var gy = y0; gy <= y1; gy++) {
        for (var gx = x0; gx <= x1; gx++) {
          var i = gy * cols + gx;
          var x = gx * step + jx[i], y = gy * step + jy[i];
          var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy, wx = x, wy = y;
          if (d2 < far) {
            var g = Math.exp(-d2 / sg2), d = Math.sqrt(d2) + 1;
            wx = x + (dx * 0.6 - dy * 0.8) / d * str * g;
            wy = y + (dy * 0.6 + dx * 0.8) / d * str * g;
          }
          var ux = wx - cx, uy = wy - cy, r = Math.sqrt(ux * ux + uy * uy);
          if (r > R) continue;
          var u = (ux * ca + uy * sa) / P + phase, t = u - Math.floor(u);
          var q = 1 - (t - 0.07) / 0.93, band = t < 0.07 ? t / 0.07 : q * Math.sqrt(q);
          var dens = band * (1 - smooth(R * 0.88, R, r)) * dmul * (narrow ? 0.05 + 0.95 * smooth(tb, tb + 70, y) : 0.03 + 0.97 * smooth(fl, fh, x)) * (0.86 + 0.14 * Math.sin(wx * 0.013 + wy * 0.009));
          if (rnd[i] < dens) {
            var px = Math.round(x * dpr), py = Math.round(y * dpr);
            if (px < 0 || py < 0 || px + sz > cw || py + sz > ch) continue;
            for (var a = 0; a < sz; a++) { var o = (py + a) * cw + px; for (var b2 = 0; b2 < sz; b2++) u32[o + b2] = rgba; }
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    var tick = function () {
      var dx = tgt.x - cur.x, dy = tgt.y - cur.y;
      cur.x += dx * 0.09; cur.y += dy * 0.09;
      draw();
      if (Math.abs(dx) + Math.abs(dy) > 0.0008) requestAnimationFrame(tick); else running = false;
    };
    var go = function () { if (!running) { running = true; requestAnimationFrame(tick); } };
    var setColor = function () {
      col = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || col;
      ctx.fillStyle = col; var h = ctx.fillStyle;
      if (h.charAt(0) === '#' && h.length === 7) rgba = ((255 << 24) | (parseInt(h.substr(5, 2), 16) << 16) | (parseInt(h.substr(3, 2), 16) << 8) | parseInt(h.substr(1, 2), 16)) >>> 0;
    };
    var resize = function () {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var tx = $('.wrap > div', hero), fn = $('.fan', hero);
      if (tx && fn) { var a = tx.getBoundingClientRect(), f = fn.getBoundingClientRect(); tr = a.right - r.left; stacked = f.top >= a.bottom - 20; tb = a.bottom - r.top + 10; } else { stacked = false; }
      step = 3; img = ctx.createImageData(cv.width, cv.height); u32 = new Uint32Array(img.data.buffer); build(); setColor(); draw();
    };
    hero.classList.add('has-tex');
    resize();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
    window.addEventListener('load', resize);
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { setColor(); draw(); });
    window.addEventListener('themechange', function () { setColor(); draw(); });
    if (!still) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tgt.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        tgt.y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        go();
      });
      hero.addEventListener('pointerleave', function () { tgt.x = 0.5; tgt.y = 0.5; go(); });
    }
  }
})();
