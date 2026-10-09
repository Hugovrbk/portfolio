/**
 * site.js - JavaScript leger, sans dependance, pour le site public.
 * Gere : menu mobile, lightbox galerie, popup de promotion, comptes a rebours,
 * repli automatique si une image (photo hebergee ailleurs, upload supprime...)
 * ne charge pas.
 */

// --- Repli automatique sur les balises <img> qui echouent au chargement ---
// (evenement "error" ne remonte pas (bubble) : on l'ecoute en phase de capture)
var IMG_FALLBACK_SRC = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">'
    + '<rect width="400" height="300" fill="#efe9df"/>'
    + '<g fill="none" stroke="#b9ad9c" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">'
    + '<rect x="70" y="95" width="260" height="160" rx="8"/>'
    + '<circle cx="200" cy="178" r="38"/>'
    + '<path d="M132 95 L150 68 L250 68 L268 95"/>'
    + '</g>'
    + '</svg>'
);
document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    img.src = IMG_FALLBACK_SRC;
    img.classList.add('img-fallback');
}, true);

// --- Meme principe pour les images de fond (hero) : on precharge et, en cas
// d'echec, on retombe sur le style ".hero.no-image" (couleur unie) deja prevu ---
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.hero[style*="background-image"]').forEach(function (heroEl) {
        var match = /url\(["']?(.*?)["']?\)/.exec(heroEl.style.backgroundImage);
        if (!match || !match[1]) return;
        var probe = new Image();
        probe.onerror = function () {
            heroEl.classList.add('no-image');
            heroEl.style.backgroundImage = 'none';
        };
        probe.src = match[1];
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // --- Menu mobile ---
    var burger = document.querySelector('.burger');
    if (burger) {
        burger.addEventListener('click', function () {
            document.body.classList.toggle('nav-open');
        });
    }

    // --- Lightbox galerie ---
    var overlay = document.getElementById('lightbox-overlay');
    if (overlay) {
        var overlayContent = overlay.querySelector('.lightbox-inner');
        document.querySelectorAll('[data-lightbox]').forEach(function (el) {
            el.addEventListener('click', function () {
                var type = el.getAttribute('data-type') || 'image';
                var src = el.getAttribute('data-src');
                if (type === 'video') {
                    overlayContent.innerHTML = '<video src="' + src + '" controls autoplay></video>';
                } else {
                    overlayContent.innerHTML = '<img src="' + src + '" alt="">';
                }
                overlay.classList.add('open');
            });
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
                overlay.classList.remove('open');
                overlayContent.innerHTML = '';
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                overlay.classList.remove('open');
                overlayContent.innerHTML = '';
            }
        });
    }

    // --- Popup promotion (affiche une seule fois par session navigateur) ---
    var popup = document.getElementById('promo-popup-overlay');
    if (popup) {
        var storageKey = 'promo_popup_seen_' + (popup.getAttribute('data-id') || '');
        if (!sessionStorage_safe_get(storageKey)) {
            setTimeout(function () { popup.classList.add('open'); }, 900);
        }
        popup.addEventListener('click', function (e) {
            if (e.target === popup || e.target.classList.contains('promo-popup-close')) {
                popup.classList.remove('open');
                sessionStorage_safe_set(storageKey, '1');
            }
        });
    }

    // --- Comptes a rebours des promotions ---
    document.querySelectorAll('[data-countdown]').forEach(function (el) {
        var end = new Date(el.getAttribute('data-countdown')).getTime();
        if (isNaN(end)) return;
        function tick() {
            var diff = end - Date.now();
            if (diff <= 0) { el.textContent = 'Terminé'; return; }
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            el.textContent = (d > 0 ? d + 'j ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }
        tick();
        setInterval(tick, 1000);
    });

    // --- Formulaire de reservation : bascule des champs selon le mode ---
    var guestsInput = document.querySelector('[name="guests"]');
    if (guestsInput) {
        guestsInput.addEventListener('input', function () {
            var max = parseInt(guestsInput.getAttribute('max') || '99', 10);
            if (parseInt(guestsInput.value, 10) > max) {
                guestsInput.setCustomValidity('Pour plus de ' + max + ' personnes, merci de nous appeler directement.');
            } else {
                guestsInput.setCustomValidity('');
            }
        });
    }
});

// sessionStorage peut echouer en navigation privee stricte : on protege les appels.
function sessionStorage_safe_get(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
}
function sessionStorage_safe_set(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) { /* ignore */ }
}
