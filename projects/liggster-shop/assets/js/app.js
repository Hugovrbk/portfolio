/* LIGGSTER SHOP V2 - app.js : navbar, loader, toasts, curseur, favoris/panier (AJAX) */
(function () {
  var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
  var stack;
  function toast(msg, type) {
    if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.appendChild(stack); }
    var t = document.createElement('div'); t.className = 'toast' + (type ? ' toast--' + type : ''); t.textContent = msg; t.setAttribute('role', 'status');
    stack.appendChild(t);
    setTimeout(function () { t.classList.add('is-leaving'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }
  window.LG = { toast: toast };

  var nav = document.getElementById('navbar');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 24); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var burger = document.getElementById('burger');
  if (burger) burger.addEventListener('click', function () { document.getElementById('nav-links').classList.toggle('is-open'); });

  var l = document.createElement('div'); l.className = 'loader';
  l.innerHTML = '<div class="loader__inner"><div class="loader__ball"></div><div class="loader__text">CHARGEMENT</div></div>';
  document.body.appendChild(l);
  addEventListener('load', function () { setTimeout(function () { l.classList.add('is-done'); dispatchEvent(new Event('lg:ready')); setTimeout(function () { l.remove(); }, 700); }, 400); });

  var d = document.body.dataset;
  if (d.flash) toast(d.flash, d.flashType);

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var dot = document.createElement('div'), ring = document.createElement('div'), x = 0, y = 0, rx = 0, ry = 0;
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring'; document.body.append(dot, ring); document.body.classList.add('has-custom-cursor');
    addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; dot.style.left = x + 'px'; dot.style.top = y + 'px'; });
    (function loop() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', function (e) { ring.classList.toggle('is-hover', !!e.target.closest('a, button, .pcard')); });
  }

  function post(url, id) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf }, body: 'product_id=' + encodeURIComponent(id) })
      .then(function (r) { return r.json().then(function (j) { j.status = r.status; return j; }); });
  }
  function setCount(id, n) { var el = document.getElementById(id); if (el) { el.textContent = n; el.dataset.count = n; } }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) { var a = e.target.closest('.pcard__art'); if (a && !document.body.classList.contains('page-product')) location.href = 'produit__id-' + a.closest('.pcard').dataset.id + '.html'; return; }
    var id = b.closest('.pcard').dataset.id;
    if (b.dataset.act === 'fav') {
      post('api/favorite-toggle.php', id).then(function (j) {
        if (j.status === 401) { location.href = 'connexion.html'; return; }
        if (!j.ok) { toast(j.error || 'Erreur', 'error'); return; }
        b.setAttribute('aria-pressed', j.fav); setCount('count-fav', j.count);
        toast(j.fav ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success');
        if (document.body.dataset.view === 'fav' && !j.fav) b.closest('.pcard').remove();
      }).catch(function () { toast('Erreur réseau', 'error'); });
    } else if (b.dataset.act === 'add') {
      post('api/cart-add.php', id).then(function (j) {
        if (j.ok) { setCount('count-cart', j.count); toast('Ajouté au panier', 'success'); } else toast(j.error || 'Erreur', 'error');
      }).catch(function () { toast('Erreur réseau', 'error'); });
    }
  });
})();
