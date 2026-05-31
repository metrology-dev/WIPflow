# WIP Flow — Agent Handoff

**Project:** WIPflow (`C:\Users\rosik\Sync\AI_Work\WIPflow`)
**Last worked:** 2026-05-31
**Git branch:** `master`
**Current version:** `APP_BASE_VERSION = '1.3'` (in `WIPflow.html`; displayed as `v1.3.N`, where N = `saveVersion` auto-incremented on each "Save as HTML")

---

## What this project is

WIP Flow is a **single-file, offline-first HTML application** (`WIPflow.html`) for tracking laboratory work-in-progress. No build step, no dependencies, no server — open the file in a browser and it runs. Data persists in `localStorage` and as embedded JSON inside the HTML file (`<script id="labwip-embedded-data">`), so "Save as HTML" produces a portable copy.

Architecture and conventions: [CLAUDE.md](CLAUDE.md) (current source of truth). User manual: the in-app **Help** and **About** views. [WIPflow_DOCUMENTATION.md](WIPflow_DOCUMENTATION.md) predates the rebrand — historical context only.

---

## State at end of this session

All known bugs and both requested feature tasks are **implemented in `WIPflow.html`**. Changes have **not been committed** — review with `git diff` and commit when ready. The app was **not** opened in the browser preview this session (the tool channel had heavy output latency); a `/verify` pass is the recommended next step before committing.

### What changed (full detail + locations in [TODO.md](TODO.md) → "✅ Completed")

Bug fixes **B1–B7** and feature tasks **T1–T2**, applied via validated scripts (each replacement asserted its match count):

- **B1–B3** — `escHtml()` now wraps all previously-raw user content: Dashboard staff-workload names + upcoming-deadline task names, Table tag chips, and all Toast messages.
- **B4** — Table/Gantt filter placeholder labels corrected to match the static HTML ("All Statuses" / "All Priorities").
- **B5** — sidebar logo `<img>` now carries the `logo-icon` class (the rule was previously dead).
- **B6** — dead `.form-control[readonly]` rule → `.form-control:disabled` (end-date field is `disabled`).
- **B7** — removed the phantom `pending` status mapping in `statusBadgeClass` and the unused `.badge-pending` CSS rule.
- **T1** — favicon and logos now use `IconPack/WIPFlow_logo.svg`, inlined as a `data:image/svg+xml;base64,…` URI: a new `<link rel="icon" type="image/svg+xml">` (PNG links kept as fallback) and the sidebar `<img>` src. The About hero copies the sidebar `src` in `switchView('about')`, so it inherits the SVG automatically. Inlining (not an external file) is required so the SVG survives `Storage.exportHTML()` (which serialises `outerHTML`).
- **T2** — `.doc-grid` (shared by Help & About) already had `max-width: 1100px` but was left-aligned; added `width: 100%; margin: 0 auto;` so both views render at an identical, centred width.
- **Logo size + versioning (v1.3)** — sidebar logo 30 → 40 px; `APP_BASE_VERSION` 1.2 → 1.3; static version placeholders → 1.3.0; About changelog entry expanded to cover all of the above.

Docs updated this session: [TODO.md](TODO.md), [CLAUDE.md](CLAUDE.md) (version constant reference), in-app About changelog. [WIPflow_DOCUMENTATION.md](WIPflow_DOCUMENTATION.md) was left unchanged (historical; nothing it describes regressed).

---

## Remaining backlog

See [TODO.md](TODO.md) → "🟠 Improvements / inconsistencies". Open items not yet done (deliberately deferred — larger or behavioural):

- **I1** view-switch always calls `Storage.markDirty()` (needless saves on navigation)
- **I2** light theme doesn't override semantic colours (`--green/--red/--orange/--purple` + `-bg`)
- **I3** verify `calcEndDate` off-by-one semantics (1-workday task starts Mon → ends Tue)
- **I4** escape `<option value>` building in the select populators
- **I5** CSV is export-only (no CSV import)
- **I6** deadline "(Xd)" rounding mixes wall-clock `now` with midnight dates
- **I7** `<head>` polish (`meta description`, `theme-color`)
- **I8** accessibility: modal focus-trap, ARIA, keyboard alternative to drag-drop

---

## How to work in this file

- Single file, no build. Edit `WIPflow.html`, reload in **Firefox** (primary target — avoid Chrome-only APIs).
- For large/giant-base64 edits, prefer a small Python script with asserted `str.count()`/`re.subn` counts over hand-matching (that's how B1–B7/T1 were applied safely).
- Find things by pattern, not line number: `grep -n "APP_BASE_VERSION|DEFAULT_SETTINGS|switchView|exportHTML|escHtml" WIPflow.html`.
- After a fix: bump `APP_BASE_VERSION` MINOR, update in-app Help/About if user-visible, update [TODO.md](TODO.md), commit.
- The `Gantt._tooltipBound` guard must persist across renders (don't reset it per render).

---

## Suggested skills

Invoke via the Skill tool when relevant:

| Skill | When |
|---|---|
| `/verify` | **Do this first** — open `WIPflow.html` in the preview and confirm: SVG logo/favicon render, sidebar logo is visibly larger, Help & About are equal-width and centred, and tasks with `<`/`&` in their names render safely (B1–B3). |
| `/run` | Start the Python static server (`python -m http.server 5500`) / open the app if the preview isn't running. |
| `/code-review` | Review the uncommitted diff for correctness before committing. |
| `/simplify` | If implementing the backlog (esp. I2/I8) introduces repetition worth trimming. |
| `/security-review` | Optional sanity pass — this session closed several `innerHTML` injection points (B1–B3). |

---

## Known constraints

- **Firefox primary.** No File System Access API or other Chrome-only features.
- `localStorage` is scoped to the file URL — always steer users to "Save as HTML" for portability.
- `WIPflow.html` is ~3,900 lines; the SVG data URI adds ~5 KB. Keep additions proportionate.
- The base64 SVG lives inline in `<head>` and in the sidebar `<img>`; if the logo art changes, regenerate both from `IconPack/WIPFlow_logo.svg` (`base64 -w0`).
