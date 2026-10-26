// Page d'une ville : petite carte centrée sur la ville (les coordonnées sont dans les attributs data-*)
function initCityMap() {
    const element = document.getElementById('cityMap');
    if (!element || typeof L === 'undefined') return;
    const lat = parseFloat(element.dataset.latitude);
    const lng = parseFloat(element.dataset.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const cityMap = L.map(element, { center: [lat, lng], zoom: parseInt(element.dataset.zoom, 10) || 12, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(cityMap);
    L.marker([lat, lng], {
        icon: L.divIcon({ className: 'student-map-marker student-map-marker-single', html: '<span>•</span>', iconSize: [36, 36], iconAnchor: [18, 18] })
    }).addTo(cityMap);
}

document.addEventListener('DOMContentLoaded', function () {
    initCityMap();
    const element = document.getElementById('map');
    if (!element) return;
    if (typeof L === 'undefined') {
        showErrorMessage('La carte ne peut pas être chargée. Vérifiez votre connexion Internet.');
        return;
    }
    initMap();
});

const mapConfig = {
    center: [48.8566, 2.3522],
    zoom: 3,
    minZoom: 2,
    maxZoom: 18,
    apiUrl: ((window.STUDENT_MAP_CONFIG || {}).baseUrl || '').replace(/\/$/, '') + '/api/cities.php',
    language: ((window.STUDENT_MAP_CONFIG || {}).language === 'en') ? 'en' : 'fr'
};

let map = null;
let markerLayer = null;
let tileLayers = {};
let cityMarkers = new Map();
let selectedCity = null;
let mapCities = [];
let globeInstance = null;
let globeMode = false;

const mapText = {
    fr: { events: 'action(s)', media: 'média(s)', loading: 'Chargement des actions…', empty: 'Aucune action publiée pour le moment.', all: 'Voir toutes les actions', unavailable: 'Les actions de cette ville sont momentanément indisponibles.', position: 'Votre position', fullscreen: 'Agrandir la carte', exitFullscreen: 'Quitter le plein écran', globe: 'Passer en vue globe', map: 'Revenir à la carte' },
    en: { events: 'event(s)', media: 'media item(s)', loading: 'Loading actions…', empty: 'No actions published yet.', all: 'View all actions', unavailable: 'Actions in this city are temporarily unavailable.', position: 'Your location', fullscreen: 'Expand map', exitFullscreen: 'Exit full screen', globe: 'Switch to globe view', map: 'Return to map' }
}[mapConfig.language];

function initMap() {
    map = L.map('map', {
        center: mapConfig.center,
        zoom: mapConfig.zoom,
        minZoom: mapConfig.minZoom,
        maxZoom: mapConfig.maxZoom,
        scrollWheelZoom: false
    });
    map.zoomControl.setPosition('bottomright');

    tileLayers.standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: mapConfig.maxZoom,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    tileLayers.dark = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: mapConfig.maxZoom, maxNativeZoom: 16,
        attribution: 'Tiles &copy; Esri'
    });
    tileLayers.terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap'
    });

    markerLayer = typeof L.markerClusterGroup === 'function'
        ? L.markerClusterGroup({ showCoverageOnHover: false, spiderfyOnMaxZoom: true })
        : L.layerGroup();
    markerLayer.addTo(map);

    initMapControls();
    initMarkerDetailPanel();
    loadMapData();
    window.setTimeout(function () { map.invalidateSize(); }, 150);
}

async function loadMapData(filters) {
    if (!map) return;
    showLoadingState();
    const query = new URLSearchParams(Object.assign({ limit: '100', lang: mapConfig.language }, filters || {}));
    try {
        const response = await fetch(mapConfig.apiUrl + '?' + query.toString(), {
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Réponse serveur ' + response.status);
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Impossible de charger les villes.');
        clearMarkers();
        mapCities = result.cities || [];
        addMarkersFromData(result.cities || []);
        if (globeInstance) updateGlobePoints();
        updateMapStats(result.stats || {});
    } catch (error) {
        console.error('Chargement de la carte impossible :', error);
        showErrorMessage('Impossible de charger les données de la carte. Réessayez dans quelques instants.');
    } finally {
        hideLoadingState();
    }
}

function clearMarkers() {
    if (markerLayer) markerLayer.clearLayers();
    cityMarkers.clear();
}

function addMarkersFromData(cities) {
    cities.forEach(function (city) {
        const latitude = Number(city.latitude);
        const longitude = Number(city.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const marker = L.marker([latitude, longitude], {
            icon: createMarkerIcon(Number(city.event_count) || 0),
            title: city.name
        });
        marker.city = city;
        marker.on('click', function () { showMarkerDetailPanel(marker); });
        marker.bindPopup(
            '<strong>' + escapeHtml(city.name) + '</strong><br>' +
            escapeHtml(city.country_name || (mapConfig.language === 'en' ? city.country_name_en : city.country_name_fr) || '') + '<br>' +
            (Number(city.event_count) || 0) + ' ' + mapText.events + ' · ' +
            (Number(city.clip_count) || 0) + ' ' + mapText.media
        );
        markerLayer.addLayer(marker);
        cityMarkers.set(String(city.id), marker);
    });
}

function createMarkerIcon(eventCount) {
    const kind = eventCount > 1 ? 'multiple' : 'single';
    const label = eventCount > 0 ? eventCount : '•';
    return L.divIcon({
        className: 'student-map-marker student-map-marker-' + kind,
        html: '<span>' + escapeHtml(label) + '</span>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -17]
    });
}

async function showMarkerDetailPanel(marker) {
    const city = marker.city;
    selectedCity = city;
    const panel = document.getElementById('markerDetailPanel');
    const title = document.getElementById('markerDetailTitle');
    const content = document.getElementById('markerDetailContent');
    const allEvents = document.getElementById('viewAllEventsBtn');
    if (!panel || !content) return;

    if (title) title.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>' + escapeHtml(city.name) + '</span>';
    content.innerHTML = '<div class="marker-detail-loading"><div class="spinner"></div><p>' + escapeHtml(mapText.loading) + '</p></div>';
    if (allEvents) allEvents.href = 'city__slug-' + encodeURIComponent(city.slug) + '.html';
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');

    try {
        const url = mapConfig.apiUrl.replace('/api/cities.php', '/api/events.php') +
            '?city_id=' + encodeURIComponent(city.id) + '&limit=4&lang=' + encodeURIComponent(mapConfig.language);
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        const result = response.ok ? await response.json() : { success: false, events: [] };
        const events = result.success && Array.isArray(result.events) ? result.events : [];
        const eventList = events.length
            ? '<ul class="map-event-list">' + events.map(function (event) {
                const title = mapConfig.language === 'en'
                    ? (event.title_en || event.title || event.title_fr || 'Event')
                    : (event.title_fr || event.title || event.title_en || 'Action');
                const href = 'event__slug-' + encodeURIComponent(event.slug) + '.html';
                return '<li><a href="' + escapeHtml(href) + '">' + escapeHtml(title) + '</a></li>';
            }).join('') + '</ul>'
            : '<p>' + escapeHtml(mapText.empty) + '</p>';
        content.innerHTML =
            '<p><strong>' + escapeHtml(city.country_name || '') + '</strong></p>' +
            '<p>' + (Number(city.event_count) || 0) + ' ' + mapText.events + ' · ' +
            (Number(city.clip_count) || 0) + ' ' + mapText.media + '</p>' + eventList;
    } catch (error) {
        console.error('Chargement des événements de la ville impossible :', error);
        content.innerHTML = '<p>' + escapeHtml(mapText.unavailable) + '</p>';
    }
}

function hideMarkerDetailPanel() {
    const panel = document.getElementById('markerDetailPanel');
    if (panel) {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
    }
    selectedCity = null;
}

function initMapControls() {
    const locate = document.getElementById('locate-btn');
    const reset = document.getElementById('reset-btn');
    const layers = document.getElementById('layers-btn');
    const globe = document.getElementById('globe-btn');
    const fullscreen = document.getElementById('fullscreen-btn');
    if (locate) locate.addEventListener('click', locateUser);
    if (reset) reset.addEventListener('click', resetMapView);
    if (layers) layers.addEventListener('click', initLayersMenu);
    if (globe) globe.addEventListener('click', toggleGlobeMode);
    if (fullscreen) fullscreen.addEventListener('click', toggleMapFullscreen);
    document.addEventListener('fullscreenchange', function () {
        if (map) window.setTimeout(function () { map.invalidateSize(); }, 100);
        updateFullscreenButton();
    });
}

function initMarkerDetailPanel() {
    const close = document.querySelector('.marker-detail-close');
    if (close) close.addEventListener('click', hideMarkerDetailPanel);
    const infoClose = document.querySelector('.map-info-close');
    const infoPanel = document.querySelector('.map-info-panel');
    // Sur téléphone, le panneau d'information démarre replié pour laisser la carte visible
    if (infoPanel && window.matchMedia('(max-width: 700px)').matches) infoPanel.classList.add('collapsed');
    if (infoClose) infoClose.addEventListener('click', function () {
        if (infoPanel) infoPanel.classList.toggle('collapsed');
    });
}

function locateUser() {
    if (!navigator.geolocation) {
        showErrorMessage('La géolocalisation n’est pas prise en charge par ce navigateur.');
        return;
    }
    navigator.geolocation.getCurrentPosition(function (position) {
        map.setView([position.coords.latitude, position.coords.longitude], 12);
        L.circleMarker([position.coords.latitude, position.coords.longitude], {
            radius: 8, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1
        }).addTo(map).bindPopup(mapText.position).openPopup();
    }, function () {
        showErrorMessage('Votre position est indisponible ou son accès a été refusé.');
    }, { enableHighAccuracy: true, timeout: 10000 });
}

function resetMapView() {
    map.setView(mapConfig.center, mapConfig.zoom);
    hideMarkerDetailPanel();
}

function initLayersMenu() {
    const names = ['standard', 'dark', 'terrain'];
    const active = names.find(function (name) { return map.hasLayer(tileLayers[name]); }) || 'standard';
    const next = names[(names.indexOf(active) + 1) % names.length];
    changeBaseLayer(next);
}

function changeBaseLayer(layerId) {
    Object.keys(tileLayers).forEach(function (id) {
        if (map.hasLayer(tileLayers[id])) map.removeLayer(tileLayers[id]);
    });
    if (tileLayers[layerId]) tileLayers[layerId].addTo(map);
}

async function toggleMapFullscreen() {
    const container = document.querySelector('.map-container');
    if (!container) return;
    try {
        if (document.fullscreenElement === container) {
            await document.exitFullscreen();
        } else if (container.requestFullscreen) {
            await container.requestFullscreen();
        } else {
            container.classList.toggle('is-expanded');
        }
    } catch (error) {
        console.error('Impossible de basculer le plein écran de la carte :', error);
        showErrorMessage(mapConfig.language === 'en' ? 'Full screen is unavailable in this browser.' : 'Le plein écran n’est pas disponible dans ce navigateur.');
    }
    window.setTimeout(function () { if (map) map.invalidateSize(); }, 120);
    updateFullscreenButton();
}

function updateFullscreenButton() {
    const button = document.getElementById('fullscreen-btn');
    const expanded = document.fullscreenElement === document.querySelector('.map-container') ||
        document.querySelector('.map-container')?.classList.contains('is-expanded');
    if (button) {
        button.title = expanded ? mapText.exitFullscreen : mapText.fullscreen;
        button.setAttribute('aria-label', button.title);
        button.innerHTML = '<i class="fas fa-' + (expanded ? 'compress' : 'expand') + '"></i>';
    }
}

function loadGlobeLibrary() {
    if (typeof window.Globe === 'function') return Promise.resolve(window.Globe);
    return new Promise(function (resolve, reject) {
        const existing = document.querySelector('script[data-globe-library]');
        if (existing) {
            existing.addEventListener('load', function () { resolve(window.Globe); }, { once: true });
            existing.addEventListener('error', reject, { once: true });
            if (typeof window.Globe === 'function') resolve(window.Globe);
            return;
        }
        const script = document.createElement('script');
        script.src = ((window.STUDENT_MAP_CONFIG||{}).assetBase||'') + 'assets/vendor/globe/globe.gl.min.js';
        script.dataset.globeLibrary = 'true';
        script.onload = function () {
            if (typeof window.Globe !== 'function') reject(new Error('Globe library global was not registered.'));
            else resolve(window.Globe);
        };
        script.onerror = function () { reject(new Error('Globe library could not be loaded.')); };
        document.head.appendChild(script);
    });
}

async function toggleGlobeMode() {
    const container = document.querySelector('.map-container');
    const globeElement = document.getElementById('globe');
    const button = document.getElementById('globe-btn');
    if (!container || !globeElement) return;
    if (globeMode) {
        globeMode = false;
        container.classList.remove('is-globe');
        globeElement.hidden = true;
        globeElement.setAttribute('aria-hidden', 'true');
        if (button) {
            button.title = mapText.globe;
            button.setAttribute('aria-label', mapText.globe);
        }
        window.setTimeout(function () { if (map) map.invalidateSize(); }, 100);
        return;
    }
    try {
        const GlobeFactory = await loadGlobeLibrary();
        if (!globeInstance) {
            globeInstance = GlobeFactory()(globeElement)
                .globeImageUrl(((window.STUDENT_MAP_CONFIG||{}).assetBase||'') + 'assets/vendor/globe/earth-blue-marble.jpg')
                .backgroundColor('#07101f')
                .showAtmosphere(true)
                .atmosphereColor('#73bfff')
                .pointsData(mapCities)
                .pointLat(function (city) { return Number(city.latitude); })
                .pointLng(function (city) { return Number(city.longitude); })
                .pointAltitude(function (city) { return Number(city.event_count) > 1 ? 0.16 : 0.1; })
                .pointRadius(function (city) { return Number(city.event_count) > 1 ? 0.5 : 0.34; })
                .pointColor(function (city) { return Number(city.event_count) > 1 ? '#8b78ff' : '#20c9a6'; })
                .pointLabel(function (city) {
                    return '<b>' + escapeHtml(city.name) + '</b><br>' +
                        escapeHtml(city.country_name || '') + '<br>' +
                        (Number(city.event_count) || 0) + ' ' + mapText.events;
                })
                .onPointClick(function (city) { showMarkerDetailPanel({ city: city }); });
            updateGlobePoints();
        }
        globeMode = true;
        globeElement.hidden = false;
        globeElement.setAttribute('aria-hidden', 'false');
        container.classList.add('is-globe');
        if (button) {
            button.title = mapText.map;
            button.setAttribute('aria-label', mapText.map);
        }
        window.setTimeout(function () {
            const rect = globeElement.getBoundingClientRect();
            if (globeInstance && rect.width && rect.height) globeInstance.width(rect.width).height(rect.height);
        }, 100);
    } catch (error) {
        console.error('Impossible de charger la vue globe :', error);
        showErrorMessage(mapConfig.language === 'en'
            ? 'The globe view could not be loaded. Check your Internet connection and try again.'
            : 'La vue globe ne peut pas être chargée. Vérifiez votre connexion Internet et réessayez.');
    }
}

function updateGlobePoints() {
    if (globeInstance) globeInstance.pointsData(mapCities);
}

function updateMapStats(stats) {
    const total = document.querySelector('[data-map-total-cities]');
    if (total && stats.totalCities !== undefined) total.textContent = String(stats.totalCities);
}

function showLoadingState() {
    const element = document.getElementById('map');
    if (element) element.setAttribute('aria-busy', 'true');
}

function hideLoadingState() {
    const element = document.getElementById('map');
    if (element) element.removeAttribute('aria-busy');
}

function showErrorMessage(message) {
    let notice = document.getElementById('map-error-message');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'map-error-message';
        notice.className = 'map-error-message';
        const container = document.querySelector('.map-container');
        if (container) container.appendChild(notice);
    }
    if (notice) notice.textContent = message;
}

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character];
    });
}

window.STUDENT_MAP = {
    loadMapData: loadMapData,
    resetMapView: resetMapView,
    changeBaseLayer: changeBaseLayer,
    hideMarkerDetailPanel: hideMarkerDetailPanel
};
