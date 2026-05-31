# WIP Flow — Development TODO

Items grouped by priority. Bugs are confirmed against the current source (`WIPflow.html`).
Last analysis: 2026-05-31 (full source review of all modules).

---

## ✅ Completed

### v1.4 (2026-05-31)

| # | Item | Fix applied |
|---|------|-------------|
| I1 | Every view switch marks data dirty | Removed `Storage.markDirty()` from `App.refresh()`. Added it directly to `TaskModal.save()`, `TaskModal.deleteTask()`, and `KanbanView.onDrop()` — the three actual mutation sites. |
| I2 | Light theme leaves semantic colours dark | Added light-mode overrides for `--green/--yellow/--red/--orange/--purple` (and `-bg` variants) to `[data-theme="light"]`. |
| I3 | End-date off-by-one | `calcEndDate` now counts the start date as day 1. A 1-workday task starting Monday now ends Monday. |
| I4 | Select option values not escaped | `escHtml(v)` applied to `value="..."` and content in `_populateSelect` (TaskModal), and all three `setOpts` helpers (TableView, KanbanView, GanttFilters). |
| I6 | Deadline "(Xd)" off by one near midnight | `now` normalised to midnight (`now.setHours(0,0,0,0)`) before `daysBetween` in Dashboard. |
| I7 | `<head>` polish | Added `<meta name="description">` and two `<meta name="theme-color">` tags (dark + light). |
| I9 | Fonts and readability — Dashboard charts | Y-axis labels 9 → 11 px, value labels 10 → 12 px, x-axis labels 9 → 11 px. Bottom padding widened. |
| I10 | Logo visibility | Sidebar logo enlarged from 40 → 48 px. |
| I11 | Documentation | Rewrote `CLAUDE.md` and `TODO.md` to minimise tables; replaced with bullets, numbered lists, code blocks, and ASCII diagrams. Added documentation-guidelines section to CLAUDE.md. |
| I14 | Gantt: resizable task panel | Drag handle (`#gantt-resize-handle`) added between task list and chart area. `Gantt._initResizeHandle()` updates `LEFT_WIDTH` live on drag. |
| I15 | Gantt: task panel scrolls away horizontally | `#gantt-task-list` and `#gantt-resize-handle` now `position: sticky; left: 0; z-index: 2`. |

### v1.3 (2026-05-31)

| # | Item | Fix applied |
|---|------|-------------|
| 16 | Sidebar logo too small / not clearly visible | Enlarged logo `<img>` from 30→40 px, bumped `border-radius` to 8 px. `APP_BASE_VERSION` → `1.3`; Help/About version placeholders → 1.3.0; About changelog entry added. |
| B1 | User content not HTML-escaped on Dashboard | `escHtml()` added to staff-workload `${name}` and upcoming-deadline `${t.name}`. |
| B2 | Table tags not escaped | `escHtml(tag.trim())` in `TableView.render()`. |
| B3 | Toast messages use raw `innerHTML` | `escHtml(msg)` in `Toast.show()`. |
| B4 | Filter placeholder labels mismatch | JS labels corrected to "All Statuses"/"All Priorities" in `TableView.populateFilters()` and `GanttFilters.populate()`. |
| B5 | Dead `.logo-icon` class never applied | Added `class="logo-icon"` to sidebar `<img>`. |
| B6 | Dead `.form-control[readonly]` CSS | Replaced with `.form-control:disabled`. |
| B7 | `statusBadgeClass` maps non-existent `pending` status | Removed `'pending':'badge-pending'` and the unused `.badge-pending` CSS rule. |
| T1 | Replace favicon + logo with the IconPack SVG | `IconPack/WIPFlow_logo.svg` inlined as a `data:image/svg+xml;base64` URI. |
| T2 | Make Help and About the same width | Added `width:100%; margin:0 auto;` to `.doc-grid`. |

### v1.2 (implemented 2026-05-31)

| # | Item | Fix applied |
|---|------|-------------|
| 1 | Task modal toast always shows "Task created" | Capture `wasEdit` before `close()` |
| 3 | Holiday additions do not recalculate existing task end dates | Added `App.refresh()` after `Storage.save()` in `addHoliday()` and `importHolidaysCSV()` |
| 4 | Kanban: equal-height columns | `.kanban-board { align-items: stretch }` + `.kanban-col { min-height: 100% }` |
| 5 | Kanban: long task names overflow card | 2-line `-webkit-line-clamp` on `.kc-name` |
| 6 | Theme switch does not re-render Kanban | Added `KanbanView.render()` in `setTheme()` |
| 7 | Calculated end date field uses `readonly` | Changed to `disabled` |
| 8 | Gantt sidebar task names clip without ellipsis | Already present in CSS |
| 9 | Kanban board missing empty state | Added "No tasks" message + New Task button |
| 10 | Gantt tooltip event listeners accumulate | Moved `_tooltipBound` guard from canvas element to `Gantt` object |
| 11 | Add "Save as HTML" to sidebar footer | Persistent button added below autosave indicator |
| 12 | Dashboard: first-run empty state | "Create your first task" prompt when `tasks.length === 0` |
| 13 | Kanban `onDrop` silent failure on invalid drag source | Added error toast for null task |
| 14 | Versioning | `APP_BASE_VERSION`, `saveVersion` in settings, `WIPflow_v{MAJOR}.{MINOR}.{SAVE}.html` download name |
| 15 | Embed icon pack as favicon + update logo to WIP Flow | Base64-embedded 16/32/128 px PNGs in `<head>`; sidebar logo uses 32 px icon; app renamed "WIP Flow" |

---

## 🟠 Improvements / inconsistencies

**I5 — CSV export/import asymmetry**

`exportCSV` writes an `alloc` column but re-importing CSV is not supported (only `.labwip` JSON imports). Either document as one-way or add CSV import.

**I8 — Accessibility**

Modal has `role="dialog"` but no focus-trap. Nav items and drag-drop columns lack ARIA labels and keyboard alternatives. Drag-and-drop has no keyboard fallback.

**I12 — Inline task edit in Table View**

Clicking a row opens the full modal. Direct cell editing for Status and Progress (the two fields changed most often at standups) would speed up daily updates. Could use a small inline dropdown/number input triggered by clicking those cells.

**I13 — PDF / Excel export**

Can be prototyped without a build step:
- PDF: `window.print()` + `@media print` CSS
- Excel: lightweight CSV → XLSX conversion

---

## Notes for maintainers

- Single file, no build. Edit `WIPflow.html`, reload browser (Firefox primary).
- After a fix: bump `APP_BASE_VERSION` MINOR, update in-app Help/About, update this file, commit.
- Escaping helper is `escHtml()` — use it for **all** user-derived content in template strings, including `<option value="...">` attributes.
