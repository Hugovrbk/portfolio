/* ============================================================
   RANKFOLIO — Éditeur de carte
   Le rendu est délégué à RFCard (card-renderer.js). Ici : état, interface, sauvegarde, exports.
   Les données serveur arrivent par <script type="application/json" id="rf-editor-data">.
   ============================================================ */
(function () {
  'use strict';

  const dataEl = document.getElementById('rf-editor-data');
  if (!dataEl || !window.RFCard) return;

  const D = JSON.parse(dataEl.textContent);
  const BASE = (document.body.dataset.base || '');
  const MAX_GAMES = 12;

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const toast = (msg, type) => (window.RF && window.RF.toast) ? window.RF.toast(msg, type) : alert(msg);

  /** Création d'éléments DOM sans innerHTML : aucun texte utilisateur n'est interprété comme du HTML. */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach(c => { if (c != null) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }

  RFCard.configure({ templates: D.templates, icons: D.icons });

  /* ── État ─────────────────────────────────────────────── */
  const state = {
    id: null,
    title: 'Ma carte',
    template: 'obsidian',
    layout: 'horizontal',
    isPublic: false,
    player: { name: D.playerName || 'TonPseudo', title: '' },
    games: [],
    show: { name: true, title: true, games: true, points: true, date: true, qr: false }
  };
  let dirty = false, saving = false, raf = 0, qrCache = null;
  const canvas = $('#cardCanvas');

  function restore() {
    const c = D.card;
    if (!c) return;
    state.id = c.id;
    state.title = c.title || state.title;
    state.template = D.templates[c.template] ? c.template : 'obsidian';
    state.layout = RFCard.LAYOUTS[c.layout] ? c.layout : 'horizontal';
    state.isPublic = !!c.is_public;
    const cfg = c.config || {};
    if (cfg.player) Object.assign(state.player, cfg.player);
    if (cfg.show) Object.assign(state.show, cfg.show);
    if (Array.isArray(cfg.games)) {
      // Anciennes cartes : rankSlug absent → on le retrouve par le nom du rang pour recharger l'emblème.
      state.games = cfg.games.map(g => {
        if (!g.rankSlug) {
          const def = D.games[g.slug];
          const r = def && def.ranks.find(x => x[1] === g.rankName);
          if (r) g.rankSlug = r[0];
        }
        return g;
      });
      // Les rangs viennent des comptes liés : on affiche toujours la valeur la plus récente.
      state.games = state.games.map(g => {
        const a = accountBySlug[g.slug];
        const e = a && a.rank ? fromAccount(a) : null;
        return e || g;
      });
    }
  }

  /* ── QR code ──────────────────────────────────────────── */
  function getQR() {
    if (!D.profileUrl || !window.RFQR) return null;
    if (qrCache === null) {
      try { qrCache = RFQR.encode(D.profileUrl); } catch (e) { qrCache = false; }
    }
    return qrCache || null;
  }

  /* ── Rendu (regroupé sur une frame) ───────────────────── */
  function spec() {
    return {
      template: state.template, layout: state.layout, player: state.player,
      games: state.games, show: state.show, qr: state.show.qr ? getQR() : null
    };
  }
  function draw() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; drawNow(); });
  }
  function drawNow() {
    RFCard.render(canvas, spec());
    const d = RFCard.LAYOUTS[state.layout];
    $('#stageMeta').textContent = d.w + ' × ' + d.h + ' px · modèle ' + D.templates[state.template].name;
  }
  function changed() { markDirty(); draw(); }

  function markDirty() { dirty = true; $('#dirtyBadge').hidden = false; }
  function markClean() { dirty = false; $('#dirtyBadge').hidden = true; }

  /* ── Modèles ──────────────────────────────────────────── */
  function buildTemplates() {
    const grid = $('#templateGrid');
    Object.entries(D.templates).forEach(([slug, t]) => {
      const b = h('button', {
        type: 'button', class: 'rf-tpl', 'data-slug': slug,
        'aria-pressed': slug === state.template ? 'true' : 'false',
        style: '--c1:' + t.bg[0] + ';--c2:' + t.bg[1] + ';--acc:' + t.accent
      }, h('span', { class: 'rf-tpl-name' }, t.name));
      b.addEventListener('click', () => {
        state.template = slug;
        $$('.rf-tpl', grid).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        changed();
      });
      grid.append(b);
    });
  }

  /* ── Sélecteur de jeu / rang ──────────────────────────── */
  const gameSel = $('#gameSelect');       // absent hors saisie manuelle
  const picker = $('#rankPicker');
  let pickedRank = null;

  function emblem(gameSlug, rankSlug, color, cls) {
    if (!RFCard.hasIcon(gameSlug, rankSlug)) return h('span', { class: cls + ' rf-emblem-dot', style: '--dot:' + color, 'aria-hidden': 'true' });
    const img = h('img', { class: cls, src: BASE + 'assets/ranks/' + gameSlug + '/' + rankSlug + '.png', alt: '', loading: 'lazy', width: 36, height: 36 });
    img.addEventListener('error', () => {
      img.replaceWith(h('span', { class: cls + ' rf-emblem-dot', style: '--dot:' + color, 'aria-hidden': 'true' }));
    });
    return img;
  }

  function buildGameSelect() {
    if (!gameSel) return;
    Object.entries(D.games).forEach(([slug, g]) => gameSel.append(h('option', { value: slug }, g.name)));
    gameSel.addEventListener('change', renderRanks);
    renderRanks();
  }

  function renderRanks() {
    if (!gameSel || !picker) return;
    const slug = gameSel.value, g = D.games[slug];
    picker.replaceChildren();
    if (!g) return;
    pickedRank = g.ranks[0] ? g.ranks[0][0] : null;
    g.ranks.forEach(r => {
      const b = h('button', { type: 'button', class: 'rf-rank', 'data-rank': r[0], 'aria-pressed': r[0] === pickedRank ? 'true' : 'false', title: r[1] },
        emblem(slug, r[0], r[3][0], 'rf-emblem'), h('span', {}, r[1]));
      b.addEventListener('click', () => {
        pickedRank = r[0];
        $$('.rf-rank', picker).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      });
      picker.append(b);
    });
  }

  /* ── Jeux sur la carte ────────────────────────────────── */
  function makeEntry(gameSlug, rankSlug, points, verified, manual) {
    const g = D.games[gameSlug];
    const r = g && g.ranks.find(x => x[0] === rankSlug);
    if (!g || !r) return null;
    const p = parseInt(points, 10);
    return {
      slug: gameSlug, name: g.name, color: g.color,
      rankSlug: r[0], rankName: r[1], rankTier: r[2], rankColors: r[3],
      points: isNaN(p) ? null : Math.max(0, p),
      verified: !!verified, manual: !!manual
    };
  }

  /** Comptes connectés : source de vérité des jeux, rangs et points affichés sur la carte. */
  const accountBySlug = {};
  (D.accounts || []).forEach(a => { accountBySlug[a.game] = a; });
  const fromAccount = a => makeEntry(a.game, a.rank, a.points, a.trust === 'api', false);

  /** Ajoute le jeu, ou met à jour son rang s'il figure déjà sur la carte. Retourne 'added' | 'updated' | 'full'. */
  function upsertGame(entry) {
    const i = state.games.findIndex(g => g.slug === entry.slug);
    if (i >= 0) { state.games[i] = entry; return 'updated'; }
    if (state.games.length >= MAX_GAMES) return 'full';
    state.games.push(entry);
    return 'added';
  }

  function renderGameList() {
    const list = $('#gameList');
    list.replaceChildren();
    $('#gameCount').textContent = state.games.length;
    if (!state.games.length) {
      list.append(h('li', { class: 'rf-empty-mini' }, 'Aucun jeu pour l\'instant. Ajoute-en un ci-dessus.'));
      return;
    }
    state.games.forEach((g, i) => {
      const linked = !!accountBySlug[g.slug];
      const orphan = !linked && !D.allowManual;      // sera retiré à l'enregistrement
      let pts;
      if (g.manual && D.allowManual) {
        pts = h('input', {
          class: 'rf-input rf-input-sm', type: 'number', min: 0, max: 999999999, inputmode: 'numeric',
          value: g.points == null ? '' : g.points, placeholder: 'pts', 'aria-label': 'Points pour ' + g.name
        });
        pts.addEventListener('input', () => { g.points = pts.value === '' ? null : Math.max(0, parseInt(pts.value, 10) || 0); changed(); });
      } else {
        pts = h('span', { class: 'rf-egame-pts' }, g.points == null ? '' : Number(g.points).toLocaleString('fr-FR'));
      }

      const btn = (label, text, fn, dis) => {
        const b = h('button', { type: 'button', class: 'rf-iconbtn', 'aria-label': label, title: label, disabled: dis }, text);
        b.addEventListener('click', fn);
        return b;
      };
      const move = d => () => {
        const j = i + d;
        if (j < 0 || j >= state.games.length) return;
        [state.games[i], state.games[j]] = [state.games[j], state.games[i]];
        renderGameList(); changed();
      };
      list.append(h('li', { class: 'rf-egame' + (orphan ? ' is-orphan' : ''), style: '--game:' + g.color, title: orphan ? 'Compte non lié : ce jeu sera retiré à l\'enregistrement.' : null },
        g.rankSlug ? emblem(g.slug, g.rankSlug, g.color, 'rf-emblem') : h('span', { class: 'rf-emblem rf-emblem-dot', style: '--dot:' + g.color }),
        h('div', { class: 'rf-egame-main' }, h('strong', {}, g.name, g.verified ? h('span', { class: 'rf-tick', title: 'Rang vérifié', 'aria-label': 'Rang vérifié' }, '✓') : null),
          h('span', {}, orphan ? 'Compte non lié' : (g.rankName || '—'))),
        pts,
        h('div', { class: 'rf-egame-btns' },
          btn('Monter ' + g.name, '↑', move(-1), i === 0),
          btn('Descendre ' + g.name, '↓', move(1), i === state.games.length - 1),
          btn('Retirer ' + g.name, '✕', () => { state.games.splice(i, 1); renderGameList(); changed(); }))
      ));
    });
    renderAccounts();
  }

  /* ── Liste des comptes connectés (ajout en un clic) ───── */
  function renderAccounts() {
    const box = $('#accountPicker');
    if (!box) return;
    box.replaceChildren();
    const accs = (D.accounts || []).filter(a => a.rank && D.games[a.game]);
    $('#noAccounts').hidden = accs.length > 0 || !!D.allowManual;
    const onCard = new Set(state.games.map(g => g.slug));
    const free = accs.filter(a => !onCard.has(a.game));
    const imp = $('#importBtn');
    imp.hidden = free.length < 2;
    accs.forEach(a => {
      const def = D.games[a.game];
      const r = def.ranks.find(x => x[0] === a.rank);
      const added = onCard.has(a.game);
      const btn = h('button', { type: 'button', class: 'rf-btn rf-btn-secondary rf-btn-sm', disabled: added }, added ? 'Ajouté' : 'Ajouter');
      btn.addEventListener('click', () => { upsertGame(fromAccount(a)); renderGameList(); changed(); });
      box.append(h('div', { class: 'rf-accrow', style: '--game:' + def.color },
        emblem(a.game, a.rank, def.color, 'rf-emblem'),
        h('div', { class: 'rf-egame-main' }, h('strong', {}, def.name), h('span', {}, r ? r[1] : '—')),
        btn));
    });
  }

  function wireGames() {
    const add = $('#addGameBtn');
    if (add && D.allowManual) {
      add.addEventListener('click', () => {
        const e = makeEntry(gameSel.value, pickedRank, $('#pointsInput').value, false, true);
        if (!e) return;
        const res = upsertGame(e);
        if (res === 'full') { toast('Une carte peut contenir ' + MAX_GAMES + ' jeux au maximum.', 'err'); return; }
        $('#pointsInput').value = '';
        renderGameList(); changed();
      });
    }
    $('#importBtn').addEventListener('click', () => {
      let n = 0;
      (D.accounts || []).forEach(a => {
        const e = a.rank ? fromAccount(a) : null;
        if (e && upsertGame(e) === 'added') n++;
      });
      renderGameList(); changed();
      toast(n + ' jeu' + (n > 1 ? 'x' : '') + ' ajouté' + (n > 1 ? 's' : '') + '.', n ? 'ok' : 'err');
    });
  }

  /* ── Champs simples ───────────────────────────────────── */
  function wireFields() {
    const layout = $('#layoutSel');
    layout.value = state.layout;
    layout.addEventListener('change', () => { state.layout = layout.value; changed(); });

    [['name', '#p_name'], ['title', '#p_title']].forEach(([k, sel]) => {
      const el = $(sel);
      el.value = state.player[k] || '';
      el.addEventListener('input', () => { state.player[k] = el.value; changed(); });
    });

    const title = $('#cardTitle');
    title.value = state.title;
    title.addEventListener('input', () => { state.title = title.value; markDirty(); });

    const pub = $('#isPublic');
    pub.checked = state.isPublic;
    pub.addEventListener('change', () => { state.isPublic = pub.checked; markDirty(); });

    $$('[data-toggle]').forEach(el => {
      const k = el.dataset.toggle;
      if (k === 'qr' && !D.profileUrl) {
        state.show.qr = false;
        el.checked = false; el.disabled = true;
        $('#qrHint').hidden = false;
        return;
      }
      el.checked = !!state.show[k];
      el.addEventListener('change', () => { state.show[k] = el.checked; changed(); });
    });
  }

  /* ── Sauvegarde ───────────────────────────────────────── */
  function setBusy(on, ...btns) { btns.forEach(b => { b.disabled = on; b.classList.toggle('is-busy', on); }); }

  async function save() {
    if (saving) return;
    saving = true;
    const btn = $('#saveBtn');
    setBusy(true, btn);
    try {
      drawNow();
      const payload = {
        id: state.id, title: (state.title || '').trim() || 'Ma carte',
        template: state.template, layout: state.layout, is_public: state.isPublic,
        config: { player: state.player, games: state.games.map(g => ({ slug: g.slug, name: g.name, color: g.color, rankSlug: g.rankSlug, rankName: g.rankName, rankTier: g.rankTier, rankColors: g.rankColors, points: g.points })), show: state.show }
      };
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      fd.append('thumb', RFCard.thumbnail(canvas, 480, 0.82));
      fd.append('_csrf', D.csrf);
      const res = await fetch(BASE + 'api/save_card.php', { method: 'POST', body: fd, credentials: 'same-origin' });
      let data = null;
      try { data = await res.json(); } catch (e) { /* réponse non JSON */ }
      if (!res.ok || !data || !data.ok) throw new Error((data && data.error) || 'Erreur ' + res.status);

      if (!state.id) history.replaceState(null, '', BASE + 'editor.html?id=' + data.id);
      state.id = data.id;
      // Le serveur ne garde que les jeux liés, avec leur vrai rang : on se réaligne sur sa version.
      if (data.config && Array.isArray(data.config.games)) { state.games = data.config.games; renderGameList(); draw(); }
      if (data.dropped && data.dropped.length) toast('Retiré (compte non lié) : ' + data.dropped.join(', ') + '.', 'err');
      markClean();
      toast(state.isPublic ? 'Carte enregistrée et publiée.' : 'Carte enregistrée.', 'ok');
    } catch (e) {
      toast('Enregistrement impossible : ' + e.message, 'err');
    } finally {
      saving = false;
      setBusy(false, btn);
    }
  }

  /* ── Exports ──────────────────────────────────────────── */
  function fileName(ext) {
    const s = (state.title || 'carte').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'rankfolio-' + (s || 'carte') + '.' + ext;
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function exportImage(kind) {
    drawNow();
    const mime = kind === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob(b => {
      if (!b) { toast('Export impossible.', 'err'); return; }
      download(b, fileName(kind === 'png' ? 'png' : 'jpg'));
    }, mime, 0.95);
  }
  async function exportPDF() {
    const btn = $('#exportPdf');
    setBusy(true, btn);
    try {
      drawNow();
      const fd = new FormData();
      fd.append('image', canvas.toDataURL('image/jpeg', 0.92));
      fd.append('_csrf', D.csrf);
      const res = await fetch(BASE + 'api/export_pdf.php', { method: 'POST', body: fd, credentials: 'same-origin' });
      if (!res.ok) throw new Error('Erreur ' + res.status);
      download(await res.blob(), fileName('pdf'));
    } catch (e) {
      toast('Export PDF impossible : ' + e.message, 'err');
    } finally {
      setBusy(false, btn);
    }
  }

  /* ── Démarrage ────────────────────────────────────────── */
  restore();
  buildTemplates();
  buildGameSelect();
  wireGames();
  wireFields();
  renderGameList();

  $('#saveBtn').addEventListener('click', save);
  $('#exportPng').addEventListener('click', () => exportImage('png'));
  $('#exportJpg').addEventListener('click', () => exportImage('jpeg'));
  $('#exportPdf').addEventListener('click', exportPDF);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  RFCard.onIconLoad(draw);
  drawNow();
  RFCard.whenFontsReady().then(draw);
})();
