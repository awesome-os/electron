import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import {
  ensureElectronBinary,
  ensureGhostAbiAddonPath,
  getElectronAssetKey,
  getGhostAbiAssetKey,
  resolveElectronEntry,
} from '../src/index.mts';

test('resolves rolling-latest debloated Electron from awesome-os/b8g-ghost cas-v1', async () => {
  const key = getElectronAssetKey();
  const entry = await resolveElectronEntry(key);
  assert.equal(entry.filename, key);
  assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  assert.ok(entry.bytes > 10_000_000, 'Expected real upstream Electron archive (>10 MB)');
  if (entry.raw_bytes) {
    assert.ok(
      entry.bytes < entry.raw_bytes,
      `Expected debloated zst (${entry.bytes}) < upstream zip (${entry.raw_bytes})`,
    );
  }
});

test('hydrates and extracts real upstream Electron binary once into shared Ghost CAS', async () => {
  const first = await ensureElectronBinary();
  assert.equal(existsSync(first.executablePath), true);

  const second = await ensureElectronBinary();
  assert.equal(second.executablePath, first.executablePath);
  assert.equal(second.cacheHit, true);
});

test('hydrates b8g-ghost-abi.node live from awesome-os/b8g-ghost cas-v1 with cache hit', async () => {
  const expectedKey = getGhostAbiAssetKey();
  const first = await ensureGhostAbiAddonPath();
  assert.equal(first.entry.filename, expectedKey);
  assert.match(first.entry.sha256, /^[a-f0-9]{64}$/);
  assert.equal(existsSync(first.addonPath), true);
  assert.ok(first.addonPath.endsWith('.node'), `Expected .node addon path, got ${first.addonPath}`);

  const second = await ensureGhostAbiAddonPath();
  assert.equal(second.addonPath, first.addonPath);
  assert.equal(second.cacheHit, true);
});
