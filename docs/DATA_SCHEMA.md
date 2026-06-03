# WIP Flow — Data Schema

WIP Flow stores all data in two places simultaneously: the browser's `localStorage` under the key `wipflow-data`, and a `<script id="labwip-embedded-data">` tag inside the HTML file itself. Both use the same JSON envelope.

---

## JSON Envelope

```json
{
  "version": "1.0",
  "settings": { ... },
  "tasks": [ ... ]
}
```

`version` is a fixed schema version string (`"1.0"`), not the app version.

---

## Settings Object

```json
{
  "theme": "dark",
  "autosaveIntervalMinutes": 5,
  "saveVersion": 0,
  "labs": ["Lab A", "Lab B"],
  "persons": ["Alice", "Bob"],
  "priorities": ["High", "Medium", "Low"],
  "statuses": ["Not Started", "Active", "On Hold", "Completed", "Blocked"],
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
| `saveVersion` | number | Incremented automatically on each **↓ Save as HTML** |
| `labs` | string[] | Available group names |
| `persons` | string[] | Available person names |
| `priorities` | string[] | Available priority labels |
| `statuses` | string[] | Available status labels |
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
| Self-contained HTML | `.html` | No (open directly) | Full portable copy with data embedded in a `<script>` tag |
| Backup snapshot | `.labwip` | Yes | Plain JSON — the envelope above |
| CSV | `.csv` | No | One-way export for spreadsheets |
| Excel | `.xls` | No | SpreadsheetML format |

---

## Backwards Compatibility

- Internal field names (`task.lab`, `settings.labs`, CSS class `f-lab`, canvas key `chart-lab`) are intentionally kept as `"lab"` even though the user-facing label is configurable. Changing them would break existing `.labwip` files.
- `AppState.fromJSON` deep-merges loaded settings over `DEFAULT_SETTINGS`, so new keys in `DEFAULT_SETTINGS` appear automatically without requiring a migration.
