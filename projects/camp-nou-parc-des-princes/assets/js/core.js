/* core.js — remplace les pages PHP (index/jour/clips) : lit TRIP_DATA, calcule
   les trajets (OSRM, côté navigateur, cache localStorage) et génère le HTML. */
(function () {
  'use strict';
  var D = window.TRIP_DATA;
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; };
  var fmt = function (n) { return Number(n).toLocaleString('fr-FR'); };
  var qs = new URLSearchParams(location.search);
  var stops = D.stops.slice().sort(function (a, b) { return a.day - b.day; });
  var byDay = {}; stops.forEach(function (s) { byDay[s.day] = s; });

  function label(s) { return s.label ? s.name + ' — ' + s.label : s.name; }
  function routeLabel(s) { var p = byDay[s.day - 1]; return (p ? p.name : '?') + ' → ' + label(s); }
  function ts(c) { return c.date ? Date.parse(c.date) || 0 : 0; }
  function byId(x, y) { return (y.id || 0) - (x.id || 0); }
  function sortClips(list, mode) {
    var a = list.slice();
    if (mode === 'recent') return a.sort(function (x, y) { return (ts(y) - ts(x)) || byId(x, y); });
    if (mode === 'anciens') return a.sort(function (x, y) { return (ts(x) - ts(y)) || -byId(x, y); });
    return a.sort(function (x, y) {
      var xn = x.views == null, yn = y.views == null;
      return xn !== yn ? (xn ? 1 : -1) : ((y.views || 0) - (x.views || 0)) || byId(x, y);
    });
  }
  function embed(slug) {
    return 'https://clips.twitch.tv/embed?clip=' + encodeURIComponent(slug) + '&parent=' + encodeURIComponent(location.hostname || 'localhost') + '&autoplay=false';
  }
  function hav(a, b) {
    var R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
    var x = Math.pow(Math.sin(dLa / 2), 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.pow(Math.sin(dLo / 2), 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  /* ---------- Trajets : OSRM au chargement, cache, repli ligne droite ---------- */
  function loadRoute(prev, s) {
    if (s.route && s.route.length) return Promise.resolve(s);
    var key = 'toutdroit.route.v1:' + [prev.lat, prev.lng, s.lat, s.lng].join(',');
    try { var c = JSON.parse(localStorage.getItem(key) || 'null'); if (c) { s.route = c.r; s._km = c.km; return Promise.resolve(s); } } catch (e) {}
    var url = 'https://router.project-osrm.org/route/v1/driving/' + prev.lng + ',' + prev.lat + ';' + s.lng + ',' + s.lat + '?overview=full&geometries=geojson';
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(t);
      if (j.code !== 'Ok') throw 0;
      s.route = j.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
      s._km = Math.round(j.routes[0].distance / 100) / 10;
      try { localStorage.setItem(key, JSON.stringify({ r: s.route, km: s._km })); } catch (e) {}
      return s;
    }).catch(function () {
      clearTimeout(t);
      s.route = [[prev.lat, prev.lng], [s.lat, s.lng]];             // repli : ligne droite
      s._km = Math.round(hav([prev.lat, prev.lng], [s.lat, s.lng]) * 1.25 * 10) / 10;
      return s;
    });
  }
  function ensureRoutes() {
    return Promise.all(stops.filter(function (s) { return s.day > 0 && byDay[s.day - 1]; })
      .map(function (s) { return loadRoute(byDay[s.day - 1], s); }));
  }

  function buildTrip() {
    var arrived = stops.filter(function (s) { return s.arrived !== false; });
    var km = 0, days = 0;
    arrived.forEach(function (s) { if (s.day > 0) days++; var k = s.km != null ? s.km : s._km; if (k) km += k; });
    return {
      stops: stops.map(function (s) {
        return { day: s.day, name: s.name, label: s.label, lat: s.lat, lng: s.lng, km: s.km != null ? s.km : (s._km || null),
          clips: (s.clips || []).length, route: s.route || null, arrived: s.arrived !== false,
          preview: s.day > 0 ? sortClips(s.clips || [], 'vues').slice(0, 3).map(function (c) { return { slug: c.slug, title: c.title }; }) : [] };
      }),
      goal: D.goal, totals: { km: Math.round(km * 10) / 10, days: days }, twitchParent: location.hostname || 'localhost'
    };
  }
  function loadScripts(list, done) {
    var i = 0; (function next() {
      if (i >= list.length) return done && done();
      var el = document.createElement('script'); el.src = list[i++]; el.onload = next; el.onerror = next; document.body.appendChild(el);
    })();
  }

  /* ---------- Page carte ---------- */
  function initIndex() {
    var nav = document.querySelector('.day-bar');
    var cur = null; stops.forEach(function (s) { if (s.arrived !== false) cur = s; });
    ensureRoutes().then(function () {
      var trip = buildTrip(); window.TRIP = trip;
      nav.innerHTML = trip.stops.filter(function (s) { return s.day > 0; }).map(function (s) {
        return '<a class="day-bubble' + (cur && s.day === cur.day ? ' is-current' : '') + '" href="jour.html?day=' + s.day + '" data-day="' + s.day + '" title="' + esc(s.name) + ' — voir les clips">' +
          '<span class="b-day">Jour ' + s.day + '</span><span class="b-city">' + esc(s.name) + '</span>' + (s.clips > 0 ? '<span class="b-clips">' + s.clips + '</span>' : '') + '</a>';
      }).join('');
      var hud = document.getElementById('hud-status');
      if (cur) hud.innerHTML = '<span class="live-dot"></span><span class="live-label">En route</span><span class="live-sep">/</span><span class="live-city">' + esc(cur.name) + '</span>'; else hud.remove();
      document.getElementById('stat-km').textContent = fmt(Math.round(trip.totals.km));
      document.getElementById('stat-days').textContent = trip.totals.days;
      document.getElementById('stat-days-unit').textContent = (trip.totals.days > 1 ? 'jours' : 'jour') + ' de route';
      if (D.bestofUrl) { var b = document.getElementById('bestof'); b.href = D.bestofUrl; b.hidden = false; }
      loadScripts(['assets/vendor/leaflet/leaflet.js', 'assets/js/map.js', 'assets/js/day-preview.js']);
    });
  }

  /* ---------- Pages jour / clips ---------- */
  function submitBox(sel) {
    return '<details class="submit-box"><summary class="submit-toggle"><span class="submit-plus">+</span> Proposer un clip</summary>' +
      '<form class="submit-form" id="propose-form"><p class="submit-intro">Tu as vu un moment fort sur le stream ? Colle le lien du clip Twitch. ' +
      '<em>(Version portfolio : formulaire de démonstration, rien n\'est enregistré.)</em></p><div class="submit-row"><div class="submit-col"><label class="field-label" for="p-day">Jour</label>' +
      '<select class="field" id="p-day" required>' + stops.filter(function (s) { return s.day > 0; }).map(function (s) {
        return '<option value="' + s.day + '"' + (s.day === sel ? ' selected' : '') + '>Jour ' + s.day + ' — ' + esc(s.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="submit-col submit-col-wide"><label class="field-label" for="p-url">Lien du clip Twitch</label><input class="field" type="text" id="p-url" placeholder="https://clips.twitch.tv/..." required></div>' +
      '<div class="submit-col"><label class="field-label" for="p-pseudo">Ton pseudo <span class="opt">(optionnel)</span></label><input class="field" type="text" id="p-pseudo" maxlength="60" placeholder="Anonyme"></div></div>' +
      '<button class="btn btn-primary" type="submit">Envoyer</button></form></details><div id="flash"></div>';
  }
  function sortBar(mode, base) {
    var u = function (k) { return base + (base.indexOf('?') > -1 ? '&' : '?') + 'tri=' + k; };
    return '<div class="sort-bar"><span class="sort-label">Trier</span><a class="sort-btn' + (mode === 'vues' ? ' is-on' : '') + '" href="' + u('vues') + '">Les plus vues</a>' +
      '<div class="sort-pair"><a class="sort-btn sort-btn-pair' + (mode === 'anciens' ? ' is-on' : '') + '" href="' + u('anciens') + '">Plus anciennes</a>' +
      '<a class="sort-btn sort-btn-pair' + (mode === 'recent' ? ' is-on' : '') + '" href="' + u('recent') + '">Plus récentes</a></div></div>' +
      '<div class="layout-toggle" role="group" aria-label="Disposition des clips"><span class="sort-label">Affichage</span><div class="sort-pair">' +
      '<button type="button" class="sort-btn sort-btn-pair layout-btn" data-cols="1">1 / 1</button><button type="button" class="sort-btn sort-btn-pair layout-btn" data-cols="2">2 / 2</button></div></div>';
  }
  function card(c, showDay, s) {
    return '<article class="clip-card"><div class="clip-frame"><iframe src="' + esc(embed(c.slug)) + '" allowfullscreen scrolling="no" loading="lazy" title="' + esc(c.title || c.slug) + '"></iframe></div>' +
      '<div class="clip-meta">' + (showDay ? '<a class="clip-day" href="jour.html?day=' + s.day + '">Jour ' + s.day + ' · ' + esc(s.name) + '</a>' : '') +
      (c.title ? '<div class="clip-title">' + esc(c.title) + '</div>' : '') +
      '<div class="clip-tags">' + (c.views != null ? '<span class="clip-views">' + fmt(c.views) + ' vues</span>' : '') + '</div></div></article>';
  }
  function navDays(cur) {
    return '<nav class="nav-days">' + stops.filter(function (s) { return s.day > 0; }).map(function (s) {
      return '<a href="jour.html?day=' + s.day + '"' + (s.day === cur ? ' class="on"' : '') + '>Jour ' + s.day + '</a>'; }).join('') + '</nav>';
  }
  function bindForm() {
    var f = document.getElementById('propose-form'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = document.getElementById('p-url').value.trim(), ok = false;
      if (/^[A-Za-z0-9_-]+$/.test(v) || /twitch\.tv\/[^\/]+\/clip\/[A-Za-z0-9_-]+/i.test(v) || /clips\.twitch\.tv\/[A-Za-z0-9_-]+/i.test(v)) ok = true;
      document.getElementById('flash').innerHTML = ok
        ? '<div class="alert alert-ok">Merci ! Dans la version originale, ton clip serait proposé puis validé. Ici, rien n\'est enregistré (démo statique).</div>'
        : '<div class="alert alert-err">Ce lien n\'est pas un clip Twitch valide.</div>';
      if (ok) f.reset();
    });
  }
  function initDay() {
    var day = parseInt(qs.get('day'), 10) || 0, s = day >= 1 ? byDay[day] : null;
    var mode = ['recent', 'anciens'].indexOf(qs.get('tri')) > -1 ? qs.get('tri') : 'vues', root = document.getElementById('app');
    var top = '<div class="admin-top"><a class="back-link" href="index.html">← Retour à la carte</a><a class="back-link" href="clips.html">Tous les clips →</a></div>';
    if (!s) { document.title = 'Jour introuvable — ' + D.title;
      root.innerHTML = top + '<div class="day-head"><h1 class="day-num"><small>Oups</small>JOUR<br>INTROUVABLE</h1><p class="day-city">Cette étape n\'existe pas encore</p></div><div class="empty">Reviens sur la carte pour choisir un jour</div>' + navDays(0); return; }
    document.title = 'Jour ' + s.day + ' · ' + s.name + ' — ' + D.title;
    var clips = sortClips(s.clips || [], mode), km = s.km != null ? s.km : null, n = clips.length;
    root.innerHTML = top + '<div class="day-head"><h1 class="day-num"><small>Le parcours</small>JOUR ' + s.day + '</h1><p class="day-city">' + esc(routeLabel(s)) + '</p><div class="day-meta">' +
      (km != null ? '<span class="chip">' + String(km).replace('.', ',') + ' km</span>' : '') + '<span class="chip muted">' + n + ' clip' + (n > 1 ? 's' : '') + '</span></div></div>' +
      submitBox(s.day) + '<div class="section-label">Les meilleurs clips de la journée</div><div class="clips-controls">' + sortBar(mode, 'jour.html?day=' + s.day) + '</div>' +
      (n ? '<div class="clips-grid">' + clips.map(function (c) { return card(c, false, s); }).join('') + '</div>' : '<div class="empty">Clips à venir</div>') + navDays(s.day);
    bindForm(); loadScripts(['assets/js/clip-layout.js']);
  }
  function initClips() {
    var mode = ['recent', 'anciens'].indexOf(qs.get('tri')) > -1 ? qs.get('tri') : 'vues', all = [];
    stops.forEach(function (s) { (s.clips || []).forEach(function (c) { all.push({ c: c, s: s }); }); });
    var sorted = sortClips(all.map(function (x) { return Object.assign({ _s: x.s }, x.c); }), mode), n = sorted.length, nd = Math.max(0, stops.length - 1);
    document.getElementById('app').innerHTML = '<a class="back-link" href="index.html">← Retour à la carte</a><div class="day-head"><h1 class="day-num"><small>Toute l\'aventure</small>TOUS<br>LES CLIPS</h1>' +
      '<div class="day-meta"><span class="chip">' + n + ' clip' + (n > 1 ? 's' : '') + '</span><span class="chip muted">' + nd + ' jour' + (nd > 1 ? 's' : '') + '</span></div></div>' +
      submitBox(null) + '<div class="section-label">Les clips</div><div class="clips-controls">' + sortBar(mode, 'clips.html') + '</div>' +
      (n ? '<div class="clips-grid">' + sorted.map(function (c) { return card(c, true, c._s); }).join('') + '</div>' : '<div class="empty">Aucun clip pour l\'instant</div>') + navDays(0);
    bindForm(); loadScripts(['assets/js/clip-layout.js']);
  }
  var page = document.body.getAttribute('data-page');
  if (page === 'index') initIndex(); else if (page === 'jour') initDay(); else if (page === 'clips') initClips();
})();
