import { describe, it, expect } from 'vitest';
import { calculateHabitStreak } from './habit';

describe('calculateHabitStreak', () => {
  const today = '2026-11-16';

  it('boş tamamlanma listesinde 0 döner', () => {
    const { currentStreak, bestStreak } = calculateHabitStreak([], today);
    expect(currentStreak).toBe(0);
    expect(bestStreak).toBe(0);
  });

  it('bugün tamamlandıysa streak 1 başlar ve geriye doğru sayar', () => {
    const dates = ['2026-11-14', '2026-11-15', '2026-11-16'];
    const { currentStreak, bestStreak } = calculateHabitStreak(dates, today);
    expect(currentStreak).toBe(3);
    expect(bestStreak).toBe(3);
  });

  it('bugün henüz yapılmadıysa ama dün yapıldıysa dünkü streak devam eder', () => {
    const dates = ['2026-11-14', '2026-11-15'];
    const { currentStreak, bestStreak } = calculateHabitStreak(dates, today);
    expect(currentStreak).toBe(2);
    expect(bestStreak).toBe(2);
  });

  it('arada kopma varsa sadece son kesintisiz zinciri currentStreak olarak alır', () => {
    // 5 günlük eski zincir, sonra boşluk, sonra 2 günlük yeni zincir
    const dates = [
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-15',
      '2026-11-16',
    ];
    const { currentStreak, bestStreak } = calculateHabitStreak(dates, today);
    expect(currentStreak).toBe(2);
    expect(bestStreak).toBe(5);
  });
});
