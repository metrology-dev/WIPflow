# LabWIP — Development TODO

Items grouped by priority. Bugs are confirmed against the current source.

---

## ✅ Completed (implemented 2026-05-31)

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
| 14 | Versioning | `APP_BASE_VERSION = '1.2'`, `saveVersion` in settings, `WIPflow_v{MAJOR}.{MINOR}.{SAVE}.html` download name |
| 15 | Embed icon pack as favicon + update logo to WIP Flow | Base64-embedded 16/32/128 px PNGs in `<head>`; sidebar logo uses 32 px icon; app renamed "WIP Flow" |

---

## 🟡 Future / backlog

*(no open items)*
