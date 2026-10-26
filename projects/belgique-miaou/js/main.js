/* ── SMOOTH SCROLL INERTIA ──────────────────────────────────────
   Lerp wheel-based — desktop uniquement, respecte prefers-reduced-motion
   ─────────────────────────────────────────────────────────────── */
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return; // scroll natif sur mobile

    let targetY  = window.scrollY;
    let currentY = window.scrollY;
    let rafId    = null;
    const EASE   = 0.14; // 0.09 = lent · 0.14 = naturel · 0.20 = rapide

    function tick() {
        const diff = targetY - currentY;
        if (Math.abs(diff) < 0.5) {
            currentY = targetY;
            window.scrollTo(0, currentY);
            rafId = null;
            return;
        }
        currentY += diff * EASE;
        window.scrollTo(0, currentY);
        rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        // Clamp par event pour éviter l'accumulation excessive
        const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 250);
        targetY += delta;
        targetY  = Math.max(0, Math.min(targetY, document.body.scrollHeight - window.innerHeight));
        if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: false });

    // Resync après scroll clavier / scrollbar
    ['keydown', 'mousedown'].forEach(ev =>
        window.addEventListener(ev, () => setTimeout(() => {
            targetY = currentY = window.scrollY;
        }, 80))
    );
})();

document.addEventListener('DOMContentLoaded', () => {

    /* 1. SCROLL PROGRESS */
    const bar = document.getElementById('scroll-progress');
    const updateProgress = () => {
        if (!bar) return;
        const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
        bar.style.width = (isNaN(p) ? 0 : p) + '%';
    };

    /* 2. NAVBAR */
    const header = document.querySelector('.header');
    const updateHeader = () => {
        if (!header || document.body.classList.contains('inner-page')) return;
        header.classList.toggle('scrolled', window.scrollY > 60);
    };

    /* 3. BACK TO TOP */
    const btt = document.getElementById('back-to-top');
    if (btt) {
        btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        const updateBtt = () => btt.classList.toggle('visible', window.scrollY > 500);
        window.addEventListener('scroll', updateBtt, { passive: true });
    }

    /* 4. SCROLL REVEAL */
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
        revealEls.forEach(el => obs.observe(el));
    }

    /* 5. COUNTER ANIMATION */
    const animCount = (el, target, dur = 1800) => {
        const s = performance.now();
        const isF = target % 1 !== 0;
        const tick = now => {
            const p = Math.min((now - s) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            el.textContent = isF ? (e * target).toFixed(1) : Math.round(e * target);
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length) {
        const cObs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { animCount(e.target, parseFloat(e.target.dataset.count)); cObs.unobserve(e.target); } });
        }, { threshold: 0.5 });
        counters.forEach(el => cObs.observe(el));
    }

    /* 6. HAMBURGER / MOBILE NAV */
    const hamburger = document.getElementById('hamburger');
    const navMobile = document.getElementById('navMobile');
    const navOverlay = document.getElementById('navMobileOverlay');
    const navClose = document.getElementById('navMobileClose');

    const openNav = () => {
        navMobile?.classList.add('open');
        navOverlay?.classList.add('open');
        hamburger?.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    const closeNav = () => {
        navMobile?.classList.remove('open');
        navOverlay?.classList.remove('open');
        hamburger?.classList.remove('open');
        document.body.style.overflow = '';
    };

    hamburger?.addEventListener('click', () => navMobile?.classList.contains('open') ? closeNav() : openNav());
    navOverlay?.addEventListener('click', closeNav);
    navClose?.addEventListener('click', closeNav);
    document.querySelectorAll('.nav-m-link, .nav-m-tickets, .nav-m-connexion').forEach(l => l.addEventListener('click', closeNav));

    /* 7. SMOOTH SCROLL */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) { e.preventDefault(); window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' }); }
        });
    });

    /* 8. TILT CARDS */
    document.querySelectorAll('.news-card, .content-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const dx = ((e.clientX - r.left) / r.width - .5) * 2;
            const dy = ((e.clientY - r.top) / r.height - .5) * 2;
            card.style.transform = `perspective(800px) rotateX(${-dy * 3.5}deg) rotateY(${dx * 3.5}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });

    /* 9. PARALLAX HERO */
    const heroContent = document.querySelector('.hero-content');
    const heroBg = document.querySelector('.hero-bg-img');
    const updateParallax = () => {
        const y = window.scrollY;
        if (heroContent) heroContent.style.transform = `translateY(${y * 0.06}px)`;
        if (heroBg) heroBg.style.transform = `translateY(${y * 0.15}px) scale(1.1)`;
    };

    /* 10. TABLE ROW STAGGER */
    const rows = document.querySelectorAll('.classement-table tbody tr');
    if (rows.length) {
        rows.forEach(r => { r.style.opacity = '0'; r.style.transform = 'translateX(-16px)'; r.style.transition = 'opacity .4s ease, transform .4s ease, background .2s'; });
        const tObs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { rows.forEach((r, i) => setTimeout(() => { r.style.opacity = '1'; r.style.transform = ''; }, i * 50)); tObs.disconnect(); }
        }, { threshold: .04 });
        const table = document.querySelector('.classement-table');
        if (table) tObs.observe(table);
    }

    /* 11. NEWS STAGGER */
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
        const cards = newsGrid.querySelectorAll('.news-card');
        cards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(30px)'; c.style.transition = 'opacity .6s ease, transform .6s ease, box-shadow .3s ease'; });
        const nObs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { cards.forEach((c, i) => setTimeout(() => { c.style.opacity = '1'; c.style.transform = ''; }, i * 120)); nObs.disconnect(); }
        }, { threshold: .08 });
        nObs.observe(newsGrid);
    }

    /* 12. TICKER */
    const ticker = document.querySelector('.ticker-track');
    if (ticker) {
        ticker.addEventListener('mouseenter', () => ticker.style.animationPlayState = 'paused');
        ticker.addEventListener('mouseleave', () => ticker.style.animationPlayState = 'running');
    }

    /* 13. RAF SCROLL */
    let lastY = -1;
    const onScroll = () => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) < .5) return;
        lastY = y;
        updateProgress();
        updateHeader();
        updateParallax();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* 14. FLASH MSG */
    const flash = document.querySelector('.flash-global, .flash-msg');
    if (flash) {
        setTimeout(() => {
            flash.style.transition = 'opacity .5s, transform .5s';
            flash.style.opacity = '0'; flash.style.transform = 'translateY(-8px)';
            setTimeout(() => flash.remove(), 500);
        }, 4500);
    }

    /* 15. MATCH CARD MOUSE PARALLAX */
    const matchCard = document.querySelector('.match-card');
    if (matchCard) {
        matchCard.addEventListener('mousemove', e => {
            const r = matchCard.getBoundingClientRect();
            const dx = ((e.clientX - r.left) / r.width - .5) * 2;
            const dy = ((e.clientY - r.top) / r.height - .5) * 2;
            matchCard.style.transform = `perspective(1000px) rotateX(${-dy * 2}deg) rotateY(${dx * 2}deg)`;
        });
        matchCard.addEventListener('mouseleave', () => { matchCard.style.transform = ''; });
    }
});
