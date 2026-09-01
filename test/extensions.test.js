'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const zlib = require('node:zlib');
const { toNavigationTarget } = require('../src/navigation');
const { crc32, packZip, isRemovableRunnerDir } = require('../src/extension-utils');

test('navigation correctly routes extensions URLs', () => {
  const t1 = toNavigationTarget('zeos://extensions');
  assert.equal(t1.type, 'url');
  assert.equal(t1.url, 'zeos://extensions');

  const t2 = toNavigationTarget('chrome://extensions');
  assert.equal(t2.type, 'url');
  assert.equal(t2.url, 'chrome://extensions');

  const t3 = toNavigationTarget('chrome-extension://abcdef/options.html');
  assert.equal(t3.type, 'url');
});

test('crc32 matches the zlib reference implementation', () => {
  for (const sample of ['', 'zeos', 'manifest.json content', 'a'.repeat(4096)]) {
    const buf = Buffer.from(sample, 'utf8');
    assert.equal(crc32(buf), zlib.crc32(buf) >>> 0, `crc32 mismatch for ${JSON.stringify(sample.slice(0, 16))}`);
  }
});

test('packZip produces an archive whose entries decompress back to the source', (t) => {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeos-test-'));
  t.after(() => { try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {} });

  const srcDir = path.join(workDir, 'ext');
  fs.mkdirSync(path.join(srcDir, 'sub'), { recursive: true });
  const files = {
    'manifest.json': JSON.stringify({ name: 'Test Ext', manifest_version: 3, version: '1.0' }),
    [path.join('sub', 'script.js')]: 'console.log("zeos");'
  };
  for (const [rel, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(srcDir, rel), content, 'utf8');
  }

  const zipPath = path.join(workDir, 'ext.zip');
  assert.equal(packZip(srcDir, zipPath), true);
  const buf = fs.readFileSync(zipPath);

  // Walk the local file headers and verify each entry round-trips.
  const found = new Map();
  let offset = 0;
  while (offset + 4 <= buf.length && buf.readUInt32LE(offset) === 0x04034b50) {
    const compressedSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    const inflated = zlib.inflateRawSync(buf.subarray(dataStart, dataStart + compressedSize));
    found.set(name, inflated.toString('utf8'));
    offset = dataStart + compressedSize;
  }

  assert.equal(found.get('manifest.json'), files['manifest.json']);
  assert.equal(found.get('sub/script.js'), files[path.join('sub', 'script.js')]);

  // End-of-central-directory record must exist and count both entries.
  const eocdOffset = buf.length - 22;
  assert.equal(buf.readUInt32LE(eocdOffset), 0x06054b50, 'missing EOCD record');
  assert.equal(buf.readUInt16LE(eocdOffset + 10), 2, 'EOCD entry count');
});

test('isRemovableRunnerDir never allows deleting the user source folder', (t) => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'user-ext-src-'));
  t.after(() => { try { fs.rmSync(sourceDir, { recursive: true, force: true }); } catch {} });

  // The regression that shipped: runnerPath falling back to the source path.
  assert.equal(isRemovableRunnerDir(sourceDir, sourceDir), false);

  // A path outside the OS temp dir is never removable, prefix or not.
  const outside = path.join(__dirname, 'zeos-ext-abc123');
  assert.equal(isRemovableRunnerDir(outside, sourceDir), false);

  // Traversal out of the temp dir is rejected.
  assert.equal(isRemovableRunnerDir(path.join(os.tmpdir(), 'zeos-ext-x', '..', '..', 'etc'), sourceDir), false);

  // A temp-dir folder without the zeos-ext- prefix is not ours to delete.
  assert.equal(isRemovableRunnerDir(path.join(os.tmpdir(), 'some-other-dir'), sourceDir), false);
});

test('isRemovableRunnerDir accepts a genuine zeos runner copy in tmpdir', () => {
  const runner = path.join(os.tmpdir(), 'zeos-ext-0123456789ab');
  const source = 'C:\\Users\\someone\\extensions\\my-ext';
  assert.equal(isRemovableRunnerDir(runner, source), true);
});
