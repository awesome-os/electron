/**
 * @file src/hydrate.mts
 * @description Hydrates debloated rolling-latest upstream Electron once per machine
 * from awesome-os/b8g-ghost @ cas-v1 into ~/.b8g/cas/electron/<sha256>/.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const GHOST_INDEX_URL =
  process.env.B8G_GHOST_INDEX_URL ??
  'https://raw.githubusercontent.com/awesome-os/b8g-ghost/main/manifests/index.json';

export const GHOST_CAS_BASE_URL =
  process.env.B8G_GHOST_CAS_URL ??
  'https://github.com/awesome-os/b8g-ghost/releases/download/cas-v1';

export interface ElectronCasEntry {
  filename: string;
  sha256: string;
  bytes: number;
  raw_bytes?: number;
  version?: string;
  category?: string;
  download_url: string;
  history?: Array<{ sha256: string; bytes: number; version?: string; retired_at?: string }>;
}

export interface GhostIndex {
  schema: string;
  cas_base_url: string;
  updated_at: string;
  total_entries: number;
  entries: Record<string, ElectronCasEntry>;
}

export function getElectronAssetKey(): string {
  if (process.platform === 'win32') return 'electron-win64.tar.zst';
  if (process.platform === 'darwin') return 'electron-macos-arm64.tar.zst';
  return process.arch === 'arm64' ? 'electron-linux-arm64.tar.zst' : 'electron-linux-x64.tar.zst';
}

export function getElectronExecutableRelPath(): string {
  if (process.platform === 'win32') return 'electron.exe';
  if (process.platform === 'darwin') return join('Electron.app', 'Contents', 'MacOS', 'Electron');
  return 'electron';
}

export function getGhostCacheDir(): string {
  const dir = process.env.B8G_GHOST_CACHE_DIR ?? join(homedir(), '.b8g', 'cas');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function fetchGhostIndex(): Promise<GhostIndex> {
  const res = await fetch(GHOST_INDEX_URL, {
    headers: { 'User-Agent': 'awesome-os-electron/0.1.0' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${GHOST_INDEX_URL}`);
  }
  return (await res.json()) as GhostIndex;
}

export async function resolveElectronEntry(assetKey = getElectronAssetKey()): Promise<ElectronCasEntry> {
  const idx = await fetchGhostIndex();
  const entry = idx.entries[assetKey];
  if (!entry) {
    throw new Error(`Asset "${assetKey}" not found in b8g-ghost cas-v1 index (${idx.total_entries} entries)`);
  }
  const pinnedSha = process.env.ELECTRON_GHOST_SHA256?.trim();
  if (pinnedSha && pinnedSha !== entry.sha256) {
    const hist = entry.history?.find((h) => h.sha256 === pinnedSha);
    if (hist) {
      return {
        ...entry,
        sha256: hist.sha256,
        bytes: hist.bytes,
        version: hist.version ?? entry.version,
        download_url: `${GHOST_CAS_BASE_URL}/${hist.sha256}`,
      };
    }
  }
  return entry;
}

export async function ensureElectronBinary(): Promise<{
  entry: ElectronCasEntry;
  installDir: string;
  executablePath: string;
  cacheHit: boolean;
}> {
  const entry = await resolveElectronEntry();
  const cacheDir = getGhostCacheDir();
  const installDir = join(cacheDir, 'electron', entry.sha256);
  const executablePath = join(installDir, getElectronExecutableRelPath());

  if (existsSync(executablePath)) {
    return { entry, installDir, executablePath, cacheHit: true };
  }

  const archivePath = join(cacheDir, `${entry.sha256}.tar.zst`);
  if (!existsSync(archivePath)) {
    const url = entry.download_url || `${GHOST_CAS_BASE_URL}/${entry.sha256}`;
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'awesome-os-electron/0.1.0' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} hydrating ${entry.filename} from ${url}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const actual = createHash('sha256').update(buf).digest('hex');
    if (actual !== entry.sha256) {
      throw new Error(`SHA-256 mismatch for ${entry.filename}: expected ${entry.sha256}, got ${actual}`);
    }
    const tmp = `${archivePath}.${process.pid}.tmp`;
    writeFileSync(tmp, buf);
    renameSync(tmp, archivePath);
  }

  mkdirSync(installDir, { recursive: true });
  execFileSync('tar', ['--zstd', '-xf', archivePath, '-C', installDir], { stdio: 'inherit' });

  if (!existsSync(executablePath)) {
    throw new Error(`Extracted Electron archive missing expected binary: ${executablePath}`);
  }

  return { entry, installDir, executablePath, cacheHit: false };
}
