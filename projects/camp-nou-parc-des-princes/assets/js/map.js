/* ============================================================
   map.js — Carte du parcours (Leaflet)
   Données injectées par index.php dans window.TRIP
   ============================================================ */
(function () {
  'use strict';

  var TRIP = window.TRIP;
  if (!TRIP || !TRIP.stops || !TRIP.stops.length) { return; }

  var COLOR     = '#00e676';   // trajet
  var COLOR_HOT = '#7cffb2';   // journée survolée
  var COLOR_OFF = '#93a5b3';   // journées mises en retrait (gris distinct du fond)

  // Déclarés ici car applyStyle() les utilise avant que le tracé soit construit.
  var segments    = {};        // jour -> { line, casing }
  var dots        = {};        // jour -> élément DOM du point
  var allPoints   = [];
  var casingColor = '#06210f';

  var map = L.map('map', {
    zoomControl:        true,
    attributionControl: true,
    scrollWheelZoom:    true,
    zoomSnap:           0.25
  });

  // Une vue initiale est indispensable AVANT d'ajouter des couches : sans
  // elle, Leaflet diffère leur création et getElement()/getContainer()
  // renvoient null. Le cadrage réel est fait plus bas par frame().
  map.setView([TRIP.stops[0].lat, TRIP.stops[0].lng], 8);

  map.zoomControl.setPosition('bottomright');

  // --------------------------------------------------------
  //  Deux fonds de carte, au choix (mémorisé d'une visite à l'autre)
  //    relief : montagnes et vallées visibles, teinte verte, lumineux
  //    sombre : fond noir et gris facon « Waze la nuit »
  // --------------------------------------------------------
  // Trois plans au choix. « clair » ajoute un ombrage du terrain par-dessus
  // le fond clair : c'est ce qui fait apparaître le relief.
  var HILLSHADE_URL =
    'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}';

  var STYLES = {
    // Imagerie satellite Esri (par défaut). Les images n'ont aucun texte : on ajoute les noms par-dessus.
    satellite: {
      url:  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      opts: { maxZoom: 19, attribution: '&copy; Esri' },
      hillshade: false,
      labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      casing: '#ffffff'
    },
    // Fond topographique Esri : végétation verte, mer bleue et relief déjà intégré.
    clair: {
      url:  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      opts: { maxZoom: 19, attribution: '&copy; Esri' },
      hillshade: false,
      labels:    null,
      casing:    '#06210f'
    }
  };

  var saved = null;
  try { saved = localStorage.getItem('toutdroit.mapStyle'); } catch (e) { /* stockage indisponible */ }
  var currentStyle = STYLES[saved] ? saved : 'satellite';

  var baseLayer  = null;
  var hillLayer  = null;
  var labelLayer = null;

  function applyStyle(name) {
    var cfg = STYLES[name];
    if (!cfg) { return; }

    currentStyle = name;

    [baseLayer, hillLayer, labelLayer].forEach(function (l) {
      if (l) { map.removeLayer(l); }
    });
    hillLayer = labelLayer = null;

    baseLayer = L.tileLayer(cfg.url, cfg.opts).addTo(map);

    if (cfg.hillshade) {
      hillLayer = L.tileLayer(HILLSHADE_URL, {
        maxZoom:     16,
        opacity:     0.22,
        className:   'hillshade-tiles',
        attribution: '&copy; Esri'
      }).addTo(map);
    }

    if (cfg.labels) {
      labelLayer = L.tileLayer(cfg.labels, {
        maxZoom:     19,
        className:   'label-tiles',
        attribution: '&copy; Esri'
      }).addTo(map);
    }

    Object.keys(STYLES).forEach(function (s) {
      document.body.classList.toggle('map-' + s, s === name);
    });

    Array.prototype.forEach.call(document.querySelectorAll('.mode-btn'), function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-style') === name);
    });

    // Le contour du tracé doit contraster avec le fond : foncé sur les fonds
    // clairs et sombres, blanc sur le satellite.
    casingColor = cfg.casing;
    Object.keys(segments).forEach(function (key) {
      segments[key].casing.setStyle({ color: casingColor });
    });

    try { localStorage.setItem('toutdroit.mapStyle', name); } catch (e) { /* stockage indisponible */ }
  }

  applyStyle(currentStyle);

  Array.prototype.forEach.call(document.querySelectorAll('.mode-btn'), function (btn) {
    btn.addEventListener('click', function () {
      applyStyle(btn.getAttribute('data-style'));
    });
  });

  // --------------------------------------------------------
  //  Tracé : une polyligne par jour (le segment MENANT à l'étape)
  // --------------------------------------------------------
  TRIP.stops.forEach(function (stop) {
    if (!stop.route || !stop.route.length) { return; }

    // Ville connue mais pas encore atteinte : route en gris pointille, pas
    // en vert plein (on ne fait pas croire que l'etape est terminee).
    var restColor = stop.arrived ? COLOR : COLOR_OFF;
    var restDash  = stop.arrived ? null : '2 10';

    // Contour foncé sous le trait : c'est lui qui fait ressortir le vert
    // aussi bien sur le fond relief clair que sur le fond sombre.
    var casing = L.polyline(stop.route, {
      color:        casingColor,
      weight:       10,
      opacity:      0.85,
      smoothFactor: 1.5,
      lineJoin:     'round',
      lineCap:      'round',
      interactive:  false
    }).addTo(map);

    var line = L.polyline(stop.route, {
      color:        restColor,
      weight:       5,
      opacity:      1,
      dashArray:    restDash,
      smoothFactor: 1.5,
      lineJoin:     'round',
      lineCap:      'round',
      interactive:  false
    }).addTo(map);

    segments[stop.day] = { line: line, casing: casing, arrived: stop.arrived };
    allPoints = allPoints.concat(stop.route);
  });

  // --------------------------------------------------------
  //  Marqueurs : un point à chaque endroit où ils ont dormi
  // --------------------------------------------------------
  var lastDay = TRIP.stops[TRIP.stops.length - 1].day;

  TRIP.stops.forEach(function (stop) {
    allPoints.push([stop.lat, stop.lng]);

    // Départ (jour 0)
    if (stop.day === 0) {
      L.marker([stop.lat, stop.lng], {
        icon: L.divIcon({
          className: 'bubble-icon',
          html: '<div class="start-marker"><i></i><span>Départ · ' + esc(stop.name) + '</span></div>',
          iconSize: [0, 0]
        }),
        interactive: false,
        zIndexOffset: 500
      }).addTo(map);
      return;
    }

    // Point de nuitée + nom de la ville
    var marker = L.marker([stop.lat, stop.lng], {
      icon: L.divIcon({
        className: 'bubble-icon',
        html: '<div class="sleep-point" data-day="' + stop.day + '">'
            + '<i></i><span>' + esc(stop.name) + '</span></div>',
        iconSize: [0, 0]
      }),
      interactive: false,
      zIndexOffset: 400 + stop.day
    }).addTo(map);

    var el = marker.getElement();
    if (el) { dots[stop.day] = el.querySelector('.sleep-point'); }
  });

  // Position actuelle : grosse boule verte qui clignote — la derniere
  // ville ou ils sont VRAIMENT arrives, pas une ville juste renseignee
  // a l'avance pour donner deja acces aux clips.
  var lastStop = TRIP.stops[TRIP.stops.length - 1];
  var current  = lastStop;
  for (var i = TRIP.stops.length - 1; i >= 0; i--) {
    if (TRIP.stops[i].arrived) { current = TRIP.stops[i]; break; }
  }

  if (current) {
    L.marker([current.lat, current.lng], {
      icon: L.divIcon({
        className: 'pulse-icon',
        html: '<div class="pulse-dot"><span></span><span></span><i></i></div>',
        iconSize: [0, 0]
      }),
      interactive: false,
      zIndexOffset: 900
    }).addTo(map);
  }

  // Étape en cours SANS ville connue : ils sont partis mais n'ont pas
  // encore dormi quelque part. Un pointillé gris, projeté vers l'objectif,
  // marque juste « c'est parti, direction par là ». Des qu'une ville est
  // deja renseignee pour le jour suivant (meme pas encore confirmee), sa
  // vraie route grisee prend le relais et ce pointille de secours est inutile.
  if (current && current.day === lastStop.day && TRIP.goal) {
    var frac = 0.15; // portion symbolique du trajet restant, pas une vraie distance
    var proj = [
      current.lat + (TRIP.goal.lat - current.lat) * frac,
      current.lng + (TRIP.goal.lng - current.lng) * frac
    ];

    L.polyline([[current.lat, current.lng], proj], {
      color:        COLOR_OFF,
      weight:       4,
      opacity:      0.7,
      dashArray:    '2 10',
      lineCap:      'round',
      className:    'progress-line',
      interactive:  false
    }).addTo(map);
  }

  // Objectif : Parc des Princes
  if (TRIP.goal) {
    L.marker([TRIP.goal.lat, TRIP.goal.lng], {
      icon: L.divIcon({
        className: 'bubble-icon',
        html: '<div class="goal-marker"><i></i><span>' + esc(TRIP.goal.name) + '</span></div>',
        iconSize: [0, 0]
      }),
      interactive: false,
      zIndexOffset: 600
    }).addTo(map);
  }

  // --------------------------------------------------------
  //  Survol d'une bulle du bandeau -> segment en fluo + point mis en avant
  // --------------------------------------------------------
  /**
   * day = numéro de la journée survolée, ou null pour tout remettre à zéro.
   * La journée survolée passe en fluo, les autres en gris clair : elles
   * restent bien visibles sur le fond sombre, mais s'effacent derrière elle.
   */
  // Épaisseur du trait selon le zoom : dézoomé, il faut un trait plus gros
  // pour que le trajet reste lisible de loin.
  function baseWeight() {
    var z = map.getZoom();
    return z < 7 ? 7 : (z < 9 ? 6 : 5);
  }

  var focusedDay = null;

  function setHighlight(day) {
    focusedDay = day;
    var base   = baseWeight();

    Object.keys(segments).forEach(function (key) {
      var d     = parseInt(key, 10);
      var seg   = segments[key];
      var isHot = (day !== null && d === day);
      var isOff = (day !== null && d !== day);

      // Au repos (ni survole, ni un autre jour survole), une etape pas
      // encore arrivee reste grise et pointillee plutot que verte pleine.
      var restColor = seg.arrived ? COLOR : COLOR_OFF;
      var restDash  = seg.arrived ? null : '2 10';

      seg.line.setStyle({
        color:     isHot ? COLOR_HOT : (isOff ? COLOR_OFF : restColor),
        weight:    isHot ? base + 4 : base,
        opacity:   isOff ? 0.85 : 1,
        dashArray: isHot ? null : restDash
      });
      seg.casing.setStyle({
        weight:  (isHot ? base + 4 : base) + 3,
        opacity: isOff ? 0.5 : 0.9
      });

      if (dots[d]) {
        dots[d].classList.toggle('is-hot', isHot);
        dots[d].classList.toggle('is-off', isOff);
      }
    });

    if (day !== null && segments[day]) {
      segments[day].casing.bringToFront();
      segments[day].line.bringToFront();
    }

    document.body.classList.toggle('is-focusing', day !== null);
  }

  // Au dézoom, les noms de villes se chevauchent : on ne garde que les points.
  function updateZoomClass() {
    document.body.classList.toggle('zoom-far', map.getZoom() < 8.5);
    setHighlight(focusedDay);
  }

  map.on('zoomend', updateZoomClass);
  updateZoomClass();

  Array.prototype.forEach.call(
    document.querySelectorAll('.day-bar .day-bubble'),
    function (btn) {
      var day = parseInt(btn.getAttribute('data-day'), 10);
      btn.addEventListener('mouseenter', function () { setHighlight(day); });
      btn.addEventListener('mouseleave', function () { setHighlight(null); });
      btn.addEventListener('focus',      function () { setHighlight(day); });
      btn.addEventListener('blur',       function () { setHighlight(null); });
    }
  );

  // --------------------------------------------------------
  //  Cadrage
  // --------------------------------------------------------
  // Le bandeau supérieur change de hauteur selon la largeur d'écran et le
  // nombre de journées : on le mesure plutôt que de deviner.
  //
  // Les marges sont ensuite bornées : sur un écran court, leur somme peut
  // dépasser la hauteur disponible, et Leaflet dézoome alors à l'extrême
  // (le trajet devient un point minuscule). On garde toujours au moins
  // 55 % de la carte pour le tracé.
  function padding() {
    var bar    = document.querySelector('.topbar');
    var size   = map.getSize();
    var narrow = window.innerWidth < 900;

    var top    = (bar ? bar.offsetHeight : 200) + 26;
    var bottom = narrow ? 205 : 130;
    var left   = narrow ? 30 : 120;
    var right  = narrow ? 30 : 110;

    var maxV = size.y * (narrow ? 0.62 : 0.45);   // petit écran : plus de marge verticale pour ne pas passer sous le bandeau
    if (top + bottom > maxV) {
      var kv = maxV / (top + bottom);
      top    = Math.floor(top * kv);
      bottom = Math.floor(bottom * kv);
    }

    var maxH = size.x * 0.45;
    if (left + right > maxH) {
      var kh = maxH / (left + right);
      left   = Math.floor(left * kh);
      right  = Math.floor(right * kh);
    }

    return {
      paddingTopLeft:     [left, top],
      paddingBottomRight: [right, bottom]
    };
  }

  function frame(bounds, animate) {
    var p = padding();
    if (animate) {
      p.duration = 1.1;
      map.flyToBounds(bounds, p);
    } else {
      map.fitBounds(bounds, p);
    }
  }

  var routeBounds = allPoints.length ? L.latLngBounds(allPoints) : null;
  var fullBounds  = (routeBounds && TRIP.goal)
    ? L.latLngBounds(allPoints.concat([[TRIP.goal.lat, TRIP.goal.lng]]))
    : routeBounds;

  if (routeBounds) { frame(routeBounds, false); }

  // Bouton « voir tout le défi »
  var goalBtn = document.getElementById('see-goal');
  var wide    = false;

  if (goalBtn && routeBounds && TRIP.goal) {
    goalBtn.addEventListener('click', function () {
      wide = !wide;
      frame(wide ? fullBounds : routeBounds, true);
      goalBtn.textContent = wide ? 'Voir l’étape en cours' : 'Voir tout le défi';
    });
  }

  // Recadre si la fenêtre change de taille (bascule mobile / desktop)
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (routeBounds) { frame(wide ? fullBounds : routeBounds, false); }
    }, 220);
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
