/* LIGGSTER SHOP - card-tilt.js : inclinaison 3D + reflet holographique */
(function () {
  var MAX = 14, active = null;
  function reset(c) { c.classList.remove('is-tilting'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var c = e.target.closest && e.target.closest('.pcard');
    if (active && active !== c) { reset(active); active = null; }
    if (!c) return;
    active = c;
    var b = c.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    c.classList.add('is-tilting');
    c.style.setProperty('--ry', ((px - 0.5) * 2 * MAX).toFixed(2) + 'deg');
    c.style.setProperty('--rx', ((0.5 - py) * 2 * MAX).toFixed(2) + 'deg');
    c.style.setProperty('--mx', (px * 100).toFixed(1));
    c.style.setProperty('--my', (py * 100).toFixed(1));
  });
  document.addEventListener('pointerleave', function () { if (active) { reset(active); active = null; } });
})();
