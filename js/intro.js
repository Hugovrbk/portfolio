/* intro.js — le logo se remplit (bord ondulé), puis l'écran d'intro se lève comme un rideau :
   tout seul, ou dès que le visiteur défile / glisse / appuie sur une touche / clique. Une seule fois par session. */
(function () {
  'use strict';
  var root = document.documentElement, intro = document.getElementById('intro');
  if (!intro) return;
  if (!root.classList.contains('has-intro')) { intro.remove(); return; }
  window.__introStarted = true;
  var bg = [].slice.call(document.querySelectorAll('body > :not(#intro):not(script)'));
  function setInert(on) { bg.forEach(function (n) { if (on) n.setAttribute('inert', ''); else n.removeAttribute('inert'); }); }
  setInert(true);
  var killed = false;
  function abort() { if (killed) return; killed = true; setInert(false); root.classList.remove('has-intro'); root.classList.add('intro-done'); if (intro.parentNode) intro.remove(); }
  try {
    var S = window.SITE || {}, name = S.name || 'Prénom Nom', role = S.role || 'développeur web';
    var svg = document.getElementById('introLogo'), outline = document.getElementById('introOutline'), fill = document.getElementById('introFill'),
        wave = document.getElementById('introWave'), tag = document.getElementById('introTag'), skip = document.getElementById('introSkip');
    outline.textContent = fill.textContent = name + '.'; svg.setAttribute('aria-label', name); tag.textContent = role;
    var dbgT = (/[?&]introT=([\d.]+)/.exec(location.search) || [])[1], hold = /[?&]hold=1/.test(location.search);   /* paramètres de test : figer le remplissage / garder le rideau à mi-course */
    var box = { x: 0, y: 0, w: 900, h: 180 }, filled = false, lifted = false, finished = false, p = 0, raf = 0, t0 = 0, autoTimer = 0, idle = 0, DUR = 2400;

    function fit() {            /* ajuste le cadre au texte réel (une fois la police chargée) */
      try { var bb = outline.getBBox(), px = bb.height * .2; box = { x: bb.x - px, y: bb.y - bb.height * .14, w: bb.width + px * 2, h: bb.height * 1.28 }; svg.setAttribute('viewBox', [box.x, box.y, box.w, box.h].join(' ')); } catch (e) { /* cadre par défaut */ }
    }
    function waveD(prog, time) {   /* surface de l'eau : montée + ondulation qui s'apaise */
      var x0 = box.x - 20, x1 = box.x + box.w + 20, bot = box.y + box.h, amp = box.h * .17 * (1 - Math.pow(prog, 3)),
          base = bot + amp - (box.h + amp * 2) * prog, k = Math.PI * 2 / (box.w * .5), d = 'M' + x0 + ',' + (bot + 60);
      for (var x = x0; x <= x1; x += 10) d += 'L' + x + ',' + (base + amp * Math.sin(k * x + time * 2.4));
      return d + 'L' + x1 + ',' + (bot + 60) + 'Z';
    }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function frame(ts) {
      if (!t0) t0 = ts;
      var t = Math.min(1, (ts - t0) / DUR); wave.setAttribute('d', waveD(ease(t), ts / 1000));
      if (t < 1) raf = requestAnimationFrame(frame); else done();
    }
    function done() { if (filled) return; filled = true; wave.setAttribute('d', waveD(1, 0)); intro.classList.add('is-filled'); autoTimer = setTimeout(lift, 1000); }
    function completeFill() { if (filled) return; cancelAnimationFrame(raf); done(); }
    function setY(v, anim) { p = v; intro.style.transition = anim ? 'transform 1.05s cubic-bezier(.76,0,.2,1)' : 'none'; intro.style.transform = 'translate3d(0,' + (-v * 100) + '%,0)'; }
    function lift() {
      if (lifted) return; lifted = true; clearTimeout(autoTimer); clearTimeout(idle); completeFill(); root.classList.add('intro-go');
      setY(1, true); intro.addEventListener('transitionend', function (e) { if (e.target === intro && e.propertyName === 'transform') finish(); }); setTimeout(finish, 1400);   /* seule la transition du rideau compte (pas celles des enfants) */
    }
    function finish() {
      if (finished) return; finished = true; setInert(false); unbind();
      try { sessionStorage.setItem('portfolioIntro', '1'); } catch (e) { /* ok */ }
      root.classList.remove('has-intro'); root.classList.add('intro-done'); intro.remove();
      var m = document.getElementById('contenu'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); }
    }
    /* défilement « scrubbé » : la page suit le geste ; relâché au-delà de 18 %, elle finit de se lever */
    function scrub(dy) {
      if (lifted) return; completeFill(); clearTimeout(autoTimer); clearTimeout(idle); root.classList.add('intro-go');
      setY(Math.max(0, Math.min(1, p + dy / (window.innerHeight * .9))), false); idle = setTimeout(release, 160);
    }
    function release() { if (hold) return; if (p > .18) lift(); else { setY(0, true); root.classList.remove('intro-go'); autoTimer = setTimeout(lift, 2600); } }
    var ty = 0;
    function onWheel(e) { e.preventDefault(); scrub(e.deltaY); }
    function onTS(e) { ty = e.touches[0].clientY; }
    function onTM(e) { e.preventDefault(); var y = e.touches[0].clientY; scrub((ty - y) * 1.5); ty = y; }
    function onTE() { clearTimeout(idle); if (!lifted) release(); }
    function onKey(e) { if (['ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter', 'End', 'Escape'].indexOf(e.key) > -1) { e.preventDefault(); lift(); } }
    function onClick(e) { lift(); }
    window.addEventListener('wheel', onWheel, { passive: false }); window.addEventListener('touchstart', onTS, { passive: true });
    window.addEventListener('touchmove', onTM, { passive: false }); window.addEventListener('touchend', onTE); window.addEventListener('keydown', onKey); intro.addEventListener('click', onClick);
    function unbind() { window.removeEventListener('wheel', onWheel); window.removeEventListener('touchstart', onTS); window.removeEventListener('touchmove', onTM); window.removeEventListener('touchend', onTE); window.removeEventListener('keydown', onKey); }
    skip.addEventListener('click', function (e) { e.stopPropagation(); lift(); }); skip.focus({ preventScroll: true });

    var go = function () {
      fit(); wave.setAttribute('d', waveD(0, 0));
      if (dbgT !== undefined) { var v = parseFloat(dbgT); wave.setAttribute('d', waveD(v, 1.3)); if (v >= 1) { filled = true; intro.classList.add('is-filled'); } return; }
      raf = requestAnimationFrame(frame);
    }, started = false;
    function start() { if (started) return; started = true; setTimeout(go, 200); }
    var load = document.fonts && document.fonts.load ? document.fonts.load('800 100px "Bricolage Grotesque"') : Promise.resolve();
    Promise.race([load, new Promise(function (r) { setTimeout(r, 1800); })]).then(start, start);
  } catch (err) { abort(); }
})();
