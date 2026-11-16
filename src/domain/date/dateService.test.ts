import { describe, it, expect } from 'vitest';
import {
  isPastDate,
  isTodayDate,
  isFutureDate,
  formatDisplayDate,
  formatMonthYear,
} from './dateService';

describe('dateService (Türkçe Tarih Yönetimi)', () => {
  const referenceToday = '2026-11-12';

  it('geçmiş günleri doğru tespit eder', () => {
    expect(isPastDate('2026-11-11', referenceToday)).toBe(true);
    expect(isPastDate('2026-10-01', referenceToday)).toBe(true);
    expect(isPastDate('2026-11-12', referenceToday)).toBe(false);
    expect(isPastDate('2026-11-13', referenceToday)).toBe(false);
  });

  it('bugünü doğru tespit eder', () => {
    expect(isTodayDate('2026-11-12', referenceToday)).toBe(true);
    expect(isTodayDate('2026-11-11', referenceToday)).toBe(false);
    expect(isTodayDate('2026-11-13', referenceToday)).toBe(false);
  });

  it('gelecek günleri doğru tespit eder', () => {
    expect(isFutureDate('2026-11-13', referenceToday)).toBe(true);
    expect(isFutureDate('2026-12-01', referenceToday)).toBe(true);
    expect(isFutureDate('2026-11-12', referenceToday)).toBe(false);
    expect(isFutureDate('2026-11-11', referenceToday)).toBe(false);
  });

  it('tarihleri anlaşılır ve estetik Türkçe formatta gösterir', () => {
    const formatted = formatDisplayDate('2026-11-12');
    expect(formatted).toContain('Kasım');
    expect(formatted).toContain('Perşembe');

    const monthFormatted = formatMonthYear(new Date('2026-11-12'));
    expect(monthFormatted).toBe('Kasım 2026');
  });
});
