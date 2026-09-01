'use strict';

// Pure extension helpers, importable without Electron so tests can exercise
// the real implementation.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const zlib = require('node:zlib');

// CRC32 table for zip generation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function packZip(sourceDir, targetZipPath) {
  const entries = [];
  function scan(dir, base) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f === '.git' || f === 'node_modules' || f.startsWith('.')) continue;
      const full = path.join(dir, f);
      const rel = base ? base + '/' + f : f;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scan(full, rel);
      } else {
        const data = fs.readFileSync(full);
        const compressed = zlib.deflateRawSync(data);
        entries.push({
          path: rel.replace(/\\/g, '/'),
          data,
          compressed,
          crc: crc32(data),
          size: data.length,
          compressedSize: compressed.length
        });
      }
    }
  }
  scan(sourceDir, '');

  const chunks = [];
  let offset = 0;
  const centralEntries = [];

  for (const entry of entries) {
    const pathBuf = Buffer.from(entry.path, 'utf8');
    const localHeader = Buffer.alloc(30 + pathBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(entry.crc, 14);
    localHeader.writeUInt32LE(entry.compressedSize, 18);
    localHeader.writeUInt32LE(entry.size, 22);
    localHeader.writeUInt16LE(pathBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    pathBuf.copy(localHeader, 30);

    chunks.push(localHeader);
    chunks.push(entry.compressed);

    const centralHeader = Buffer.alloc(46 + pathBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(entry.crc, 16);
    centralHeader.writeUInt32LE(entry.compressedSize, 20);
    centralHeader.writeUInt32LE(entry.size, 24);
    centralHeader.writeUInt16LE(pathBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    pathBuf.copy(centralHeader, 46);

    centralEntries.push(centralHeader);
    offset += localHeader.length + entry.compressed.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralEntries) {
    chunks.push(c);
    centralSize += c.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);
  chunks.push(eocd);

  fs.writeFileSync(targetZipPath, Buffer.concat(chunks));
  return true;
}

// A runner dir may only be deleted when it is unambiguously a Zeos-created
// copy inside the OS temp dir and not the user's original source folder.
// Fails closed: any resolution error means "do not delete".
function isRemovableRunnerDir(runnerPath, sourcePath) {
  try {
    const resolve = (p) => {
      try { return fs.realpathSync(p); } catch { return path.resolve(p); }
    };
    const runner = resolve(runnerPath);
    if (sourcePath && runner === resolve(sourcePath)) return false;
    const rel = path.relative(resolve(os.tmpdir()), runner);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
    return path.basename(runner).startsWith('zeos-ext-');
  } catch {
    return false;
  }
}

module.exports = { crc32, packZip, isRemovableRunnerDir };
