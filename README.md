# WIP Flow

**A single-file, offline-first work-in-progress tracker.**

WIP Flow runs entirely in your browser. Download one HTML file, open it, and start tracking tasks — no install, no server, no internet connection required. Your data is saved automatically to your own data file, and the app never starts from fabricated data.

---

## Features

- **Dashboard** — KPI cards, status/priority/group bar charts, staff workload, upcoming deadlines, and resource conflict detection
- **Table view** — sortable, multi-filter grid with inline status and progress editing
- **Gantt timeline** — canvas-rendered timeline with Day/Week/Month/Year zoom, resizable task panel, today marker, and hover tooltips
- **Kanban board** — drag-and-drop cards grouped by status, with keyboard-accessible move controls
- **Calendar sidebar** — month calendar with task activity dots; click any date to filter all views simultaneously
- **Print / export report** — configurable sections, paper size, and orientation; preview before printing
- **Reliable data management** — an owned `wipflow-data.json` data file with revision tracking and conflict prompts; silent autosave in Chrome/Edge, automatic read-back in Firefox/Safari; rolling restore points; never fabricates data
- **Export formats** — self-contained HTML snapshot, `.labwip` JSON backup, CSV, Excel (SpreadsheetML)
- **Dark and light themes**
- **Fully configurable** — rename groups, persons, statuses, priorities, tags, and holidays to match your workflow

---

## Getting Started

1. Download `WIPflow.html`
2. Open it in a browser (Firefox, Chrome, Edge or Safari)
3. Choose how to start: an empty project, 15 demonstration tasks, an existing data file, or an import
4. Chrome/Edge only: connect your data file once via **Data & Backup** for silent autosave
5. Click **+ New Task** to create your first task

No installation. No account. No network request.

---

## Views

### Dashboard

Shows six KPI cards (total tasks, active, overdue, completed, blocked, overallocated), three bar charts (status distribution, by priority, by group), a staff workload panel, upcoming deadlines for the next 14 days, and a resource conflicts panel that flags staff members assigned to overlapping tasks at over 100% combined allocation.

### Table

A full task table with sortable columns (click any header to sort, click again to reverse) and filter dropdowns for group, person, status, and priority, plus a free-text search. Click a **Status** cell to change it inline without opening the modal. Click a **Progress** cell to edit the percentage directly.

### Gantt

A canvas-based timeline at four zoom levels:

- **Day** — individual days with weekday abbreviations
- **Week** — week blocks labelled with ISO week number and date
- **Month** — month columns
- **Year** — auto-scales to fill available width

Weekend columns and configured holidays are shaded. A dashed line marks today. The task panel on the left is resizable by dragging the divider. Bar colour reflects priority; fill level reflects progress. Hover over a bar for a full detail tooltip.

### Kanban

Cards grouped into status columns. Drag a card to a different column to update its status, or use the **Move to…** dropdown on each card for keyboard accessibility. Filter by group or person using the dropdowns above the board.

---

## Calendar Sidebar

A compact month calendar sits in the sidebar below the Views navigation, giving a visual overview of task activity and acting as a global date filter.

### Activity dots

Up to three dots appear beneath each day number, based on the **Activity Category** assigned to each status in **Settings → Task Statuses**:

| Dot | Category | Meaning |
|-----|----------|---------|
| ● Green | Active Work | Tasks with an active status span this day |
| ○ Outline | Planned Work | Tasks with a planned status are scheduled for this day |
| ● Red | Attention Needed | Tasks with a problem status span this day |

Statuses set to **No Calendar Marker** (e.g. Completed) produce no dot. Hover over a day for exact counts by category.

### Date filtering

Click any date to activate a global filter. A banner appears below the toolbar:

```
📅 Date filter active:  5 June 2026   [✕ Clear]
```

All views update simultaneously — Dashboard KPIs and charts, Table rows, Gantt bars, and Kanban cards — showing only tasks active on the selected date (where `startDate ≤ date ≤ endDate`). Click the same date again or press **✕ Clear** to remove the filter. The calendar stays visible.

When the Gantt view is open, the timeline also auto-scrolls to the selected date and draws a dashed guide line.

### Calendar settings

Under **Settings → Calendar**:

- **Week numbering** — ISO 8601 (default) or US style
- **First day of week** — Monday (default) or Sunday
- **Show adjacent-month days** — on or off

The calendar section can be collapsed by clicking the **Calendar** header.

---

## Saving & Portability

WIP Flow keeps your work in three places at once, so a single failure never costs you data. Click the **save status** at the bottom of the sidebar to open **Data & Backup** and see which route is active.

**1 — Your data file (source of truth)**
WIP Flow owns `wipflow-data.json`. Every save carries a revision number that increases monotonically.

- **Chrome / Edge** — connect the file once via **Data & Backup → Connect existing data file**. Every change is then written straight into it, silently, with no dialogs. This is the best experience.
- **Firefox / Safari** — these browsers do not let a page write files. WIP Flow therefore writes the file as a download when you press **Save** and when you close the tab, and reads it back automatically at startup. Put `wipflow-data.json` in the same folder as `WIPflow.html` and your work returns with no clicks. Browsers name repeated downloads `wipflow-data(1).json`, so keep the newest copy beside the app; WIP Flow detects a lagging file and tells you rather than loading older data.

_Why a file and not just the browser?_
Browser storage on `file://` pages is keyed to the exact file path — Firefox records the full `file:///.../WIPflow.html` path as the storage origin. Moving or renaming `WIPflow.html` therefore starts from an empty data set. A file you own travels with you; browser storage does not.

**2 — The browser copy (always current)**
Every save also writes to browser storage. This is the fastest layer and the one WIP Flow reads when the data file is missing, unreadable or older. Treat it as a safety net, not the primary store.

**3 — Restore points, snapshots and backups**
The last 12 revisions are kept automatically and can be restored from **Data & Backup → Restore points**. **↓ Portable snapshot** downloads a self-contained copy of the whole app with the data embedded — useful for archiving or handing to someone else. **Export .labwip** produces a plain JSON backup for interchange.

**Moving the app to another computer**
1. Copy `WIPflow.html` *and* `wipflow-data.json` together — two files, one folder.
2. Open `WIPflow.html`. Your work is read from the file. In Chrome or Edge, connect the file once more for silent autosave.

**If two versions ever disagree**
WIP Flow shows both with their revision, task count and timestamp and asks which one you want. It never overwrites silently and never guesses from timestamps. On first run it never invents data: you choose an empty project, 15 demonstration tasks, an existing data file, or an import.

**Version numbers** take the form `MAJOR.MINOR.SAVE`. The SAVE counter increments on each **↓ Portable snapshot**, giving every exported file a unique, monotonically increasing identifier.

---

## End Date Calculation

End dates are calculated automatically from start date, estimated workdays, and allocation percentage:

```
calendar_days = ⌈ workdays ÷ (allocation% ÷ 100) ⌉
```

Starting from the start date, the app counts forward that many calendar workdays (Monday–Friday), skipping any dates configured as holidays. The end date field updates live as you type. Adding or removing holidays immediately recalculates all existing task end dates.

**Example:** 10 workdays at 50% allocation requires 20 calendar workdays. Starting on a Monday with no holidays, the task ends on the Friday four weeks later.

---

## Settings

| Section | What you can configure |
|---------|----------------------|
| Groups | Add/remove group names (configurable label: Department, Team, Project, etc.) |
| Persons | Add/remove staff members |
| Priorities | Add/remove priority levels |
| Statuses | Add/remove task statuses; set Activity Category per status to control calendar dot rendering |
| Tags | Add/remove tags |
| Holidays | Add dates (with optional names) excluded from workday calculations; import from CSV — see [examples/swedish-holidays-2026.csv](examples/swedish-holidays-2026.csv) for the expected format |
| Theme | Dark or light |
| Autosave | Periodic save interval in minutes (0 to disable) |
| Group Terminology | Rename the grouping concept (singular + plural) |
| Calendar | Week numbering, first day of week, show adjacent-month days |
| Storage | Connect/disconnect a file storage folder; shows current provider and folder name |
| Data Management | Export HTML, export/import `.labwip`, export CSV, export Excel, print report, clear all data |

---

## Export Options

| Format | How to access | Notes |
|--------|--------------|-------|
| Self-contained HTML | ↓ Portable snapshot (sidebar or topbar) | Full portable copy with data embedded — a copy, not your working file |
| `.labwip` JSON | Data & Backup → Export .labwip | Re-importable full backup |
| CSV | Settings → Export CSV | Spreadsheet view only — one-way, no re-import |
| Excel (.xls) | Settings → Export Excel | SpreadsheetML, opens in Excel and LibreOffice |
| Print / PDF | Settings → Print / Export Report | Configurable sections, paper size, orientation; preview before print |

### Browser support for data management

| Browser | Writing the data file | Reading the data file | Experience |
|---------|----------------------|----------------------|------------|
| Chrome / Edge | File System Access API — silent, every change | Remembered handle | Fully automatic |
| Firefox | Download on Save and on tab close (`file://` pages cannot write files) | Automatic, from beside `WIPflow.html` | Automatic read, one-click sync on save |
| Safari | Download on Save and on tab close | Automatic, from beside `WIPflow.html` | As Firefox |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save now |
| `Enter` (in task modal input) | Save and close modal |
| `Ctrl+Enter` (in task modal textarea) | Save and close modal |
| `Escape` (in task modal) | Close without saving |
| `Tab` / `Shift+Tab` (in task modal) | Navigate fields (focus trapped within dialog) |

---

## Development

WIP Flow is intentionally a single file with no build toolchain.

```
WIPflow.html       # The entire application — ~5 900 lines of HTML/CSS/JS
CLAUDE.md          # Architecture notes and conventions for AI-assisted development
TODO.md            # Backlog and completed change log
HANDOFF.md         # Context for continuing development across sessions
docs/
  ARCHITECTURE.md  # Module map, data flow, and key conventions
  DATA_SCHEMA.md   # Task and settings JSON schema reference
```

To develop:

1. Open `WIPflow.html` in a browser
2. Edit the file in any text editor
3. Reload the browser tab — changes are visible immediately
4. The browser console is the only debugger

To serve locally (optional):

```bash
python -m http.server 5500
# then open http://localhost:5500/WIPflow.html
```

### Data schema

The data file, the browser cache and `.labwip` exports all use the same JSON envelope:

```json
{
  "version": "3.0",
  "revision": 12,
  "appVersion": "3.0",
  "savedAt": "<ISO timestamp>",
  "savedFrom": "file:///.../WIPflow.html",
  "settings": {
    "theme": "dark",
    "autosaveIntervalMinutes": 5,
    "saveVersion": 0,
    "revision": 12,
    "labs": [],
    "persons": [],
    "priorities": [],
    "statuses": [],
    "tags": [],
    "holidays": []
  },
  "tasks": [
    {
      "id": "task_...",
      "name": "",
      "lab": "",
      "person": "",
      "priority": "",
      "status": "",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "workdays": 0,
      "alloc": 100,
      "progress": 0,
      "description": "",
      "tags": "",
      "notes": "",
      "created": "<ISO timestamp>",
      "modified": "<ISO timestamp>"
    }
  ]
}
```

`revision` is a monotonically increasing counter used to decide which copy is newer. Files
without it (v2.5 and earlier) are accepted and treated as revision 1, so existing backups
import cleanly. New settings keys added to `DEFAULT_SETTINGS` appear automatically for
existing users on next load.

---

## Changelog

- **v3.0** — Reliable data management: an owned `wipflow-data.json` data file with revision tracking, silent autosave in Chrome/Edge and automatic read-back in Firefox/Safari; explicit first-run choice and recovery prompts instead of silent demo seeding; rolling restore points; stale-file detection; verified, escaping-safe portable snapshots; Data & Backup panel
- **v2.5** — Automated testing infrastructure (Vitest unit/integration tests and Playwright end-to-end tests)
- **v2.4** — Calendar activity categories: each status now carries an *Activity Category* (Planned Work / Active Work / Attention Needed / No Calendar Marker) that controls calendar dot rendering; Settings → Task Statuses adds an Activity Category dropdown per status; legacy files auto-migrate on load
- **v2.3** — File storage with File System Access API; `tasks.json` with write-safe backup; first-time setup; migration from localStorage; external-change detection; Settings → Storage card
- **v2.2** — New app logo; Settings page redesigned as vertically stacked full-width cards
- **v2.1** — Calendar sidebar with global date filtering; activity dots; date filter bar; Settings → Calendar
- **v2.0** — Configurable group terminology; print/export report dialog with section selection and preview
- **v1.9** — Keyboard shortcuts in task modal; responsive chart layout
- **v1.8** — Design system modernization; WCAG AA contrast; CSS variable-driven chart colours
- **v1.7** — Excel export fix; improved print/PDF dialog; Gantt alignment fixes; Year zoom auto-scale
- **v1.6** — Accessibility improvements (modal focus trap, ARIA, Kanban keyboard controls); inline table editing
- **v1.5** — Inter font; HiDPI chart rendering
- **v1.4** — Light theme colours; end-date off-by-one fix; HTML-escaping hardening
- **v1.3** — Logo and layout polish; security cleanup
- **v1.2** — Versioning system; Kanban improvements; Gantt tooltip fix

---

## License

Copyright (C) 2026 Daniel Rosik

WIP Flow is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version. See [LICENSE](LICENSE) for the full text.
