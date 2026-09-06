import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The default subject of the 3D panel: the Zeos wordmark, extruded straight out
// of the IBM VGA bitmap the ASCII logo already draws with. Building it from the
// glyph raster instead of a mesh file keeps the two logos the same letterforms,
// and gives the effect passes hard pixel edges to bite on.

const FONT_STACK = '"IBM VGA 8x16", "Cascadia Mono", Consolas, monospace';

// Rasterizes the word and returns a boolean grid of lit pixels.
function rasterize(word, cellHeight) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.font = `${cellHeight}px ${FONT_STACK}`;
  const metrics = ctx.measureText(word);
  const width = Math.max(1, Math.ceil(metrics.width));
  const height = Math.ceil(cellHeight * 1.25);

  canvas.width = width;
  canvas.height = height;
  // Re-applying the font: resizing the canvas resets the 2D context.
  ctx.font = `${cellHeight}px ${FONT_STACK}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(word, 0, Math.round(cellHeight * 0.1));

  const { data } = ctx.getImageData(0, 0, width, height);
  const grid = [];
  for (let y = 0; y < height; y += 1) {
    const row = new Uint8Array(width);
    for (let x = 0; x < width; x += 1) {
      // Alpha alone: the glyph is drawn white on a transparent ground.
      row[x] = data[(y * width + x) * 4 + 3] > 127 ? 1 : 0;
    }
    grid.push(row);
  }
  return { grid, width, height };
}

// Horizontal runs become single boxes, which cuts the draw list by roughly an
// order of magnitude versus one box per pixel.
function runsOf(grid, width, height) {
  const runs = [];
  for (let y = 0; y < height; y += 1) {
    let start = -1;
    for (let x = 0; x <= width; x += 1) {
      const lit = x < width && grid[y][x] === 1;
      if (lit && start === -1) start = x;
      if (!lit && start !== -1) {
        runs.push({ x: start, y, length: x - start });
        start = -1;
      }
    }
  }
  return runs;
}

export function buildWordmark(word = 'ZEOS', options = {}) {
  const {
    cellHeight = 64,      // glyph raster height in pixels
    depth = 0.55,         // extrusion, in pixel units
    gap = 0.06,           // shrink per pixel so the voxels read as separate
    color = 0x60a5fa,
    roughness = 0.45,
    metalness = 0.35,
  } = options;

  const { grid, width, height } = rasterize(word, cellHeight);
  const runs = runsOf(grid, width, height);
  if (!runs.length) return null;

  const parts = [];
  for (const run of runs) {
    const box = new THREE.BoxGeometry(run.length - gap, 1 - gap, depth);
    // Canvas y grows downward; the scene's does not.
    box.translate(run.x + run.length / 2, height - run.y, 0);
    parts.push(box);
  }

  const merged = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  merged.center();
  merged.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const mesh = new THREE.Mesh(merged, material);
  mesh.name = `wordmark:${word}`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// The bitmap face has to be loaded before rasterizing or the browser silently
// falls back to a different metric set and the wordmark comes out wrong.
export async function buildWordmarkWhenReady(word = 'ZEOS', options = {}) {
  try {
    if (document.fonts?.load) await document.fonts.load(`64px "IBM VGA 8x16"`, word);
    await document.fonts?.ready;
  } catch {
    // A missing face is not fatal: the stack falls through to a monospace.
  }
  return buildWordmark(word, options);
}
