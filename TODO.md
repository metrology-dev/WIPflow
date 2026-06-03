# WIP Flow — Development TODO

Items grouped by priority. Bugs are confirmed against the current source (`WIPflow.html`).
Last analysis: 2026-06-03 (v2.2 shipped — logo + Settings refactor). Master is clean.

---

## ToDo

*(No open items.)*

---

## ✅ Completed

### v2.2 (2026-06-03)

**Logo update**

- App logo replaced with new WIP Flow branding (`Icons/WIPFlow_logo_new_small.png` embedded as base64)
- Updated across: favicon, sidebar logo (48 × 48 px), and About page hero
- Removed old SVG base64 logo

**Settings page layout refactoring**

- `.settings-grid` changed from a two-column CSS grid to a vertically stacked flex column with `max-width: 900px` and `margin: 0 auto` — matches the single-column `.doc-grid` pattern used by Help/About
- Removed the nested `<div style="display:flex;flex-direction:column">` wrapper that grouped the right-hand column cards; all cards are now direct children of `.settings-grid`
- Added subtitle descriptions to each list-management card (Groups, Persons, Priority Levels, Task Statuses, Tags, Holiday Calendar)
- Removed `grid-column: 1 / -1` span from Holiday Calendar (no longer needed in single-column layout)
- No changes to business logic, state management, or any existing CSS component styles

**GitHub preparation**

- Added `.gitignore` covering export artefacts (`.labwip`, `.csv`), temp files, OS files, and editor files
- Added `docs/ARCHITECTURE.md` — module map, data flow diagrams, and key conventions
- Added `docs/DATA_SCHEMA.md` — full JSON schema reference for tasks and settings

---

### v2.1 (2026-06-02)

**Calendar Sidebar and global date filtering**

- Calendar Sidebar: compact month calendar in the left sidebar below the navigation menu; shows month/year header, ‹/›/Today navigation, ISO 8601 and US-style week numbers, weekday headers, and task activity dots beneath each day
- Activity dots: up to 3 dots per day — red (Blocked/Overdue), green (Active/On Hold), outline (Not Started); Completed tasks show no dots; hover tooltip shows exact counts per category
- Global date filter (`GlobalFilter` module): clicking a day sets `selectedDate`; clicking the same day again clears it; a banner below the topbar shows the active date and a Clear button
- Filtering: all views (Dashboard, Table, Gantt, Kanban) respect `GlobalFilter.selectedDate` — filter logic: `task.startDate <= date <= task.endDate`
- Gantt: when date filter is active, timeline auto-scrolls to the selected date and draws an accent-coloured dashed guide line
- Dashboard: KPI cards and charts recalculate using the date-filtered task set; clear empty state message when no tasks match
- Calendar is collapsible via the section header to reclaim vertical space
- Settings → Calendar: week numbering (ISO 8601 / US), first day of week (Monday / Sunday), show/hide adjacent-month days
- New state: `GlobalFilter.selectedDate` (runtime only, not persisted)
- New settings keys: `calendarWeekNumbering`, `calendarFirstDay`, `calendarShowOutsideDays`
- New modules: `GlobalFilter`, `SidebarCalendar`

### v2.0 (2026-06-01)

**Grouping concept, Report Printing, TODO restructuring**

- Grouping concept: "Laboratories" replaced with a configurable group terminology throughout the UI; `groupSingular`/`groupPlural` added to `DEFAULT_SETTINGS` (defaults: Group/Groups); new `grp(plural)` helper reads from `AppState.settings` at call time; Settings → Group Terminology card lets users rename to Department, Team, Project, etc.; all filter dropdowns, chart titles, modal labels, and card headers update immediately on save; internal data fields (`task.lab`, `settings.labs`, `f-lab`) preserved unchanged for backwards compatibility
- Report Printing: replaced `Storage.printPDF()` with a new `Report` module; dialog offers section selection (Cover, Statistics, Dashboard KPIs, Charts, Workload, Task Table, Open Tasks, Completed Tasks, Gantt), paper size (A4/Letter), orientation (Portrait/Landscape), and date/title toggles; canvas sections (charts, Gantt) are captured as data-URL images and embedded in a dedicated `#print-report-container` div; Preview button shows full-screen preview before committing to print; `body.printing-report` class hides `#app` and reveals the container at `@media print`; `.rpt-*` CSS classes live outside the media query so they also apply to the preview overlay
- TODO restructuring: section order changed to Title → ToDo → Completed → Notes for maintainers

### v1.9 (2026-06-01)

**Keyboard shortcuts and responsive charts**

- Task modal: Enter key in any input field saves and closes the modal; Ctrl+Enter (Cmd+Enter on Mac) saves from a textarea without disrupting normal line breaks; event listeners are added in `_trapFocus()` and removed in `_releaseFocus()` — no leaks after close
- Dashboard: Status Distribution / By Priority / By Laboratory chart row changed from CSS Grid to Flexbox (`flex-wrap: wrap`) with per-card `flex` grow weights set proportionally to bar counts — charts wrap onto new rows on medium screens and stack vertically on narrow screens; proportional sizing is preserved

### v1.8 (2026-05-31)

**Design system modernization**

- Color system: refined dark-mode palette — more vibrant semantic colors (green `#3fb950`, red `#f85149`, purple `#a371f7`), deeper shadows, and improved bg-4/border separation for clearer surface layering
- Accessibility: dark-mode `--text-3` lifted to `#768390` (~4.5:1 contrast on dark bg); light-mode `--text-3` improved to `#636b75` (~5.4:1 on white) — both WCAG AA compliant for small text
- Badge borders replaced hard-coded RGBA values with semantic CSS custom properties (`--badge-border-*`) — consistent theming across both modes
- Typography: removed `font-family: var(--mono)` from non-code UI labels (form labels, table column headers, Gantt task-panel header, nav section labels, Kanban column titles); normalised 13.5 px → 14 px body copy
- Charts: `PRIORITY_COLORS` and `STATUS_COLORS` changed to CSS variable strings (`var(--red)` etc.) resolved at render time — Gantt bars, dot indicators, and bar charts all use theme-correct colours
- Gantt canvas: holiday and today-marker colours now read `--orange` / `--orange-bg` CSS variables; top-level `resolveColor()` helper added for safe canvas CSS-var resolution

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

## Notes for maintainers

- Single file, no build. Edit `WIPflow.html`, reload browser (Firefox primary).
- After a fix: bump `APP_BASE_VERSION` MINOR, update in-app Help/About, update this file, commit.
- Escaping helper is `escHtml()` — use it for **all** user-derived content in template strings, including `<option value="...">` attributes.
- Internal field names (`task.lab`, `settings.labs`, `f-lab`, `chart-lab`) are intentionally kept as "lab" for backwards compatibility; only user-facing labels are driven by `grp()`.
- `Report` module: add new sections to `Report.SECTIONS` array and handle them in `Report._render()`; canvas sections require the corresponding view to be pre-rendered in `Report._run()`.
- `GlobalFilter.selectedDate` is runtime-only state (not persisted to localStorage or embedded data). Calendar display settings (`calendarWeekNumbering`, `calendarFirstDay`, `calendarShowOutsideDays`) are persisted in `AppState.settings`.
- `SidebarCalendar` depends on `GlobalFilter` being declared first; `GlobalFilter._apply()` calls `SidebarCalendar.render()` and `App.refresh()` — both must be defined before first use (they are, since `App.init()` runs after all module declarations).
