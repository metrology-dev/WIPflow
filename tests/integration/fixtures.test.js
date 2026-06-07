/**
 * Fixture-based integration tests.
 * Verifies that AppState.fromJSON correctly loads each fixture,
 * that all migration logic fires, and that data integrity is preserved.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fix = (name) => JSON.parse(readFileSync(resolve(__dirname, '../fixtures', name), 'utf8'));

// Globals injected by tests/setup/wipflow-env.js

function resetState() {
  AppState.tasks = [];
  AppState.settings = Object.assign({}, DEFAULT_SETTINGS);
}

// ── legacy-v1.wipflow ─────────────────────────────────────────────────────────
describe('legacy-v1.wipflow — string status migration', () => {
  beforeEach(resetState);

  it('loads without error', () => {
    expect(() => AppState.fromJSON(fix('legacy-v1.wipflow'))).not.toThrow();
  });

  it('migrates all 5 string statuses to objects', () => {
    AppState.fromJSON(fix('legacy-v1.wipflow'));
    const statuses = AppState.settings.statuses;
    expect(statuses).toHaveLength(5);
    statuses.forEach(s => {
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('activityCategory');
      expect(VALID_ACTIVITY_CATEGORIES).toContain(s.activityCategory);
    });
  });

  it('maps known status names correctly', () => {
    AppState.fromJSON(fix('legacy-v1.wipflow'));
    const byName = Object.fromEntries(AppState.settings.statuses.map(s => [s.name, s.activityCategory]));
    expect(byName['Not Started']).toBe('planned');
    expect(byName['Active']).toBe('active');
    expect(byName['On Hold']).toBe('active');
    expect(byName['Blocked']).toBe('problem');
    expect(byName['Completed']).toBe('none');
  });

  it('preserves all 5 tasks with correct data', () => {
    AppState.fromJSON(fix('legacy-v1.wipflow'));
    expect(AppState.tasks).toHaveLength(5);
    const alpha = AppState.tasks.find(t => t.id === 'task_legacy_001');
    expect(alpha).toBeDefined();
    expect(alpha.name).toBe('Legacy Task Alpha');
    expect(alpha.status).toBe('Active');
    expect(alpha.progress).toBe(50);
  });

  it('fills in DEFAULT_SETTINGS fields that were missing', () => {
    AppState.fromJSON(fix('legacy-v1.wipflow'));
    // legacy-v1 has no calendarWeekNumbering — should be filled from DEFAULT_SETTINGS
    expect(AppState.settings.calendarWeekNumbering).toBeDefined();
    expect(AppState.settings.calendarFirstDay).toBeDefined();
  });

  it('round-trips without data loss', () => {
    AppState.fromJSON(fix('legacy-v1.wipflow'));
    const snapshot1 = AppState.toJSON();
    AppState.fromJSON(snapshot1);
    const snapshot2 = AppState.toJSON();
    expect(snapshot2.tasks).toHaveLength(snapshot1.tasks.length);
    expect(snapshot2.settings.statuses).toHaveLength(snapshot1.settings.statuses.length);
  });
});

// ── legacy-v2.wipflow ─────────────────────────────────────────────────────────
describe('legacy-v2.wipflow — partial object status migration', () => {
  beforeEach(resetState);

  it('loads without error', () => {
    expect(() => AppState.fromJSON(fix('legacy-v2.wipflow'))).not.toThrow();
  });

  it('fixes the missing activityCategory on "Not Started"', () => {
    AppState.fromJSON(fix('legacy-v2.wipflow'));
    const notStarted = AppState.settings.statuses.find(s => s.name === 'Not Started');
    expect(notStarted).toBeDefined();
    expect(VALID_ACTIVITY_CATEGORIES).toContain(notStarted.activityCategory);
  });

  it('fixes the invalid activityCategory on "In Progress"', () => {
    AppState.fromJSON(fix('legacy-v2.wipflow'));
    const inProgress = AppState.settings.statuses.find(s => s.name === 'In Progress');
    expect(inProgress).toBeDefined();
    // 'invalid-category' → inferred from name 'In Progress' → 'none' (not a known name)
    expect(VALID_ACTIVITY_CATEGORIES).toContain(inProgress.activityCategory);
  });

  it('preserves valid object statuses unchanged', () => {
    AppState.fromJSON(fix('legacy-v2.wipflow'));
    const active = AppState.settings.statuses.find(s => s.name === 'Active');
    expect(active.activityCategory).toBe('active');
    const review = AppState.settings.statuses.find(s => s.name === 'Review');
    expect(review.activityCategory).toBe('active');
    const done = AppState.settings.statuses.find(s => s.name === 'Done');
    expect(done.activityCategory).toBe('none');
  });

  it('preserves all tasks, settings, and custom group terminology', () => {
    AppState.fromJSON(fix('legacy-v2.wipflow'));
    expect(AppState.tasks).toHaveLength(5);
    expect(AppState.settings.groupSingular).toBe('Department');
    expect(AppState.settings.groupPlural).toBe('Departments');
    expect(AppState.settings.theme).toBe('light');
  });

  it('round-trips without data loss', () => {
    AppState.fromJSON(fix('legacy-v2.wipflow'));
    const snap1 = AppState.toJSON();
    AppState.fromJSON(snap1);
    const snap2 = AppState.toJSON();
    // All statuses should have valid activityCategory after second load
    snap2.settings.statuses.forEach(s => {
      expect(VALID_ACTIVITY_CATEGORIES).toContain(s.activityCategory);
    });
    expect(snap2.tasks).toHaveLength(5);
  });
});

// ── golden-project.wipflow ────────────────────────────────────────────────────
describe('golden-project.wipflow — data integrity', () => {
  beforeEach(() => {
    resetState();
    AppState.fromJSON(fix('golden-project.wipflow'));
  });

  it('loads without error', () => {
    expect(AppState.tasks.length).toBeGreaterThan(0);
  });

  it('has 143 tasks', () => {
    expect(AppState.tasks).toHaveLength(143);
  });

  it('all statuses have valid activityCategory', () => {
    AppState.settings.statuses.forEach(s => {
      expect(VALID_ACTIVITY_CATEGORIES, `${s.name} should have a valid category`).toContain(s.activityCategory);
    });
  });

  it('all 12 statuses are present', () => {
    expect(AppState.settings.statuses).toHaveLength(12);
  });

  it('all 4 activity categories are represented in statuses', () => {
    const categories = new Set(AppState.settings.statuses.map(s => s.activityCategory));
    expect(categories.has('planned')).toBe(true);
    expect(categories.has('active')).toBe(true);
    expect(categories.has('problem')).toBe(true);
    expect(categories.has('none')).toBe(true);
  });

  it('all 12 labs (groups) are configured', () => {
    expect(AppState.settings.labs).toHaveLength(12);
  });

  it('all 5 persons are configured', () => {
    expect(AppState.settings.persons).toHaveLength(5);
  });

  it('all 8 priorities are configured', () => {
    expect(AppState.settings.priorities).toHaveLength(8);
  });

  it('every task has required fields', () => {
    AppState.tasks.forEach(t => {
      expect(t.id, `task ${t.name}`).toBeTruthy();
      expect(t.name, `task id ${t.id}`).toBeTruthy();
      expect(t.startDate, `task ${t.name}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.endDate, `task ${t.name}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof t.workdays, `task ${t.name}`).toBe('number');
      expect(typeof t.alloc, `task ${t.name}`).toBe('number');
      expect(typeof t.progress, `task ${t.name}`).toBe('number');
    });
  });

  it('every task\'s endDate is not before startDate', () => {
    AppState.tasks.forEach(t => {
      expect(t.endDate >= t.startDate, `task ${t.name}: end must be ≥ start`).toBe(true);
    });
  });

  it('data covers past, present, and future dates', () => {
    const today = '2026-06-07';
    const hasPast    = AppState.tasks.some(t => t.endDate < today);
    const hasPresent = AppState.tasks.some(t => t.startDate <= today && t.endDate >= today);
    const hasFuture  = AppState.tasks.some(t => t.startDate > today);
    expect(hasPast).toBe(true);
    expect(hasPresent).toBe(true);
    expect(hasFuture).toBe(true);
  });

  it('all configured labs have at least one task', () => {
    const labsWithTasks = new Set(AppState.tasks.map(t => t.lab));
    AppState.settings.labs.forEach(lab => {
      expect(labsWithTasks.has(lab), `lab "${lab}" has no tasks`).toBe(true);
    });
  });

  it('all configured persons have at least one task', () => {
    const personsWithTasks = new Set(AppState.tasks.map(t => t.person));
    AppState.settings.persons.forEach(p => {
      expect(personsWithTasks.has(p), `person "${p}" has no tasks`).toBe(true);
    });
  });

  it('all configured statuses have at least one task', () => {
    const statusesWithTasks = new Set(AppState.tasks.map(t => t.status));
    AppState.settings.statuses.forEach(s => {
      expect(statusesWithTasks.has(s.name), `status "${s.name}" has no tasks`).toBe(true);
    });
  });

  it('all configured priorities have at least one task', () => {
    const prioritiesWithTasks = new Set(AppState.tasks.map(t => t.priority));
    AppState.settings.priorities.forEach(p => {
      expect(prioritiesWithTasks.has(p), `priority "${p}" has no tasks`).toBe(true);
    });
  });

  describe('filtering integrity', () => {
    it('every filter combination returns results', () => {
      const labs     = AppState.settings.labs;
      const persons  = AppState.settings.persons;
      const statuses = AppState.settings.statuses.map(s => s.name);
      const priorities = AppState.settings.priorities;

      labs.forEach(lab => {
        const result = AppState.getFilteredTasks({ lab });
        expect(result.length, `filter by lab "${lab}"`).toBeGreaterThan(0);
      });
      persons.forEach(person => {
        const result = AppState.getFilteredTasks({ person });
        expect(result.length, `filter by person "${person}"`).toBeGreaterThan(0);
      });
      statuses.forEach(status => {
        const result = AppState.getFilteredTasks({ status });
        expect(result.length, `filter by status "${status}"`).toBeGreaterThan(0);
      });
      priorities.forEach(priority => {
        const result = AppState.getFilteredTasks({ priority });
        expect(result.length, `filter by priority "${priority}"`).toBeGreaterThan(0);
      });
    });

    it('selectedDate filter returns tasks spanning today', () => {
      const today = '2026-06-07';
      const result = AppState.getFilteredTasks({ selectedDate: today });
      expect(result.length).toBeGreaterThan(0);
      result.forEach(t => {
        expect(t.startDate <= today && t.endDate >= today, `task ${t.name}`).toBe(true);
      });
    });
  });

  describe('save/load integrity', () => {
    it('round-trip preserves task count', () => {
      const originalCount = AppState.tasks.length;
      const json = AppState.toJSON();
      AppState.tasks = [];
      AppState.fromJSON(json);
      expect(AppState.tasks).toHaveLength(originalCount);
    });

    it('round-trip preserves status objects with categories', () => {
      const originalStatuses = JSON.parse(JSON.stringify(AppState.settings.statuses));
      const json = AppState.toJSON();
      AppState.fromJSON(json);
      expect(AppState.settings.statuses).toEqual(originalStatuses);
    });

    it('round-trip preserves all task fields', () => {
      const original = AppState.tasks[0];
      const json = AppState.toJSON();
      AppState.fromJSON(json);
      const restored = AppState.tasks[0];
      expect(restored).toEqual(original);
    });
  });
});
