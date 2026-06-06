# WIP Flow

**A single-file, offline-first work-in-progress tracker.**

WIP Flow runs entirely in your browser. Download one HTML file, open it, and start tracking tasks — no install, no server, no internet connection required. Your data is saved automatically and travels with the file.

---

## Features

- **Dashboard** — KPI cards, status/priority/group bar charts, staff workload, upcoming deadlines, and resource conflict detection
- **Table view** — sortable, multi-filter grid with inline status and progress editing
- **Gantt timeline** — canvas-rendered timeline with Day/Week/Month/Year zoom, resizable task panel, today marker, and hover tooltips
- **Kanban board** — drag-and-drop cards grouped by status, with keyboard-accessible move controls
- **Calendar sidebar** — month calendar with task activity dots; click any date to filter all views simultaneously
- **Print / export report** — configurable sections, paper size, and orientation; preview before printing
- **File storage** — connect a folder once; tasks save to `tasks.json` automatically with a write-safe backup; survives browser cache clearing (Chrome/Edge)
- **Export formats** — self-contained HTML, `.labwip` JSON backup, CSV, Excel (SpreadsheetML)
- **Dark and light themes**
- **Fully configurable** — rename groups, persons, statuses, priorities, tags, and holidays to match your workflow

---

## Getting Started

1. Download `WIPflow.html`
2. Open it in a browser (Firefox or Chrome recommended)
3. The app loads with 15 demonstration tasks — explore freely
4. Clear them under **Settings → Data Management → Clear All Data** when ready to start fresh
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

WIP Flow uses multiple complementary layers so your data is never lost:

**1 — File storage (Chrome/Edge, recommended)**
Connect a folder once via **Settings → Storage → Connect Folder**. WIP Flow saves tasks to `tasks.json` in that folder after every change. Before each write, the previous file is backed up to `tasks.backup.json` — if `tasks.json` is ever corrupted, the backup is restored automatically on startup. The 📁 prefix in the save indicator confirms file storage is active. Tasks in a file survive browser cache clearing and can be copied to other computers.

**2 — localStorage (always active, safety net)**
Every save also writes to browser localStorage. When file storage is active this is an additional safety net. _Limitation:_ localStorage is scoped to the file URL — moving `WIPflow.html` to a different folder loses the association.

**3 — Embedded data (self-contained HTML)**
On every save the full dataset is written into a `<script>` tag inside the HTML in memory. Clicking **↓ Save as HTML** downloads a versioned self-contained copy with all data embedded. Open it on any machine, any browser, without needing localStorage or a folder.

**4 — `.labwip` JSON export**
**Settings → Data Management → Export .labwip** downloads a plain JSON snapshot. Import it with **↓ Import** in the topbar to restore data into any copy of WIP Flow.

**Recommended workflow (Chrome/Edge):**
On first launch, choose a folder. From then on, tasks save automatically — nothing else to do. Copy the `tasks.json` file to move your data to another machine.

**Recommended workflow (Firefox or any browser):**
Work normally (localStorage handles daily saves). Periodically click **↓ Save as HTML** and replace your working `WIPflow.html` with the downloaded file.

**Version numbers** take the form `MAJOR.MINOR.SAVE`. The SAVE counter increments automatically on each **↓ Save as HTML**, giving every exported file a unique, monotonically increasing identifier.

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
| Holidays | Add dates (with optional names) excluded from workday calculations; import from CSV |
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
| Self-contained HTML | ↓ Save as HTML (sidebar or topbar) | Full portable copy with data embedded |
| `.labwip` JSON | Settings → Export backup snapshot | Re-importable full backup |
| CSV | Settings → Export CSV | Spreadsheet view only — one-way, no re-import |
| Excel (.xls) | Settings → Export Excel | SpreadsheetML, opens in Excel and LibreOffice |
| Print / PDF | Settings → Print / Export Report | Configurable sections, paper size, orientation; preview before print |

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

The `.labwip` format and `localStorage` both use the same JSON envelope:

```json
{
  "version": "1.0",
  "settings": {
    "theme": "dark",
    "autosaveIntervalMinutes": 5,
    "saveVersion": 0,
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

New settings keys added to `DEFAULT_SETTINGS` appear automatically for existing users on next load.

---

## Changelog

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
