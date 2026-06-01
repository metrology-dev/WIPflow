# WIP Flow — Agent Handoff

**Branch:** `feature/calendar-sidebar`
**Version:** 2.1 (awaiting merge to `master`)
**Date:** 2026-06-02
**Status:** Implemented, verified in browser preview, awaiting user review and merge approval.

---

## What was done

Implemented the Calendar Sidebar feature from the v2.1 specification in `TODO.md`. All changes are in a single file (`WIPflow.html`) plus documentation updates (`CLAUDE.md`, `TODO.md`).

### New modules added

- **`GlobalFilter`** (declared between `grp` helper and `Storage`): runtime-only date filter state. `selectedDate` is YYYY-MM-DD or null. `setDate(date)` toggles; `clearDate()` resets. Calls `SidebarCalendar.render()` and `App.refresh()`. Not persisted.
- **`SidebarCalendar`** (declared after `Settings`, before the window resize handler): sidebar calendar component. State: `_year`, `_month` (current display month), `_collapsed`. `init()` seeds current month and renders; `render()` redraws the calendar grid; `navigate(delta)` steps months; `selectDate(dateStr)` delegates to `GlobalFilter.setDate()`.

### HTML additions

- `#sidebar-scroll-area` wrapper: wraps `#sidebar-nav` and `#sidebar-calendar-section` in a `flex:1; overflow-y:auto` container so both scroll together while logo and footer stay fixed.
- `#sidebar-calendar-section`: below the nav in the sidebar, with a collapsible header (`SidebarCalendar.toggleCollapse()`) and calendar container `#sidebar-calendar`.
- `#date-filter-bar`: a flex div between `<header id="topbar">` and `<div id="view-area">`. Hidden by CSS (`display:none`); shown as `display:flex` when `GlobalFilter.selectedDate` is non-null. Contains the date chip and a Clear button.
- Calendar Settings card added to Settings view (below Group Terminology, above Data Management).

### CSS additions (all in the sidebar CSS area)

- `#sidebar-scroll-area`, `#sidebar-nav` (override to `flex:0 0 auto`)
- `#sidebar-calendar-section`, `.cal-section-header`
- `#sidebar-calendar`, `.cal-nav`, `.cal-month-title`, `.cal-nav-btn`, `.cal-today-btn`
- `.cal-grid`, `.cal-hdr`, `.cal-wk`, `.cal-day`, `.cal-day-num`
- `.cal-day-today`, `.cal-day-selected`, `.cal-day-outside`
- `.cal-day-dots`, `.cal-dot`, `.cal-dot-active`, `.cal-dot-overdue`, `.cal-dot-planned`
- `#date-filter-bar`, `.date-filter-chip`

### Modified existing modules

- **`DEFAULT_SETTINGS`**: added `calendarWeekNumbering: 'iso'`, `calendarFirstDay: 'mon'`, `calendarShowOutsideDays: true`.
- **`AppState.getFilteredTasks`**: added `filters.selectedDate` branch — filters tasks where `startDate <= date <= endDate`.
- **`App.init()`**: calls `SidebarCalendar.init()` after `Dashboard.initResizeObserver()`.
- **`App.refresh()`**: calls `SidebarCalendar.render()` after view refresh (updates dots when task data changes).
- **`Dashboard.render()`**: applies `GlobalFilter.selectedDate` before computing all KPIs and charts; shows a date-aware empty state when filtered list is empty.
- **`TableView.render()`**: merges `GlobalFilter.selectedDate` into filters on every render call.
- **`KanbanView._getFilteredTasks()`**: applies `GlobalFilter.selectedDate` after lab/person filters.
- **`Gantt._getFilteredTasks()`**: applies `GlobalFilter.selectedDate` after standard filters.
- **`Gantt.render()`**: after `_drawBars()`, if a date is selected, `requestAnimationFrame`-scrolls to that date position.
- **`Gantt._drawBars()`**: draws an accent-coloured dashed vertical guide line at the selected date position.
- **`Settings.render()`**: populates the three calendar settings inputs from `AppState.settings`.
- **`Settings`**: new method `saveCalendarSettings()` — reads the three inputs, saves to `AppState.settings`, calls `Storage.save()` and `SidebarCalendar.render()`.

### Documentation

- `TODO.md`: replaced full spec with concise completed entry under v2.1; added notes about `GlobalFilter` and `SidebarCalendar` to Notes for maintainers.
- `CLAUDE.md`: updated module list, file size estimate (~4 600 lines), added `GlobalFilter` and `SidebarCalendar` entries, added `GlobalFilter` convention note.
- Help view (`#view-help`): added "Calendar Sidebar" card explaining dots, filtering, navigation, and settings.
- About view (`#view-about`): added v2.1 changelog entry at the top.

---

## Verification done

- Calendar renders with correct week numbers (ISO 8601, Monday-first) and all 35 cells for June 2026.
- Clicking a date (e.g. 2026-06-05) sets `GlobalFilter.selectedDate`, shows the filter bar with "5 June 2026", filters Dashboard KPIs to 8 tasks (correct count verified), and visually selects the day.
- Clearing via `GlobalFilter.clearDate()` resets to null, hides the bar, and restores 18 total tasks.
- Calendar Settings inputs render with correct defaults (iso / mon).
- No JS errors in browser console.

---

## Pending / out of scope

The following items from the original spec were deliberately deferred:

- **"Open Task List" click action** (Settings → Calendar → Click Action): not implemented — current action is always "Filter Tasks".
- **Week view / agenda view**: future; `SidebarCalendar` is structured so a `_renderWeekView()` can be added alongside `render()`.
- **Multi-day / date-range selection**: `GlobalFilter` currently holds a single `selectedDate`; extend to `{startDate, endDate}` to support ranges.
- **Task creation from calendar**: no `+` button on day cells.

---

## Architecture notes for future agents

- `GlobalFilter` is declared between `grp` and `Storage` in the JS. `SidebarCalendar` is declared last (after `Settings`) because it depends on `GlobalFilter` and all view modules.
- The sidebar layout change required an override CSS rule for `#sidebar-nav { flex: 0 0 auto }` after the original `#sidebar-nav { flex: 1 }` rule. Both are in the CSS; the later rule wins.
- `SidebarCalendar.render()` is lightweight — it rebuilds only the calendar grid HTML. Calling it on every `App.refresh()` is intentional and has negligible cost.
- The filter logic `startDate <= date <= endDate` is applied in four places: `AppState.getFilteredTasks`, `KanbanView._getFilteredTasks`, `Gantt._getFilteredTasks`, and `Dashboard.render`. New views must follow the same pattern.
