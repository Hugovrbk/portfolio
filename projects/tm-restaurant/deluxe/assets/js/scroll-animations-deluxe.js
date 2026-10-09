/* scroll-animations-deluxe.js - Gamme DELUXE.
   Repli JS de la barre de progression si animation-timeline: scroll()
   n'est pas supporte. Les autres effets (parallax, zoom, titres)
   progressifs restent visuellement acceptables sans repli lourd. */
(function () {
    'use strict';
    var bar = document.querySelector('.sa-progress');
    if (!bar) return;
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll(root)')) return;
    function update() {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? (h.scrollTop / max) : 0) + ')';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
})();
