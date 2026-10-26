/* ============================================================
   RANKFOLIO — Moteur de rendu des cartes (canvas 2D)
   Partagé par l'éditeur et l'aperçu de la page d'accueil.

   RFCard.configure({ templates })
   RFCard.render(canvas, spec)       spec = { template, layout, player, games, show, qr, date }
   RFCard.thumbnail(canvas, 480)     → data URL JPEG
   RFCard.onIconLoad(fn)             → rappelé quand un emblème finit de charger
   ============================================================ */
(function (global) {
  'use strict';

  const FONT = {
    display: '"Cormorant Garamond", Georgia, serif',
    body: 'Inter, "Segoe UI", system-ui, sans-serif'
  };

  const LAYOUTS = {
    horizontal: { w: 1200, h: 675 },
    vertical:   { w: 675,  h: 1200 },
    square:     { w: 900,  h: 900 },
    panoramic:  { w: 1500, h: 600 },
    banner:     { w: 1500, h: 500 }
  };

  let iconSet = null;   // ensemble des emblèmes existants (si fourni par le serveur)
  let TEMPLATES = {
    obsidian: { name: 'Obsidian', bg: ['#0a0a0f', '#1a1a24'], accent: '#c9a961' }
  };

  /* ── Emblèmes (images chargées à la demande, une seule fois) ───── */
  const iconStore = new Map();   // "jeu/rang" → { img, state }
  const iconListeners = [];

  function iconBase() {
    return (document.body && document.body.dataset.base ? document.body.dataset.base : '') + 'assets/ranks/';
  }

  /** Retourne l'image si elle est prête ; sinon lance son chargement et retourne null. */
  function getIcon(gameSlug, rankSlug) {
    if (!gameSlug || !rankSlug) return null;
    const key = gameSlug + '/' + rankSlug;
    if (iconSet && !iconSet.has(key)) return null;
    let e = iconStore.get(key);
    if (!e) {
      e = { img: new Image(), state: 'loading' };
      iconStore.set(key, e);
      e.img.onload = () => { e.state = 'ok'; iconListeners.forEach(fn => fn(key)); };
      e.img.onerror = () => { e.state = 'fail'; };
      e.img.src = iconBase() + key + '.png';
    }
    return e.state === 'ok' ? e.img : null;
  }

  /* ── Utilitaires de dessin ─────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Écrit un texte en réduisant la taille de police, puis en tronquant, pour qu'il tienne dans maxW. */
  function fitText(ctx, text, x, y, maxW, makeFont, size, minSize) {
    let s = size;
    ctx.font = makeFont(s);
    while (ctx.measureText(text).width > maxW && s > minSize) { s -= 1; ctx.font = makeFont(s); }
    let out = text;
    if (ctx.measureText(out).width > maxW) {
      while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
      out = out.trimEnd() + '…';
    }
    ctx.fillText(out, x, y);
    return s;
  }

  /**
   * Répartit n cellules dans une zone. Choisit le nombre de colonnes qui donne les cellules
   * les plus proches d'un ratio ~2,6:1, sans jamais masquer de jeu tant que la place suffit.
   */
  function fitGrid(n, area, gap, lim) {
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = Math.min((area.w - gap * (cols - 1)) / cols, lim.maxW);
      const chRaw = (area.h - gap * (rows - 1)) / rows;
      if (cw < lim.minW || chRaw < lim.minH) continue;
      const ch = Math.min(chRaw, lim.maxH, cw / 1.9);
      const empty = rows * cols - n;
      const score = Math.abs(Math.log(cw / ch) - Math.log(2.5)) + 0.12 * (empty / cols);
      if (!best || score < best.score) best = { cols, rows, cw, ch, score, shown: n };
    }
    if (best) return best;

    // Plus de place : on affiche le maximum de cellules de taille minimale, le reste est résumé par « +N ».
    let cap = null;
    for (let cols = 1; cols <= 6; cols++) {
      const cw = Math.min((area.w - gap * (cols - 1)) / cols, lim.maxW);
      if (cw < lim.minW * 0.8) continue;
      const rows = Math.max(1, Math.floor((area.h + gap) / (lim.minH * 0.8 + gap)));
      const ch = Math.min((area.h - gap * (rows - 1)) / rows, lim.maxH);
      const total = cols * rows;
      if (!cap || total > cap.total) cap = { cols, rows, cw, ch, total };
    }
    cap = cap || { cols: 1, rows: 1, cw: area.w, ch: area.h, total: 1 };
    const shown = Math.max(1, Math.min(n, cap.total - (n > cap.total ? 1 : 0)));
    return { cols: cap.cols, rows: Math.ceil(shown / cap.cols), cw: cap.cw, ch: cap.ch, shown };
  }

  /* ── Une cellule « jeu » ───────────────────────────────── */
  function drawGameCell(ctx, g, x, y, w, h, c) {
    // Fond
    roundRect(ctx, x, y, w, h, Math.min(16, h * 0.16));
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, g.color + (c.light ? '30' : '2a'));
    grad.addColorStop(1, c.light ? 'rgba(0,0,0,.04)' : 'rgba(0,0,0,.28)');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = g.color + '66'; ctx.lineWidth = 1.4; ctx.stroke();

    // Rail de couleur du jeu (même repère que l'interface du site)
    ctx.save();
    roundRect(ctx, x, y, w, h, Math.min(16, h * 0.16)); ctx.clip();
    ctx.fillStyle = g.color; ctx.fillRect(x, y, 5, h);
    ctx.restore();

    // Emblème : image réelle (ratio conservé) sinon emblème dessiné
    const icon = getIcon(g.slug, g.rankSlug);
    const box = Math.min(h * 0.74, 120);
    const boxW = icon && icon.naturalWidth / icon.naturalHeight > 1.5 ? Math.min(box * 1.7, w * 0.32) : box;
    const ex = x + 24, cy = y + h / 2;
    if (icon) {
      const r = Math.min(boxW / icon.naturalWidth, box / icon.naturalHeight);
      const dw = icon.naturalWidth * r, dh = icon.naturalHeight * r;
      ctx.drawImage(icon, ex + (boxW - dw) / 2, cy - dh / 2, dw, dh);
    } else if (global.RFRanks) {
      global.RFRanks.drawEmblem(ctx, ex + box / 2, cy, box * 0.42, g.rankTier || 1, g.rankColors || [g.color, g.color, g.color]);
    }

    // Coche : le rang a été lu directement chez l'éditeur (compte vérifié)
    if (g.verified) {
      const r = Math.max(9, Math.min(13, h * 0.1)), cx = x + w - r - 14, cy2 = y + r + 12;
      ctx.beginPath(); ctx.arc(cx, cy2, r, 0, Math.PI * 2);
      ctx.fillStyle = '#2fbf7a'; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.8, r * 0.18); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy2 + r * 0.02); ctx.lineTo(cx - r * 0.1, cy2 + r * 0.38); ctx.lineTo(cx + r * 0.5, cy2 - r * 0.32); ctx.stroke();
    }

    // Textes
    const tx = ex + boxW + 18;
    const maxW = x + w - tx - (g.verified ? 38 : 16);
    const f1 = Math.max(13, Math.min(21, h * 0.14));
    const f2 = Math.max(17, Math.min(34, h * 0.22));
    const f3 = Math.max(12, Math.min(16, h * 0.105));
    const showPts = c.showPoints && g.points != null && g.points !== '';
    const block = f1 * 1.2 + f2 * 1.25 + (showPts ? f3 * 1.5 : 0);
    let ty = cy - block / 2;

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = c.text;
    ty += f1;
    fitText(ctx, g.name || '', tx, ty, maxW, s => '600 ' + s + 'px ' + FONT.body, f1, 10);
    ctx.fillStyle = c.accent;
    ty += f2 * 1.2;
    fitText(ctx, g.rankName || '—', tx, ty, maxW, s => '700 ' + s + 'px ' + FONT.display, f2, 13);
    if (showPts) {
      ctx.fillStyle = c.sub;
      ty += f3 * 1.5;
      ctx.font = '400 ' + f3 + 'px ' + FONT.body;
      ctx.fillText(Number(g.points).toLocaleString('fr-FR') + ' pts', tx, ty);
    }
  }

  /* ── QR code ───────────────────────────────────────────── */
  function drawQR(ctx, qr, x, y, size) {
    const pad = size * 0.09;
    roundRect(ctx, x, y, size, size, 10);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    const inner = size - pad * 2;
    const cell = inner / qr.size;
    ctx.fillStyle = '#0a0a0f';
    for (let r = 0; r < qr.size; r++) {
      for (let col = 0; col < qr.size; col++) {
        if (qr.modules[r][col]) {
          ctx.fillRect(Math.round(x + pad + col * cell), Math.round(y + pad + r * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
  }

  /* ── Rendu principal ───────────────────────────────────── */
  function render(canvas, spec) {
    const d = LAYOUTS[spec.layout] || LAYOUTS.horizontal;
    if (canvas.width !== d.w) canvas.width = d.w;
    if (canvas.height !== d.h) canvas.height = d.h;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, d.w, d.h);

    const tpl = TEMPLATES[spec.template] || TEMPLATES.obsidian || Object.values(TEMPLATES)[0];
    const light = !!tpl.light;
    const col = {
      light,
      text: light ? '#111111' : '#f2f2f2',
      sub: light ? '#555555' : '#a0a0a8',
      accent: tpl.accent,
      showPoints: !!(spec.show && spec.show.points)
    };
    const show = spec.show || {};
    const games = Array.isArray(spec.games) ? spec.games : [];
    const wide = d.w / d.h >= 2.2;
    const pad = wide ? 44 : 56;

    // Fond, halo, double filet
    const bg = ctx.createLinearGradient(0, 0, d.w, d.h);
    bg.addColorStop(0, tpl.bg[0]); bg.addColorStop(1, tpl.bg[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, d.w, d.h);

    const glow = ctx.createRadialGradient(d.w * 0.85, d.h * 0.15, 20, d.w * 0.85, d.h * 0.15, d.w * 0.7);
    glow.addColorStop(0, tpl.accent + '33'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, d.w, d.h);

    ctx.strokeStyle = tpl.accent + '55'; ctx.lineWidth = 2;
    roundRect(ctx, 18, 18, d.w - 36, d.h - 36, 22); ctx.stroke();
    ctx.strokeStyle = light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    roundRect(ctx, 26, 26, d.w - 52, d.h - 52, 18); ctx.stroke();

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const footerY = d.h - pad + 8;
    const qrOn = !!(show.qr && spec.qr);

    /* — Bloc identité — */
    let gridArea;
    if (wide) {
      const colW = Math.round(d.w * 0.28);
      if (show.name) {
        ctx.fillStyle = col.text;
        fitText(ctx, spec.player.name || 'TonPseudo', pad, pad + 62, colW, s => '700 ' + s + 'px ' + FONT.display, 56, 28);
      }
      if (show.title && spec.player.title) {
        ctx.fillStyle = tpl.accent;
        fitText(ctx, spec.player.title.toUpperCase(), pad, pad + 94, colW, s => '500 ' + s + 'px ' + FONT.body, 15, 10);
      }
      if (qrOn) drawQR(ctx, spec.qr, pad, footerY - 30 - 104, 104);
      const lx = pad + colW + 28;
      ctx.strokeStyle = tpl.accent + '44'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, pad + 6); ctx.lineTo(lx, d.h - pad - 10); ctx.stroke();
      gridArea = { x: lx + 28, y: pad + 4, w: d.w - pad - (lx + 28), h: d.h - pad * 2 - 14, center: true };
    } else {
      const qrSize = 96;
      const textMax = d.w - pad * 2 - (qrOn ? qrSize + 28 : 0);
      if (show.name) {
        ctx.fillStyle = col.text;
        fitText(ctx, spec.player.name || 'TonPseudo', pad, pad + 64, textMax, s => '700 ' + s + 'px ' + FONT.display, 52, 28);
      }
      if (show.title && spec.player.title) {
        ctx.fillStyle = tpl.accent;
        fitText(ctx, spec.player.title.toUpperCase(), pad, pad + 96, textMax, s => '500 ' + s + 'px ' + FONT.body, 15, 10);
      }
      if (qrOn) drawQR(ctx, spec.qr, d.w - pad - qrSize, pad + 6, qrSize);
      const sepY = Math.max(pad + 128, qrOn ? pad + 6 + qrSize + 18 : 0);
      ctx.strokeStyle = tpl.accent + '44'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, sepY); ctx.lineTo(d.w - pad, sepY); ctx.stroke();
      const top = sepY + 28;
      gridArea = { x: pad, y: top, w: d.w - pad * 2, h: footerY - 28 - top, center: false };
    }

    /* — Grille des jeux — */
    if (show.games && games.length) {
      const gap = 18;
      const g = fitGrid(games.length, gridArea, gap, { minW: 240, minH: 88, maxW: 560, maxH: 190 });
      const totalW = g.cols * g.cw + (g.cols - 1) * gap;
      const totalH = g.rows * g.ch + (g.rows - 1) * gap;
      const ox = gridArea.x + (gridArea.w - totalW) / 2;
      const oy = gridArea.y + (gridArea.center ? (gridArea.h - totalH) / 2 : 0);
      for (let i = 0; i < g.shown; i++) {
        drawGameCell(ctx, games[i], ox + (i % g.cols) * (g.cw + gap), oy + Math.floor(i / g.cols) * (g.ch + gap), g.cw, g.ch, col);
      }
      if (games.length > g.shown) {
        ctx.fillStyle = col.sub; ctx.font = '500 15px ' + FONT.body; ctx.textAlign = 'right';
        ctx.fillText('+' + (games.length - g.shown) + ' autre' + (games.length - g.shown > 1 ? 's' : ''), gridArea.x + gridArea.w, footerY - 6);
        ctx.textAlign = 'left';
      }
    } else if (!games.length) {
      ctx.fillStyle = col.sub; ctx.font = '400 17px ' + FONT.body; ctx.textAlign = 'center';
      ctx.fillText('Ajoute des jeux pour les voir apparaître ici.', gridArea.x + gridArea.w / 2, gridArea.y + gridArea.h / 2);
      ctx.textAlign = 'left';
    }

    /* — Pied : date et signature — */
    if (show.date) {
      ctx.fillStyle = col.sub; ctx.font = '400 12px ' + FONT.body;
      ctx.fillText('Mis à jour le ' + (spec.date || new Date().toLocaleDateString('fr-FR')), pad, footerY);
    }
    ctx.fillStyle = tpl.accent + '99'; ctx.font = '600 11px ' + FONT.body; ctx.textAlign = 'right';
    ctx.fillText('RANKFOLIO', d.w - pad, footerY);
    ctx.textAlign = 'left';
  }

  /** Miniature JPEG (fond opaque) pour la galerie. */
  function thumbnail(canvas, maxW, quality) {
    const w = Math.min(maxW || 480, canvas.width);
    const h = Math.round(canvas.height * (w / canvas.width));
    const t = document.createElement('canvas');
    t.width = w; t.height = h;
    const c = t.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.drawImage(canvas, 0, 0, w, h);
    return t.toDataURL('image/jpeg', quality || 0.82);
  }

  /** Charge les polices utilisées par le canvas avant le premier dessin. */
  function whenFontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('700 48px "Cormorant Garamond"'),
      document.fonts.load('600 17px Inter'),
      document.fonts.load('400 12px Inter')
    ]).catch(() => {});
  }

  global.RFCard = {
    LAYOUTS,
    configure(o) {
      if (!o) return;
      if (o.templates) TEMPLATES = o.templates;
      if (o.icons) iconSet = new Set(o.icons);
    },
    hasIcon(g, r) { return !iconSet || iconSet.has(g + '/' + r); },
    render, thumbnail, whenFontsReady,
    getIcon,
    onIconLoad(fn) { iconListeners.push(fn); }
  };
})(window);
