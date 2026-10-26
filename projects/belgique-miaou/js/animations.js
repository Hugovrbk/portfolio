// ════════════════════════════════════════════════════════════
//  ANIMATIONS — RFC Liège  (auto-mode: no class needed)
// ════════════════════════════════════════════════════════════

// ── Auto-inject page loader ───────────────────────────────────
(function() {
    if (document.getElementById('page-loader')) return;
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = '<div class="loader-ball"></div><div class="loader-ball"></div><div class="loader-ball"></div>';
    document.body.prepend(loader);
})();

window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        setTimeout(() => loader.classList.add('hide'), 300);
        setTimeout(() => loader.remove(), 800);
    }
});

// ── Intersection Observer (scroll reveal) ────────────────────
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

// Existing .reveal classes
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    .forEach(el => revealObserver.observe(el));

// ── Auto-reveal: détecte les éléments sans class manuelle ─────
const AUTO_SELECTORS = [
    '.content-section', '.news-card', 'article.news-card',
    '.match-card', '.sponsor-item', '.content-card',
    '.section-match', '.section-news .news-card',
    '.classement-table-wrap', '.sponsors-grid .sponsor-item',
    '.footer-col', '.footer-brand',
    '.page-banner', '.stat-card',
    '.adm-card', '.cms-card',
    '.joueur-card', '.result-item', '.match-item'
];

AUTO_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
        if (!el.classList.contains('reveal') &&
            !el.classList.contains('reveal-left') &&
            !el.classList.contains('reveal-right') &&
            !el.classList.contains('reveal-scale')) {
            el.classList.add('reveal');
            el.style.transitionDelay = Math.min(i * 0.07, 0.45) + 's';
            revealObserver.observe(el);
        }
    });
});

// Hero content always visible (not revealed)
document.querySelectorAll('.hero-content, .hero-badge, .hero h1').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
});

// ── Stagger pour listes ───────────────────────────────────────
document.querySelectorAll('.stagger-list > *').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
    if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        revealObserver.observe(el);
    }
});

// ── Compteurs animés (data-count) ────────────────────────────
function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 25);
}
const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

// ── Ripple effect ─────────────────────────────────────────────
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `@keyframes rippleEffect { to { transform: scale(2.5); opacity: 0; } }`;
document.head.appendChild(rippleStyle);

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-submit,.nav-btn,.btn-compte,.btn-adm,.btn-primary,.btn-secondary,.btn-auth');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
        width:${size}px;height:${size}px;
        left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;
        background:rgba(255,255,255,0.3);transform:scale(0);
        animation:rippleEffect 0.5s ease-out;`;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
});

// ── Particules flottantes sur le header ───────────────────────
function createParticles() {
    const header = document.querySelector('.header');
    if (!header) return;
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('span');
        p.style.cssText = `
            position:absolute;pointer-events:none;border-radius:50%;
            width:${3+Math.random()*6}px;height:${3+Math.random()*6}px;
            background:rgba(200,16,46,${0.06+Math.random()*0.14});
            left:${Math.random()*100}%;top:${Math.random()*100}%;
            animation:float ${3+Math.random()*4}s ease-in-out infinite alternate;
            animation-delay:${Math.random()*2}s;`;
        header.style.position = 'relative';
        header.appendChild(p);
    }
}
createParticles();

// ── Smooth scroll pour ancres ─────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ── Hover lift sur les cartes ─────────────────────────────────
document.querySelectorAll('.news-card, .match-card, .content-card, .sponsor-item').forEach(card => {
    card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-6px)';
        card.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
    });
});
