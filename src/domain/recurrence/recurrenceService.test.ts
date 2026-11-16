import { describe, it, expect, beforeEach } from 'vitest';
import { RecurrenceService } from './recurrenceService';
import {
  LocalTaskRepository,
  LocalRecurrenceRepository,
  LocalTaskEventRepository,
} from '../../repositories/localRepository';

describe('RecurrenceService (Tekrarlanan Görevler Motoru)', () => {
  let taskRepo: LocalTaskRepository;
  let recurrenceRepo: LocalRecurrenceRepository;
  let eventRepo: LocalTaskEventRepository;
  let recurrenceService: RecurrenceService;

  const today = '2026-11-13'; // Friday
  const saturday = '2026-11-14';
  const sunday = '2026-11-15';
  const monday = '2026-11-16';

  beforeEach(() => {
    localStorage.clear();
    taskRepo = new LocalTaskRepository();
    recurrenceRepo = new LocalRecurrenceRepository();
    eventRepo = new LocalTaskEventRepository();
    recurrenceService = new RecurrenceService(recurrenceRepo, taskRepo, eventRepo);
  });

  it('hafta içi kuralı (weekdays) Cuma ve Pazartesi tetiklenir, hafta sonu tetiklenmez', async () => {
    const { rule } = await recurrenceService.createRule(
      {
        title: 'Sabah bülteni oku',
        frequency: 'weekdays',
        start_date: today,
      },
      today
    );

    expect(recurrenceService.isRuleApplicableOnDate(rule, today)).toBe(true); // Cuma
    expect(recurrenceService.isRuleApplicableOnDate(rule, saturday)).toBe(false); // Cumartesi
    expect(recurrenceService.isRuleApplicableOnDate(rule, sunday)).toBe(false); // Pazar
    expect(recurrenceService.isRuleApplicableOnDate(rule, monday)).toBe(true); // Pazartesi
  });

  it('günlük kural (daily) her gün tetiklenir ve senkronizasyonda yeni görev oluşturur', async () => {
    await recurrenceService.createRule(
      {
        title: 'Günlük egzersiz',
        frequency: 'daily',
        start_date: today,
      },
      today
    );

    // Senkronize et (bugün için ilk görev zaten oluştu)
    const todayTasks = await taskRepo.findByDate(today);
    expect(todayTasks).toHaveLength(1);
    expect(todayTasks[0].title).toBe('Günlük egzersiz');

    // Cumartesi gününe senkronizasyon yap
    const spawnedSaturday = await recurrenceService.syncRecurringTasksForDate(saturday, today);
    expect(spawnedSaturday).toHaveLength(1);
    expect(spawnedSaturday[0].scheduled_date).toBe(saturday);

    // Pazar gününe senkronizasyon yap
    const spawnedSunday = await recurrenceService.syncRecurringTasksForDate(sunday, today);
    expect(spawnedSunday).toHaveLength(1);
    expect(spawnedSunday[0].scheduled_date).toBe(sunday);
  });

  it('idempotency: aynı gün için tekrar çağrıldığında mükerrer görev oluşturmaz', async () => {
    await recurrenceService.createRule(
      {
        title: 'Kitap oku',
        frequency: 'daily',
        start_date: today,
      },
      today
    );

    // İkinci kez sync çağrıldığında
    const spawned = await recurrenceService.syncRecurringTasksForDate(today, today);
    expect(spawned).toHaveLength(0); // Zaten ilk oluşturmada yapıldı

    const tasks = await taskRepo.findByDate(today);
    expect(tasks).toHaveLength(1);
  });

  it('geçmiş günler salt okunurdur, geçmiş gün için otomatik tekrar görevi oluşturulmaz', async () => {
    const yesterday = '2026-11-12';
    await recurrenceService.createRule(
      {
        title: 'Geçmişe yazma',
        frequency: 'daily',
        start_date: '2026-11-01',
      },
      today
    );

    const spawned = await recurrenceService.syncRecurringTasksForDate(yesterday, today);
    expect(spawned).toHaveLength(0);

    const pastTasks = await taskRepo.findByDate(yesterday);
    expect(pastTasks).toHaveLength(0);
  });
});
