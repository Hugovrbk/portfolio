/* ===================================================================
   scroll-animations.js - Gamme MIEUX+
   1) Tag automatique des elements courants du site avec des classes
      d'animation (aucune modification HTML/PHP des pages requise).
   2) Repli IntersectionObserver pour navigateurs sans
      animation-timeline (les animations CSS natives suffisent sinon).
   =================================================================== */
(function () {
    'use strict';

    var SELECTORS = [
        '.section-head',
        '.info-grid',
        '.info-grid > *',
        '.menu-image-grid img',
        '.menu-preview-grid figure',
        '.gallery-grid > *',
        '.card',
        '.review-card',
        '.event-card',
        '.faq-item',
        '.hours-grid > *',
        '.contact-grid > *',
        '.hero-content > *',
        '.specialties-grid > *',
        '.popular-dishes > *',
        '.reservation-form',
        '.reservation-form > *',
        '.promo-popup-body > *'
    ];
    var KINDS = [
        [/section-head/, 'sa-mask'],
        [/info-grid > \*/, 'sa-left'],
        [/gallery-grid|menu-image-grid|menu-preview-grid/, 'sa-drift'],
        [/review-card|event-card/, 'sa-reveal'],
        [/reservation-form > \*/, 'sa-right']
    ];
    function kindFor(sel) {
        for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0].test(sel)) return KINDS[i][1];
        return 'sa-reveal';
    }

    document.querySelectorAll(SELECTORS.join(',')).forEach(function (el, i) {
        var sel = null;
        for (var k = 0; k < SELECTORS.length; k++) {
            if (el.matches(SELECTORS[k])) { sel = SELECTORS[k]; break; }
        }
        el.classList.add(kindFor(sel || ''));
        el.style.setProperty('--sa-i', (i % 6));
    });

    function onScroll() {
        document.body.classList.toggle('sa-scrolled', window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nativeSD = !reduced && window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    if (nativeSD) return; // Les animations CSS natives gerent tout.

    if (reduced) {
        document.querySelectorAll('.sa-reveal,.sa-left,.sa-right,.sa-zoom,.sa-blur,.sa-drift')
            .forEach(function (el) { el.classList.add('sa-in'); });
        return;
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add('sa-in'); io.unobserve(en.target); }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.sa-reveal,.sa-left,.sa-right,.sa-zoom,.sa-blur,.sa-drift')
        .forEach(function (el) { io.observe(el); });
})();
