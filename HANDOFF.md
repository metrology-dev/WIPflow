# WIP Flow — Agent Handoff

**Project:** WIPflow (`C:\Users\rosik\Sync\AI_Work\WIPflow`)
**Last worked:** 2026-06-01
**Git branch:** `master`
**Current version:** `APP_BASE_VERSION = '1.9'` (in `WIPflow.html`; displayed as `v1.9.N`, where N = `saveVersion` auto-incremented on each "Save as HTML")

---

## What this project is

WIP Flow is a **single-file, offline-first HTML application** (`WIPflow.html`) for tracking laboratory work-in-progress. No build step, no dependencies, no server — open the file in a browser and it runs. Data persists in `localStorage` and as embedded JSON inside the HTML file (`<script id="labwip-embedded-data">`), so "Save as HTML" produces a portable copy.

Architecture and conventions: [CLAUDE.md](CLAUDE.md) (current source of truth). User manual: the in-app **Help** and **About** views. [WIPflow_DOCUMENTATION.md](WIPflow_DOCUMENTATION.md) predates the rebrand — historical context only.

---

## State at end of this session

All items from the v1.9 sprint are **implemented and committed** in `WIPflow.html`. Verified in the browser preview — no console errors, all changed paths exercised.

### What changed (full detail in [TODO.md](TODO.md) → v1.9 section)

**Task modal keyboard shortcuts:**

- `_trapFocus()` now adds a third listener `_enterFn` alongside the existing `_trapFn` (Tab trap) and `_escFn` (Escape).
- Enter from any non-textarea field calls `TaskModal.save()`.
- Ctrl+Enter / Cmd+Enter from a textarea calls `TaskModal.save()`.
- Plain Enter inside a textarea does nothing (normal newline behavior preserved).
- `e.repeat` guard prevents double-saves on held key.
- `_releaseFocus()` removes all three listeners and nulls them — no leaks after close.

**Responsive Dashboard chart row:**

- `.dash-grid.triple` changed from `display: grid` to `display: flex; flex-wrap: wrap`.
- `_redrawCharts()` now sets `flex: ${n} 1 150px` on each of the three card children (previously set `gridTemplateColumns`). Flex-grow weight equals the bar count for that chart, preserving proportional sizing.
- At wide viewports all three charts sit on one row; at medium widths they wrap (2+1); at mobile they stack vertically.
- The `@media (max-width: 1100px)` rule no longer overrides `.dash-grid.triple` — wrapping is handled automatically by flexbox.

---

## Remaining backlog

[TODO.md](TODO.md) → ToDo section is currently empty. Add new items as they are identified.

---

## How to work in this file

- Single file, no build. Edit `WIPflow.html`, reload in **Firefox** (primary target — avoid Chrome-only APIs).
- Start the preview server: `python -m http.server 5500` (configured in `.claude/launch.json`).
- Find things by pattern, not line number: `grep -n "APP_BASE_VERSION|DEFAULT_SETTINGS|switchView|exportHTML|escHtml" WIPflow.html`.
- After a fix: bump `APP_BASE_VERSION` MINOR, update in-app Help/About if user-visible, update [TODO.md](TODO.md), commit.
- The `Gantt._tooltipBound` guard must persist across renders (don't reset it per render).
- Gantt `pixelsPerDay` for year zoom is recomputed dynamically at the start of `render()` — don't cache it externally.
- `resolveColor(cssVarStr)` is a top-level helper for resolving `var(--foo)` strings to concrete values for canvas use.

---

## Design system (v1.8 — unchanged in v1.9)

### Dark mode CSS variables (`:root`)

```
--bg: #0d1117  --bg-2: #161b22  --bg-3: #21262d  --bg-4: #2d333b
--border: #30363d  --border-2: #444c56
--text: #dce6f0  --text-2: #8b9ab0  --text-3: #768390
--accent: #1f6feb  --accent-2: #4493f8
--green: #3fb950  --red: #f85149  --orange: #e3622b
--yellow: #d29922  --purple: #a371f7  --cyan: #39c5cf
--badge-border-{red,orange,yellow,green,purple}: rgba(…, 0.35)
```

### Light mode CSS variables (`[data-theme="light"]`)

```
--bg: #f5f7fa  --bg-2: #ffffff  --bg-3: #eef1f5  --bg-4: #e3e8ef
--border: #d1d8e0  --border-2: #b5bfc9
--text: #1c2330  --text-2: #4a5568  --text-3: #636b75
--badge-border-{red,orange,yellow,green,purple}: rgba(…, 0.30)
```

### Typography uses

- `var(--font)` (Inter) for all UI labels, nav items, form labels, table headers, card titles, Kanban column titles
- `var(--mono)` (IBM Plex Mono) retained only for: date/numeric data values (`.td-mono`, `.deadline-date`, `.workload-pct`), code/pre blocks, sidebar version string, table footer counts

---

## Suggested skills

| Skill | When |
|---|---|
| `/verify` | Open app in preview, exercise the changed path, screenshot. Always do this before committing. |
| `/run` | Start the Python static server / open the app if the preview isn't running. |
| `/code-review` | Review the uncommitted diff for correctness before committing. |
| `/simplify` | If implementing new features introduces repetition worth trimming. |

---

## Known constraints

- **Firefox primary.** No File System Access API or other Chrome-only features.
- `localStorage` is scoped to the file URL — always steer users to "Save as HTML" for portability.
- `WIPflow.html` is ~4 300 lines. Keep additions proportionate.
- The base64 SVG lives inline in `<head>` and in the sidebar `<img>`; if the logo art changes, regenerate both from `IconPack/WIPFlow_logo.svg` (`base64 -w0`).
- Print with canvas (Dashboard, Gantt) works because canvas retains its pixel buffer when hidden. The print flow sequences through views before switching to table to ensure canvases are drawn.
- `color-mix()` is not used despite being tempting — CSS custom properties on badge borders are more compatible and explicit.
