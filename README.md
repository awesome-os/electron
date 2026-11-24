# `awesome-os/electron`

> **100% unmodified upstream Electron — debloated, rolling-latest (Keep-Last-5), and hydrated ONCE per machine from [`awesome-os/b8g-ghost @ cas-v1`](https://github.com/awesome-os/b8g-ghost/releases/tag/cas-v1) instead of duplicating `250 MB` into every `node_modules/electron/dist/`.**

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
# Hydrates debloated rolling-latest Electron once into ~/.b8g/cas/electron/<sha256>/ and launches your app:
node src/cli.mts ./my-electron-app
```

Programmatic API (matches npm `electron` returning the executable path):

```ts
import { ensureElectronBinary, resolveElectronEntry } from 'electron';

const entry = await resolveElectronEntry();
console.log(`Rolling-latest Electron ${entry.version} (${entry.bytes} B debloated zst vs ${entry.raw_bytes} B upstream zip)`);

const { executablePath, cacheHit } = await ensureElectronBinary();
console.log('Hydrated binary:', executablePath, { cacheHit });
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
