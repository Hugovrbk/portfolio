/* static-patch.js — remplace ce que faisaient PHP/MySQL : API (villes, événements, votes, favoris) et filtres. */
(function () {
  'use strict';
  var S = window.SM_STATIC || {};
  var lang = (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr';
  var T = { fr: { none: 'Aucun résultat pour ces critères.', note: 'Version de démonstration statique : données d’exemple, votes et favoris enregistrés dans votre navigateur.', res: 'résultat' },
            en: { none: 'No results for these criteria.', note: 'Static demo version: sample data, votes and favourites are stored in your browser.', res: 'result' } }[lang];
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k) || ''); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }

  /* ---------- 1. API remplacées ---------- */
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  function json(o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } })); }
  function bodyParams(init) { var b = init && init.body; return b instanceof URLSearchParams ? b : new URLSearchParams(b || ''); }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var m = url.match(/api\/([a-z-]+)\.php/);
    if (!m) return realFetch(input, init);
    var u = new URL(url, location.href), p = u.searchParams, D = S[p.get('lang') || lang] || S.fr || { cities: { success: true, cities: [] }, events: {} };
    if (m[1] === 'cities') {
      var list = (D.cities.cities || []).slice(), term = (p.get('search') || '').toLowerCase(), cid = p.get('country_id');
      if (term) list = list.filter(function (c) { return (c.name || '').toLowerCase().indexOf(term) > -1; });
      if (cid) list = list.filter(function (c) { return String(c.country_id) === cid; });
      return json(Object.assign({}, D.cities, { cities: list }));
    }
    if (m[1] === 'events') {
      var e = D.events[p.get('city_id')] || { success: true, events: [] };
      return json(Object.assign({}, e, { events: (e.events || []).slice(0, +p.get('limit') || 50) }));
    }
    if (m[1] === 'clip-vote') {
      var b = bodyParams(init), id = b.get('clip_id'), v = parseInt(b.get('vote'), 10) || 0, votes = get('sm.votes', {});
      if (v) votes[id] = v; else delete votes[id]; set('sm.votes', votes);
      return json({ success: true, user_vote: v, upvotes: v === 1 ? 1 : 0, downvotes: v === -1 ? 1 : 0, aura: v });
    }
    if (m[1] === 'favorites') {
      var f = bodyParams(init), favs = get('sm.favs', {}), key = f.get('type') + ':' + f.get('id');
      if (f.get('action') === 'add') favs[key] = 1; else delete favs[key]; set('sm.favs', favs);
      return json({ success: true });
    }
    if (m[1] === 'comments') return json({ success: true, message: lang === 'fr' ? 'Merci ! Version de démonstration : le commentaire n’est pas publié.' : 'Thank you! Demo version: the comment is not published.' });
    return json({ success: false, message: lang === 'fr' ? 'Fonction non disponible dans cette version de démonstration.' : 'Feature not available in this demo version.' });
  };

  document.addEventListener('DOMContentLoaded', function () {
    /* ---------- 2. Votes : restaurer l'état enregistré ---------- */
    var votes = get('sm.votes', {});
    document.querySelectorAll('.aura-voting[data-clip-id]').forEach(function (box) {
      var v = votes[box.dataset.clipId] || 0; box.dataset.vote = String(v);
      var s = box.querySelector('.aura-score strong'), up = box.querySelector('.upvote-count'), dn = box.querySelector('.downvote-count');
      if (s) s.textContent = v; if (up) up.textContent = v === 1 ? 1 : 0; if (dn) dn.textContent = v === -1 ? 1 : 0;
      box.querySelectorAll('button[data-vote]').forEach(function (b) { var on = Number(b.dataset.vote) === v; b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    });

    /* ---------- 3. Filtres (explorer, médiathèque, clips) ---------- */
    document.querySelectorAll('form[data-static-filter]').forEach(function (form) {
      var cards = Array.prototype.slice.call(document.querySelectorAll('article[data-kind]'));
      if (!cards.length) return;
      var host = cards[0].parentElement, order = cards.slice();
      var empty = document.createElement('p'); empty.className = 'static-empty'; empty.hidden = true; empty.textContent = T.none;
      empty.style.cssText = 'margin:1.5rem 0;font-weight:700'; host.parentElement.insertBefore(empty, host.nextSibling);
      function val(n) { var e = form.elements[n]; return e ? String(e.value || '').trim() : ''; }
      function apply(e) {
        if (e) e.preventDefault();
        var q = val('search').toLowerCase(), cat = val('category'), co = val('country'), city = val('city'), type = val('type'), df = val('date_from'), dt = val('date_to'), sort = val('sort');
        var shown = cards.filter(function (c) {
          var d = c.dataset, ok = true;
          if (q) ok = ok && c.textContent.toLowerCase().indexOf(q) > -1;
          if (cat) ok = ok && (' ' + (d.cats || '') + ' ').indexOf(' ' + cat + ' ') > -1;
          if (co) ok = ok && d.country === co;
          if (city) ok = ok && (d.city === city);
          if (type) ok = ok && d.type === type;
          if (df) ok = ok && d.date >= df;
          if (dt) ok = ok && d.date <= dt;
          return ok;
        });
        var key = function (c) { return sort.indexOf('views') > -1 || sort.indexOf('aura') > -1 ? Number(c.dataset.views) : Date.parse(c.dataset.date); };
        var list = shown.slice();
        if (sort && sort !== 'featured') list.sort(function (a, b) { var asc = /asc|old/.test(sort); return asc ? key(a) - key(b) : key(b) - key(a); });
        else list.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
        cards.forEach(function (c) { c.hidden = shown.indexOf(c) < 0; });
        list.forEach(function (c) { host.appendChild(c); });
        empty.hidden = shown.length > 0;
        document.querySelectorAll('.results-count').forEach(function (el) {
          var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), node, last = null;
          while ((node = walker.nextNode())) { if (/\d+/.test(node.nodeValue)) last = node; }
          if (last) last.nodeValue = last.nodeValue.replace(/\d+/, shown.length).replace(/(résultat|result)s?/i, function (w) { return shown.length === 1 ? w.replace(/s$/i, '') : (/s$/i.test(w) ? w : w + 's'); });
        });
      }
      form.addEventListener('submit', apply);
      form.addEventListener('reset', function () { setTimeout(function () { apply(); }, 0); });
      Array.prototype.forEach.call(form.elements, function (el) { if (el.tagName === 'SELECT') el.addEventListener('change', function () { apply(); }); });
      /* pré-remplissage depuis l'adresse (?category=…) */
      var qs = new URLSearchParams(location.search); qs.forEach(function (v, k) { if (form.elements[k]) form.elements[k].value = v; });
      if (qs.toString()) apply();
    });

    /* ---------- 4. Mention de démonstration ---------- */
    var foot = document.querySelector('footer'); if (foot) {
      var n = document.createElement('p'); n.textContent = T.note; n.style.cssText = 'margin:1rem auto 0;max-width:60rem;padding:0 1rem;font-size:.85rem;opacity:.75;text-align:center'; foot.appendChild(n);
    }
  });
})();
