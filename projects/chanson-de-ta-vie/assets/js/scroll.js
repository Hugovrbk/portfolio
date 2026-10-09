/* scroll.js — Vinyl scroll animation + audio players */

(function() {

  /* =====================================================
     VINYL SVG — génération des sillons dynamiquement
     ===================================================== */
  function buildVinylSVG(svgId) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');

    // Gradients
    defs.innerHTML = `
      <radialGradient id="vg" cx="42%" cy="36%" r="65%">
        <stop offset="0%"   stop-color="#28201a"/>
        <stop offset="50%"  stop-color="#1a1410"/>
        <stop offset="100%" stop-color="#0c0a08"/>
      </radialGradient>
      <radialGradient id="lg" cx="40%" cy="38%" r="58%">
        <stop offset="0%"   stop-color="#f0d870"/>
        <stop offset="60%"  stop-color="#c9a84c"/>
        <stop offset="100%" stop-color="#7a4a18"/>
      </radialGradient>
      <radialGradient id="sheen" cx="30%" cy="28%" r="55%">
        <stop offset="0%"   stop-color="rgba(255,255,255,0.07)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
    `;
    svg.appendChild(defs);

    function circle(cx, cy, r, attrs = {}) {
      const el = document.createElementNS(ns, 'circle');
      el.setAttribute('cx', cx); el.setAttribute('cy', cy); el.setAttribute('r', r);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    }
    function text(x, y, content, attrs = {}) {
      const el = document.createElementNS(ns, 'text');
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.textContent = content;
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    }

    // Outer ring
    svg.appendChild(circle(200, 200, 198, { fill: '#0a0805', stroke: '#3a3028', 'stroke-width': '1' }));
    // Main disc
    svg.appendChild(circle(200, 200, 195, { fill: 'url(#vg)' }));

    // Grooves (r from 62 to 190, step 3)
    for (let r = 190; r >= 62; r -= 3) {
      const opacity = 0.25 + (r / 190) * 0.25;
      svg.appendChild(circle(200, 200, r, {
        fill: 'none',
        stroke: '#3a3020',
        'stroke-width': '0.55',
        opacity: opacity.toFixed(2)
      }));
    }

    // Sheen overlay
    svg.appendChild(circle(200, 200, 195, { fill: 'url(#sheen)' }));

    // Label backing
    svg.appendChild(circle(200, 200, 54, { fill: '#18120a' }));
    // Label
    svg.appendChild(circle(200, 200, 51, { fill: 'url(#lg)' }));
    // Label inner ring
    svg.appendChild(circle(200, 200, 51, { fill: 'none', stroke: '#8a5c1e', 'stroke-width': '0.8' }));

    // Label text
    const t1 = text(200, 191, 'La Chanson', {
      'text-anchor': 'middle', fill: '#0d0b0a',
      'font-family': 'Georgia, serif', 'font-size': '9.5',
      'font-style': 'italic', 'font-weight': 'bold'
    });
    const t2 = text(200, 203, 'de Ta Vie ♪', {
      'text-anchor': 'middle', fill: '#1a0e04',
      'font-family': 'Georgia, serif', 'font-size': '7.5'
    });
    const t3 = text(200, 218, '✦ Belgique ✦', {
      'text-anchor': 'middle', fill: '#3a2808',
      'font-family': 'Georgia, serif', 'font-size': '5.5',
      'letter-spacing': '1'
    });
    svg.appendChild(t1); svg.appendChild(t2); svg.appendChild(t3);

    // Spindle hole
    svg.appendChild(circle(200, 200, 5.5, { fill: '#0a0805' }));
    svg.appendChild(circle(200, 200, 5.5, { fill: 'none', stroke: '#3a3028', 'stroke-width': '0.5' }));
  }

  /* =====================================================
     SCROLL-DRIVEN VINYL ROTATION (sans GSAP obligatoire)
     ===================================================== */
  function initVinylScroll() {
    const section = document.querySelector('.vinyl-section');
    const vinyl   = document.getElementById('vinyl');
    const textItems = document.querySelectorAll('.vinyl-text-item');
    if (!section || !vinyl) return;

    // Idle rotation quand pas en scroll
    let idleAngle   = 0;
    let scrollAngle = 0;
    let lastScroll  = window.scrollY;
    let idleTicking = false;

    function idleLoop() {
      idleAngle += 0.12;
      vinyl.style.transform = `rotate(${scrollAngle + idleAngle}deg)`;
      idleTicking = requestAnimationFrame(idleLoop);
    }

    window.addEventListener('scroll', () => {
      const sectionTop    = section.getBoundingClientRect().top + window.scrollY;
      const sectionHeight = section.offsetHeight;
      const progress      = Math.max(0, Math.min(1,
        (window.scrollY - sectionTop) / (sectionHeight - window.innerHeight)
      ));

      scrollAngle = progress * 720;
      vinyl.style.transform = `rotate(${scrollAngle + idleAngle}deg)`;

      // Quel panneau de texte afficher
      const idx = Math.min(textItems.length - 1, Math.floor(progress * textItems.length));
      textItems.forEach((el, i) => el.classList.toggle('active', i === idx));
    }, { passive: true });

    idleLoop();
  }

  /* =====================================================
     HERO RINGS — sillons décoratifs en fond
     ===================================================== */
  function buildHeroRings() {
    const container = document.querySelector('.hero__rings');
    if (!container) return;
    const sizes = [200, 340, 480, 620, 760, 900, 1040, 1200];
    sizes.forEach(s => {
      const el = document.createElement('div');
      el.className = 'hero__ring';
      el.style.cssText = `width:${s}px;height:${s}px`;
      container.appendChild(el);
    });
  }

  /* =====================================================
     AUDIO PLAYERS CUSTOM
     ===================================================== */
  function initAudioPlayers() {
    document.querySelectorAll('.demo-card').forEach(card => {
      const btn    = card.querySelector('.audio-player__btn');
      const fill   = card.querySelector('.audio-player__fill');
      const time   = card.querySelector('.audio-player__time');
      const bar    = card.querySelector('.audio-player__progress');
      const src    = btn && btn.dataset.src;
      if (!btn || !src) return;

      const audio  = new Audio(src);
      let playing  = false;

      function fmt(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
      }

      btn.addEventListener('click', () => {
        if (playing) { audio.pause(); btn.textContent = '▶'; playing = false; }
        else {
          document.querySelectorAll('.demo-card audio').forEach(a => a.pause());
          document.querySelectorAll('.audio-player__btn').forEach(b => b.textContent = '▶');
          audio.play().catch(() => {});
          btn.textContent = '⏸';
          playing = true;
        }
      });

      audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        fill.style.width = pct + '%';
        time.textContent = fmt(audio.currentTime) + ' / ' + (audio.duration ? fmt(audio.duration) : '0:00');
      });

      audio.addEventListener('ended', () => { btn.textContent = '▶'; playing = false; fill.style.width = '0%'; });

      bar.addEventListener('click', e => {
        if (!audio.duration) return;
        const rect = bar.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      });
    });
  }

  /* =====================================================
     FAQ ACCORDION
     ===================================================== */
  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const q = item.querySelector('.faq-question');
      const a = item.querySelector('.faq-answer');
      if (!q || !a) return;
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(el => {
          el.classList.remove('open');
          el.querySelector('.faq-answer').style.maxHeight = '0';
        });
        if (!isOpen) {
          item.classList.add('open');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
  }

  /* =====================================================
     STYLE CARDS — sélection
     ===================================================== */
  function initStyleCards() {
    document.querySelectorAll('.style-card[data-style]').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const hidden = document.getElementById('style_musical_hidden');
        if (hidden) hidden.value = card.dataset.style;
        // Si on est sur la page commander.php, aller à l'étape suivante
        if (typeof goToStep === 'function') goToStep(2);
      });
    });
  }

  /* =====================================================
     PRODUCT CARDS (commander.php)
     ===================================================== */
  function initProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        // Mise à jour du prix dans le récap
        updateRecap();
      });
    });
  }

  /* =====================================================
     SCROLL REVEAL
     ===================================================== */
  function initReveal() {
    const cardEls = document.querySelectorAll(
      '.how-card, .style-card, .pricing-card, .avis-card, .demo-card'
    );
    const headerEls = document.querySelectorAll('.section-title, .section-intro');

    if (!('IntersectionObserver' in window)) {
      [...cardEls, ...headerEls].forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    const obsCards = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.delay ?? entry.target.dataset.idx ?? 0, 10) * 90;
        setTimeout(() => {
          entry.target.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, delay);
        obsCards.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    cardEls.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      if (!el.dataset.delay) el.dataset.idx = i % 6;
      obsCards.observe(el);
    });

    const obsHeaders = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.transition = 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1)';
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        obsHeaders.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    headerEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      obsHeaders.observe(el);
    });
  }

  /* =====================================================
     STYLES HORIZONTAUX — scroll vertical → translation horizontale
     ===================================================== */
  function initStylesHorizontal() {
    const section  = document.getElementById('stylesSection');
    const track    = document.getElementById('stylesTrack');
    const progBar  = document.getElementById('stylesProgressBar');
    if (!section || !track) return;

    // Mobile : fallback scroll natif
    if (window.innerWidth < 768) {
      section.style.height = 'auto';
      const sticky = section.querySelector('.styles-h-sticky');
      if (sticky) { sticky.style.position = 'relative'; sticky.style.height = 'auto'; sticky.style.overflow = 'visible'; }
      track.style.overflowX = 'auto';
      track.style.paddingBottom = '1rem';
      track.querySelectorAll('.style-card-h').forEach(c => c.style.scrollSnapAlign = 'start');
      return;
    }

    let currentX = 0;
    let targetX  = 0;
    let rafId    = null;

    function lerp() {
      const dist = targetX - currentX;
      currentX += dist * 0.08;
      if (Math.abs(dist) < 0.4) currentX = targetX;
      track.style.transform = `translateX(-${currentX.toFixed(2)}px)`;
      if (progBar) progBar.style.width = (targetX / Math.max(1, track.scrollWidth - window.innerWidth) * 100).toFixed(1) + '%';
      rafId = Math.abs(dist) > 0.2 ? requestAnimationFrame(lerp) : null;
    }

    window.addEventListener('scroll', () => {
      const top      = section.getBoundingClientRect().top + window.scrollY;
      const travel   = section.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, (window.scrollY - top) / travel));
      const maxX     = Math.max(0, track.scrollWidth - window.innerWidth);
      targetX = progress * maxX;
      if (!rafId) rafId = requestAnimationFrame(lerp);
    }, { passive: true });
  }

  /* =====================================================
     SCROLL PROGRESS BAR
     ===================================================== */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scrollProgress';
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* =====================================================
     HERO PARALLAX
     ===================================================== */
  function initHeroParallax() {
    const heroContent = document.querySelector('.hero__content');
    const heroNotes   = document.querySelector('.hero__notes');
    const heroRings   = document.querySelector('.hero__rings');
    if (!heroContent) return;

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const vh = window.innerHeight;
      if (scrolled > vh * 1.2) return;

      const frac = scrolled / vh;
      heroContent.style.transform = `translateY(${scrolled * 0.28}px)`;
      heroContent.style.opacity   = Math.max(0, 1 - frac * 1.6);
      if (heroNotes) heroNotes.style.transform = `translateY(${scrolled * 0.12}px)`;
      if (heroRings) heroRings.style.transform = `translateY(${scrolled * 0.06}px) scale(${1 + frac * 0.08})`;
    }, { passive: true });
  }

  /* =====================================================
     OCCASION CARDS — entrée alternée gauche/droite
     ===================================================== */
  function initOccasionReveal() {
    const cards = document.querySelectorAll('.occasion-card');
    if (!cards.length || !('IntersectionObserver' in window)) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.delay || 0, 10) * 110;
        setTimeout(() => {
          entry.target.style.transition =
            'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateX(0) translateY(0)';
        }, delay);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    cards.forEach((el, i) => {
      const fromRight = i % 2 === 1;
      el.style.opacity   = '0';
      el.style.transform = `translateX(${fromRight ? '40px' : '-40px'}) translateY(16px)`;
      obs.observe(el);
    });
  }

  /* =====================================================
     INIT
     ===================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    buildVinylSVG('vinyl');
    buildHeroRings();
    initVinylScroll();
    initAudioPlayers();
    initFAQ();
    initStyleCards();
    initProductCards();
    initReveal();
    initScrollProgress();
    initHeroParallax();
    initOccasionReveal();
    initStylesHorizontal();
  });

})();
