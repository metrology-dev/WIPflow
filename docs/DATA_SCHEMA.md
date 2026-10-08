# WIP Flow — Data Schema

WIP Flow stores task data in several places simultaneously:

- **`wipflow-data.json`** — the owned data file. In Chrome/Edge it is the source of truth: written silently on every change via the File System Access API, with the previous version copied to `wipflow-data.json.bak1` (then `.bak2` … `.bak9`) before each write, and the canonical name always holding the newest data. In Firefox/Safari it is a one-way export, because those engines refuse to let a page read local files
- **Browser storage** — always active, under the key `labwip_data`. The fastest layer, and the working copy wherever the data file cannot be read back
- **IndexedDB (`wipflow`)** — holds the persisted data-folder handle (`kv` store) and, in the `backups` store, the last 12 revisions as restore points
- **`<script id="labwip-embedded-data">`** — inside the HTML file; kept in sync on every save and used as the payload for the **↓ Portable snapshot** export, and as a fallback source when nothing else has data

All representations use the same JSON envelope, distinguished by a `revision` counter that
decides which copy is newer. A copy is never chosen by timestamp, and where several files are
present (browsers name repeated downloads `name(1).json`) the highest revision always wins.

---

## JSON Envelope

```json
{
  "version": "3.0",
  "revision": 12,
  "appVersion": "3.0",
  "savedAt": "2026-06-03T09:00:00.000Z",
  "savedFrom": "file:///C:/Apps/WIPflow/WIPflow.html",
  "settings": { ... },
  "tasks": [ ... ]
}
```

| Field | Description |
|-------|-------------|
| `version` | Schema version of the payload |
| `revision` | Monotonically increasing save counter. Used to decide which copy is newer and to detect a file that lags behind the browser copy |
| `appVersion` | `APP_BASE_VERSION` of the build that wrote the payload |
| `savedAt` | ISO timestamp of the save |
| `savedFrom` | URL the payload was written from — makes cross-location confusion visible |

Payloads written before v3.0 have no `revision`; they are accepted and treated as revision 1
so existing `.labwip` backups import cleanly.

---

## Settings Object

```json
{
  "theme": "dark",
  "autosaveIntervalMinutes": 5,
  "saveVersion": 0,
  "revision": 12,
  "labs": ["Lab A", "Lab B"],
  "persons": ["Alice", "Bob"],
  "priorities": ["High", "Medium", "Low"],
  "statuses": [
    {"name": "Not Started", "activityCategory": "planned"},
    {"name": "Active",      "activityCategory": "active"},
    {"name": "On Hold",     "activityCategory": "active"},
    {"name": "Blocked",     "activityCategory": "problem"},
    {"name": "Completed",   "activityCategory": "none"}
  ],
  "tags": ["urgent", "review"],
  "holidays": ["2026-12-25 Christmas", "2027-01-01"],
  "groupSingular": "Group",
  "groupPlural": "Groups",
  "calendarWeekNumbering": "iso",
  "calendarFirstDay": "mon",
  "calendarShowOutsideDays": false
}
```

### Settings fields

| Field | Type | Description |
|-------|------|-------------|
| `theme` | `"dark"` \| `"light"` | UI colour scheme |
| `autosaveIntervalMinutes` | number | Periodic autosave interval; `0` disables it |
| `saveVersion` | number | Incremented automatically on each **↓ Portable snapshot** |
| `revision` | number | Monotonically increasing data revision, incremented on every save |
| `labs` | string[] | Available group names |
| `persons` | string[] | Available person names |
| `priorities` | string[] | Available priority labels |
| `statuses` | `{name: string, activityCategory: string}[]` | Available status objects. `activityCategory` is one of `planned`, `active`, `problem`, `none` — controls calendar dot rendering. Legacy string arrays are auto-migrated on load |
| `tags` | string[] | Available tag labels |
| `holidays` | string[] | Dates excluded from workday counts; format `"YYYY-MM-DD"` or `"YYYY-MM-DD Name"` |
| `groupSingular` | string | Singular label for the grouping concept (e.g. `"Department"`) |
| `groupPlural` | string | Plural label for the grouping concept (e.g. `"Departments"`) |
| `calendarWeekNumbering` | `"iso"` \| `"us"` | ISO 8601 or US-style week numbering |
| `calendarFirstDay` | `"mon"` \| `"sun"` | First day of week in the sidebar calendar |
| `calendarShowOutsideDays` | boolean | Show days from adjacent months in the calendar grid |

New keys added to `DEFAULT_SETTINGS` appear automatically for existing users on next load via `AppState.fromJSON` merge.

---

## Task Object

```json
{
  "id": "task_1748721600000_abc123",
  "name": "Synthesis of compound X",
  "lab": "Lab A",
  "person": "Alice",
  "priority": "High",
  "status": "Active",
  "startDate": "2026-06-01",
  "endDate": "2026-06-15",
  "workdays": 10,
  "alloc": 50,
  "progress": 40,
  "description": "Full synthesis protocol...",
  "tags": "urgent,review",
  "notes": "Internal notes...",
  "created": "2026-06-01T10:00:00.000Z",
  "modified": "2026-06-03T09:00:00.000Z"
}
```

### Task fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier — `task_<timestamp>_<random>` |
| `name` | string | Task name (required) |
| `lab` | string | Group assignment (matches a value in `settings.labs`). Field name kept as `lab` for backwards compatibility |
| `person` | string | Assignee (matches a value in `settings.persons`) |
| `priority` | string | Priority level (matches a value in `settings.priorities`) |
| `status` | string | Workflow state (matches a value in `settings.statuses`) |
| `startDate` | `YYYY-MM-DD` | Task start date |
| `endDate` | `YYYY-MM-DD` | Calculated end date (auto-computed from `startDate`, `workdays`, `alloc`, and holidays) |
| `workdays` | number | Estimated effort in working days |
| `alloc` | number | Allocation percentage (1–100); default `100` |
| `progress` | number | Completion percentage (0–100) |
| `description` | string | Free-text description |
| `tags` | string | Comma-separated tag list (matches values in `settings.tags`) |
| `notes` | string | Internal notes |
| `created` | ISO 8601 | Creation timestamp |
| `modified` | ISO 8601 | Last-modified timestamp |

---

## Import/Export Formats

| Format | Extension | Re-importable | Notes |
|--------|-----------|---------------|-------|
| Data file | `.json` | Yes (via **Load data file…**) | `wipflow-data.json` — the live source of truth in Chrome/Edge |
| Backup history | `.json.bakN` | Yes | `wipflow-data.json.bak1` … `.bak9`, written where the app may write files. The canonical file always holds the newest data |
| Self-contained HTML | `.html` | No (open directly) | Portable snapshot with the data embedded in a `<script>` tag |
| Backup snapshot | `.labwip` | Yes | Plain JSON — the envelope above |
| CSV | `.csv` | No | One-way export for spreadsheets |
| Excel | `.xls` | No | SpreadsheetML format |

---

## Backwards Compatibility

- Internal field names (`task.lab`, `settings.labs`, CSS class `f-lab`, canvas key `chart-lab`) are intentionally kept as `"lab"` even though the user-facing label is configurable. Changing them would break existing `.labwip` files.
- `AppState.fromJSON` merges loaded settings over `DEFAULT_SETTINGS`, so new keys in `DEFAULT_SETTINGS` appear automatically without requiring a migration.
- `settings.statuses` was a plain string array before v2.4. `AppState.fromJSON` auto-migrates legacy string entries to `{name, activityCategory}` objects using name-based heuristics (case-insensitive). Unknown names default to `activityCategory: "none"`. No data is lost.
- Payloads without `revision` (v2.5 and earlier) are treated as revision 1.
- The pre-3.0 browser storage key `wipflow_data` is read once on first run, adopted, and then removed once the data has been written to the new key. Nothing is discarded.
- **Local file reads are not universally available.** Firefox blocks them by default (`security.fileuri.strict_origin_policy = true`); Chromium and WebKit refuse `file://` requests outright. `DataFile.canRead()` reports this, and the UI states it instead of failing silently. Where reads are blocked the data file must be loaded explicitly with **Load data file…**.
