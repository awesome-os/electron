#!/usr/bin/env node
/**
 * @file src/cli.mts
 * @description Hybrid `electron` CLI:
 *   - `--sectium` or `ELECTRON_BACKEND=sectium`: routes to `sectium-electron` if installed,
 *     or prints clear installation guidance.
 *   - Default / `--upstream`: hydrates rolling-latest debloated upstream Electron once from
 *     cas-v1 into ~/.b8g/cas/electron/<sha256>/, pre-hydrates `b8g-ghost-abi-<os>.node`,
 *     injects `B8G_GHOST_ABI_PATH` + `B8G_GHOST_CAS_DIR`, and spawns Electron cleanly.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { ensureElectronBinary, ensureGhostAbiAddonPath } from './hydrate.mts';

const rawArgs = process.argv.slice(2);
const forwardArgs: string[] = [];
let backendOverride: 'sectium' | 'upstream' | undefined;
let passthrough = false;

for (const arg of rawArgs) {
  if (!passthrough && arg === '--') {
    passthrough = true;
    forwardArgs.push(arg);
    continue;
  }
  if (!passthrough && arg === '--sectium') {
    backendOverride = 'sectium';
    continue;
  }
  if (!passthrough && arg === '--upstream') {
    backendOverride = 'upstream';
    continue;
  }
  forwardArgs.push(arg);
}

const envBackend = process.env.ELECTRON_BACKEND?.trim().toLowerCase();
const useSectium =
  backendOverride === 'sectium' ||
  (backendOverride !== 'upstream' && envBackend === 'sectium');

function resolveSectiumEntrypoint(): string | null {
  const req = createRequire(import.meta.url);
  for (const specifier of ['sectium-electron/cli', 'sectium-electron/src/cli.mts']) {
    try {
      return req.resolve(specifier);
    } catch {
      // Try next candidate
    }
  }
  try {
    const pkgPath = req.resolve('sectium-electron/package.json');
    const pkgDir = dirname(pkgPath);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      bin?: string | Record<string, string>;
      main?: string;
    };
    const binRel =
      typeof pkg.bin === 'string'
        ? pkg.bin
        : pkg.bin?.['sectium-electron'] ?? pkg.bin?.electron ?? pkg.main;
    if (binRel) {
      const candidate = resolve(pkgDir, binRel);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
    // sectium-electron not installed in module resolution path
  }
  return null;
}

if (useSectium) {
  const sectiumEntry = resolveSectiumEntrypoint();
  if (!sectiumEntry) {
    console.error(
      [
        '[awesome-os/electron] Sectium backend requested (--sectium / ELECTRON_BACKEND=sectium),',
        'but `sectium-electron` is not installed in this workspace.',
        '',
        'Install the sovereign Sectium Electron runtime:',
        '  pnpm add github:awesome-os/sectium-electron',
        '',
        'Or run unmodified upstream Electron with zero-copy Ghost ABI:',
        '  electron --upstream <app>',
      ].join('\n'),
    );
    process.exit(1);
  }

  const ghostAbi = await ensureGhostAbiAddonPath();
  if (process.env.ELECTRON_GHOST_VERBOSE === '1') {
    console.error(
      `[awesome-os/electron] routing to sectium-electron (${sectiumEntry}) ghostAbi=${ghostAbi.addonPath}`,
    );
  }

  const child = spawn(process.execPath, [sectiumEntry, ...forwardArgs], {
    stdio: 'inherit',
    windowsHide: false,
    env: {
      ...process.env,
      B8G_GHOST_ABI_PATH: ghostAbi.addonPath,
      B8G_GHOST_CAS_DIR: ghostAbi.cacheDir,
    },
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
} else {
  const [electron, ghostAbi] = await Promise.all([
    ensureElectronBinary(),
    ensureGhostAbiAddonPath(),
  ]);

  if (process.env.ELECTRON_GHOST_VERBOSE === '1') {
    console.error(
      `[awesome-os/electron] ${electron.entry.version ?? 'latest'} (${electron.executablePath}) cacheHit=${electron.cacheHit}`,
    );
    console.error(
      `[awesome-os/electron] ghost-abi (${ghostAbi.addonPath}) cacheHit=${ghostAbi.cacheHit}`,
    );
  }

  const child = spawn(electron.executablePath, forwardArgs, {
    stdio: 'inherit',
    windowsHide: false,
    env: {
      ...process.env,
      B8G_GHOST_ABI_PATH: ghostAbi.addonPath,
      B8G_GHOST_CAS_DIR: ghostAbi.cacheDir,
    },
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}
