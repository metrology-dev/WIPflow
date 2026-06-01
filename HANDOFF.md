# WIP Flow — Agent Handoff

**Branch:** `master`
**Version:** 2.1
**Date:** 2026-06-02
**Status:** Shipped and merged.

---

## Current state

WIP Flow is a single-file offline-first HTML app (`WIPflow.html`). All code is inline — no build step. Open directly in a browser (Firefox primary) to run.

The app is on version **2.1**. All planned work from `TODO.md` is complete. There are no open bugs or pending items.

---

## What shipped in v2.1

Calendar Sidebar with global date filtering. Full details in `TODO.md` (Completed → v2.1).

Key architectural additions:

- **`GlobalFilter`** — runtime-only shared filter state (`selectedDate: YYYY-MM-DD | null`). All views read it on render. Not persisted. Declared between `grp` helper and `Storage`.
- **`SidebarCalendar`** — sidebar calendar component. Declared after `Settings`. Depends on `GlobalFilter` and all view modules.
- **`#sidebar-calendar-section`** — inside `<nav>`, directly after the Kanban button, separated from Views by a `<div class="divider">` and from Manage by another.
- **`#date-filter-bar`** — between `<header id="topbar">` and `<div id="view-area">`. Hidden by CSS; shown as `flex` when `GlobalFilter.selectedDate` is set.
- **Settings → Calendar** card — week numbering, first day of week, show outside days.

Day highlight design:
- **Today**: bold `--accent` text (no background)
- **Selected**: `--accent-2` inset border square (no fill), hover covers the full cell including dots

---

## Architecture quick-reference

```
WIPflow.html (~4 600 lines)
│
├── CSS (lines ~10–1290)
├── HTML (lines ~1290–1940)
│   ├── #sidebar
│   │   ├── #sidebar-logo
│   │   ├── #sidebar-scroll-area
│   │   │   └── nav#sidebar-nav
│   │   │       ├── Views buttons
│   │   │       ├── [divider]
│   │   │       ├── #sidebar-calendar-section
│   │   │       ├── [divider]
│   │   │       └── Manage / Support buttons
│   │   └── #sidebar-footer
│   └── #main
│       ├── header#topbar
│       ├── #date-filter-bar
│       └── #view-area  (dashboard / table / gantt / kanban / settings / help / about)
│
└── JS (lines ~1940–end)
    ├── DEFAULT_SETTINGS
    ├── WorkCalendar
    ├── AppState          getFilteredTasks supports filters.selectedDate
    ├── GlobalFilter      NEW — shared date filter state
    ├── grp()
    ├── Storage
    ├── App
    ├── TaskModal
    ├── Dashboard         filters tasks by GlobalFilter.selectedDate
    ├── TableView         merges GlobalFilter.selectedDate on every render
    ├── KanbanView        applies GlobalFilter.selectedDate in _getFilteredTasks
    ├── GanttFilters
    ├── Gantt             applies filter, scrolls to date, draws guide line
    ├── Settings          renders calendar settings; saveCalendarSettings()
    ├── SidebarCalendar   NEW — renders sidebar calendar
    ├── Toast
    └── Report
```

---

## Conventions to know

- `escHtml()` — use for **all** user content in template strings, including `value="..."` attributes.
- `Storage.markDirty()` — at mutation sites (debounced 400 ms). `Storage.save()` only for immediate writes.
- `GlobalFilter` state is runtime-only — never write it to `AppState.settings`.
- After any fix: bump `APP_BASE_VERSION` MINOR, update Help/About in-app views, update `TODO.md`, commit.
- Stage only `WIPflow.html` and intentionally changed markdown files. Never commit `.labwip`, CSV, or temp files.

---

## If you pick this up next

There are no open TODO items. Possible future directions (all deferred from the v2.1 spec):

- Calendar click action: "Open Task List" mode (currently only "Filter Tasks")
- Date range / multi-day selection (extend `GlobalFilter` to `{startDate, endDate}`)
- Task creation from calendar (wire `SidebarCalendar.selectDate` to open `TaskModal` with a pre-filled date)
- Week view / agenda view in the sidebar calendar
