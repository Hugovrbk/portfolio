/* static-patch.js (Liggster Shop) — remplace PHP/MySQL : panier, favoris, filtres de la boutique, paiement et compte de démonstration. Tout reste dans le navigateur. */
(function () {
  'use strict';
  var C = (window.LG_STATIC || {}).catalog || {};
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k) || ''); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  function money(n) { return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €'; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function fee(sub) { return sub > 0 && sub < 100 ? 6.9 : 0; }
  var cart = function () { return get('lg.cart', {}); }, favs = function () { return get('lg.favs', []); };
  function count() { var c = cart(); return Object.keys(c).reduce(function (n, k) { return n + c[k]; }, 0); }
  function lines() { var c = cart(), out = [], sub = 0; Object.keys(c).forEach(function (id) { var p = C[id]; if (!p) return; var q = Math.min(c[id], p.stock); if (q < 1) return; out.push({ id: id, p: p, q: q }); sub += p.price * q; }); return { lines: out, sub: sub }; }

  /* ---------- API remplacées (appelées par app.js) ---------- */
  var real = window.fetch ? window.fetch.bind(window) : null;
  function json(o, st) { return Promise.resolve(new Response(JSON.stringify(o), { status: st || 200, headers: { 'Content-Type': 'application/json' } })); }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '', m = url.match(/api\/([a-z-]+)\.php/);
    if (!m) return real(input, init);
    var id = (String((init && init.body) || '').match(/product_id=(\d+)/) || [])[1];
    if (m[1] === 'cart-add') {
      var p = C[id]; if (!p) return json({ ok: false, error: 'Produit introuvable' }, 404);
      var c = cart(); if ((c[id] || 0) >= p.stock) return json({ ok: false, error: 'Stock maximum atteint' });
      c[id] = (c[id] || 0) + 1; set('lg.cart', c); return json({ ok: true, count: count() });
    }
    if (m[1] === 'favorite-toggle') {
      var f = favs(), i = f.indexOf(Number(id)); if (i > -1) f.splice(i, 1); else f.push(Number(id)); set('lg.favs', f);
      return json({ ok: true, fav: i === -1, count: f.length });
    }
    return json({ ok: false, error: 'Fonction non disponible dans cette version de démonstration.' }, 400);
  };

  function badges() {
    [['count-cart', count()], ['count-fav', favs().length]].forEach(function (a) { var el = document.getElementById(a[0]); if (el) { el.textContent = a[1]; el.dataset.count = a[1]; } });
    var f = favs(); document.querySelectorAll('.pcard').forEach(function (card) { var b = card.querySelector('[data-act="fav"]'); if (b) b.setAttribute('aria-pressed', f.indexOf(Number(card.dataset.id)) > -1 ? 'true' : 'false'); });
  }

  /* ---------- boutique : filtres (équivalent du SQL de boutique.php) ---------- */
  function shop() {
    var form = document.getElementById('filters'); if (!form) return;
    var q = new URLSearchParams(location.search), type = q.get('type') || q.get('cat') || 'all';
    Array.prototype.forEach.call(form.elements, function (el) { if (!el.name || !q.has(el.name)) return; if (el.type === 'checkbox') el.checked = q.get(el.name) === el.value; else el.value = q.get(el.name); });
    var lo = form.elements.min, hi = form.elements.max; if (lo && hi) { lo.dispatchEvent(new Event('input')); }
    document.querySelectorAll('.filters .chip').forEach(function (c) { var t = (c.getAttribute('href').match(/(?:type|cat)=([a-z-]+)/) || [])[1] || 'all'; c.classList.toggle('is-active', t === type); });
    var cards = Array.prototype.slice.call(document.querySelectorAll('.pcard[data-id]')), host = cards.length ? cards[0].parentElement : null; if (!host) return;
    var F = favs(), min = +q.get('min') || 0, max = q.has('max') ? +q.get('max') : Infinity, bloc = q.get('bloc') || '', serie = q.get('serie') || '', lang = q.get('langue') || '', term = (q.get('q') || '').toLowerCase(), all = q.get('avail') === 'all', sort = q.get('sort') || 'new';
    var shown = cards.filter(function (c) {
      var d = c.dataset, p = +d.price;
      if (type === 'fav' && F.indexOf(+d.id) < 0) return false;
      if (type !== 'all' && type !== 'fav' && (' ' + d.types + ' ').indexOf(' ' + type + ' ') < 0) return false;
      if (p < min || p > max) return false; if (bloc && d.bloc !== bloc) return false; if (serie && d.serie !== serie) return false; if (lang && d.lang !== lang) return false;
      if (term && d.name.toLowerCase().indexOf(term) < 0) return false; if (!all && +d.stock <= 0) return false; return true;
    });
    shown.sort(function (a, b) { if (sort === 'price_asc') return a.dataset.price - b.dataset.price; if (sort === 'price_desc') return b.dataset.price - a.dataset.price; return (b.dataset.feat - a.dataset.feat) || (b.dataset.created - a.dataset.created); });
    cards.forEach(function (c) { c.hidden = shown.indexOf(c) < 0; }); shown.forEach(function (c) { host.appendChild(c); });
    document.querySelectorAll('main p, main span, main div').forEach(function (el) { if (!el.children.length && /^\s*\d+\s+articles?\s*$/i.test(el.textContent)) el.textContent = shown.length + ' article' + (shown.length > 1 ? 's' : ''); });
    if (!shown.length) { var e = document.createElement('div'); e.className = 'empty'; e.innerHTML = '<h3>Aucun article ne correspond</h3><p>Modifie les filtres pour voir plus de résultats.</p>'; host.parentElement.appendChild(e); }
  }

  /* ---------- panier ---------- */
  function renderCart(root) {
    var L = lines(), sub = L.sub, f = fee(sub);
    if (!L.lines.length) { root.innerHTML = '<h1>Panier</h1><ol class="steps"><li class="is-current">1. Panier</li><li>2. Livraison et confirmation</li></ol><div class="empty"><h3>Ton panier est vide</h3><p style="margin:.75rem auto 1.5rem">Ajoute une carte ou un booster pour commencer.</p><a class="btn btn--primary" href="boutique.html">Voir la boutique</a></div>'; return; }
    root.innerHTML = '<h1>Panier</h1><ol class="steps"><li class="is-current">1. Panier</li><li>2. Livraison et confirmation</li></ol><div class="cart-layout"><div>' + L.lines.map(function (l) {
      return '<div class="cart-line"><div class="cart-line__art" style="--accent:#7c4dff">' + esc(l.p.name.charAt(0).toUpperCase()) + '</div><div><strong>' + esc(l.p.name) + '</strong><div class="text-dim" style="font-size:.85rem">' + money(l.p.price) + ' l\'unité</div></div>' +
        '<div class="qty"><button data-q="dec" data-id="' + l.id + '" aria-label="Retirer un">−</button><span>' + l.q + '</span><button data-q="inc" data-id="' + l.id + '" aria-label="Ajouter un"' + (l.q >= l.p.stock ? ' disabled' : '') + '>+</button></div><strong>' + money(l.p.price * l.q) + '</strong>' +
        '<button class="btn btn--danger btn--sm" data-q="remove" data-id="' + l.id + '">Supprimer</button></div>'; }).join('') +
      '</div><aside class="summary"><h3>Récapitulatif</h3><div class="sum-row"><span>Sous-total</span><span>' + money(sub) + '</span></div><div class="sum-row"><span>Livraison</span><span>' + (f ? money(f) : 'Offerte') + '</span></div><div class="sum-row sum-total"><span>Total</span><span>' + money(sub + f) + '</span></div>' +
      '<p class="text-dim" style="font-size:.8rem;margin-bottom:1rem">Livraison offerte dès 100 €. Paiement simulé (démo).</p><a class="btn btn--primary btn--block" href="commande.html">Commander</a></aside></div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-q]'); if (!b) return;
    var c = cart(), id = b.dataset.id, p = C[id], q = c[id] || 0;
    if (b.dataset.q === 'inc') q = Math.min(q + 1, p.stock); else if (b.dataset.q === 'dec') q--; else q = 0;
    if (q <= 0) delete c[id]; else c[id] = q; set('lg.cart', c); badges(); var r = document.querySelector('[data-static-cart] .container'); if (r) renderCart(r);
  });

  /* ---------- commande (démo) ---------- */
  function renderCheckout(root) {
    var L = lines(), f = fee(L.sub), u = get('lg.user', {});
    if (!L.lines.length) { root.innerHTML = '<h1>Commande</h1><div class="empty"><h3>Ton panier est vide</h3><p style="margin:.75rem auto 1.5rem">Ajoute un article avant de commander.</p><a class="btn btn--primary" href="boutique.html">Voir la boutique</a></div>'; return; }
    function fld(n, l, v, t) { return '<div class="field"><label for="' + n + '">' + l + '</label><input class="input" id="' + n + '" name="' + n + '" type="' + (t || 'text') + '" value="' + esc(v || '') + '" required></div>'; }
    root.innerHTML = '<h1>Commande</h1><ol class="steps"><li>1. Panier</li><li class="is-current">2. Livraison et confirmation</li></ol><div class="cart-layout"><form id="checkout" novalidate><h3 style="margin-bottom:1rem">Adresse de livraison</h3>' +
      fld('name', 'Nom complet', u.username) + fld('address', 'Adresse', u.address) + fld('postal', 'Code postal', u.postal_code) + fld('city', 'Ville', u.city) + fld('country', 'Pays', u.country || 'Belgique') +
      '<p class="text-dim" style="font-size:.85rem;margin:1rem 0">Paiement simulé : aucune donnée n\'est envoyée.</p><button class="btn btn--primary" type="submit">Confirmer la commande</button></form>' +
      '<aside class="summary"><h3>Récapitulatif</h3>' + L.lines.map(function (l) { return '<div class="sum-row"><span>' + esc(l.p.name) + ' × ' + l.q + '</span><span>' + money(l.p.price * l.q) + '</span></div>'; }).join('') +
      '<div class="sum-row"><span>Livraison</span><span>' + (f ? money(f) : 'Offerte') + '</span></div><div class="sum-row sum-total"><span>Total</span><span>' + money(L.sub + f) + '</span></div></aside></div>';
    document.getElementById('checkout').addEventListener('submit', function (ev) {
      ev.preventDefault(); var form = ev.target; if (!form.checkValidity()) { form.reportValidity(); return; }
      var orders = get('lg.orders', []), n = orders.length + 1, o = { id: 1000 + n, date: new Date().toISOString(), lines: L.lines.map(function (l) { return { name: l.p.name, q: l.q, price: l.p.price }; }), total: L.sub + f, ship: f, city: form.city.value };
      orders.unshift(o); set('lg.orders', orders); set('lg.cart', {}); badges();
      root.innerHTML = '<h1>Merci pour ta commande !</h1><div class="empty"><h3>Commande n° ' + o.id + ' confirmée</h3><p style="margin:.75rem auto 1.5rem">Version de démonstration : aucun paiement n\'a été effectué.</p><a class="btn btn--primary" href="compte.html">Voir mes commandes</a> <a class="btn btn--ghost" href="boutique.html">Continuer mes achats</a></div>';
      window.scrollTo(0, 0);
    });
  }

  /* ---------- compte (démo) ---------- */
  function renderAccount(root) {
    var u = get('lg.user', { username: 'Démo', email: 'demo@liggster.local' }), orders = get('lg.orders', []);
    root.innerHTML = '<h1>Mon compte</h1><p class="text-dim" style="margin:.5rem 0 2rem">' + esc(u.username) + ' · ' + esc(u.email) + ' · <span class="badge badge--gold">Démo</span></p><div class="account-grid"><div><h3 style="margin-bottom:1rem">Mes commandes</h3>' +
      (orders.length ? orders.map(function (o) { return '<div class="cart-line" style="grid-template-columns:1fr auto auto"><div><strong>Commande n° ' + o.id + '</strong><div class="text-dim" style="font-size:.85rem">' + new Date(o.date).toLocaleDateString('fr-FR') + ' · ' + o.lines.map(function (l) { return esc(l.name) + ' × ' + l.q; }).join(', ') + '</div></div><strong>' + money(o.total) + '</strong></div>'; }).join('') : '<p class="text-dim">Aucune commande pour le moment. Les commandes de démonstration restent dans ce navigateur.</p>') +
      '</div><div><h3 style="margin-bottom:1rem">Mes informations</h3><p class="text-dim">Compte de démonstration : aucune donnée personnelle n\'est collectée ni envoyée.</p><button class="btn btn--ghost" id="lg-reset" type="button">Réinitialiser la démo</button></div></div>';
    document.getElementById('lg-reset').addEventListener('click', function () { ['lg.cart', 'lg.favs', 'lg.orders', 'lg.user'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* ok */ } }); location.reload(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    badges(); shop();
    var r;
    if ((r = document.querySelector('[data-static-cart] .container'))) renderCart(r);
    if ((r = document.querySelector('[data-static-checkout] .container'))) renderCheckout(r);
    if ((r = document.querySelector('[data-static-account] .container'))) renderAccount(r);
    document.querySelectorAll('form[data-static-login]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); var em = (f.elements.email || {}).value || 'demo@liggster.local'; set('lg.user', { username: (f.elements.username && f.elements.username.value) || em.split('@')[0], email: em }); location.href = 'compte.html'; }); });
  });
})();
