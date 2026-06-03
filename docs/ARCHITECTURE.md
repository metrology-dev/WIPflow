# WIP Flow — Architecture

WIP Flow is a single-file, offline-first HTML application. The entire application lives in `WIPflow.html` (~5 000 lines of inline HTML, CSS, and JavaScript). There is no build step, no package manager, and no transpilation.

---

## File Structure

```
WIPflow.html           # The entire application — HTML, CSS, and JS in one file
README.md              # User-facing documentation for GitHub
CLAUDE.md              # Architecture notes and conventions for AI-assisted development
TODO.md                # Backlog and completed change log
HANDOFF.md             # Context for handing off development across sessions
docs/
  ARCHITECTURE.md      # This file — module map and data flow reference
  DATA_SCHEMA.md       # Task and settings JSON schema reference
Icons/
  WIPFlow_logo_new_small.png   # App logo (embedded as base64 in WIPflow.html)
  WIPFlow_logo_new.svg         # Source SVG for the logo
```

---

## Internal Structure of WIPflow.html

The file is structured as three sections, in order:

```
<head>
  metadata, favicon, Inter + IBM Plex Mono font imports
<style>
  ~1 290 lines of CSS (CSS custom properties → layout → components → views)
<body>
  #sidebar
    #sidebar-logo
    #sidebar-scroll-area → nav#sidebar-nav (Views, Calendar, Manage)
    #sidebar-footer
  #main
    header#topbar
    #date-filter-bar   (hidden unless GlobalFilter.selectedDate is set)
    #view-area
      #view-dashboard
      #view-table
      #view-gantt
      #view-kanban
      #view-settings
      #view-help
      #view-about
<script>
  ~3 200 lines of JS — module object literals in dependency order
```

---

## JS Modules (declaration order)

Modules are plain object literals with underscore-prefixed private methods. Order matters — each module may reference modules declared above it.

| Module | Responsibility |
|--------|---------------|
| `DEFAULT_SETTINGS` | Constant seed values for labs, persons, priorities, statuses, tags, `saveVersion`, and calendar settings |
| `WorkCalendar` | Date arithmetic: `isWorkday`, `calcEndDate(startStr, workdays, allocPct)`, `fmt`, `parse`. Skips weekends and configured holidays |
| `AppState` | In-memory store: `tasks[]`, `settings{}`. CRUD via `saveTask`, `deleteTask`, `getTask`, `getFilteredTasks`. Serialised via `toJSON/fromJSON` |
| `GlobalFilter` | Runtime-only shared filter state: `selectedDate` (YYYY-MM-DD or null). `setDate` / `clearDate` trigger `SidebarCalendar.render()` and `App.refresh()`. Never persisted |
| `grp(plural)` | Helper function — reads `AppState.settings.groupSingular/groupPlural` and returns the correct label |
| `Storage` | Persistence: `save()`, `exportHTML()`, `exportFile()`, `exportCSV()`, `exportXLS()`, `markDirty()` (debounced 400 ms) |
| `App` | Lifecycle: `init()`, `refresh()`, `switchView(name)`, autosave timer |
| `TaskModal` | Create/edit task dialog |
| `Dashboard` | Canvas-based KPI cards and bar charts. Respects `GlobalFilter.selectedDate` |
| `TableView` | Sortable/filterable table. Merges `GlobalFilter.selectedDate` on every render |
| `KanbanView` | Kanban board with drag-and-drop. Respects `GlobalFilter.selectedDate` |
| `GanttFilters` | Filter state for the Gantt view |
| `Gantt` | Canvas timeline with zoom levels. Auto-scrolls and draws guide line when date filter is active |
| `Settings` | Settings page rendering and mutation handlers |
| `SidebarCalendar` | Sidebar calendar component with activity dots and date selection |
| `Toast` | Non-blocking notification toasts |
| `Report` | Print/export report dialog |

---

## Data Flow

### Save on mutation

```
user action (TaskModal.save / KanbanView.onDrop / TableView inline edit)
  └─► Storage.markDirty()          ← debounced 400 ms
        └─► Storage.save()
              ├─► localStorage.setItem(STORAGE_KEY, json)
              └─► <script id="labwip-embedded-data"> updated in DOM
```

Settings mutations (holiday add/remove, theme change, list edits) call `Storage.save()` directly for an immediate write.

### Portable export

```
Storage.exportHTML()
  ├─► AppState.settings.saveVersion++
  └─► downloads WIPflow_vMAJOR.MINOR.SAVE.html (self-contained with embedded data)
```

### View rendering

```
App.refresh()
  ├─► renders the active view (Dashboard / Table / Gantt / Kanban)
  └─► calls SidebarCalendar.render()

GlobalFilter.setDate(date) / GlobalFilter.clearDate()
  ├─► updates GlobalFilter.selectedDate
  ├─► calls SidebarCalendar.render()
  └─► calls App.refresh()           ← all views re-read the filter at render time
```

---

## Key Conventions

- **No classes** — all modules are plain object literals.
- **Canvas rendering** — Dashboard charts and Gantt draw directly to `<canvas>`; no virtual DOM.
- **Inline HTML** — views assign template-literal strings to `el.innerHTML`. Always escape user content with `escHtml()`.
- **`markDirty()` vs `save()`** — use `markDirty()` at mutation sites; `save()` only for immediate writes.
- **`GlobalFilter.selectedDate`** is runtime-only — never write to `AppState.settings` and never persist.
- **Holiday changes** — call `App.refresh()` after `Storage.save()` so all end dates recalculate.
- **Theme changes** — call `render()` for canvas-based views (Dashboard, Gantt) and `KanbanView.render()` in `Settings.setTheme()`.

---

## WorkCalendar End-Date Formula

```
calendarDays = ⌈ workdays ÷ (allocPct ÷ 100) ⌉
```

Starting from `startDate` (counted as day 1 if it is a workday), walk forward skipping weekends and any date in `AppState.settings.holidays` (array of `"YYYY-MM-DD"` or `"YYYY-MM-DD Name"` strings) until `calendarDays` workdays have been counted.

---

## Versioning

Format: `MAJOR.MINOR.SAVE`

- **MAJOR** — bump for breaking changes or significant new features.
- **MINOR** — bump for bug fixes and small improvements.
- **SAVE** — auto-incremented each time the user clicks **↓ Save as HTML**.

`APP_BASE_VERSION` is a constant near the top of the `<script>` section. `saveVersion` lives in `AppState.settings` and persists with the data.
