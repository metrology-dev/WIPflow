# LabWIP - Laboratory Work-in-Progress Tracker

**Version:** 1.0  
**File:** `WIPflow.html` (single-file, self-contained)  
**Compatibility:** Firefox * Chrome * Edge

---

## Overview

LabWIP is a standalone, offline-first web application for tracking work in progress in research laboratory environments. It runs entirely in a browser by opening a single HTML file - no installation, no server, no internet connection required.

The application is designed for operational planning in multi-laboratory settings: tracking ongoing work, visualising timelines, coordinating staff allocation, and estimating realistic end dates based on workday calculations.

---

## Getting Started

### First launch

1. Place `WIPflow.html` in any folder on your computer.
2. Open the file in Firefox, Chrome, or Edge.
3. The application loads with demonstration data pre-populated (15 sample tasks from three laboratories). This data can be cleared under **Settings --> Clear All Data**.

### Moving the file to another computer

Because browser `localStorage` is tied to the file path, simply copying `WIPflow.html` to a new location would normally lose your data. LabWIP solves this with a three-layer persistence strategy - see [Data & Persistence](#data--persistence) below.

---

## Interface

The application has four views, accessible from the left sidebar.

### Dashboard

An operational overview of the entire task portfolio.

- **KPI cards** - counts of total, active, overdue, completed, and blocked tasks at a glance.
- **Status distribution chart** - bar chart of all tasks grouped by status.
- **Priority distribution chart** - bar chart grouped by priority level.
- **Laboratory distribution chart** - bar chart grouped by laboratory.
- **Staff workload** - horizontal bar graph showing the number of active tasks per responsible person.
- **Upcoming deadlines** - tasks due within the next 14 days, sorted by date, colour-coded by urgency (red <= 2 days, orange <= 5 days).

All charts resize dynamically with the browser window.

---

### Table View

A sortable, filterable grid of all tasks.

**Filtering and search**

- Free-text search across task name, description, notes, and tags (live, as-you-type).
- Dropdown filters for laboratory, responsible person, status, and priority. Filters combine - all active filters apply simultaneously.
- **Clear Filters** button resets all filters at once.

**Sorting**

Click any column header to sort ascending; click again to reverse. The active sort column and direction are shown in the table footer. Multi-column sorting is not supported - the last clicked column wins.

**Columns**

| Column | Notes |
|---|---|
| Task | Task name; overdue tasks highlighted in red |
| Lab | Laboratory |
| Person | Responsible person |
| Status | Colour-coded badge |
| Priority | Colour-coded badge |
| Start | Start date (YYYY-MM-DD) |
| End (calc.) | Calculated end date; overdue shown with ⚠ |
| Days | Estimated workdays |
| Alloc% | Staff allocation percentage |
| Progress | Visual bar with percentage |
| Tags | Comma-separated tag chips |

Click any row to open the task editor.

---

### Gantt View

A canvas-rendered horizontal timeline of all tasks.

**Zoom levels**

| Level | Column unit | Use |
|---|---|---|
| Day | Individual days | Short sprints, detailed scheduling |
| Week | Week numbers | Normal operational planning |
| Month | 5-day blocks | Long-term overview |

**Navigation**

- Scroll horizontally through the timeline using the scrollbar or trackpad.
- The **Today** button scrolls the view to centre on the current date.
- The timeline header scrolls in sync with the chart body.

**Visual conventions**

- Bar colour indicates priority (red = Critical, orange = High, yellow = Medium, green = Low).
- Bar fill opacity indicates progress - a brighter/solid portion of the bar shows completed work.
- A dashed vertical orange line marks today's date.
- Weekend columns are lightly shaded.
- Task labels are truncated if the bar is too narrow to display them.

**Filters**

Dropdown filters for laboratory, person, and status work the same as in Table View. Filters apply immediately.

**Hover tooltip**

Hovering over any task bar shows a tooltip with full task details: name, lab, person, status, priority, start/end dates, progress, and allocation. The tooltip repositions automatically to avoid being clipped at the screen edge.

Click a task bar to open the task editor.

---

### Settings

Central configuration for all application-wide values.

**Editable lists**

All dropdown options used in the task editor are managed here. Each list supports adding new entries (type and press Enter, or click **Add**) and removing existing entries (click ✕).

| List | Used in |
|---|---|
| Laboratories | Task --> Laboratory field |
| Responsible Persons | Task --> Responsible Person field |
| Priority Levels | Task --> Priority field |
| Task Statuses | Task --> Status field |
| Tags | Task --> Tags field (free-text, but listed here as reference) |

> **Note:** Removing an item from a list does not modify existing tasks that already use it. Existing tasks retain their values; the removed option simply no longer appears in the dropdown for new tasks.

**Theme**

Switch between Dark (default) and Light mode. The setting is persisted across sessions.

**Autosave interval**

Set the periodic background save timer in minutes (1-60). Set to **0** to disable the timer entirely. See [Save Behaviour](#save-behaviour) for full details.

**Data Management**

See [Data & Persistence](#data--persistence).

---

## Task Editor

Click any task row or Gantt bar to edit, or click **+ New Task** (topbar or sidebar) to create a new one.

### Fields

| Field | Required | Notes |
|---|---|---|
| Task Name | Yes | Free text |
| Laboratory | Yes | Dropdown - configured in Settings |
| Responsible Person | Yes | Dropdown - configured in Settings |
| Priority | Yes | Dropdown - configured in Settings |
| Status | - | Dropdown - configured in Settings |
| Start Date | - | Date picker (YYYY-MM-DD) |
| Estimated Workdays | - | Numeric; fractional values allowed (e.g. 0.5) |
| Allocation % | - | 1-100; defaults to 100 |
| Calculated End Date | - | Read-only; computed automatically |
| Progress | - | Slider, 0-100% |
| Description | - | Multi-line free text |
| Tags | - | Comma-separated values |
| Notes | - | Short free text |

### End date calculation

The end date is calculated from the start date, estimated workdays, and allocation percentage:

```
calendar_duration = ceil(workdays / (allocation% / 100))
```

The result is then walked forward day by day from the start date, counting only Monday-Friday, skipping weekends. The calculation updates live as you type.

**Example:** 10 workdays at 50% allocation requires 20 calendar workdays to elapse. If the start date is a Monday with no holidays, the calculated end date lands on the Friday four weeks later.

### Deleting a task

When editing an existing task, a **Delete Task** button appears in the lower left of the editor. Deletion is permanent and asks for confirmation.

---

## Data & Persistence

LabWIP uses three complementary layers to ensure data is never lost and travels with the file.

### Layer 1 - localStorage

All data is saved to browser `localStorage` on every save operation. This is fast and automatic. The storage key is `labwip_data`.

**Limitation:** `localStorage` is scoped to the file's URL. If you move `WIPflow.html` to a different folder or computer and open it from the new path, the browser treats it as a different origin and the locally stored data is not found.

### Layer 2 - Embedded data in `WIPflow.html`

On every save, the full JSON dataset is written into a `<script id="labwip-embedded-data">` tag inside the HTML file itself. This means `WIPflow.html` is self-contained: the file carries its own data. On startup, LabWIP reads both the embedded data and `localStorage`, then loads whichever source has the more recently modified task.

**Practical effect:** After any save operation, you can copy or move `WIPflow.html` to any folder or machine and open it - your data will be there without any additional steps.

> **Caveat:** This only works if the browser actually writes the tag to disk. The `textContent` of an in-memory DOM element is updated on every save, but the physical `WIPflow.html` file on disk is only updated if the browser re-downloads it or if you use the **Export** function. For day-to-day use on a single machine, rely on `localStorage`. For portability, always keep `labwip-autosave.labwip` next to the file (see Layer 3).

### Layer 3 - `labwip-autosave.labwip`

On every save, a file named `labwip-autosave.labwip` is silently downloaded to your browser's default download folder. This is a plain JSON file in the `.labwip` format. Because the filename is fixed, each download overwrites the previous one, so the file always reflects the most recent save.

**To move to a new machine or folder:**

1. Copy both `WIPflow.html` and `labwip-autosave.labwip` to the new location.
2. Open `WIPflow.html`.
3. If data does not load automatically, click **↓ Import** in the topbar and select `labwip-autosave.labwip`.

---

## Save Behaviour

There are three save triggers, all writing to the same three layers simultaneously.

| Trigger | When | Behaviour |
|---|---|---|
| **Save-on-change** | Every edit (task create/edit/delete, settings change) | Debounced 400 ms - rapid changes (e.g. dragging the progress slider) coalesce into a single save |
| **Manual save** | Click **⬡ Save** in the topbar, or press **Ctrl+S** / **Cmd+S** | Immediate; cancels any pending debounce; shows a toast confirmation |
| **Periodic autosave** | Every N minutes (configurable in Settings) | Runs silently in the background; disabled when interval is set to 0 |

The save status indicator in the sidebar shows the time of the last successful save and the current autosave interval (e.g. `Saved 14:23 * 5min`, or `Saved 14:23 * timer off` when disabled).

---

## File Format

Exported `.labwip` files are plain JSON with a `.labwip` extension. They can be opened in any text editor.

### Schema

```json
{
  "version": "1.0",
  "settings": {
    "theme": "dark",
    "autosaveIntervalMinutes": 5,
    "labs": ["RMP", "RAL", "RnL"],
    "persons": ["Anna S.", "Erik L."],
    "priorities": ["Critical", "High", "Medium", "Low"],
    "statuses": ["Not Started", "Active", "On Hold", "Blocked", "Completed"],
    "tags": ["calibration", "measurement"]
  },
  "tasks": [
    {
      "id": "task_1718000000000_ab12",
      "name": "Annual HPGe detector efficiency calibration",
      "lab": "RMP",
      "person": "Anna S.",
      "priority": "Critical",
      "status": "Active",
      "startDate": "2025-05-01",
      "endDate": "2025-05-08",
      "workdays": 5,
      "alloc": 100,
      "progress": 60,
      "description": "",
      "tags": "calibration,HPGe",
      "notes": "Cs-137 reference source",
      "created": "2025-04-28T09:00:00.000Z",
      "modified": "2025-05-03T11:22:00.000Z"
    }
  ]
}
```

### Field reference

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique task identifier, auto-generated |
| `name` | string | Task name |
| `lab` | string | Laboratory name |
| `person` | string | Responsible person |
| `priority` | string | Priority level |
| `status` | string | Current status |
| `startDate` | string | ISO date `YYYY-MM-DD` |
| `endDate` | string | Calculated ISO date `YYYY-MM-DD` |
| `workdays` | number | Estimated effort in workdays |
| `alloc` | number | Staff allocation percentage (1-100) |
| `progress` | number | Completion percentage (0-100) |
| `description` | string | Long-form description |
| `tags` | string | Comma-separated tag list |
| `notes` | string | Short notes field |
| `created` | string | ISO 8601 timestamp, set on creation |
| `modified` | string | ISO 8601 timestamp, updated on every edit |

---

## CSV Export

The **↑ Export CSV** function in Settings --> Data Management produces a flat CSV file with all task fields as columns. All fields are included; values containing commas or quotes are properly escaped per RFC 4180.

The CSV export is one-way - it cannot be imported back into LabWIP. Use `.labwip` files for backup and transfer.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` / `Cmd+S` | Manual save |
| `Escape` | Close the task editor |

---

## Technical Notes

### Architecture

The application is a single HTML file containing all HTML, CSS, and JavaScript inline. There are no external dependencies at runtime beyond an optional Google Fonts CDN call for IBM Plex Sans and IBM Plex Mono (the application falls back to system fonts if offline).

The JavaScript is structured as a set of plain objects acting as modules:

| Module | Responsibility |
|---|---|
| `AppState` | Central data store; task CRUD; filtering and sorting logic |
| `Storage` | localStorage, embedded data, silent export, save/load orchestration |
| `WorkCalendar` | Workday arithmetic; end date calculation |
| `App` | View routing; autosave timer; lifecycle |
| `TaskModal` | Task create/edit dialog |
| `Dashboard` | KPI cards; canvas bar charts; ResizeObserver |
| `TableView` | Sortable/filterable task grid |
| `Gantt` | Canvas-based timeline; scroll sync; tooltip |
| `Settings` | List editors; theme; autosave interval |
| `Toast` | Notification toasts |

### Browser compatibility

The application is tested against and prioritises Firefox. It uses only standard browser APIs available in all modern browsers:

- `localStorage`
- `Canvas 2D API`
- `Blob` / `URL.createObjectURL` for file downloads
- `FileReader` for file imports
- `ResizeObserver` for responsive chart redraws

The **File System Access API** (Chrome-only) is deliberately not used, ensuring full Firefox compatibility.

### Performance

The table and Gantt views are rendered synchronously from the in-memory `AppState.tasks` array. Sorting and filtering are performed on every render using native `Array` methods. The application handles up to approximately 1 000 tasks comfortably in all three views without pagination or virtualisation.

---

## Planned / Suggested Future Features

The architecture is designed to accommodate these extensions without restructuring:

- Holiday calendars and national holiday awareness in end date calculations
- Recurring tasks
- ISO 17025 traceability metadata fields
- Audit trail and change history
- File attachments
- PDF and Excel export
- Instrument and equipment linkage
- Sample tracking
- Calibration scheduling
- Resource conflict detection
- Kanban board view
- Multi-project support
- Shift planning and workload balancing
- Notification system

---

## Changelog

### v1.0

- Initial release
- Dashboard, Table, Gantt, and Settings views
- Three-layer persistence (localStorage + embedded HTML data + auto-export `.labwip`)
- Workday-based end date calculation with weekend skipping
- Configurable autosave interval (0 = disabled)
- Manual save button and Ctrl+S shortcut
- Save-on-change with 400 ms debounce
- Dark and light themes
- CSV export
- Firefox-first compatibility
