/* RANKFOLIO — Accueil : carte d'exemple vivante (rendu réel + modèles cliquables + inclinaison) */
(function () {
  'use strict';
  const dataEl = document.getElementById('rf-hero-data');
  const canvas = document.getElementById('heroCard');
  if (!dataEl || !canvas || !window.RFCard) return;

  const D = JSON.parse(dataEl.textContent);
  const spec = Object.assign({}, D.card);
  RFCard.configure({ templates: D.templates, icons: D.icons });

  const draw = () => RFCard.render(canvas, spec);
  draw();
  RFCard.onIconLoad(draw);
  RFCard.whenFontsReady().then(draw);

  /* Changement de modèle */
  const swatches = Array.from(document.querySelectorAll('.rf-swatch'));
  swatches.forEach(b => b.addEventListener('click', () => {
    spec.template = b.dataset.template;
    swatches.forEach(s => {
      s.classList.toggle('is-active', s === b);
      s.setAttribute('aria-pressed', s === b ? 'true' : 'false');
    });
    draw();
  }));

  /* Inclinaison au pointeur (désactivée si l'utilisateur réduit les animations ou n'a pas de souris) */
  const stage = document.getElementById('heroStage');
  const tilt = document.getElementById('heroTilt');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (stage && tilt && !calm && window.matchMedia('(hover: hover)').matches) {
    stage.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
      tilt.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
      tilt.style.setProperty('--sx', ((px + 0.5) * 100).toFixed(1) + '%');
      tilt.style.setProperty('--sy', ((py + 0.5) * 100).toFixed(1) + '%');
    });
    stage.addEventListener('pointerleave', () => {
      tilt.style.setProperty('--rx', '0deg');
      tilt.style.setProperty('--ry', '0deg');
    });
  }
})();
