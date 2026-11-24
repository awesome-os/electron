# `awesome-os/electron`

> **100% unmodified upstream Electron — debloated, rolling-latest (Keep-Last-5), and hydrated ONCE per machine from [`awesome-os/b8g-ghost @ cas-v1`](https://github.com/awesome-os/b8g-ghost/releases/tag/cas-v1) instead of duplicating `250 MB` into every `node_modules/electron/dist/`.**

---

## Quick Install & Usage

### Install via `pnpm` (or release tarball)

```powershell
pnpm add github:awesome-os/electron
```

Or download the latest SHA-256 verified archive from [`Releases`](https://github.com/awesome-os/electron/releases/latest).

### Usage & Verification

```powershell
# Launch an Electron app via shared debloated cas-v1 Electron (or --sectium)
node src/cli.mts ./my-electron-app

# Verify locally (Node.js 22+)
node --test
```

---

## Which Awesome-OS Electron Repo Should You Use?

| Repo | What It Is | Footprint | Best For |
| :--- | :--- | :--- | :--- |
| **`awesome-os/electron`** *(this repo)* | **100% real upstream Electron**, debloated (strips ~53 unused `locales/*.pak` + `15 MB` `LICENSES.chromium.html`, re-packed as `zstd -9`) and shared once per machine in `~/.b8g/cas/` | **1 shared copy per machine** (0 B extra per app) | Drop-in replacement for *any* existing Electron app (VS Code, Obsidian, legacy apps needing 100% Chromium APIs) |
| **[`awesome-os/sectium-electron`](https://github.com/awesome-os/sectium-electron)** | Sovereign Electron-compatible runtime over **Sectium Display + `B8G_ARENA_V1` zero-copy IPC + Shared V8** | **`~120 KB` launcher**, zero Chromium monolith | New & sovereign desktop apps that want zero-copy IPC and zero Chromium bloat |

---

## Drop-In Usage

Replace npm's `electron` in your `package.json`:

```json
{
  "devDependencies": {
    "electron": "github:awesome-os/electron"
  }
}
```

Or run directly:

```bash
# Default / --upstream: hydrates debloated rolling-latest Electron + b8g-ghost-abi.node once
# into ~/.b8g/cas/ and launches your app with B8G_GHOST_ABI_PATH + B8G_GHOST_CAS_DIR set:
node src/cli.mts ./my-electron-app
node src/cli.mts --upstream ./my-electron-app

# Hybrid --sectium routing (or ELECTRON_BACKEND=sectium):
# Routes to `sectium-electron` when installed, or prints install guidance:
node src/cli.mts --sectium ./my-electron-app
```

### Zero-`node-gyp` `B8G_ARENA_V1` Access (`B8G_GHOST_ABI_PATH`)

Even unmodified upstream Electron apps automatically receive the pre-hydrated, SHA-256-verified `b8g-ghost-abi-<os>.node` N-API addon in their environment:

- `B8G_GHOST_ABI_PATH` — absolute path to `~/.b8g/cas/ghost-abi/<sha256>/b8g-ghost-abi-<os>.node`
- `B8G_GHOST_CAS_DIR` — shared Ghost CAS directory (`~/.b8g/cas`)

Programmatic API (matches npm `electron` returning the executable path, plus Ghost ABI hydration):

```ts
import {
  ensureElectronBinary,
  ensureGhostAbiAddonPath,
  resolveElectronEntry,
} from 'electron';

const entry = await resolveElectronEntry();
console.log(`Rolling-latest Electron ${entry.version} (${entry.bytes} B debloated zst vs ${entry.raw_bytes} B upstream zip)`);

const { executablePath, cacheHit } = await ensureElectronBinary();
const { addonPath } = await ensureGhostAbiAddonPath();
console.log('Hydrated binary:', executablePath, { cacheHit, addonPath });
```

---

## Documentation

Because `awesome-os/electron` runs **unmodified upstream Electron**, all official upstream Electron docs apply 100% as-is:
- **Official Electron Documentation:** https://www.electronjs.org/docs/latest/
- **Upstream Source & Releases:** https://github.com/electron/electron

---

## Rolling-Latest & Keep-Last-5 Retention

Upstream Electron releases are automatically ingested and debloated into [`awesome-os/b8g-ghost @ cas-v1`](https://github.com/awesome-os/b8g-ghost/releases/tag/cas-v1) daily:
- Default always resolves to **rolling-latest** stable Electron.
- The last **5** versions are retained in `manifests/index.json` (`history`) for pinned rollbacks (`ELECTRON_GHOST_SHA256=<sha256>`).
