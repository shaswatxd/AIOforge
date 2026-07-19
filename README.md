# AIOforge

A one-click Windows software installer and PC setup manager — Electron + React + TypeScript, styled after Windows 11 Fluent Design. Install dozens of apps at once, manage updates and uninstalls, build shareable install profiles, and tweak your PC, all from one app.

## Tech Stack

- **Shell**: Electron 33, `electron-vite` (Vite-powered main/preload/renderer build), `electron-builder` + `electron-updater`
- **UI**: React 18, TypeScript, Tailwind CSS (Fluent acrylic/dark-light theme), Framer Motion, `lucide-react`
- **State**: Zustand (client/UI state) + TanStack React Query (IPC-backed server state, with push-based cache updates for live install progress)
- **Routing**: React Router (`HashRouter`, since the renderer is loaded from a local file in production)
- **Data**: SQLite via `better-sqlite3`
- **Package managers**: winget (primary) and Chocolatey (secondary), invoked as real CLI subprocesses

## Getting Started

```bash
npm install
npm run dev      # launch in development (hot reload)
npm run build    # type-check + build main/preload/renderer to out/
npm run dist     # build + package a Windows installer (electron-builder)
```

Requires Windows 10/11 with [winget](https://learn.microsoft.com/windows/package-manager/winget/) available on PATH (bundled with Windows 11 and modern Windows 10). Chocolatey is optional — install it separately if you want it as a fallback/secondary source (Settings → Package Manager).

### Native module build notes (Windows)

`better-sqlite3` is a native addon and must be compiled for **Electron's** Node/V8 ABI, not your system Node. After `npm install`, if you ever see a `NODE_MODULE_VERSION` mismatch or the app fails to open its database, rebuild it explicitly:

```bash
npx electron-rebuild -f -w better-sqlite3
```

**Administrator rights**: system-wide install/uninstall/tweaks need elevation — the packaged installer requests it automatically (`requestedExecutionLevel: requireAdministrator` in `electron-builder.yml`, triggers a UAC prompt on launch). In `npm run dev`, nothing elevates you automatically — run your terminal/VS Code "as Administrator" if you want uninstalls, repairs, or PC Setup tweaks to actually succeed instead of failing with things like MSI error 1603.

Two environment gotchas we hit while building this project, in case you hit them too:

- **Very new Node versions on Windows** (whose own build was compiled with `clang=1`, e.g. some Node 24+ builds) cause `node-gyp` to default native addon builds to the `ClangCL` MSVC toolset. If your Visual Studio Build Tools installation doesn't include the Clang component, the build fails with `MSB8020`. Rebuilding against Electron's bundled Node (via `electron-rebuild`, which uses Electron's own headers/ABI) sidesteps this entirely — that's the supported path anyway, since the addon needs to match Electron's ABI, not your system Node's.
- If `ELECTRON_RUN_AS_NODE=1` is set in your shell (some tool integrations set this), `npm run dev` will crash on `electron.app` being `undefined` — Electron runs as plain Node in that mode. Unset it before running `npm run dev`.

## Releasing & Auto-Updates

The installer and `electron-updater` feed are already wired up (`src/main/autoUpdater.ts`, `electron-builder.yml`). To go live:

1. Create the GitHub repo and push this project to it.
2. Edit `electron-builder.yml` → `publish.owner` / `publish.repo` to match your real repo (currently placeholders).
3. Tag and push a release:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
4. `.github/workflows/release.yml` picks up the tag, builds on `windows-latest`, and publishes the installer + `latest.yml` to a GitHub Release automatically using the repo's built-in `GITHUB_TOKEN` — no secrets to configure.
5. From then on, every installed copy of SetupForge checks that repo's releases on startup (`autoUpdater.checkForUpdatesAndNotify()`) and prompts to update when a newer tag is published.

Prefer to publish manually instead of via CI? Run this locally with a [GitHub personal access token](https://github.com/settings/tokens) (`repo` scope):
```bash
GH_TOKEN=ghp_xxx npm run dist -- --publish always
```

Already verified locally end-to-end (unpacked app, signed-but-unsigned NSIS installer, and `latest.yml` all build correctly) — see `release/` after running `npm run dist`.

## Project Structure

```
src/
  main/               # Electron main process
    ipc/              # ipcMain handlers, one file per feature domain
    services/         # business logic (queue, package managers, profiles, tweaks, backup, admin, ...)
    db/                # better-sqlite3 init, schema, repositories
  preload/            # contextBridge — exposes window.api (typed by @shared/types/ipc)
  renderer/src/
    routes/           # one file per page (Home, Profiles, Queue, Updates, Uninstall, PCSetup, Backup, Admin, Settings)
    components/       # layout/, apps/, queue/, profiles/, common/
    state/            # Zustand stores (UI-only state)
    queries/           # React Query hooks wrapping window.api calls
    lib/               # query client, formatting utils
  shared/
    types/            # types shared between main and renderer (the IPC contract lives here)
    catalog/          # the static app catalog (100 apps, 14 categories, real winget/choco IDs)
    packs/             # bundled starter/bonus profile packs
```

## Feature Tour

- **Home** — search, category browser, Featured/Popular/Recently Added/Recommended rails, quick-access tiles for the queue/downloads/installed/updates counts.
- **App Card / App Detail** — logo, description, developer, version, size, rating, downloads, license, category, favorite/install/advanced-options actions. Advanced options are driven by a per-app `installOptions` schema (Node.js PATH/npm/pnpm/yarn, Python pip/pipx/env vars, VS Code extension picker, Git identity + SSH key + default branch, etc.) so options aren't hardcoded per screen.
- **Install Queue** — real concurrency-limited queue backed by actual `winget`/`choco` subprocesses, with live progress/speed/ETA parsed from CLI output, plus pause/resume/cancel/retry.
- **Profiles** — build a custom profile from any set of catalog apps, install a whole profile in one click, export/import as JSON, generate a share code, and 9 bundled starter/bonus packs (React Developer, Developer, Student, Gaming, Office, Cybersecurity, Flutter, Python, Data Science).
- **Update Manager** — scans installed apps via `winget upgrade` / `choco outdated`, update selected or all, background update checking, optional auto-update.
- **Uninstall Manager** — live-detects installed software, with uninstall/repair/reinstall actions.
- **PC Setup** — real, scoped tweaks: dark mode, show file extensions/hidden files, install Windows Terminal / PowerShell 7 / WSL / developer fonts, enable Developer Mode.
- **Backup & Restore / Export & Import** — full backup (apps + profiles + settings) with a SHA256 checksum for tamper detection, plus scoped export/import.
- **Admin Mode** — generates a deployment bundle: a manifest, a PowerShell script that installs the chosen profiles' apps via winget (run it via GPO/Intune/PsExec to hit multiple PCs), and optionally the actual installer binaries pre-downloaded with `winget download` for offline use.
- **Settings** — theme (light/dark/system), language, download location, package manager preference (winget/Chocolatey/both, with live availability check), queue concurrency.

## What's real vs. what's local-first-mocked

This is a genuine, working desktop app — not a UI mockup. Everything below either really executes, or is clearly documented as a local stand-in for a service that doesn't exist yet:

| Feature | Status |
|---|---|
| Install/uninstall/upgrade via winget & Chocolatey | **Real** — actual CLI subprocesses, real progress parsing |
| SQLite persistence (installed apps, profiles, queue, settings, history) | **Real** |
| PC tweaks (dark mode, WSL, PowerShell 7, Dev Mode, ...) | **Real** — registry edits / real winget installs |
| Admin bundle (manifest + deploy script + offline installers) | **Real** — `winget download` actually fetches installers |
| Backup/restore, export/import, SHA256 checksum | **Real** |
| Profile share codes ("DEV-X82K9") | **Local-first mock** — codes resolve against this machine's SQLite cache, not a hosted service. Swap `src/main/services/cloudClient.ts` for a real HTTP client against the same interface to go live. |
| Community/Trending profiles | **Local-first mock** — same bundled packs, presented with sample install-count stats. |
| AI recommendations ("You installed X, want Y?") | **Rule-based**, not an LLM call — a small transparent co-install rule table in `recommendationService.ts`. |
| App ratings/downloads/sizes shown on cards | **Sample data** — deterministically generated per app ID (no live store backend), clearly separable in `shared/catalog/helpers.ts::sampleStats`. |
| App logos | **Generated initials badges**, not fetched brand marks (avoids trademark/asset-sourcing issues) — swap `IconBadge` for real PNGs under a resources folder to upgrade. |
| Auto-updater (`electron-updater`) | Wired up, inert until `electron-builder.yml`'s `publish` block points at a real release feed. |

## License

All Rights Reserved © shaswatxd — see [LICENSE](LICENSE). This is source-available, not open source: viewing the code doesn't grant permission to use, copy, modify, or redistribute it.
