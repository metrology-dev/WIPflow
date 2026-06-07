/**
 * Migration tests — legacy data loading and status schema upgrades.
 * Critical area: data loss must never occur during migration.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// All globals injected by tests/setup/wipflow-env.js

describe('migrateStatusCategory', () => {
  it('maps known status names (case-insensitive)', () => {
    expect(migrateStatusCategory('not started')).toBe('planned');
    expect(migrateStatusCategory('Not Started')).toBe('planned');
    expect(migrateStatusCategory('NOT STARTED')).toBe('planned');

    expect(migrateStatusCategory('active')).toBe('active');
    expect(migrateStatusCategory('Active')).toBe('active');

    expect(migrateStatusCategory('on hold')).toBe('active');
    expect(migrateStatusCategory('On Hold')).toBe('active');

    expect(migrateStatusCategory('blocked')).toBe('problem');
    expect(migrateStatusCategory('Blocked')).toBe('problem');

    expect(migrateStatusCategory('overdue')).toBe('problem');
    expect(migrateStatusCategory('Overdue')).toBe('problem');

    expect(migrateStatusCategory('completed')).toBe('none');
    expect(migrateStatusCategory('Completed')).toBe('none');
  });

  it('returns "none" for unknown status names', () => {
    expect(migrateStatusCategory('In Review')).toBe('none');
    expect(migrateStatusCategory('Custom')).toBe('none');
    expect(migrateStatusCategory('')).toBe('none');
    expect(migrateStatusCategory(null)).toBe('none');
    expect(migrateStatusCategory(undefined)).toBe('none');
  });
});

describe('ACTIVITY_CATEGORIES', () => {
  it('defines all four system categories', () => {
    expect(VALID_ACTIVITY_CATEGORIES).toContain('planned');
    expect(VALID_ACTIVITY_CATEGORIES).toContain('active');
    expect(VALID_ACTIVITY_CATEGORIES).toContain('problem');
    expect(VALID_ACTIVITY_CATEGORIES).toContain('none');
    expect(VALID_ACTIVITY_CATEGORIES).toHaveLength(4);
  });

  it('each category has label and dot properties', () => {
    for (const key of VALID_ACTIVITY_CATEGORIES) {
      const cat = ACTIVITY_CATEGORIES[key];
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('dot');
      expect(typeof cat.label).toBe('string');
    }
  });

  it('only "none" has a null dot', () => {
    expect(ACTIVITY_CATEGORIES.none.dot).toBeNull();
    expect(ACTIVITY_CATEGORIES.planned.dot).not.toBeNull();
    expect(ACTIVITY_CATEGORIES.active.dot).not.toBeNull();
    expect(ACTIVITY_CATEGORIES.problem.dot).not.toBeNull();
  });
});

describe('AppState.fromJSON — migration', () => {
  beforeEach(() => {
    AppState.tasks = [];
    AppState.settings = Object.assign({}, DEFAULT_SETTINGS);
  });

  it('migrates legacy string statuses to objects', () => {
    AppState.fromJSON({
      version: '1.0',
      settings: { statuses: ['Active', 'Blocked', 'Completed'] },
      tasks: [],
    });
    const statuses = AppState.settings.statuses;
    expect(statuses).toHaveLength(3);
    expect(statuses[0]).toEqual({ name: 'Active',    activityCategory: 'active'  });
    expect(statuses[1]).toEqual({ name: 'Blocked',   activityCategory: 'problem' });
    expect(statuses[2]).toEqual({ name: 'Completed', activityCategory: 'none'    });
  });

  it('assigns "none" for unknown names during migration', () => {
    AppState.fromJSON({
      version: '1.0',
      settings: { statuses: ['Custom Status', 'Another'] },
      tasks: [],
    });
    expect(AppState.settings.statuses[0].activityCategory).toBe('none');
    expect(AppState.settings.statuses[1].activityCategory).toBe('none');
  });

  it('preserves valid object statuses unchanged', () => {
    const statuses = [
      { name: 'Active',    activityCategory: 'active'  },
      { name: 'Planning',  activityCategory: 'planned' },
    ];
    AppState.fromJSON({ version: '1.0', settings: { statuses }, tasks: [] });
    expect(AppState.settings.statuses).toHaveLength(2);
    expect(AppState.settings.statuses[0]).toEqual(statuses[0]);
    expect(AppState.settings.statuses[1]).toEqual(statuses[1]);
  });

  it('fixes object statuses with invalid activityCategory', () => {
    AppState.fromJSON({
      version: '1.0',
      settings: { statuses: [{ name: 'Active', activityCategory: 'invalid-value' }] },
      tasks: [],
    });
    expect(AppState.settings.statuses[0].activityCategory).toBe('active'); // inferred from name
  });

  it('handles mixed legacy string + valid object statuses', () => {
    AppState.fromJSON({
      version: '1.0',
      settings: {
        statuses: [
          'Not Started',
          { name: 'Active', activityCategory: 'active' },
        ],
      },
      tasks: [],
    });
    expect(AppState.settings.statuses).toHaveLength(2);
    expect(AppState.settings.statuses[0]).toEqual({ name: 'Not Started', activityCategory: 'planned' });
    expect(AppState.settings.statuses[1]).toEqual({ name: 'Active',       activityCategory: 'active'  });
  });

  it('fills in DEFAULT_SETTINGS for missing settings keys', () => {
    AppState.fromJSON({ version: '1.0', settings: {}, tasks: [] });
    expect(Array.isArray(AppState.settings.statuses)).toBe(true);
    expect(typeof AppState.settings.theme).toBe('string');
    expect(Array.isArray(AppState.settings.labs)).toBe(true);
    expect(Array.isArray(AppState.settings.holidays)).toBe(true);
  });

  it('preserves all task data unchanged', () => {
    const tasks = [
      { id: 'task_1', name: 'Task A', startDate: '2026-01-01', endDate: '2026-01-05', status: 'Active' },
      { id: 'task_2', name: 'Task B', startDate: '2026-02-01', endDate: '2026-02-10', status: 'Completed' },
    ];
    AppState.fromJSON({ version: '1.0', settings: {}, tasks });
    expect(AppState.tasks).toHaveLength(2);
    expect(AppState.tasks[0].name).toBe('Task A');
    expect(AppState.tasks[1].name).toBe('Task B');
  });

  it('throws on missing or invalid format', () => {
    expect(() => AppState.fromJSON(null)).toThrow();
    expect(() => AppState.fromJSON({})).toThrow();
    expect(() => AppState.fromJSON({ version: '' })).toThrow();
  });
});
