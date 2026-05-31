# WIP Flow — Agent Handoff

**Project:** WIPflow (`C:\Users\rosik\Sync\AI_Work\WIPflow`)
**Last worked:** 2026-05-31
**Git branch:** `master`
**Current version:** `APP_BASE_VERSION = '1.7'` (in `WIPflow.html`; displayed as `v1.7.N`, where N = `saveVersion` auto-incremented on each "Save as HTML")

---

## What this project is

WIP Flow is a **single-file, offline-first HTML application** (`WIPflow.html`) for tracking laboratory work-in-progress. No build step, no dependencies, no server — open the file in a browser and it runs. Data persists in `localStorage` and as embedded JSON inside the HTML file (`<script id="labwip-embedded-data">`), so "Save as HTML" produces a portable copy.

Architecture and conventions: [CLAUDE.md](CLAUDE.md) (current source of truth). User manual: the in-app **Help** and **About** views. [WIPflow_DOCUMENTATION.md](WIPflow_DOCUMENTATION.md) predates the rebrand — historical context only.

---

## State at end of this session

All bugs and UI improvements from the v1.7 sprint are **implemented and committed** in `WIPflow.html`. The app was verified in the browser preview — no console errors, all changed paths exercised.

### What changed (full detail in [TODO.md](TODO.md) → v1.7 section)

**Bug fixes:**

- **XLS export** — Added `<?mso-application progid="Excel.Sheet"?>` processing instruction and UTF-8 BOM to SpreadsheetML output. Excel no longer shows a format-mismatch warning on open.
- **Print/PDF** — Replaced bare `window.print()` with a dialog (checkboxes for Dashboard and Gantt; table always included). Prints in landscape. Print CSS updated: always shows `#view-table`; shows optional views via `body[data-print-dash/gantt]` data attributes; proper table formatting (`font-size: 11px`, `border-collapse`).
- **Gantt alignment** — Fixed 5 px offset between timeline header and chart canvas caused by the resize handle not being included in the left-header width. `gantt-left-header` is now set to `LEFT_WIDTH + 5` in both `render()` and the resize drag handler. Verified pixel-perfect: all four DOM edges equal.

**UI improvements:**

- **Dashboard proportional charts** — `_redrawCharts()` now computes `gridTemplateColumns` proportional to bar counts (`nStatus fr nPriority fr nLab fr`) with a forced layout reflow before drawing, so the canvas sizes are correct.
- **Gantt Year zoom** — `render()` now dynamically computes `pixelsPerDay` for year zoom to fill the available `gantt-body-wrap` width. Month labels are skipped when the column is < 48 px wide to avoid overlap.
- **Kanban fill** — `.kanban-col` changed from `width: 260px; flex-shrink: 0` to `flex: 1 1 220px; min-width: 200px`. Columns fill the full board width.
- **Help & About cards** — `doc-grid` changed from 2-column to 1-column; `grid-column: 1` constraint removed; all cards now span the full content width (up to 1100 px max).

Docs updated: [TODO.md](TODO.md) (v1.7 completed section, ToDo cleared), [HANDOFF.md](HANDOFF.md) (this file), in-app About changelog and Help text.

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
- `WIPflow.html` is ~4 100 lines. Keep additions proportionate.
- The base64 SVG lives inline in `<head>` and in the sidebar `<img>`; if the logo art changes, regenerate both from `IconPack/WIPFlow_logo.svg` (`base64 -w0`).
- Print with canvas (Dashboard, Gantt) works because canvas retains its pixel buffer when hidden. The print flow sequences through views before switching to table to ensure canvases are drawn.
