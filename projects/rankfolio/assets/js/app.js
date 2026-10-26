/* ============================================================
   RANKFOLIO — Comportements communs à toutes les pages
   (menu mobile, confirmations, notifications, reflet des vignettes)
   ============================================================ */
(function () {
  'use strict';

  /* Menu mobile */
  const toggle = document.querySelector('.rf-nav-toggle');
  const nav = document.getElementById('rf-nav');
  if (toggle && nav) {
    const set = open => {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  }

  /* Confirmation avant une action destructive : <button data-confirm="Message ?"> */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-confirm]');
    if (el && !window.confirm(el.getAttribute('data-confirm'))) e.preventDefault();
  });

  /* Filtre qui s'applique dès le changement : <select data-autosubmit> */
  document.querySelectorAll('select[data-autosubmit]').forEach(s => {
    s.addEventListener('change', () => s.form && s.form.submit());
  });

  /* Notifications éphémères : RF.toast('Message', 'ok' | 'err') */
  let box = null;
  function toast(msg, type) {
    if (!box) {
      box = document.createElement('div');
      box.className = 'rf-toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.append(box);
    }
    const t = document.createElement('div');
    t.className = 'rf-toast ' + (type === 'err' ? 'rf-toast-err' : 'rf-toast-ok');
    t.setAttribute('role', type === 'err' ? 'alert' : 'status');
    t.textContent = msg;
    box.append(t);
    setTimeout(() => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 300); }, type === 'err' ? 6000 : 3200);
  }
  window.RF = { toast };

  /* Messages de succès : disparaissent seuls (les erreurs restent) */
  document.querySelectorAll('.rf-flashes .rf-flash-ok').forEach(f => {
    setTimeout(() => { f.classList.add('is-leaving'); setTimeout(() => f.remove(), 400); }, 5000);
  });

  /* Reflet qui suit le pointeur sur les vignettes (effet « coque brillante ») */
  if (window.matchMedia('(hover: hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.rf-slab-window').forEach(w => {
      w.addEventListener('pointermove', e => {
        const r = w.getBoundingClientRect();
        w.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        w.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }
})();
