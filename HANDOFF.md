# WIP Flow — Agent Handoff

**Project:** WIPflow (`C:\Users\rosik\Sync\AI_Work\WIPflow`)  
**Last worked:** 2026-05-31  
**Git branch:** `master`  
**Last commit:** see `git log --oneline -3`

---

## What this project is

WIP Flow is a **single-file offline-first HTML application** (`WIPflow.html`) for tracking laboratory work-in-progress. No build step, no dependencies, no server. Open the file in a browser and it runs. All data persists in `localStorage` and as embedded JSON in the HTML file itself.

The full architecture is documented in [CLAUDE.md](CLAUDE.md). The user-facing manual lives inside the app itself (Help and About views). Technical documentation that predates the rebrand is at [WIPflow_DOCUMENTATION.md](WIPflow_DOCUMENTATION.md) — treat it as historical context; CLAUDE.md and the in-app Help/About are the current source of truth.

---

## What was done in the last session

Two commits were made. Diff: `git show HEAD` and `git show HEAD~1`.

**Commit 1 (`87382b8`)** — All TODO items implemented:
- Bug fixes: TaskModal toast (#1), holiday recalculation (#3)
- Kanban: equal-height columns, name clamp, empty state, theme re-render, onDrop guard (#4, 5, 6, 9, 13)
- UX: `disabled` end date, Gantt tooltip leak fix (#7, 10)
- Low priority: "Save as HTML" sidebar button, dashboard empty state (#11, 12)
- Versioning: `MAJOR.MINOR.SAVE` format, `saveVersion` in settings, versioned export filename (#14)
- Assets: app renamed **WIP Flow**, base64 favicons + sidebar logo (#15)
- [TODO.md](TODO.md) updated to mark all items complete

**Commit 2 (HEAD)** — Help, About, handoff, CLAUDE.md:
- In-app **Help** view (`#view-help`): manual covering all features; detailed sections on saving/portability and versioning
- In-app **About** view (`#view-about`): description, author, version (dynamic), changelog, architecture table
- This handoff document
- [CLAUDE.md](CLAUDE.md) updated with current module map, workflow rules, and maintenance conventions

---

## Current version

`APP_BASE_VERSION = '1.2'` (hardcoded in `WIPflow.html` near line 1690).  
`saveVersion` auto-increments in `AppState.settings` on each "Save as HTML" click.  
Displayed as `v1.2.N` in sidebar and About view.

---

## Key file locations in WIPflow.html

All line numbers are approximate — search by the patterns below.

| What | How to find |
|---|---|
| Version constant | `grep -n "APP_BASE_VERSION"` |
| Default settings / seed data | `grep -n "DEFAULT_SETTINGS"` |
| Module declarations | `grep -n "^const \(AppState\|Storage\|App\|Gantt\|Dashboard\|TableView\|KanbanView\|Settings\|Toast\|TaskModal\)"` |
| Nav items (sidebar) | `grep -n "nav-item.*data-view"` |
| View panels (HTML) | `grep -n "view-panel"` |
| switchView() | `grep -n "switchView"` |
| exportHTML() | `grep -n "exportHTML"` |
| CSS design tokens | Top of `<style>` block — `:root {` |

---

## Active backlog

[TODO.md](TODO.md) — currently empty (all items shipped). Add new items there as they arise.

---

## Rules the previous agent followed (from CLAUDE.md)

1. **Never introduce a build step** — all code stays inline in `WIPflow.html`.
2. **No classes** — all JS modules are plain object literals.
3. **Escape user content** with `escHtml()` before any `innerHTML` interpolation.
4. **`markDirty()` not `save()`** for UI-triggered mutations (debounced).
5. **Bump `APP_BASE_VERSION` MINOR** when fixing bugs or making small improvements; bump MAJOR for breaking changes.
6. **Update Help + About** when adding or changing features.
7. **Update TODO.md** to reflect new backlog items or completed work.
8. **Commit** after each logical unit of work with a descriptive message.

---

## Suggested skills

Invoke these via the Skill tool when relevant:

| Skill | When to invoke |
|---|---|
| `/verify` | After any code change — launches the app in the preview panel and checks the golden path |
| `/run` | To start the Python static server and open the app (if preview isn't already running) |
| `/code-review` | Before committing a large diff — checks for bugs and simplification opportunities |
| `/simplify` | After a large feature addition — trims unnecessary abstractions |
| `/fewer-permission-prompts` | If permission prompts for Bash/MCP tools become noisy |

---

## Known constraints

- **Firefox is the primary target** — avoid Chrome-only APIs (e.g. File System Access API).
- `WIPflow.html` is currently ~3 600 lines. Keep additions proportionate.
- The `_tooltipBound` guard on `Gantt` must **not** be reset between renders — only on full destroy.
- `localStorage` is scoped to the file URL. Always remind users to use "Save as HTML" for portability.
