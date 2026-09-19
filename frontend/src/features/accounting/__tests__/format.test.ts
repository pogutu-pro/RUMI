import { dateLabel, kes, monthLabel, shiftMonth } from '../format';

describe('accounting formatting', () => {
  it('formats money with thousands separators and drops empty cents', () => {
    expect(kes('50000.00')).toBe('KES 50,000');
    expect(kes('925.93')).toBe('KES 925.93');
    expect(kes(undefined)).toBe('KES 0');
  });

  it('walks months across a year boundary', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('labels months and dates for people', () => {
    expect(monthLabel('2026-09')).toBe('September 2026');
    expect(monthLabel('2026-09-01')).toBe('September 2026');
    expect(dateLabel('2026-10-20')).toBe('20 Oct 2026');
  });
});
