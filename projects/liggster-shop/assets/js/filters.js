/* LIGGSTER SHOP V2 - filters.js : filtres de la boutique (double curseur de prix, envoi automatique) */
(function () {
  var f = document.getElementById('filters'); if (!f) return;
  var d = f.querySelector('details'); if (d && innerWidth >= 900) d.open = true;
  var lo = f.querySelector('input[name=min]'), hi = f.querySelector('input[name=max]'), fill = f.querySelector('.range__fill'), out = document.getElementById('range-out'), M = +lo.max, t;
  function paint() {
    var a = +lo.value, b = +hi.value;
    if (a > b) { if (this === lo) { a = b; lo.value = a; } else { b = a; hi.value = b; } }
    fill.style.left = (a / M * 100) + '%'; fill.style.right = (100 - b / M * 100) + '%'; out.textContent = a + ' € – ' + b + ' €';
  }
  [lo, hi].forEach(function (el) {
    el.addEventListener('input', paint);
    el.addEventListener('change', function () { clearTimeout(t); t = setTimeout(function () { f.submit(); }, 250); });
  });
  f.querySelectorAll('select, input[type=checkbox]').forEach(function (el) { el.addEventListener('change', function () { f.submit(); }); });
  paint.call(lo);
})();
