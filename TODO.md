# LabWIP — Development TODO

Items grouped by priority. Bugs are confirmed against the current source.

---

## 🔴 Bugs (confirmed)

### 1. GanttFilters populates wrong data
**File:** `GanttFilters.populate()` (lines 2872–2874)  
Both `gantt-filter-person` and `gantt-filter-status` are populated with
`AppState.settings.labs` instead of `.persons` and `.statuses`. Person and
status filtering in the Gantt view is completely broken as a result.

**Fix:** Pass the correct arrays.
```js
setOpts('gantt-filter-person', 'All Staff',    AppState.settings.persons);
setOpts('gantt-filter-status', 'All Statuses', AppState.settings.statuses);
```

---

### 2. Task modal toast always shows "Task created"
**File:** `TaskModal.save()` (line 2298)  
`this.close()` is called at line 2296, which sets `this._editId = null`.
The toast at line 2298 then checks `this._editId`, which is always `null`,
so it always shows "Task created" even when editing an existing task.

**Fix:** Capture the ID before calling `close()`.
```js
const wasEdit = !!this._editId;
AppState.saveTask(data);
this.close();
App.refresh();
Toast.show(wasEdit ? 'Task updated' : 'Task created', 'success');
```

---

### 3. Holiday additions do not recalculate existing task end dates
**File:** `Settings.addHoliday()` and `importHolidaysCSV()`  
Adding or importing holidays saves to settings but does not call
`App.refresh()`. All tasks with calculated end dates remain stale — they
were computed without the new holiday and will show wrong end dates until
the task is manually re-saved.

**Fix:** After `Storage.save()` in both `addHoliday()` and after the
`if (added > 0)` block in `importHolidaysCSV`, add `App.refresh()`.

---

## 🟠 Kanban improvements

### 4. Kanban: equal-height columns for easier horizontal drag (requested)
Currently each column shrinks to fit its card count. A column with one
card is very short, making it hard to drag a card from a tall column and
drop it there. All columns should share the height of the tallest column
so the full column area is always a valid drop target.

**Fix:** Apply `align-items: stretch` on `.kanban-board` and set
`min-height` on `.kanban-col-body` dynamically (or CSS `flex: 1` with a
board-level `min-height`). The simplest CSS-only fix:
```css
.kanban-board { align-items: stretch; }
.kanban-col   { min-height: 100%; }
```
The column bodies already have `flex: 1`, so they will fill the column
height. The column itself needs `min-height: 100%` or the board needs
`align-items: stretch` (not `flex-start`) so all columns stretch to the
tallest one.

---

### 5. Kanban: long task names overflow card without ellipsis
**File:** `.kc-name` CSS  
No `overflow: hidden` or `text-overflow: ellipsis` is set. Long names
stretch the card width beyond 260 px and break column layout.

**Fix:**
```css
.kc-name { overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
```
(2-line clamp is friendlier than single-line truncation for a card UI.)

---

## 🟡 UX inconsistencies

### 6. Theme switch does not re-render Kanban view
**File:** `Settings.setTheme()`  
When switching between dark and light themes, only Dashboard and Gantt
(canvas-based) are explicitly re-rendered. HTML-based views (Table,
Kanban) are not refreshed, so CSS variable changes are applied but any
dynamically injected inline styles (e.g. priority/status colours in cards)
are stale.

**Fix:** Add `if (App.currentView === 'kanban') KanbanView.render();`
alongside the existing Gantt/Dashboard redraw calls.

---

### 7. Calculated end date field should use `disabled`, not `readonly`
**File:** `#f-enddate` input in the task modal  
The field uses `readonly` which still allows users to click and select
text, implying it is editable. A `disabled` attribute communicates
"computed, not user-editable" more clearly, and `<input disabled>` is
skipped during form submission semantics.

**Fix:** Change `readonly` to `disabled` and update the CSS selector if
it targets `:read-only`.

---

### 8. Gantt sidebar task names clip without ellipsis
**File:** `_renderTaskList()` inline style  
The name div has `overflow:hidden` from its parent but no
`text-overflow:ellipsis`, so text is hard-cut mid-character.

**Fix:**
```css
.gantt-task-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

---

### 9. Kanban board missing empty state
**File:** `KanbanView.render()`  
When filters result in zero tasks, the board renders empty columns with
no message. Table and Gantt both show an explicit "no results" state.

**Fix:** After rendering columns, check if total task count is zero and
insert a centred message inside the board, or add a `<div
class="kanban-empty">` similar to `#gantt-empty`.

---

## 🔵 Performance

### 10. Gantt tooltip event listeners accumulate on every render
**File:** `_bindTooltip()` (canvas `_tooltipBound` guard)  
The guard flag `canvas._tooltipBound` is set on the canvas DOM element.
Because `render()` recreates the canvas (sets `.width` / `.height`,
which resets the element), the flag is gone on the next render cycle and
new listeners are added each time. After many renders the canvas has
many stacked `mousemove` / `click` listeners.

**Fix:** Move the guard to the `Gantt` object itself
(`this._tooltipBound`) rather than the canvas, so it survives
canvas resizes:
```js
_bindTooltip(canvas) {
  if (this._tooltipBound) return;
  this._tooltipBound = true;
  // … rest of bindings
},
```
Reset `this._tooltipBound = false` in a `destroy()` or view-leave hook
only if the element is fully removed from the DOM.

---

## ⚪ Low priority / polish

### 11. Add "Save as HTML" to App.refresh flow hint
When the app is opened from a file path that has changed (e.g. moved to
a new folder), localStorage data from the old path is lost. A subtle
persistent reminder in the footer ("unsaved to file") would prompt users
to export HTML occasionally.

### 12. Dashboard: first-run empty state
When no tasks exist, the KPI section shows all-zero cards with no call
to action. A "Create your first task →" prompt in the otherwise empty
dashboard would help new users.

### 13. Kanban `onDrop` silent failure on invalid drag source
If something other than a task card is dragged into a column (external
text, file, etc.), `AppState.getTask(taskId)` returns `null` and the
drop silently does nothing. A defensive check with a brief error toast
would make the failure visible.

---

## 🎨 Assets

### 14. Embed icon pack as favicon
**Assets:** `IconPack/` — `WIPFlow.ico`, `WIPFlow_16x16.png` through `WIPFlow_256x256.png`

Because the app is a single self-contained HTML file, icons **must be
base64-embedded** — external `href` references break portability when the
file is moved or copied without the `IconPack/` folder.

**Implementation:**
1. Base64-encode the relevant PNG sizes (16, 32, and optionally 180 for
   Apple touch icon).
2. Inject into `<head>` as data URIs:
```html
<link rel="icon" type="image/png" sizes="16x16"
      href="data:image/png;base64,<16x16-base64>">
<link rel="icon" type="image/png" sizes="32x32"
      href="data:image/png;base64,<32x32-base64>">
<link rel="apple-touch-icon" sizes="180x180"
      href="data:image/png;base64,<128x128-base64>">
```
3. The `.ico` is not needed in the HTML (it is useful if the file is ever
   served from a web server as `favicon.ico`, but browsers prefer the
   explicit `<link>` tags above).
4. The 64 px and larger PNGs can be added as `<link rel="icon"
   sizes="64x64">` etc. if desired, but 16 and 32 are sufficient for
   browser tabs and taskbar icons.

**Note:** Base64 of `32x32.png` is typically ~2 KB; all three sizes
together add under 10 KB to the file — negligible for a 200 KB app.
