# WIP Flow — Development TODO

Items grouped by priority. Bugs are confirmed against the current source (`WIPflow.html`).
Last analysis: 2026-05-31 (full source review of all modules).

---

## ✅ Completed

### v1.5 (2026-05-31)

**I14 — Typography and rendering quality**
- Font switched to Inter across the entire UI; IBM Plex Mono retained only for code/monospace elements.
- Dashboard bar charts now scale by `window.devicePixelRatio` — sharp on HiDPI/Retina displays.
- Chart axis labels: 13 px Inter 400. Value labels: 13 px Inter 600. Gantt bar text: 11 px Inter 500.
- KPI card values: weight 300 → 500 for legibility on dark backgrounds.
- Card section titles: mono → Inter 600 at 14 px.
- Chart label colour uses `--text` for values, `--text-2` for axes — improved contrast.
- Bumped `APP_BASE_VERSION` to `1.5`.

### v1.4 (2026-05-31)

**I1 — View navigation no longer marks data dirty**
Removed `Storage.markDirty()` from `App.refresh()`. Added it to `TaskModal.save()`, `TaskModal.deleteTask()`, and `KanbanView.onDrop()` — the three actual mutation sites.

**I2 — Light theme semantic colours**
Added light-mode overrides for `--green/--yellow/--red/--orange/--purple` (and `-bg` variants) to `[data-theme="light"]`.

**I3 — End-date off-by-one fixed**
`calcEndDate` now counts the start date as day 1. A 1-workday task starting Monday ends Monday.

**I4 — Select option values HTML-escaped**
`escHtml(v)` applied to `value="..."` and content in `_populateSelect` (TaskModal) and all three `setOpts` helpers (TableView, KanbanView, GanttFilters).

**I6 — Deadline counter normalised to midnight**
`now.setHours(0,0,0,0)` before `daysBetween` in Dashboard — never off by one near midnight.

**I7 — `<head>` polish**
Added `<meta name="description">` and two `<meta name="theme-color">` tags (dark + light).

**I9 — Dashboard chart font sizes**
Y-axis labels 9 → 11 px, value labels 10 → 12 px, x-axis labels 9 → 11 px. Bottom padding widened.

**I10 — Logo size**
Sidebar logo enlarged from 40 → 48 px.

**I11 — Documentation rewrite**
Rewrote `CLAUDE.md` and `TODO.md` to minimise tables; replaced with bullets, numbered lists, code blocks, and ASCII diagrams. Added documentation-guidelines section to CLAUDE.md.

**I14 — Gantt resizable task panel**
Drag handle (`#gantt-resize-handle`) added between task list and chart area. `Gantt._initResizeHandle()` updates `LEFT_WIDTH` live on drag.

**I15 — Gantt task panel fixed on horizontal scroll**
Restructured body into `#gantt-body-outer` / `#gantt-task-panel` / `#gantt-body-wrap` so the task list is outside the horizontal scroll container and stays fixed. Vertical scroll is synced between panels.

### v1.3 (2026-05-31)

**T1 / T2 / 16 — Logo and layout**
- Sidebar logo switched to inlined SVG, enlarged 30 → 40 px.
- Help and About views centred at a shared max width.

**B1–B7 — Security and cleanup**
- HTML-escaping added for staff names, task names, tags, and toast messages.
- Filter labels corrected to "All Statuses" / "All Priorities".
- Dead CSS removed: `[readonly]`, `.badge-pending`, `'pending'` status mapping.

### v1.2 (2026-05-31)

**Bug fixes**
- Task modal toast: "Task created" vs "Task updated" — captured `wasEdit` before `close()`.
- Holiday additions now recalculate existing task end dates.
- Kanban: equal-height columns, 2-line card name clamp, empty state, theme-switch re-render, `onDrop` error toast.
- Gantt tooltip listener accumulation fixed (guard moved to `Gantt` object).
- End-date field changed from `readonly` to `disabled`.

**Features**
- Versioning: `APP_BASE_VERSION`, `saveVersion`, `WIPflow_v{MAJOR}.{MINOR}.{SAVE}.html` download name.
- Favicon and logo updated to WIP Flow branding.
- "Save as HTML" button added to sidebar footer.
- Dashboard first-run empty state.

---

## 🟠 Backlog

**I5 — CSV export is one-way**
`exportCSV` produces a file but there is no matching CSV import (only `.labwip` JSON). Either document as export-only or implement CSV import.

**I8 — Accessibility gaps**
- Modal has `role="dialog"` but no focus-trap.
- Nav items and Kanban drag-drop columns lack ARIA labels.
- Drag-and-drop has no keyboard fallback.

**I12 — Inline task edit in Table View**
Clicking a row opens the full modal. Direct cell editing for Status and Progress (the two most-changed fields at standups) would speed up daily updates — a small inline dropdown/number input triggered by clicking those cells.

**I13 — PDF / Excel export**
Can be prototyped without a build step:
- PDF via `window.print()` + `@media print` CSS.
- Excel via a lightweight CSV → XLSX conversion.

---

## Notes for maintainers

- Single file, no build. Edit `WIPflow.html`, reload browser (Firefox primary).
- After a fix: bump `APP_BASE_VERSION` MINOR, update in-app Help/About, update this file, commit.
- Escaping helper is `escHtml()` — use it for **all** user-derived content in template strings, including `<option value="...">` attributes.
