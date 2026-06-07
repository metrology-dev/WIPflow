/**
 * WorkCalendar unit tests.
 * All functions tested here are pure date math; no DOM involvement.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// WorkCalendar and AppState are injected by tests/setup/wipflow-env.js

describe('WorkCalendar', () => {

  // ── isWorkday ─────────────────────────────────────────────────────────────
  describe('isWorkday', () => {
    it('Monday–Friday are workdays', () => {
      // 2026-06-01 is a Monday
      for (let i = 0; i < 5; i++) {
        const d = new Date('2026-06-01T12:00:00');
        d.setDate(d.getDate() + i);
        expect(WorkCalendar.isWorkday(d), `day ${i}`).toBe(true);
      }
    });

    it('Saturday is not a workday', () => {
      expect(WorkCalendar.isWorkday(new Date('2026-06-06T12:00:00'))).toBe(false);
    });

    it('Sunday is not a workday', () => {
      expect(WorkCalendar.isWorkday(new Date('2026-06-07T12:00:00'))).toBe(false);
    });
  });

  // ── addDays ───────────────────────────────────────────────────────────────
  describe('addDays', () => {
    it('adds positive days', () => {
      const result = WorkCalendar.addDays(new Date('2026-06-01'), 5);
      expect(WorkCalendar.fmt(result)).toBe('2026-06-06');
    });

    it('adds negative days (subtract)', () => {
      const result = WorkCalendar.addDays(new Date('2026-06-06'), -5);
      expect(WorkCalendar.fmt(result)).toBe('2026-06-01');
    });

    it('does not mutate the input date', () => {
      const original = new Date('2026-06-01');
      WorkCalendar.addDays(original, 10);
      expect(WorkCalendar.fmt(original)).toBe('2026-06-01');
    });
  });

  // ── fmt ───────────────────────────────────────────────────────────────────
  describe('fmt', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(WorkCalendar.fmt(new Date('2026-01-05T12:00:00'))).toBe('2026-01-05');
    });

    it('pads single-digit month and day', () => {
      expect(WorkCalendar.fmt(new Date('2026-03-09T12:00:00'))).toBe('2026-03-09');
    });

    it('returns empty string for falsy input', () => {
      expect(WorkCalendar.fmt(null)).toBe('');
      expect(WorkCalendar.fmt(undefined)).toBe('');
    });
  });

  // ── parse ─────────────────────────────────────────────────────────────────
  describe('parse', () => {
    it('parses YYYY-MM-DD into a Date', () => {
      const d = WorkCalendar.parse('2026-06-15');
      expect(d).toBeInstanceOf(Date);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(5); // June = 5
      expect(d.getDate()).toBe(15);
    });

    it('returns null for empty string', () => {
      expect(WorkCalendar.parse('')).toBeNull();
      expect(WorkCalendar.parse(null)).toBeNull();
    });

    it('returns null for invalid date', () => {
      expect(WorkCalendar.parse('not-a-date')).toBeNull();
    });

    it('round-trips through fmt', () => {
      const dateStr = '2026-11-30';
      expect(WorkCalendar.fmt(WorkCalendar.parse(dateStr))).toBe(dateStr);
    });
  });

  // ── daysBetween ───────────────────────────────────────────────────────────
  describe('daysBetween', () => {
    it('returns the number of calendar days between two dates', () => {
      const a = new Date('2026-06-01');
      const b = new Date('2026-06-08');
      expect(WorkCalendar.daysBetween(a, b)).toBe(7);
    });

    it('returns negative when b is before a', () => {
      const a = new Date('2026-06-08');
      const b = new Date('2026-06-01');
      expect(WorkCalendar.daysBetween(a, b)).toBe(-7);
    });

    it('returns null when either argument is falsy', () => {
      expect(WorkCalendar.daysBetween(null, new Date())).toBeNull();
      expect(WorkCalendar.daysBetween(new Date(), null)).toBeNull();
    });
  });

  // ── calcEndDate ───────────────────────────────────────────────────────────
  describe('calcEndDate', () => {
    it('1 workday starting Monday returns Monday', () => {
      // 2026-06-01 = Monday
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-01', 1, 100, []));
      expect(result).toBe('2026-06-01');
    });

    it('5 workdays starting Monday returns Friday', () => {
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-01', 5, 100, []));
      expect(result).toBe('2026-06-05');
    });

    it('skips the weekend: 1 workday starting Friday returns Friday', () => {
      // 2026-06-05 = Friday
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-05', 1, 100, []));
      expect(result).toBe('2026-06-05');
    });

    it('extends across weekend: 2 workdays starting Friday → Monday', () => {
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-05', 2, 100, []));
      expect(result).toBe('2026-06-08');
    });

    it('50% allocation doubles calendar days', () => {
      // 2 workdays at 50% = ceil(2/0.5) = 4 calendar days
      // Mon, Tue, Wed, Thu → ends Thursday
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-01', 2, 50, []));
      expect(result).toBe('2026-06-04');
    });

    it('25% allocation: 1 workday = ceil(1/0.25)=4 calendar days → Thu', () => {
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-01', 1, 25, []));
      expect(result).toBe('2026-06-04');
    });

    it('skips holiday in calculation', () => {
      // 2 workdays from Mon, with Tuesday as holiday → ends Wednesday
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-01', 2, 100, ['2026-06-02']));
      expect(result).toBe('2026-06-03');
    });

    it('skips multiple holidays', () => {
      // 1 workday from Monday; Mon is a holiday → ends Tuesday
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-01', 1, 100, ['2026-06-01']));
      expect(result).toBe('2026-06-02');
    });

    it('returns null for 0 workdays', () => {
      expect(WorkCalendar.calcEndDate('2026-06-01', 0, 100, [])).toBeNull();
    });

    it('returns null for 0% allocation', () => {
      expect(WorkCalendar.calcEndDate('2026-06-01', 5, 0, [])).toBeNull();
    });

    it('returns null for missing start date', () => {
      expect(WorkCalendar.calcEndDate('', 5, 100, [])).toBeNull();
      expect(WorkCalendar.calcEndDate(null, 5, 100, [])).toBeNull();
    });

    it('works with holidays as YYYY-MM-DD strings in the set', () => {
      // holiday array from DEFAULT_SETTINGS format
      const result = WorkCalendar.fmt(WorkCalendar.calcEndDate('2026-06-01', 3, 100, ['2026-06-03']));
      // Mon(1), Tue(2), skip Wed holiday, Thu(4)
      expect(result).toBe('2026-06-04');
    });
  });

  // ── nextWorkday ───────────────────────────────────────────────────────────
  describe('nextWorkday', () => {
    it('returns the next calendar day if it is a workday', () => {
      // Monday → Tuesday
      expect(WorkCalendar.nextWorkday('2026-06-01', [])).toBe('2026-06-02');
    });

    it('skips weekend: Friday → Monday', () => {
      expect(WorkCalendar.nextWorkday('2026-06-05', [])).toBe('2026-06-08');
    });

    it('skips holiday on the next day', () => {
      // Mon → Tue is holiday → Wed
      expect(WorkCalendar.nextWorkday('2026-06-01', ['2026-06-02'])).toBe('2026-06-03');
    });
  });
});
