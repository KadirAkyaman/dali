import { describe, it, expect } from 'vitest';
import { ReminderService } from './reminderService';
import { Task } from '../../types/task';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../../types/settings';

describe('ReminderService (Hatırlatıcı & Sessiz Saatler)', () => {
  const baseTask: Task = {
    id: 'task-1',
    title: 'Önemli toplantı',
    notes: null,
    scheduled_date: '2026-11-12',
    status: 'open',
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    source_task_id: null,
    rollover_count: 0,
    reminder_at: '14:30',
    recurrence_rule_id: null,
  };

  it('sessiz saatleri gece geçişiyle doğru hesaplar (22:00 - 08:00)', () => {
    const settings: AppSettings = {
      ...DEFAULT_APP_SETTINGS,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
    };

    // 23:15 -> Sessiz saat
    const night = new Date('2026-11-12T23:15:00');
    expect(ReminderService.isQuietHours(settings, night)).toBe(true);

    // 07:45 -> Sessiz saat
    const earlyMorning = new Date('2026-11-12T07:45:00');
    expect(ReminderService.isQuietHours(settings, earlyMorning)).toBe(true);

    // 14:30 -> Sessiz saat DIŞINDA
    const afternoon = new Date('2026-11-12T14:30:00');
    expect(ReminderService.isQuietHours(settings, afternoon)).toBe(false);
  });

  it('vakti gelen görevi tespit eder ve tamamlanmış görevleri hariç tutar', () => {
    const settings: AppSettings = {
      ...DEFAULT_APP_SETTINGS,
      notifications_enabled: true,
    };

    const now = new Date('2026-11-12T14:30:00');

    // Açık görev
    const due = ReminderService.getDueTasks([baseTask], settings, '2026-11-12', now);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe('task-1');

    // Tekrar çağrıldığında mükerrer bildirim vermez
    const secondCall = ReminderService.getDueTasks([baseTask], settings, '2026-11-12', now);
    expect(secondCall).toHaveLength(0);

    // Tamamlanmış görev bildirilmez
    const completedTask: Task = { ...baseTask, id: 'task-done', status: 'completed' };
    const dueCompleted = ReminderService.getDueTasks([completedTask], settings, '2026-11-12', now);
    expect(dueCompleted).toHaveLength(0);
  });
});
