/* ============================================================
   clip-layout.js — Disposition des clips (1 / 2 / 4 par ligne)
   Purement visuel, mémorisé d'une page à l'autre via localStorage.
   ============================================================ */
(function () {
  'use strict';

  var buttons = document.querySelectorAll('.layout-btn');
  if (!buttons.length) { return; }

  var grid  = document.querySelector('.clips-grid');
  var saved = localStorage.getItem('toutdroit.clipCols');
  var valid = ['1', '2'];
  var current = valid.indexOf(saved) !== -1 ? saved : '2';

  function apply(cols) {
    current = cols;

    if (grid) {
      valid.forEach(function (c) { grid.classList.remove('cols-' + c); });
      grid.classList.add('cols-' + cols);
    }

    Array.prototype.forEach.call(buttons, function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-cols') === cols);
    });

    localStorage.setItem('toutdroit.clipCols', cols);
  }

  Array.prototype.forEach.call(buttons, function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-cols')); });
  });

  apply(current);
})();
