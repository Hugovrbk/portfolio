/* ============================================================
   RANKFOLIO — Générateur de QR code (sans dépendance)
   Mode octets (UTF-8), correction d'erreur M, versions 1 à 10 (jusqu'à 213 octets).
   RFQR.encode("https://…") → { size, modules[][] (booléens), version }
   Algorithme conforme à ISO/IEC 18004, inspiré de l'implémentation de référence de Project Nayuki (MIT).
   ============================================================ */
(function (global) {
  'use strict';

  // Indexés par version (1..10), niveau M
  const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const NUM_BLOCKS    = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  const MAX_VERSION = 10;

  function rawModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  const dataCodewords = ver => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];

  /* ── Reed-Solomon sur GF(256) ─────────────────────────── */
  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    const res = new Array(degree).fill(0);
    res[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < degree) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return res;
  }
  function rsRemainder(data, div) {
    const res = div.map(() => 0);
    for (const b of data) {
      const factor = b ^ res.shift();
      res.push(0);
      div.forEach((coef, i) => { res[i] ^= gfMul(coef, factor); });
    }
    return res;
  }

  /* ── Données → mots de code ───────────────────────────── */
  function buildCodewords(bytes, ver) {
    const bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(0x4, 4);                        // mode octets
    push(bytes.length, ver >= 10 ? 16 : 8);
    bytes.forEach(b => push(b, 8));
    const cap = dataCodewords(ver) * 8;
    push(0, Math.min(4, cap - bits.length));
    push(0, (8 - bits.length % 8) % 8);
    for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);
    const out = new Array(bits.length / 8).fill(0);
    bits.forEach((b, i) => { out[i >>> 3] |= b << (7 - (i & 7)); });
    return out;
  }

  function addEccAndInterleave(data, ver) {
    const nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver];
    const raw = Math.floor(rawModules(ver) / 8);
    const shortBlocks = nb - raw % nb;
    const shortLen = Math.floor(raw / nb);
    const div = rsDivisor(eccLen);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const dat = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = rsRemainder(dat, div);
      if (i < shortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const out = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((blk, j) => { if (i !== shortLen - eccLen || j >= shortBlocks) out.push(blk[i]); });
    }
    return out;
  }

  /* ── Matrice ──────────────────────────────────────────── */
  function alignPositions(ver) {
    if (ver === 1) return [];
    const n = Math.floor(ver / 7) + 2;
    const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const res = [6];
    for (let pos = ver * 4 + 10; res.length < n; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  function makeMatrix(ver) {
    const size = ver * 4 + 17;
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn  = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, dark) => { mod[y][x] = dark; fn[y][x] = true; };

    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    });
    const ap = alignPositions(ver), n = ap.length;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const bits = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const b = ((bits >>> i) & 1) !== 0, a = size - 11 + i % 3, c = Math.floor(i / 3);
        set(a, c, b); set(c, a, b);
      }
    }
    return { size, mod, fn, set };
  }

  function drawFormat(m, mask) {
    const { size, set } = m;
    const data = (0 << 3) | mask;                   // niveau M = 00
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = i => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  }

  function placeData(m, codewords) {
    const { size, mod, fn } = m;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
          if (!fn[y][x] && i < codewords.length * 8) {
            mod[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
  }

  const MASKS = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
    (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
    (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
  ];
  function applyMask(m, k) {
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) {
      if (!m.fn[y][x] && MASKS[k](x, y)) m.mod[y][x] = !m.mod[y][x];
    }
  }

  /** Pénalité simplifiée (suites de 5+, blocs 2×2, équilibre noir/blanc). */
  function penalty(m) {
    const { size, mod } = m;
    let p = 0;
    for (let a = 0; a < size; a++) {
      for (const horizontal of [true, false]) {
        let run = 1;
        for (let b = 1; b < size; b++) {
          const cur = horizontal ? mod[a][b] : mod[b][a];
          const prev = horizontal ? mod[a][b - 1] : mod[b - 1][a];
          if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
    }
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (mod[y][x]) dark++;
      if (x < size - 1 && y < size - 1 && mod[y][x] === mod[y][x + 1] && mod[y][x] === mod[y + 1][x] && mod[y][x] === mod[y + 1][x + 1]) p += 3;
    }
    const total = size * size;
    p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return p;
  }

  function encode(text) {
    const bytes = Array.from(new TextEncoder().encode(String(text)));
    let ver = 1;
    for (; ver <= MAX_VERSION; ver++) {
      if (4 + (ver >= 10 ? 16 : 8) + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    }
    if (ver > MAX_VERSION) throw new RangeError('Texte trop long pour le QR code');

    const codewords = addEccAndInterleave(buildCodewords(bytes, ver), ver);
    const m = makeMatrix(ver);
    drawFormat(m, 0);
    placeData(m, codewords);

    let best = 0, bestScore = Infinity;
    for (let k = 0; k < 8; k++) {
      applyMask(m, k); drawFormat(m, k);
      const s = penalty(m);
      if (s < bestScore) { bestScore = s; best = k; }
      applyMask(m, k);
    }
    applyMask(m, best); drawFormat(m, best);
    return { size: m.size, modules: m.mod, version: ver };
  }

  global.RFQR = { encode };
})(typeof window !== 'undefined' ? window : globalThis);
