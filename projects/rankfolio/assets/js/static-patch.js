/* static-patch.js (Rankfolio) — remplace ce que faisaient PHP/MySQL : sauvegarde, export PDF, liste des cartes. Tout reste dans le navigateur. */
(function () {
  'use strict';
  var S = window.RF_STATIC || {};
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k) || ''); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  var cards = function () { return get('rf.cards', []); };
  function nextId() { return cards().reduce(function (m, c) { return Math.max(m, c.id); }, 1000) + 1; }
  function toast(msg) {
    var t = document.createElement('div'); t.textContent = msg; t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1b2a3d;color:#fff;border:1px solid #e8b04a;padding:12px 18px;border-radius:10px;z-index:9999;font:600 14px system-ui,sans-serif;max-width:90vw';
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3600);
  }

  /* ---------- éditeur : choisir la carte à ouvrir AVANT que editor.js lise ses données ---------- */
  var jsonEl = document.getElementById('rf-editor-data');
  if (jsonEl) {
    try {
      var D = JSON.parse(jsonEl.textContent), q = new URLSearchParams(location.search);
      if (q.get('new')) D.card = S.blankCard || null;
      else if (q.get('id')) { var c = cards().filter(function (x) { return String(x.id) === q.get('id'); })[0]; if (c) D.card = c; }
      jsonEl.textContent = JSON.stringify(D);
    } catch (e) { /* données intactes */ }
  }

  /* ---------- PDF : un JPEG dans une page A4 (équivalent de SimplePDF en PHP) ---------- */
  function jpegSize(bin) {
    var i = 2; while (i < bin.length) {
      if (bin.charCodeAt(i) !== 0xFF) { i++; continue; }
      var m = bin.charCodeAt(i + 1), len = (bin.charCodeAt(i + 2) << 8) + bin.charCodeAt(i + 3);
      if (m >= 0xC0 && m <= 0xC3) return { h: (bin.charCodeAt(i + 5) << 8) + bin.charCodeAt(i + 6), w: (bin.charCodeAt(i + 7) << 8) + bin.charCodeAt(i + 8) };
      i += 2 + len;
    } return null;
  }
  function makePdf(dataUrl) {
    var bin = atob(dataUrl.split(',')[1]), sz = jpegSize(bin) || { w: 1200, h: 675 };
    var pw = 595.28, ph = 841.89, mg = 24; if (sz.w > sz.h) { var t = pw; pw = ph; ph = t; }
    var r = Math.min((pw - mg * 2) / sz.w, (ph - mg * 2) / sz.h), dw = sz.w * r, dh = sz.h * r, x = (pw - dw) / 2, y = (ph - dh) / 2;
    var out = '%PDF-1.4\n', off = [];
    function add(id, body) { off[id] = out.length; out += id + ' 0 obj\n' + body + '\nendobj\n'; }
    add(1, '<< /Type /Catalog /Pages 2 0 R >>'); add(2, '<< /Type /Pages /Kids [5 0 R] /Count 1 >>');
    var content = 'q ' + dw.toFixed(2) + ' 0 0 ' + dh.toFixed(2) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /Im0 Do Q';
    add(3, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    add(4, '<< /Type /XObject /Subtype /Image /Width ' + sz.w + ' /Height ' + sz.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bin.length + ' >>\nstream\n' + bin + '\nendstream');
    add(5, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw.toFixed(2) + ' ' + ph.toFixed(2) + '] /Contents 3 0 R /Resources << /XObject << /Im0 4 0 R >> >> >>');
    var xref = out.length; out += 'xref\n0 6\n0000000000 65535 f \n';
    for (var i = 1; i <= 5; i++) out += ('0000000000' + off[i]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    var u8 = new Uint8Array(out.length); for (var k = 0; k < out.length; k++) u8[k] = out.charCodeAt(k) & 255;
    return new Blob([u8], { type: 'application/pdf' });
  }

  /* ---------- API remplacées ---------- */
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  function jres(o, status) { return Promise.resolve(new Response(JSON.stringify(o), { status: status || 200, headers: { 'Content-Type': 'application/json' } })); }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '', m = url.match(/api\/([a-z_]+)\.php/);
    if (!m) return realFetch(input, init);
    var fd = init && init.body;
    if (m[1] === 'save_card' && fd && fd.get) {
      var p = JSON.parse(fd.get('payload')), list = cards(), id = p.id, rec;
      if (!id || !list.some(function (x) { return x.id === id; })) { id = nextId(); rec = { id: id }; list.push(rec); } else rec = list.filter(function (x) { return x.id === id; })[0];
      Object.assign(rec, { title: p.title, template: p.template, layout: p.layout, is_public: !!p.is_public, config: p.config, thumb: fd.get('thumb') || '', updated: Date.now() });
      set('rf.cards', list); return jres({ ok: true, id: id, config: p.config, dropped: [] });
    }
    if (m[1] === 'export_pdf' && fd && fd.get) return Promise.resolve(new Response(makePdf(fd.get('image')), { status: 200, headers: { 'Content-Type': 'application/pdf' } }));
    return jres({ ok: false, error: 'Fonction non disponible dans cette version de démonstration.' }, 400);
  };

  /* ---------- liste « Mes cartes » ---------- */
  var LAYOUTS = { horizontal: 'Horizontale', vertical: 'Verticale', square: 'Carrée', story: 'Story', banner: 'Bannière' };
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function tpl(slug) { var T = S.templates || {}; var t = Array.isArray(T) ? T.filter(function (x) { return x.slug === slug; })[0] : T[slug]; return t || { name: slug, bg: ['#0a0a0f', '#1a1a24'], accent: '#c9a961' }; }
  function hasIcon(g, r) { var I = S.icons || []; return I.indexOf(g + '/' + r) > -1; }
  function slab(c, demo) {
    var t = tpl(c.template), bg = t.bg || ['#0a0a0f', '#1a1a24'];
    var emb = ((c.config && c.config.games) || []).filter(function (g) { return hasIcon(g.slug, g.rankSlug); }).slice(0, 4).map(function (g) { return '<img class="rf-mini-emblem" src="assets/ranks/' + g.slug + '/' + g.rankSlug + '.png" alt="" loading="lazy" width="40" height="40">'; }).join('');
    var win = c.thumb ? '<img src="' + c.thumb + '" alt="" style="display:block;width:100%;border-radius:6px">' : '<div class="rf-mini"><span class="rf-mini-name">' + esc(c.config && c.config.player && c.config.player.name) + '</span><span class="rf-mini-row">' + emb + '</span></div>';
    var serial = demo ? '0001' : String(c.id - 1000).padStart(4, '0');
    return '<article class="rf-slab" data-card-id="' + c.id + '" style="--c1:' + bg[0] + ';--c2:' + bg[1] + ';--acc:' + t.accent + '"><header class="rf-slab-label"><span class="rf-slab-title">' + esc(c.title) + '</span><span class="rf-slab-serial">№&nbsp;' + serial + '</span></header>' +
      '<a class="rf-slab-window" href="editor.html?id=' + c.id + '" aria-label="Ouvrir « ' + esc(c.title) + ' »">' + win + '</a><footer class="rf-slab-foot"><div class="rf-slab-line"><span class="rf-slab-by">' + esc(t.name) + ' · ' + esc(LAYOUTS[c.layout] || c.layout) + '</span><span class="rf-badge ' + (c.is_public ? 'rf-badge-ok' : '') + '">' + (c.is_public ? 'Publique' : 'Privée') + '</span></div>' +
      '<div class="rf-slab-actions"><a class="rf-btn rf-btn-secondary rf-btn-sm" href="editor.html?id=' + c.id + '">Modifier</a>' +
      ['toggle_public|' + (c.is_public ? 'Rendre privée' : 'Rendre publique'), 'duplicate|Dupliquer', 'delete|Supprimer'].map(function (a) { var p = a.split('|'); return '<button class="rf-btn rf-btn-ghost rf-btn-sm' + (p[0] === 'delete' ? ' rf-btn-danger' : '') + '" type="button" data-act="' + p[0] + '" data-id="' + c.id + '">' + p[1] + '</button>'; }).join('') + '</div></footer></article>';
  }
  function allCards() {
    var hid = get('rf.hidden', []), demo = (S.demoCard && hid.indexOf(S.demoCard.id) < 0) ? [Object.assign({}, S.demoCard, get('rf.demoOverride', {}))] : [];
    return demo.concat(cards());
  }
  function renderCards() {
    var grid = document.querySelector('[data-static-grid]'); if (!grid) return;
    var list = allCards(); grid.innerHTML = list.map(function (c) { return slab(c, c.id === 1); }).join('') || '<p style="grid-column:1/-1">Aucune carte pour le moment. Crée ta première carte !</p>';
    var p = document.querySelector('.rf-pagehead p'); if (p) p.textContent = list.length + ' carte' + (list.length > 1 ? 's' : '') + ' dans ta collection';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button[data-act]'); if (!b) return;
    var act = b.dataset.act, id = Number(b.dataset.id), list = cards();
    if (act === 'delete') { if (!window.confirm('Supprimer cette carte ?')) return; if (id === 1) { var h = get('rf.hidden', []); h.push(1); set('rf.hidden', h); } else set('rf.cards', list.filter(function (x) { return x.id !== id; })); }
    else if (act === 'toggle_public') { if (id === 1) { var o = get('rf.demoOverride', {}); o.is_public = !(Object.assign({}, S.demoCard, o).is_public); set('rf.demoOverride', o); } else list.forEach(function (x) { if (x.id === id) x.is_public = !x.is_public; }), set('rf.cards', list); }
    else if (act === 'duplicate') { var src = allCards().filter(function (x) { return x.id === id; })[0]; if (src) { var cp = JSON.parse(JSON.stringify(src)); cp.id = nextId(); cp.title = src.title + ' (copie)'; cp.is_public = false; list.push(cp); set('rf.cards', list); } }
    renderCards();
  });
  document.addEventListener('DOMContentLoaded', function () {
    renderCards();
    document.querySelectorAll('form[data-rf-demo]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); toast('Version de démonstration : ce formulaire n’enregistre rien.'); }); });
    document.querySelectorAll('[data-confirm]').forEach(function () { /* confirmations gérées par app.js */ });
  });
})();
