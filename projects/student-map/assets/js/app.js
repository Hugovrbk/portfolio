document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initMobileMenu();
    initScrollEffects();
    initDropdowns();
    initFlashMessages();
    initScrollToTop();
    initModalSystem();
    initFormValidation();
    initTooltips();
    initFavoriteButtons();
});

function initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            const selector = link.getAttribute('href');
            if (!selector || selector === '#') return;
            const target = document.querySelector(selector);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function initMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle], .mobile-menu-toggle, .navbar-toggle, .menu-toggle');
    const menu = document.querySelector('.mobile-menu, [data-mobile-menu]') || document.querySelector('.navbar-menu');
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    const close = document.querySelector('.mobile-menu-close');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const setOpen = function (open) {
        toggle.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('is-open', open);
        if (overlay) overlay.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    if (close) close.addEventListener('click', function () { setOpen(false); });
    if (overlay) overlay.addEventListener('click', function () { setOpen(false); });
    menu.querySelectorAll('.submenu-toggle').forEach(function (item) {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            const parent = item.closest('.has-submenu');
            if (parent) parent.classList.toggle('is-open');
        });
    });
    menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { if (link.getAttribute('href') !== '#') setOpen(false); });
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    });
}

function initScrollEffects() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const update = function () { nav.classList.toggle('is-scrolled', window.scrollY > 12); };
    update();
    window.addEventListener('scroll', throttle(update, 80), { passive: true });
}

function initDropdowns() {
    document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function (event) {
            const parent = toggle.closest('.dropdown');
            if (!parent) return;
            if (toggle.getAttribute('href') === '#') event.preventDefault();
            const open = !parent.classList.contains('is-open');
            document.querySelectorAll('.dropdown.is-open').forEach(function (item) {
                if (item !== parent) item.classList.remove('is-open');
            });
            parent.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
        });
    });
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.is-open').forEach(function (item) {
                item.classList.remove('is-open');
                const toggle = item.querySelector('.dropdown-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        }
    });
}

function initFlashMessages() {
    document.querySelectorAll('.flash-message').forEach(function (message) {
        const close = message.querySelector('.flash-close');
        if (close) close.addEventListener('click', function () { message.remove(); });
        window.setTimeout(function () {
            if (message.isConnected) message.classList.add('flash-message-dismissed');
        }, 7000);
    });
}

function initScrollToTop() {
    const button = document.querySelector('[data-scroll-top], .scroll-to-top');
    if (!button) return;
    const update = function () { button.hidden = window.scrollY < 350; };
    update();
    window.addEventListener('scroll', throttle(update, 100), { passive: true });
    button.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

function initModalSystem() {
    document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
        trigger.addEventListener('click', function () { openModal(document.querySelector(trigger.dataset.modalOpen)); });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (trigger) {
        trigger.addEventListener('click', function () { closeModal(trigger.closest('.modal')); });
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            const modal = document.querySelector('.modal.is-open, .modal.show');
            if (modal) closeModal(modal);
        }
    });
}

function openModal(modal) {
    if (!modal) return;
    modal.classList.add('is-open', 'show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open', 'show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
}

function initFormValidation() {
    document.querySelectorAll('form.form-validate').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                form.reportValidity();
            }
        });
        form.querySelectorAll('input, textarea, select').forEach(function (field) {
            field.addEventListener('input', function () { field.setCustomValidity(''); });
        });
    });
}

function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(function (element) {
        element.setAttribute('title', element.dataset.tooltip);
    });
}

function initFavoriteButtons() {
    document.querySelectorAll('[data-favorite-toggle]').forEach(function (button) {
        button.addEventListener('click', async function () {
            if (button.disabled) return;
            const config = window.STUDENT_MAP_CONFIG || {};
            const isFavorite = button.dataset.favorite === 'true';
            const body = new URLSearchParams({
                csrf_token: config.csrfToken || '',
                action: isFavorite ? 'remove' : 'add',
                type: button.dataset.favoriteType || '',
                id: button.dataset.favoriteId || ''
            });
            button.disabled = true;
            try {
                const response = await fetch((config.baseUrl || '').replace(/\/$/, '') + '/api/favorites.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
                    body: body.toString()
                });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Impossible de mettre à jour ce favori.');
                button.dataset.favorite = String(!isFavorite);
                button.innerHTML = '<i class="fas fa-heart"></i> ' +
                    (button.dataset.favorite === 'true' ? button.dataset.removeLabel : button.dataset.addLabel);
            } catch (error) {
                console.error('Mise à jour du favori impossible :', error);
                button.setAttribute('aria-label', error.message);
                window.alert(error.message);
            } finally {
                button.disabled = false;
            }
        });
    });
}

function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(Number(number) || 0);
}

function formatDate(dateString, options) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', options || { dateStyle: 'medium' }).format(date);
}

function formatDuration(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(value / 60);
    return minutes + ':' + String(value % 60).padStart(2, '0');
}

function extractYoutubeId(url) {
    const match = String(url || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
    return match ? match[1] : (/^[\w-]{11}$/.test(String(url || '')) ? String(url) : null);
}

function getYoutubeEmbedUrl(videoId, options) {
    const params = new URLSearchParams(Object.assign({ rel: '0', modestbranding: '1' }, options || {}));
    return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId) + '?' + params.toString();
}

function getYoutubeThumbnailUrl(videoId, quality) {
    return 'https://img.youtube.com/vi/' + encodeURIComponent(videoId) + '/' + encodeURIComponent(quality || 'hqdefault') + '.jpg';
}

function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = function () { if (callback) callback(null, script); };
    script.onerror = function () { if (callback) callback(new Error('Impossible de charger le script')); };
    document.head.appendChild(script);
    return script;
}

function loadStylesheet(url, callback) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = function () { if (callback) callback(null, link); };
    link.onerror = function () { if (callback) callback(new Error('Impossible de charger la feuille de style')); };
    document.head.appendChild(link);
    return link;
}

function debounce(func, wait) {
    let timer;
    return function () {
        const context = this;
        const args = arguments;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { func.apply(context, args); }, wait);
    };
}

function throttle(func, limit) {
    let lastRun = 0;
    let timer;
    return function () {
        const context = this;
        const args = arguments;
        const remaining = limit - (Date.now() - lastRun);
        if (remaining <= 0) {
            window.clearTimeout(timer);
            lastRun = Date.now();
            func.apply(context, args);
        } else if (!timer) {
            timer = window.setTimeout(function () {
                timer = null;
                lastRun = Date.now();
                func.apply(context, args);
            }, remaining);
        }
    };
}

async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(String(text));
        return true;
    }
    const field = document.createElement('textarea');
    field.value = String(text);
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
}

function generateSlug(string) {
    return String(string || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function truncateString(string, maxLength, suffix) {
    const text = String(string || '');
    const limit = Math.max(0, Number(maxLength) || 0);
    if (text.length <= limit) return text;
    const end = suffix === undefined ? '…' : suffix;
    return text.slice(0, Math.max(0, limit - end.length)) + end;
}

function initInfiniteScroll(containerSelector, endpoint, options) {
    const container = document.querySelector(containerSelector);
    if (!container || !('IntersectionObserver' in window)) return null;
    const settings = Object.assign({ offset: 0, limit: 12, onItems: null }, options || {});
    const sentinel = document.createElement('div');
    sentinel.className = 'infinite-scroll-sentinel';
    container.after(sentinel);
    let loading = false;
    const observer = new IntersectionObserver(async function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; }) || loading) return;
        loading = true;
        try {
            const url = new URL(endpoint, window.location.href);
            url.searchParams.set('offset', settings.offset);
            url.searchParams.set('limit', settings.limit);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Réponse serveur ' + response.status);
            const data = await response.json();
            const items = data.events || data.clips || data.items || [];
            if (typeof settings.onItems === 'function') settings.onItems(items, container);
            settings.offset += items.length;
            if (items.length < settings.limit) observer.disconnect();
        } catch (error) {
            console.error('Chargement complémentaire impossible :', error);
            observer.disconnect();
        } finally {
            loading = false;
        }
    });
    observer.observe(sentinel);
    return observer;
}

window.STUDENT_MAP_UTILS = {
    formatNumber: formatNumber,
    formatDate: formatDate,
    formatDuration: formatDuration,
    extractYoutubeId: extractYoutubeId,
    getYoutubeEmbedUrl: getYoutubeEmbedUrl,
    getYoutubeThumbnailUrl: getYoutubeThumbnailUrl,
    loadScript: loadScript,
    loadStylesheet: loadStylesheet,
    debounce: debounce,
    throttle: throttle,
    copyToClipboard: copyToClipboard,
    generateSlug: generateSlug,
    truncateString: truncateString,
    initInfiniteScroll: initInfiniteScroll,
    openModal: openModal,
    closeModal: closeModal
};
