import { describe, it, expect } from 'vitest';
import { DAYS_OF_WEEK, DEFAULT_WEEKLY_ROUTINES } from './routine';

describe('Weekly Routines Module', () => {
  it('haftanın 7 gününü doğru sırada içerir', () => {
    expect(DAYS_OF_WEEK).toHaveLength(7);
    expect(DAYS_OF_WEEK[0].dayName).toBe('Pazartesi');
    expect(DAYS_OF_WEEK[6].dayName).toBe('Pazar');
  });

  it('varsayılan rutin yapısı 7 günü kapsar', () => {
    expect(DEFAULT_WEEKLY_ROUTINES).toHaveLength(7);
    expect(DEFAULT_WEEKLY_ROUTINES.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
