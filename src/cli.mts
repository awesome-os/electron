#!/usr/bin/env node
/**
 * @file src/cli.mts
 * @description Drop-in `electron` CLI: hydrates rolling-latest debloated Electron
 * once from cas-v1 into ~/.b8g/cas/electron/<sha256>/ and spawns it directly.
 */

import { spawn } from 'node:child_process';
import { ensureElectronBinary } from './hydrate.mts';

const { executablePath, entry, cacheHit } = await ensureElectronBinary();
if (process.env.ELECTRON_GHOST_VERBOSE === '1') {
  console.error(
    `[awesome-os/electron] ${entry.version ?? 'latest'} (${executablePath}) cacheHit=${cacheHit}`,
  );
}

const child = spawn(executablePath, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: false,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
