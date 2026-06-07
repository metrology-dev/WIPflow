/**
 * AppState unit tests — CRUD operations, serialisation, and filtering.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Globals injected by tests/setup/wipflow-env.js

// Helper: create a minimal valid task
function makeTask(overrides = {}) {
  return {
    name:      'Test Task',
    lab:       'RMP',
    person:    'Anna S.',
    priority:  'Medium',
    status:    'Active',
    startDate: '2026-06-01',
    endDate:   '2026-06-05',
    workdays:  5,
    alloc:     100,
    progress:  0,
    description: '',
    tags: '',
    notes: '',
    ...overrides,
  };
}

describe('AppState — task CRUD', () => {
  beforeEach(() => {
    AppState.tasks = [];
    AppState.settings = Object.assign({}, DEFAULT_SETTINGS);
  });

  describe('saveTask (create)', () => {
    it('adds a new task and returns it', () => {
      const task = AppState.saveTask(makeTask());
      expect(AppState.tasks).toHaveLength(1);
      expect(task.name).toBe('Test Task');
    });

    it('assigns a unique id when none is provided', () => {
      const t1 = AppState.saveTask(makeTask({ name: 'A' }));
      const t2 = AppState.saveTask(makeTask({ name: 'B' }));
      expect(t1.id).toBeTruthy();
      expect(t2.id).toBeTruthy();
      expect(t1.id).not.toBe(t2.id);
    });

    it('sets created and modified timestamps', () => {
      const before = Date.now();
      const task = AppState.saveTask(makeTask());
      const after = Date.now();
      expect(new Date(task.created).getTime()).toBeGreaterThanOrEqual(before);
      expect(new Date(task.created).getTime()).toBeLessThanOrEqual(after);
      expect(task.modified).toBeTruthy();
    });

    it('preserves a provided id', () => {
      const task = AppState.saveTask(makeTask({ id: 'task_custom_id' }));
      expect(task.id).toBe('task_custom_id');
    });
  });

  describe('saveTask (update)', () => {
    it('updates an existing task by id', () => {
      const task = AppState.saveTask(makeTask());
      AppState.saveTask({ id: task.id, name: 'Updated Name' });
      expect(AppState.tasks).toHaveLength(1);
      expect(AppState.tasks[0].name).toBe('Updated Name');
    });

    it('preserves unchanged fields when updating', () => {
      const task = AppState.saveTask(makeTask({ lab: 'RAL', priority: 'High' }));
      AppState.saveTask({ id: task.id, name: 'New Name' });
      expect(AppState.tasks[0].lab).toBe('RAL');
      expect(AppState.tasks[0].priority).toBe('High');
    });

    it('updates the modified timestamp on update', () => {
      const task = AppState.saveTask(makeTask());
      const originalModified = task.modified;
      // Small delay to ensure timestamp differs
      return new Promise(resolve => setTimeout(() => {
        AppState.saveTask({ id: task.id, name: 'Changed' });
        expect(AppState.tasks[0].modified).not.toBe(originalModified);
        resolve();
      }, 10));
    });
  });

  describe('deleteTask', () => {
    it('removes the task with the given id', () => {
      const t1 = AppState.saveTask(makeTask({ name: 'A' }));
      const t2 = AppState.saveTask(makeTask({ name: 'B' }));
      AppState.deleteTask(t1.id);
      expect(AppState.tasks).toHaveLength(1);
      expect(AppState.tasks[0].id).toBe(t2.id);
    });

    it('is a no-op for a non-existent id', () => {
      AppState.saveTask(makeTask());
      AppState.deleteTask('task_does_not_exist');
      expect(AppState.tasks).toHaveLength(1);
    });
  });

  describe('getTask', () => {
    it('returns the task with the matching id', () => {
      const task = AppState.saveTask(makeTask({ name: 'Find Me' }));
      expect(AppState.getTask(task.id).name).toBe('Find Me');
    });

    it('returns undefined for a non-existent id', () => {
      expect(AppState.getTask('task_not_here')).toBeUndefined();
    });
  });
});

describe('AppState — serialisation', () => {
  beforeEach(() => {
    AppState.tasks = [];
    AppState.settings = Object.assign({}, DEFAULT_SETTINGS);
  });

  it('toJSON returns a snapshot with version, settings, and tasks', () => {
    AppState.saveTask(makeTask());
    const json = AppState.toJSON();
    expect(json).toHaveProperty('version');
    expect(json).toHaveProperty('settings');
    expect(json).toHaveProperty('tasks');
    expect(json.tasks).toHaveLength(1);
  });

  it('round-trip: toJSON → fromJSON preserves all tasks', () => {
    AppState.saveTask(makeTask({ name: 'Alpha', priority: 'Critical' }));
    AppState.saveTask(makeTask({ name: 'Beta',  priority: 'Low'      }));
    const json = AppState.toJSON();
    AppState.tasks = [];
    AppState.fromJSON(json);
    expect(AppState.tasks).toHaveLength(2);
    expect(AppState.tasks[0].name).toBe('Alpha');
    expect(AppState.tasks[1].name).toBe('Beta');
  });

  it('round-trip preserves settings including statuses', () => {
    AppState.settings.theme = 'light';
    const json = AppState.toJSON();
    AppState.fromJSON(json);
    expect(AppState.settings.theme).toBe('light');
    expect(Array.isArray(AppState.settings.statuses)).toBe(true);
    expect(AppState.settings.statuses[0]).toHaveProperty('name');
    expect(AppState.settings.statuses[0]).toHaveProperty('activityCategory');
  });
});

describe('AppState.getFilteredTasks', () => {
  beforeEach(() => {
    AppState.tasks = [];
    AppState.settings = Object.assign({}, DEFAULT_SETTINGS);
  });

  function seed() {
    AppState.saveTask(makeTask({ name: 'Alpha', lab: 'RMP', person: 'Anna S.',  status: 'Active',    priority: 'High',   startDate: '2026-06-01', endDate: '2026-06-10' }));
    AppState.saveTask(makeTask({ name: 'Beta',  lab: 'RAL', person: 'Erik L.',  status: 'Completed', priority: 'Low',    startDate: '2026-05-01', endDate: '2026-05-15' }));
    AppState.saveTask(makeTask({ name: 'Gamma', lab: 'RMP', person: 'Anna S.',  status: 'Blocked',   priority: 'High',   startDate: '2026-06-15', endDate: '2026-06-20' }));
    AppState.saveTask(makeTask({ name: 'Delta', lab: 'RnL', person: 'Maria H.', status: 'Active',    priority: 'Medium', startDate: '2026-07-01', endDate: '2026-07-10',
                                  description: 'keyword match', tags: 'urgent' }));
  }

  it('returns all tasks when no filters are given', () => {
    seed();
    expect(AppState.getFilteredTasks({}).length).toBe(4);
  });

  it('filters by lab', () => {
    seed();
    const result = AppState.getFilteredTasks({ lab: 'RMP' });
    expect(result).toHaveLength(2);
    expect(result.every(t => t.lab === 'RMP')).toBe(true);
  });

  it('filters by person', () => {
    seed();
    const result = AppState.getFilteredTasks({ person: 'Anna S.' });
    expect(result).toHaveLength(2);
  });

  it('filters by status', () => {
    seed();
    const result = AppState.getFilteredTasks({ status: 'Active' });
    expect(result).toHaveLength(2);
    expect(result.every(t => t.status === 'Active')).toBe(true);
  });

  it('filters by priority', () => {
    seed();
    const result = AppState.getFilteredTasks({ priority: 'High' });
    expect(result).toHaveLength(2);
    expect(result.every(t => t.priority === 'High')).toBe(true);
  });

  it('filters by search (name)', () => {
    seed();
    expect(AppState.getFilteredTasks({ search: 'gamma' })).toHaveLength(1);
    expect(AppState.getFilteredTasks({ search: 'ALPHA' })).toHaveLength(1);
  });

  it('filters by search (description)', () => {
    seed();
    const result = AppState.getFilteredTasks({ search: 'keyword match' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Delta');
  });

  it('filters by search (tags)', () => {
    seed();
    const result = AppState.getFilteredTasks({ search: 'urgent' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Delta');
  });

  it('combines multiple filters (AND logic)', () => {
    seed();
    const result = AppState.getFilteredTasks({ lab: 'RMP', status: 'Active' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alpha');
  });

  describe('selectedDate filter', () => {
    it('includes tasks that span the selected date', () => {
      seed();
      // 'Alpha' runs 2026-06-01..2026-06-10, so 2026-06-05 is within
      const result = AppState.getFilteredTasks({ selectedDate: '2026-06-05' });
      expect(result.some(t => t.name === 'Alpha')).toBe(true);
    });

    it('excludes tasks that do not span the selected date', () => {
      seed();
      // 'Beta' runs 2026-05-01..2026-05-15, outside of 2026-06-05
      const result = AppState.getFilteredTasks({ selectedDate: '2026-06-05' });
      expect(result.some(t => t.name === 'Beta')).toBe(false);
    });

    it('includes tasks whose startDate equals the selected date', () => {
      seed();
      const result = AppState.getFilteredTasks({ selectedDate: '2026-06-01' });
      expect(result.some(t => t.name === 'Alpha')).toBe(true);
    });

    it('includes tasks whose endDate equals the selected date', () => {
      seed();
      const result = AppState.getFilteredTasks({ selectedDate: '2026-06-10' });
      expect(result.some(t => t.name === 'Alpha')).toBe(true);
    });

    it('excludes tasks on a date strictly before startDate', () => {
      seed();
      const result = AppState.getFilteredTasks({ selectedDate: '2026-05-31' });
      expect(result.some(t => t.name === 'Alpha')).toBe(false);
    });

    it('excludes tasks on a date strictly after endDate', () => {
      seed();
      const result = AppState.getFilteredTasks({ selectedDate: '2026-06-11' });
      expect(result.some(t => t.name === 'Alpha')).toBe(false);
    });
  });

  describe('sorting', () => {
    it('sorts by name ascending', () => {
      seed();
      const result = AppState.getFilteredTasks({}, 'name', 'asc');
      const names = result.map(t => t.name);
      expect(names).toEqual([...names].sort());
    });

    it('sorts by name descending', () => {
      seed();
      const result = AppState.getFilteredTasks({}, 'name', 'desc');
      const names = result.map(t => t.name);
      expect(names).toEqual([...names].sort().reverse());
    });

    it('sorts by numeric workdays', () => {
      AppState.tasks = [];
      AppState.saveTask(makeTask({ name: 'A', workdays: 10 }));
      AppState.saveTask(makeTask({ name: 'B', workdays: 3  }));
      AppState.saveTask(makeTask({ name: 'C', workdays: 7  }));
      const result = AppState.getFilteredTasks({}, 'workdays', 'asc');
      expect(result.map(t => t.workdays)).toEqual([3, 7, 10]);
    });
  });
});
