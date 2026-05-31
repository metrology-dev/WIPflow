# WIP Flow — Development TODO

Items grouped by priority. Bugs are confirmed against the current source (`WIPflow.html`).
Last analysis: 2026-05-31 (full source review of all modules).

---

## ✅ Completed

### v1.7 (2026-05-31)

**Bug: XLS export format warning**
Added `<?mso-application progid="Excel.Sheet"?>` processing instruction and UTF-8 BOM to the SpreadsheetML output. Excel no longer shows "file format and extension don't match" warning.

**Bug: Print/PDF export**
Replaced bare `window.print()` with a dialog that lets the user choose to include Dashboard (KPI & charts) and/or Gantt chart alongside the always-included task table. Prints in landscape (`@page { size: landscape }`). Print CSS updated to always show `#view-table`, show optional views via `body[data-print-dash/gantt]` data attributes, and properly format the table with correct column widths.

**Bug: Gantt chart UI alignment**
Fixed the 5 px offset between the timeline header and the chart canvas caused by the resize handle not being accounted for in the header width. `gantt-left-header` now has width = `LEFT_WIDTH + 5` (handle width), kept in sync during drag-resize. All four DOM edges (header right, timeline left, body-wrap left, panel+handle right) are now pixel-perfect equal.

**UI: Dashboard proportional chart widths**
Status Distribution / By Priority / By Laboratory chart columns are now dynamically sized proportional to their bar counts (e.g. 5 bars : 4 bars : 3 bars → 42% : 33% : 25%). `_redrawCharts()` sets `gridTemplateColumns` via JS with a forced layout reflow before drawing.

**UI: Gantt Year zoom fills available area**
Year zoom now computes `pixelsPerDay` dynamically so the chart fills the visible width. Month labels are skipped when the column width is below 48 px to prevent overlap.

**UI: Kanban Board layout**
Kanban columns changed from fixed `width: 260px; flex-shrink: 0` to `flex: 1 1 220px; min-width: 200px` — columns grow to fill the full available horizontal area.

**UI: Help & About card widths**
`doc-grid` changed from 2-column to 1-column layout; `grid-column: 1` constraint removed. All cards now span the full content width (up to 1100 px max).

### v1.6 (2026-05-31)

**I5 — CSV export documented as one-way**
CSV export button tooltip and Help text now state that CSV is export-only; re-import requires the `.labwip` format.

**I8 — Accessibility**
- Modal: Tab key trapped within the dialog; Escape closes it.
- Nav: `aria-current="page"` tracks the active view; all nav buttons have `aria-label`; `role="separator"` on dividers.
- Kanban: columns are `role="region"` with count-aware labels; card lists are `role="list"`; cards are `role="listitem"` with task name in `aria-label`; each card has a "Move to…" status `<select>` as a keyboard-accessible drag alternative.
- Decorative icons marked `aria-hidden="true"` throughout.

**I12 — Inline task editing in Table View**
- Click any Status cell to replace it with a `<select>` showing all statuses — change saves immediately, Escape cancels.
- Click any Progress cell to replace it with a number input — Enter or blur saves, Escape cancels.
- Both cells show a hover highlight (`.td-inline-edit`); row click still opens the full modal for all other cells.

**I13 — PDF and Excel export**
- Export Excel (.xls): SpreadsheetML XML, opens in Excel and LibreOffice Calc; numeric columns use `ss:Type="Number"`.
- Print / Save as PDF: `window.print()` with `@media print` CSS that hides sidebar, topbar, filters, and buttons and lays out the active view cleanly.
- Both options added to Settings → Data Management.

### v1.5 (2026-05-31)

**I14 — Typography and rendering quality**
- Font switched to Inter across the entire UI; IBM Plex Mono retained only for code/monospace elements.
- Dashboard bar charts now scale by `window.devicePixelRatio` — sharp on HiDPI/Retina displays.
- Chart axis labels: 13 px Inter 400. Value labels: 13 px Inter 600. Gantt bar text: 11 px Inter 500.
- KPI card values: weight 300 → 500 for legibility on dark backgrounds.
- Card section titles: mono → Inter 600 at 14 px.
- Chart label colour uses `--text` for values, `--text-2` for axes — improved contrast.

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

## ToDo

No open items at this time. Add new backlog entries here as they are identified.

---
## Notes for maintainers

- Single file, no build. Edit `WIPflow.html`, reload browser (Firefox primary).
- After a fix: bump `APP_BASE_VERSION` MINOR, update in-app Help/About, update this file, commit.
- Escaping helper is `escHtml()` — use it for **all** user-derived content in template strings, including `<option value="...">` attributes.
