/* ============================================================
   day-preview.js — Aperçu vidéo au survol d'une bulle « Jour N »
   Enchaîne les 3 clips les plus vus du jour, skippables, avec
   avance automatique. Données déjà présentes dans window.TRIP
   (aucun appel réseau côté client).
   ============================================================ */
(function () {
  'use strict';

  var TRIP = window.TRIP;
  var bubbles = document.querySelectorAll('.day-bar .day-bubble');
  if (!TRIP || !TRIP.stops || !bubbles.length) { return; }

  var CLIP_DURATION = 15000; // ms passés sur chaque clip avant d'enchaîner
  var CLOSE_DELAY    = 160;  // ms de tolérance pour glisser la souris vers le panneau

  var previewByDay = {};
  TRIP.stops.forEach(function (s) {
    if (s.preview && s.preview.length) { previewByDay[s.day] = s.preview; }
  });
  if (!Object.keys(previewByDay).length) { return; } // aucun clip nulle part : rien a construire

  // --------------------------------------------------------
  //  Panneau flottant (un seul, réutilisé et repositionné)
  // --------------------------------------------------------
  var panel = document.createElement('div');
  panel.className = 'day-preview';
  panel.innerHTML =
    '<div class="day-preview-frame"></div>' +
    '<div class="day-preview-bar">' +
      '<span class="day-preview-count"></span>' +
      '<button type="button" class="day-preview-skip">Suivant →</button>' +
    '</div>';
  document.body.appendChild(panel);

  var frameEl = panel.querySelector('.day-preview-frame');
  var countEl = panel.querySelector('.day-preview-count');
  var skipBtn = panel.querySelector('.day-preview-skip');

  var clips     = [];
  var index     = 0;
  var advanceTimer = null;
  var closeTimer   = null;

  function embedUrl(slug) {
    return 'https://clips.twitch.tv/embed?clip=' + encodeURIComponent(slug)
         + '&parent=' + encodeURIComponent(TRIP.twitchParent)
         + '&autoplay=true&muted=true';
  }

  function renderClip() {
    var c = clips[index];
    frameEl.innerHTML = '<iframe src="' + embedUrl(c.slug) + '" '
      + 'allow="autoplay" scrolling="no" loading="lazy" title="'
      + (c.title ? escHtml(c.title) : c.slug) + '"></iframe>';
    countEl.textContent = (index + 1) + ' / ' + clips.length;

    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(next, CLIP_DURATION);
  }

  function next() {
    index++;
    if (index >= clips.length) { hide(); return; }
    renderClip();
  }

  function show(day, anchor) {
    var found = previewByDay[day];
    if (!found || !found.length) { return; }

    cancelClose();
    clips = found;
    index = 0;
    position(anchor);
    panel.classList.add('is-visible');
    renderClip();
  }

  function hide() {
    clearTimeout(advanceTimer);
    panel.classList.remove('is-visible');
    frameEl.innerHTML = ''; // coupe la lecture
  }

  function scheduleClose() {
    closeTimer = setTimeout(hide, CLOSE_DELAY);
  }

  function cancelClose() {
    clearTimeout(closeTimer);
  }

  function position(anchor) {
    var rect  = anchor.getBoundingClientRect();
    var width = 300; // doit correspondre a la largeur CSS de .day-preview

    var left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - width - 10));

    panel.style.left = left + 'px';
    panel.style.top  = (rect.bottom + 10) + 'px';
  }

  skipBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    next();
  });

  panel.addEventListener('mouseenter', cancelClose);
  panel.addEventListener('mouseleave', scheduleClose);

  Array.prototype.forEach.call(bubbles, function (btn) {
    var day = parseInt(btn.getAttribute('data-day'), 10);
    btn.addEventListener('mouseenter', function () { show(day, btn); });
    btn.addEventListener('mouseleave', scheduleClose);
    btn.addEventListener('focus',      function () { show(day, btn); });
    btn.addEventListener('blur',       scheduleClose);
  });

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
