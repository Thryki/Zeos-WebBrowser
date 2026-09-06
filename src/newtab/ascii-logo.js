'use strict';

// Zeos wordmark rendered the way a terminal would draw a solid: an extruded
// 3D slab of the word, rasterised every frame into a strict character grid.
//
// The lit face is one continuous stream of the word; the receding faces are
// an ordered dither of sparse marks, so depth reads through density alone.
// Monochrome, on a strict grid: the charm is the terminal, not the colour.
//
// The pointer carries a round shield: any character caught inside it is
// displaced to the rim, opening a clean hole that follows the cursor.

(function () {
  const canvas = document.getElementById('ascii-logo');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  // The turn is the identity, so it keeps going; reduced motion drops the
  // parts that are decoration — the scatter on entry and the click ripple —
  // and halves the speed.
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const config = {
    word: 'ZEOS',
    texture: 'ZEOS#',      // what the lit face is filled with
    shadeLevels: 8,        // depth buckets feeding the ordered dither
    // The bitmap face is designed at 8x16; drawing it at any other size
    // blurs it, so the grid matches the glyph exactly.
    cellW: 8,
    cellH: 16,
    targetRows: 17,        // glyph height, in character rows
    depth: 74,             // thickness of the slab, in model units
    slices: 16,            // extrusion samples between the back and front face
    focal: 1400,
    yawBase: 0.35,         // resting angle when motion is reduced
    pitch: 0.16,
    spinMs: 13000,         // one full turn
    dwell: 0.46,           // how much the turn lingers on the readable faces
    tilt: 0.30,            // how much the pointer steers the rotation
    shield: 62,            // radius of the pointer shield, in screen pixels
    formMs: 1400
  };

  let maskPoints = [];
  let maskW = 0;
  let maskH = 0;
  let cols = 0;
  let rows = 0;
  let front = null;        // Uint8Array: 0 empty, 1 side face, 2 lit face
  let shade = null;        // Uint8Array: dither ramp index for side faces
  let edges = null;        // Uint8Array: 0 none, then an index into EDGE_CHARS
  const EDGE_CHARS = [null, '/', '\\', '|', '-'];
  // Ordered dither, so the receding faces break into a regular field of marks
  // with real gaps instead of a solid wash.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let startedAt = 0;
  let raf = 0;
  let foreground = '#f5f5f5';
  // The wordmark is drawn in a real bitmap terminal face, not the UI font:
  // that squared, 1993-CRT weight is the whole point of the look.
  const GLYPH_FONT = '"IBM VGA 8x16", "Cascadia Mono", Consolas, monospace';
  const pointer = { x: -9999, y: -9999, nx: 0, ny: 0, active: false };
  let ripple = { at: -9999, x: 0, y: 0 };

  function readTheme() {
    const styles = getComputedStyle(document.documentElement);
    foreground = styles.getPropertyValue('--fg').trim() || foreground;
  }

  // Draws the word once with a heavy face and keeps the covered points; these
  // are the silhouette that gets extruded.
  function buildMask() {
    // Sized so the letters occupy targetRows rows, but never wider than the
    // canvas.
    const wanted = (config.targetRows * config.cellH) / 0.72;
    const fontSize = Math.max(96, Math.min(wanted, width / 2.9));
    const probe = document.createElement('canvas');
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    probe.width = Math.max(1, Math.floor(width));
    probe.height = Math.max(1, Math.floor(fontSize * 1.45));
    pctx.font = `900 ${fontSize}px "Arial Black", "Segoe UI Black", Impact, sans-serif`;
    // Extra tracking keeps the gaps between letters open once the shape is
    // quantised onto the character grid.
    try { pctx.letterSpacing = `${Math.round(fontSize * 0.1)}px`; } catch {}
    pctx.textAlign = 'center';
    pctx.textBaseline = 'middle';
    pctx.fillStyle = '#fff';
    pctx.fillText(config.word, probe.width / 2, probe.height / 2);

    const { data } = pctx.getImageData(0, 0, probe.width, probe.height);
    const stepX = 2;
    const stepY = 3;
    const points = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let y = 0; y < probe.height; y += stepY) {
      for (let x = 0; x < probe.width; x += stepX) {
        if (data[(y * probe.width + x) * 4 + 3] < 128) continue;
        points.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    maskW = maxX - minX || 1;
    maskH = maxY - minY || 1;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    maskPoints = new Float32Array(points.length);
    for (let i = 0; i < points.length; i += 2) {
      maskPoints[i] = points[i] - cx;
      maskPoints[i + 1] = points[i + 1] - cy;
    }
    startedAt = performance.now();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.max(1, Math.floor(width / config.cellW));
    rows = Math.max(1, Math.floor(height / config.cellH));
    front = new Uint8Array(cols * rows);
    shade = new Uint8Array(cols * rows);
    edges = new Uint8Array(cols * rows);
    buildMask();
  }

  // Places a model point into the character grid, pushing it clear of the
  // pointer shield first so the hole stays perfectly round.
  function stamp(px, py, kind, shadeIndex) {
    let x = px;
    let y = py;
    if (pointer.active) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < config.shield) {
        const angle = dist < 0.001 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
        x = pointer.x + Math.cos(angle) * config.shield;
        y = pointer.y + Math.sin(angle) * config.shield;
      }
    }
    const col = (x / config.cellW) | 0;
    const row = (y / config.cellH) | 0;
    if (col < 0 || row < 0 || col >= cols || row >= rows) return;
    const index = row * cols + col;
    // The lit face always wins over the shaded ones behind it.
    if (front[index] === 2 && kind !== 2) return;
    front[index] = kind;
    shade[index] = shadeIndex;
  }

  function step(now) {
    const elapsed = now - startedAt;
    const form = Math.min(1, elapsed / config.formMs);
    const eased = 1 - Math.pow(1 - form, 3);

    front.fill(0);
    edges.fill(0);

    // A full, continuous turn: the solid rotates rather than rocking, so every
    // face comes around — front, edge-on, and the back of the letters.
    const spin = config.spinMs * (REDUCED_MOTION ? 2 : 1);
    const phase = (now / spin) * Math.PI * 2;
    // A full turn, but shaped: the solid lingers while it faces the reader and
    // whips through the profile, where the letters would be edge-on and
    // unreadable.
    const t = phase - config.dwell * Math.sin(phase * 2);
    const yaw = t + (pointer.active ? pointer.nx * config.tilt : 0);
    const pitch = Math.sin(t * 0.5) * config.pitch -
      (pointer.active ? pointer.ny * config.tilt * 0.5 : 0);
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);
    const centreX = width / 2;
    const centreY = height / 2;

    // Grows out of the back face, so the solid builds towards the viewer.
    const visibleSlices = Math.max(1, Math.round(config.slices * eased));

    for (let s = 0; s < visibleSlices; s += 1) {
      // Back to front, so the lit face is stamped last.
      const k = 1 - s / Math.max(1, config.slices - 1);
      const z = -config.depth / 2 + config.depth * k;
      const isFront = s === visibleSlices - 1 && form >= 1;
      const shadeIndex = isFront
        ? config.shadeLevels - 1
        : Math.max(0, Math.min(config.shadeLevels - 2, Math.round((1 - k) * (config.shadeLevels - 2))));

      for (let i = 0; i < maskPoints.length; i += 2) {
        const mx = maskPoints[i];
        const my = maskPoints[i + 1];
        const x1 = mx * cosY + z * sinY;
        const z1 = z * cosY - mx * sinY;
        const y2 = my * cosX - z1 * sinX;
        const z2 = z1 * cosX + my * sinX;
        const scale = config.focal / (config.focal + z2 + config.depth);
        stamp(centreX + x1 * scale, centreY + y2 * scale, isFront ? 2 : 1, shadeIndex);
      }
    }

    // Trace the silhouette with line-art characters, the way ASCII solids are
    // drawn: the outline is what makes the volume read as a built object
    // rather than a cloud of text.
    const filled = (col, row) => (
      col >= 0 && row >= 0 && col < cols && row < rows && front[row * cols + col] !== 0
    );
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        if (!front[index]) continue;
        const up = filled(col, row - 1);
        const down = filled(col, row + 1);
        const left = filled(col - 1, row);
        const right = filled(col + 1, row);
        if (up && down && left && right) continue;
        let edge = 0;
        if (!left && !up) edge = 1;        // '/'
        else if (!right && !up) edge = 2;  // '\'
        else if (!left && !down) edge = 2;
        else if (!right && !down) edge = 1;
        else if (!left || !right) edge = 3; // '|'
        else edge = 4;                      // '-'
        edges[index] = edge;
      }
    }

    // Paint the grid.
    ctx.clearRect(0, 0, width, height);
    // Monochrome, like the reference: one ink on black.
    ctx.fillStyle = foreground;
    ctx.font = `${config.cellH}px ${GLYPH_FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const texture = config.texture;
    let streamIndex = 0;
    const rippleAge = now - ripple.at;
    const rippleRadius = rippleAge < 900 ? (rippleAge / 900) * config.shield * 5 : -1;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const kind = front[index];
        if (!kind) continue;

        let char;
        let alpha;
        const edge = edges[index];
        if (edge) {
          char = EDGE_CHARS[edge];
          alpha = 0.95;
        } else if (kind === 2) {
          // The lit face is one continuous stream of the name, flowing left to
          // right and wrapping from row to row, so it reads as running text.
          char = texture[streamIndex % texture.length];
          streamIndex += 1;
          alpha = 1;
        } else {
          // Receding faces are an ordered dither: sparse marks with real gaps
          // between them, never solid fill. Density carries the shading.
          const level = shade[index];
          const threshold = BAYER[(row & 3) * 4 + (col & 3)];
          if (threshold >= level * 2) continue;
          char = level < 3 ? '·' : level < 5 ? ':' : level < 7 ? '-' : '+';
          alpha = 0.5 + (level / (config.shadeLevels - 1)) * 0.4;
        }

        const x = col * config.cellW;
        const y = row * config.cellH;

        if (rippleRadius > 0) {
          // A click sends a ring outwards that briefly brightens the grid.
          const d = Math.hypot(x - ripple.x, y - ripple.y);
          if (Math.abs(d - rippleRadius) < 26) alpha = Math.min(1, alpha + 0.5);
        }

        ctx.globalAlpha = alpha * (0.25 + eased * 0.75);
        ctx.fillText(char, x, y);
      }
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(step);
  }

  function pointerFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.nx = Math.max(-1, Math.min(1, (pointer.x / rect.width) * 2 - 1));
    pointer.ny = Math.max(-1, Math.min(1, (pointer.y / rect.height) * 2 - 1));
    pointer.active = true;
  }

  window.addEventListener('pointermove', pointerFromEvent, { passive: true });
  window.addEventListener('pointerdown', (event) => {
    pointerFromEvent(event);
    ripple = { at: performance.now(), x: pointer.x, y: pointer.y };
  });
  window.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('blur', () => { pointer.active = false; });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    raf = requestAnimationFrame(step);
  });

  new MutationObserver(readTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style']
  });

  function start() {
    readTheme();
    resize();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  }

  // Without waiting for the bitmap face the first frames would be measured
  // and drawn in the fallback, which has different metrics.
  if (document.fonts && document.fonts.load) {
    const ready = document.fonts.load(`${config.cellH}px "IBM VGA 8x16"`);
    const timeout = new Promise((resolve) => setTimeout(resolve, 1200));
    Promise.race([ready, timeout]).then(start, start);
  } else {
    start();
  }
})();
