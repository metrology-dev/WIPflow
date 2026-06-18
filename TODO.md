# WIP Flow — Development TODO

Items grouped by priority. Bugs are confirmed against the current source (`WIPflow.html`).
Last analysis: 2026-06-07 (v2.5 shipped — Automated testing infrastructure). Master is clean.

---

## ToDo

No open items. Possible future directions:

- Settings: "Clear browser localStorage backup" button for migrated users who want to clean up
- Settings: Show `tasks.json` file path or last-saved timestamp
- Conflict resolution when external changes are detected (merge instead of replace)
- Calendar click: "Open Task List" mode, task creation from calendar, date range selection
- Week / agenda view in the sidebar calendar
- Status color: add a `color` field to status objects; user-configurable colors per status
- E2E tests: add Firefox project to Playwright config once selector compatibility is verified
- Adopt Material Design 3 (MD3) as the system-wide design language — typography/fonts, color tokens, component styles (buttons, inputs, cards, dialogs), and elevation/shape conventions, applied consistently across all views (Dashboard, Table, Gantt, Kanban, Settings, Help, About)

---

## ✅ Completed (recent — full history below)

### v2.5 (2026-06-07)

**Automated testing infrastructure**

- Node.js + Vitest + Playwright added as dev dependencies (`package.json`)
- `tests/setup/wipflow-env.js`: vm-based loader that extracts the main `<script>` from `WIPflow.html`, transforms top-level `const`/`let` to `var` so they become vm context properties, and exposes all modules on `globalThis` — tests run against production code with no duplication and no separate build step
- 108 unit and integration tests across 4 test files:
  - `tests/unit/work-calendar.test.js`: `isWorkday`, `addDays`, `fmt`, `parse`, `daysBetween`, `calcEndDate` (weekends, holidays, allocation %), `nextWorkday`
  - `tests/unit/app-state.test.js`: task CRUD (`saveTask`, `deleteTask`, `getTask`), serialisation round-trip, `getFilteredTasks` (search, lab, person, status, priority, selectedDate, sorting)
  - `tests/unit/migration.test.js`: `migrateStatusCategory` (case-insensitive, unknown → `none`), `ACTIVITY_CATEGORIES` shape, `fromJSON` migration for string statuses, partial objects, invalid categories, mixed arrays
  - `tests/integration/fixtures.test.js`: loads all three fixture files, verifies migration correctness, data integrity, filter completeness, and save/load round-trips
- 25 Playwright E2E tests across 4 spec files:
  - `task-management.spec.js`: create, edit, delete tasks; Escape to cancel; end-date auto-calculation
  - `settings.spec.js`: view navigation, theme switching, status list with activity category dropdowns
  - `calendar-filter.spec.js`: sidebar calendar rendering, prev/next/today navigation, date filter activation and clearing, task count reduction
  - `persistence.spec.js`: task survives localStorage reload
- `tests/fixtures/golden-project.wipflow`: 143 realistic tasks across 12 labs, 8 priorities, 12 statuses, 5 persons — all activity categories represented; past/present/future date coverage; every filter combination returns results
- `tests/fixtures/legacy-v1.wipflow`: v1.x format with plain string statuses — verifies full migration path
- `tests/fixtures/legacy-v2.wipflow`: v2.x format with partial/invalid object statuses — verifies partial migration path
- Run commands: `npm test` (unit + integration, ~300 ms), `npm run test:e2e` (E2E, ~30 s), `npm run test:all` (both)

---

## ✅ Completed (earlier history)

### WIPflow Testing Framework and Continuous Verification

##### Objective

Implement a comprehensive automated testing strategy for WIPflow that ensures future changes can be verified quickly, consistently, and with high confidence.

The primary goals are:

* Prevent regressions.
* Detect breaking changes early.
* Improve reliability of AI-assisted development.
* Make future feature additions safer.
* Provide confidence before every commit and release.
* Ensure all critical workflows continue working after code changes.

---

##### Development Philosophy

From this point forward:

1. Every new feature must include tests.
2. Every bug fix must include a regression test.
3. Every code change must execute the test suite.
4. Tests are part of the application and must be maintained alongside production code.
5. Changes are not considered complete until tests pass.

Testing is not an optional activity.

Testing is a required part of implementation.

---

##### Analyze Existing Project

First analyze the current codebase and determine:

* Framework used
* Build system
* Package manager
* Existing testing infrastructure
* Existing test coverage
* Project architecture

Then implement the most appropriate testing solution.

Preferred technologies:

* Vitest
* Playwright
* Testing Library

Use alternatives only if they better fit the existing architecture.

---

##### Create Testing Architecture

Implement a layered testing strategy.

###### Layer 1: Unit Tests

Test isolated business logic.

Examples:

* Date calculations
* Task filtering
* Status handling
* Calendar indicator generation
* File import/export logic
* Settings validation
* Data migrations
* Utility functions

Requirements:

* Fast execution
* No UI rendering required
* No external dependencies

---

###### Layer 2: Component Tests

Test UI components in isolation.

Examples:

* Task cards
* Task editor
* Status editor
* Calendar widget
* Settings panels
* Filter controls
* Dashboard widgets

Verify:

* Rendering
* State updates
* User interaction
* Validation behavior

---

###### Layer 3: Integration Tests

Verify cooperation between subsystems.

Examples:

* Task creation workflow
* Status management workflow
* Calendar filtering
* Data persistence
* Import/export cycle
* Settings changes affecting UI

Verify data flow between modules.

---

###### Layer 4: End-to-End Tests

Use Playwright.

Simulate real user behavior.

Examples:

* Create project
* Create task
* Edit task
* Save data
* Reload application
* Verify persistence
* Modify settings
* Use calendar filtering
* Import file
* Export file

These tests should exercise the application as a user would.

---

##### Critical Areas Requiring High Coverage

The following systems are considered critical.

Coverage should be prioritized here.

###### Data Persistence

Verify:

* Save operations
* Load operations
* Backup creation
* Recovery behavior
* Data integrity

Data loss is unacceptable.

---

###### File System Access API

Verify:

* File creation
* File updates
* Reopen existing files
* Error handling
* Permission handling

---

###### Task Management

Verify:

* Create
* Edit
* Delete
* Clone
* Move
* Status changes
* Date changes

---

###### Calendar Logic

Verify:

* Indicator generation
* Filtering
* Tooltip counts
* Date calculations
* Activity category mappings

Particularly test:

* Planned
* Active
* Problem
* None

---

###### Data Migration

Verify:

* Older files load correctly
* New properties are created automatically
* No user data is lost

Every migration must include dedicated tests.

---

###### Settings System

Verify:

* Status creation
* Status deletion
* Status renaming
* Activity category mapping
* Validation rules

---

##### Regression Testing Rules

Whenever a bug is fixed:

1. Reproduce the bug with a failing test.
2. Fix the bug.
3. Verify the new test passes.

Never fix a bug without adding a regression test.

Every bug should permanently increase project quality.

---

##### Test Coverage Targets

Target coverage:

| Area              | Minimum Coverage |
| ----------------- | ---------------- |
| Business Logic    | 90%              |
| Data Persistence  | 95%              |
| Migrations        | 95%              |
| Calendar Logic    | 95%              |
| Utility Functions | 90%              |
| UI Components     | 80%              |

Coverage should focus on meaningful behavior rather than artificial percentage goals.

---

##### Continuous Verification Workflow

For every code change:

###### Step 1

Update affected tests.

If behavior changes:

* Update existing tests.
* Add missing tests.

---

###### Step 2

Run full test suite.

Execute:

```bash
npm test
```

or equivalent project command.

---

###### Step 3

Run end-to-end tests.

Execute:

```bash
npm run test:e2e
```

or equivalent command.

---

###### Step 4

Review failures.

Do not ignore failing tests.

Determine whether:

* Code is wrong.
* Test is outdated.
* Requirements changed.

---

###### Step 5

Update tests if requirements changed.

Tests should reflect intended behavior.

---

###### Step 6

Verify all tests pass before completing work.

No task is complete while tests fail.

---

##### AI Development Workflow Requirements

When making future code changes:

Always perform the following sequence:

1. Analyze affected functionality.
2. Identify existing tests.
3. Update tests first if appropriate.
4. Implement change.
5. Execute relevant tests.
6. Fix failures.
7. Run complete suite.
8. Verify no regressions.

The AI must never:

* Remove tests without justification.
* Disable tests to achieve a passing build.
* Ignore failing tests.
* Reduce coverage to simplify implementation.

---

##### Test Organization

Use a clear structure.

Example:

```text
tests/
├── unit/
├── integration/
├── e2e/
├── migrations/
├── fixtures/
└── helpers/
```

Mirror production structure where practical.

Test files should be easy to locate.

---

##### Test Fixtures

Create reusable fixtures for:

* Empty projects
* Small projects
* Large projects
* Legacy file versions
* Complex task structures
* Multiple status configurations

Fixtures should support repeatable testing.

---

##### Snapshot Testing

Use sparingly.

Allowed for:

* Stable UI rendering

Avoid for:

* Dynamic content
* Frequently changing components

Behavioral tests are preferred.

---

##### Future Features

Whenever a new feature is implemented:

The implementation is incomplete until:

* Unit tests exist.
* Integration tests exist where appropriate.
* End-to-end tests exist for user-facing workflows.
* All tests pass.

This requirement applies to all future development.

---

##### Acceptance Criteria

The implementation is successful when:

✓ Automated testing infrastructure exists.

✓ Unit tests execute successfully.

✓ Integration tests execute successfully.

✓ End-to-end tests execute successfully.

✓ Coverage reporting is available.

✓ Test execution can be performed with a single command.

✓ Critical business logic is protected by tests.

✓ Data persistence is protected by tests.

✓ Migration logic is protected by tests.

✓ Future development includes test updates as part of every change.

The resulting testing system should become a permanent quality gate for WIPflow development and significantly reduce the likelihood of regressions introduced by future AI-generated code changes.




### WIPflow Golden Test Dataset Specification

##### Objective

Create a realistic, production-like test dataset that can be used for:

* Manual testing
* Automated testing
* Regression testing
* Performance testing
* UI validation
* Migration testing
* AI-assisted development verification

The dataset should intentionally contain complexity that exposes edge cases and implementation defects.

This dataset becomes a permanent part of the project and must be maintained alongside the application.

---

##### Dataset Name

```text
golden-project.wipflow
```

Location:

```text
tests/fixtures/golden-project.wipflow
```

---

##### Dataset Requirements

The dataset should resemble a real-world project rather than a synthetic example.

The goal is to stress all major application features simultaneously.

---

##### Project Structure

Create:

* 1 Project
* 12 Groups
* 8 Priority Levels
* 12 Statuses
* 5 Responsible Persons
* 150–200 Tasks

The project should appear realistic when viewed in the application.

---

##### Status Configuration

Include default and custom statuses.

Examples:

* Not Started
* Active
* On Hold
* Blocked
* Overdue
* Completed
* Awaiting Review
* Awaiting Approval
* Awaiting Customer
* Verification
* Deferred
* Cancelled

Map activity categories appropriately.

Ensure all activity categories are represented:

* planned
* active
* problem
* none

---

##### Task Distribution

Create approximately:

| Type           | Count     |
| -------------- | --------- |
| Not Started    | 40        |
| Active         | 40        |
| Completed      | 40        |
| Problem States | 20        |
| Custom States  | Remaining |

The calendar should contain activity across several months.

---

##### Date Coverage

Include:

* Past tasks
* Current tasks
* Future tasks

Cover at least:

* 12 months of dates

Include:

* Tasks beginning today
* Tasks ending today
* Tasks spanning multiple months
* Milestone-style tasks
* Long-running tasks

---

##### Dependency Scenarios

Create tasks with:

* No dependencies
* Single dependency
* Multiple dependencies
* Long dependency chains

Example chain:

```text
Task A
↓
Task B
↓
Task C
↓
Task D
↓
Task E
```

Include at least:

* 30 dependent tasks

---

##### Priority Coverage

Ensure every priority level contains tasks.

Example:

* Critical
* High
* Medium
* Low
* Backlog

Include realistic distribution.

---

##### Group Coverage

Each group should contain tasks.

Examples:

* Planning
* Procurement
* Development
* Testing
* Validation
* Documentation
* Deployment

The purpose is to verify filtering and grouping behavior.

---

##### Responsible Persons

Create several responsible persons.

Examples:

* Alice
* Bob
* Charlie
* Dana
* Erik

Distribute tasks unevenly.

Some users should have heavy workloads.

---

##### Calendar Stress Cases

Include days containing:

* Only planned tasks
* Only active tasks
* Only problem tasks
* Planned + active
* Active + problem
* Planned + active + problem

This verifies dot priority behavior.

---

##### Filtering Stress Cases

Ensure data exists for:

* Every status
* Every priority
* Every group
* Every responsible person

Every filter should visibly change results.

---

##### Search Stress Cases

Include tasks with:

* Short names
* Long names
* Similar names
* Duplicate prefixes

Examples:

```text
Prepare Report
Prepare Report Draft
Prepare Report Final
Prepare Report Review
```

Verify search functionality.

---

##### Completed Work

Include:

* Recently completed tasks
* Older completed tasks
* Long-duration completed tasks

Verify reporting and statistics.

Completed tasks should not generate calendar indicators.

---

##### File Persistence Testing

Save dataset.

Reload dataset.

Verify:

* No data loss
* No data corruption
* No missing settings
* No missing relationships

Automate this test.

---

##### Migration Testing Dataset

Create additional fixtures:

```text
tests/fixtures/legacy-v1.wipflow
tests/fixtures/legacy-v2.wipflow
tests/fixtures/legacy-v3.wipflow
```

These should intentionally omit newer fields.

Use them to verify migration logic.

---

##### Automated Verification

Create automated tests that load the golden dataset and verify:

###### Data Integrity

* Task count unchanged
* Status count unchanged
* Groups unchanged
* Priorities unchanged

---

###### Calendar Integrity

Verify:

* Activity dots render correctly
* Counts match expectations
* Activity categories work correctly

---

###### Filtering Integrity

Run every filter.

Verify:

* Results are returned
* Counts are correct

---

###### Save/Load Integrity

Perform:

```text
Load
→ Save
→ Reload
→ Compare
```

No meaningful data should change.

---

###### Performance Validation

Measure:

* Load time
* Save time
* Calendar rendering time
* Filter execution time

Detect major regressions.

---

##### Development Workflow Rule

Every feature implementation must be validated against:

```text
golden-project.wipflow
```

before being considered complete.

Every bug fix must be tested against:

```text
golden-project.wipflow
```

before being merged.

Every automated test run should include this dataset.

---

##### Acceptance Criteria

✓ Golden dataset exists.

✓ Dataset contains realistic project complexity.

✓ Automated tests use the dataset.

✓ Save/load validation exists.

✓ Migration validation exists.

✓ Calendar validation exists.

✓ Filtering validation exists.

✓ Performance baselines exist.

✓ Future development uses the dataset as a mandatory verification asset.

The golden dataset should become the primary regression-testing asset for WIPflow and provide confidence that future changes do not break real-world usage scenarios.

---

### v2.4 (2026-06-06)

**Calendar activity categories — decouple calendar dots from status names**

- `DEFAULT_SETTINGS.statuses` changed from a string array to an object array: `{ name, activityCategory }` — `activityCategory` is one of `planned`, `active`, `problem`, or `none`
- New `ACTIVITY_CATEGORIES` constant and `migrateStatusCategory()` helper for name-based legacy migration
- `AppState.fromJSON` auto-migrates legacy string statuses on load (case-insensitive name match; unknown names default to `none`); no user action required, no data lost
- `SidebarCalendar._computeDots` now builds a `Map` from status name → activityCategory at render time; zero hard-coded status names remain in calendar logic
- Calendar tooltips aggregate by category: "N Problem tasks / N Active tasks / N Planned tasks"
- `Settings._renderStatusList`: status list now renders an Activity Category dropdown per row (Planned Work / Active Work / Attention Needed / No Calendar Marker)
- `Settings.setStatusCategory(idx, category)`: saves category change, re-saves to storage, re-renders calendar
- `Settings.addItem('statuses')` now pushes `{ name, activityCategory: 'none' }` instead of a string
- All callers updated to extract `.name` from status objects: `TaskModal`, `TableView`, `KanbanView`, `GanttFilters`
- Help view updated to describe activity categories rather than hard-coded status names

---

### v2.3 (2026-06-06)

**File Storage refactor — user-owned `tasks.json` with File System Access API**

- New `IDB` module: IndexedDB helper for persisting `FileSystemDirectoryHandle` across sessions
- New `FileSystemStorageProvider`: File System Access API provider — `chooseFolder`, `load`, `save`, `loadBackup`, `disconnect`; write-safe (backs up `tasks.json` → `tasks.backup.json` before every write)
- New `StorageManager`: async startup orchestrator — provider selection, first-time setup dialog, localStorage migration, external-change detection, page-lifecycle save hooks
- First-time setup overlay (`#setup-overlay`): shown once on first launch in Chrome/Edge; user chooses a folder or continues with browser storage
- Migration: if localStorage data exists when a folder is connected, it is automatically written to `tasks.json`; localStorage kept as safety backup
- Corruption recovery: if `tasks.json` cannot be parsed on startup, `tasks.backup.json` is loaded automatically and a toast is shown
- External-change detection: on tab focus, `tasks.json` modification time is checked; if changed externally, a reload offer is shown
- `Storage.save()` rewritten to delegate to `StorageManager._doSave()`; always writes localStorage as safety net
- `Storage.load()` removed; data loading now handled by async `StorageManager.init()` before `App.init()`
- `Storage.markDirty()` debounce changed from 400 ms to 500 ms
- Save indicator: shows 📁 prefix when file storage is active; error state (red dot) on write failure
- Settings → Storage card: shows current provider, folder name, Connect / Change / Disconnect actions
- Immediate save on tab hide and page unload (`visibilitychange` + `beforeunload`)
- `App.init()` no longer calls `Storage.load()`; seeds demo data only if `AppState.tasks` is empty
- Boot changed to `async`: `await StorageManager.init()` before `App.init()`
- Graceful degradation: app fully functional in Firefox (no FSAPI) and any browser via localStorage fallback
- All existing export/import/print functionality preserved unchanged

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
