/**
 * @file src/index.mts
 * @description Drop-in `electron` package entrypoint powered by awesome-os/b8g-ghost cas-v1.
 */

export {
  GHOST_INDEX_URL,
  GHOST_CAS_BASE_URL,
  getElectronAssetKey,
  getElectronExecutableRelPath,
  getGhostCacheDir,
  fetchGhostIndex,
  resolveElectronEntry,
  ensureElectronBinary,
  type ElectronCasEntry,
  type GhostIndex,
} from './hydrate.mts';
