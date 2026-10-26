/* LIGGSTER SHOP - polish.js : finitions (accessibilité, progression, boutons magnétiques, signature de pied de page) */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var main = document.querySelector('main');
  if (main) {
    main.id = main.id || 'main'; main.setAttribute('tabindex', '-1');
    var skip = document.createElement('a'); skip.className = 'skip-link'; skip.href = '#' + main.id; skip.textContent = 'Aller au contenu';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  var bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  function progress() { var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; }
  addEventListener('scroll', progress, { passive: true }); addEventListener('resize', progress); progress();

  var legal = document.querySelector('.footer__legal');
  if (legal) { var mark = document.createElement('div'); mark.className = 'footer__mark'; mark.setAttribute('aria-hidden', 'true'); mark.textContent = 'Liggster'; legal.parentNode.insertBefore(mark, legal); }

  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest('.btn'); if (!b || b.disabled) return;
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
    });
    document.addEventListener('pointerout', function (e) {
      var b = e.target.closest && e.target.closest('.btn'); if (b && !b.contains(e.relatedTarget)) b.style.transform = '';
    });
  }

  // Transition douce entre les pages (fondu), sans toucher aux liens externes ni aux raccourcis clavier
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.protocol !== location.protocol || a.host !== location.host) return;
    if (a.pathname === location.pathname && a.search === location.search) return;
    e.preventDefault(); document.body.classList.add('is-leaving');
    setTimeout(function () { location.href = a.href; }, reduce ? 0 : 260);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) document.body.classList.remove('is-leaving'); });

  // Image d'illustration absente : cadre pointillé qui indique le fichier attendu
  document.querySelectorAll('img[data-pokemon]').forEach(function (img) {
    function fallback() {
      var d = document.createElement('div'); d.className = img.className + ' art-placeholder';
      d.innerHTML = '<span><strong>' + img.dataset.pokemon + '</strong><small>Ajoute assets/img/pokemon/' + img.dataset.file + '.png</small></span>';
      img.replaceWith(d);
    }
    if (img.complete && img.naturalWidth === 0) fallback(); else img.addEventListener('error', fallback);
  });
})();
