/* LIGGSTER SHOP - animations.js : GSAP + ScrollTrigger */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  // Moment d'ouverture (une seule séquence orchestrée à l'accueil)
  var intro = document.querySelectorAll('[data-intro]');
  if (intro.length) {
    gsap.set(intro, { opacity: 0, y: 40 });
    window.addEventListener('lg:ready', function () {
      gsap.to(intro, { opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: 'power3.out' });
    }, { once: true });
    gsap.to('.hero__content', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Révélations au défilement : bas, gauche, droite
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    var d = el.dataset.reveal, from = { opacity: 0, duration: 0.9, ease: 'power3.out' };
    if (d === 'left') from.x = -80; else if (d === 'right') from.x = 80; else from.y = 50;
    gsap.from(el, Object.assign({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } }, from));
  });
  var cards = document.querySelectorAll('#featured-grid .pcard');
  if (cards.length) gsap.from(cards, { opacity: 0, y: 60, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '#featured-grid', start: 'top 85%', once: true } });
})();
