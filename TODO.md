# WIP Flow — Development TODO

Items grouped by priority. Bugs are confirmed against the current source (`WIPflow.html`).
Last analysis: 2026-05-31 (full source review of all modules).

---

## ✅ Completed

### v1.3 (2026-05-31)
| # | Item | Fix applied |
|---|------|-------------|
| 16 | Sidebar logo too small / not clearly visible | Enlarged logo `<img>` from 30→40 px, bumped `border-radius` to 8 px. `APP_BASE_VERSION` → `1.3`; Help/About version placeholders → 1.3.0; About changelog entry added. |
| B1 | User content not HTML-escaped on Dashboard | `escHtml()` added to staff-workload `${name}` (line ~2828) and upcoming-deadline `${t.name}` (line ~2853). |
| B2 | Table tags not escaped | `escHtml(tag.trim())` in `TableView.render()` (line ~3065). |
| B3 | Toast messages use raw `innerHTML` | `escHtml(msg)` in `Toast.show()` (line ~2418). |
| B4 | Filter placeholder labels mismatch | JS labels corrected to "All Statuses"/"All Priorities" in `TableView.populateFilters()` and `GanttFilters.populate()` (lines ~3009-3010, ~3242). |
| B5 | Dead `.logo-icon` class never applied | Added `class="logo-icon"` to sidebar `<img>` (line ~1222), wiring up the existing rule. |
| B6 | Dead `.form-control[readonly]` CSS | Replaced with `.form-control:disabled` (line 370) to match the now-`disabled` end-date field. |
| B7 | `statusBadgeClass` maps non-existent `pending` status | Removed `'pending':'badge-pending'` from the map and the unused `.badge-pending` CSS rule. |
| T1 | Replace favicon + logo with the IconPack SVG | `IconPack/WIPFlow_logo.svg` inlined as a `data:image/svg+xml;base64` URI: new `<link rel="icon" type="image/svg+xml">` (PNG links retained as fallback) and sidebar `<img>` src. About hero inherits it via the existing `src`-copy in `switchView('about')`. Inlined so it survives `Storage.exportHTML()`. |
| T2 | Make Help and About the same width | `.doc-grid` already had `max-width:1100px` but was left-aligned; added `width:100%; margin:0 auto;` so both views render at an identical centred width. |

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

| # | Item | Detail |
|---|------|--------|
| I1 | **Every view switch marks data dirty** | `App.refresh()` always calls `Storage.markDirty()`, even when only navigating (no mutation). This flips the indicator "Unsaved → Saved" and triggers a debounced `localStorage` write on every view change. Consider calling `markDirty()` only from actual mutations, not from pure re-renders. |
| I2 | **Light theme leaves semantic colours dark** | `[data-theme="light"]` overrides bg/text/accent/shadow but **not** `--green/--yellow/--red/--orange/--purple` (or their `-bg` variants). These dark-tuned colours are reused on the light background (badges, KPI accents, charts). Add light-mode values for contrast. |
| I3 | **End-date off-by-one worth verifying** | `WorkCalendar.calcEndDate` advances *before* checking, so a 1-workday/100% task starting Monday ends **Tuesday**, not Monday. If "1 workday" should finish the same day, subtract one step. Confirm intended semantics and align Help text. |
| I4 | **Select option values not escaped** | `TaskModal._populateSelect`, `TableView/Gantt/Kanban setOpts` build `<option value="${v}">` from settings lists. A lab/person/tag containing `"` would break the attribute. Escape values. |
| I5 | **CSV export/import asymmetry** | `exportCSV` writes an `alloc` column header but the field is stored as `alloc`; re-importing CSV is not supported at all (only `.labwip` JSON imports). Document as one-way, or add CSV import. |
| I6 | **Deadline "(Xd)" can be off by one** | `daysBetween(now, endDate)` mixes current wall-clock time with a midnight date; rounding can show one day off near midnight. Normalise `now` to midnight before diffing. |
| I7 | **`<head>` polish** | No `<meta name="description">` or `<meta name="theme-color">`. Minor SEO/PWA niceties. (Favicon now SVG + PNG fallback — done in T1.) |
| I8 | **Accessibility** | Modal/dialog has `role="dialog"` but no focus-trap; nav items and drag-drop columns lack ARIA labels/keyboard alternatives. Drag-and-drop has no keyboard fallback. |

---

## Notes for maintainers
- Single file, no build. Edit `WIPflow.html`, reload browser (Firefox primary).
- After a fix: bump `APP_BASE_VERSION` MINOR, update in-app Help/About, update this file, commit.
- Escaping helper is `escHtml()` — use it for **all** user-derived content in template strings.
