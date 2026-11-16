import { describe, it, expect, beforeEach } from 'vitest';
import { RolloverService } from './rolloverService';
import {
  LocalTaskRepository,
  LocalTaskEventRepository,
  LocalSettingsRepository,
} from '../../repositories/localRepository';

describe('RolloverService (Automated Daily Task Migration)', () => {
  let taskRepo: LocalTaskRepository;
  let eventRepo: LocalTaskEventRepository;
  let settingsRepo: LocalSettingsRepository;
  let rolloverService: RolloverService;

  const today = '2026-11-12';
  const yesterday = '2026-11-11';
  const threeDaysAgo = '2026-11-09';

  beforeEach(() => {
    localStorage.clear();
    taskRepo = new LocalTaskRepository();
    eventRepo = new LocalTaskEventRepository();
    settingsRepo = new LocalSettingsRepository();
    rolloverService = new RolloverService(taskRepo, eventRepo, settingsRepo);
  });

  it('rolls over open tasks from yesterday to today', async () => {
    // 1 open task, 1 completed task from yesterday
    const openTask = await taskRepo.create({
      id: 'task-open-1',
      title: 'Incomplete task',
      scheduled_date: yesterday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const completedTask = await taskRepo.create({
      id: 'task-done-1',
      title: 'Completed task',
      scheduled_date: yesterday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await taskRepo.update(completedTask.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    // Run rollover
    const result = await rolloverService.processDailyRollover(today);
    expect(result.executed).toBe(true);
    expect(result.rolledOverCount).toBe(1);

    // Verify open task was moved to today
    const updatedOpen = await taskRepo.findById(openTask.id);
    expect(updatedOpen?.scheduled_date).toBe(today);
    expect(updatedOpen?.rollover_count).toBe(1);

    // Verify completed task remains in yesterday
    const untouchedCompleted = await taskRepo.findById(completedTask.id);
    expect(untouchedCompleted?.scheduled_date).toBe(yesterday);
    expect(untouchedCompleted?.status).toBe('completed');
    expect(untouchedCompleted?.rollover_count).toBe(0);
  });

  it('is idempotent: running multiple times does not duplicate or re-rollover', async () => {
    await taskRepo.create({
      id: 'task-1',
      title: 'Task to rollover',
      scheduled_date: yesterday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const firstRun = await rolloverService.processDailyRollover(today);
    expect(firstRun.rolledOverCount).toBe(1);

    const secondRun = await rolloverService.processDailyRollover(today);
    expect(secondRun.rolledOverCount).toBe(0);

    const allTasks = await taskRepo.findByDate(today);
    expect(allTasks).toHaveLength(1);
  });

  it('handles multi-day inactivity safely without duplicating tasks', async () => {
    // App was closed for 3 days
    await taskRepo.create({
      id: 'multi-day-task',
      title: 'Task from 3 days ago',
      scheduled_date: threeDaysAgo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const result = await rolloverService.processDailyRollover(today);
    expect(result.rolledOverCount).toBe(1);

    const task = await taskRepo.findById('multi-day-task');
    expect(task?.scheduled_date).toBe(today);
    expect(task?.rollover_count).toBe(1);

    // Ensure no intermediate tasks were generated
    const allTasks = await taskRepo.findByDate(today);
    expect(allTasks).toHaveLength(1);
  });

  it('respects auto_rollover_enabled setting when false', async () => {
    await settingsRepo.updateSettings({ auto_rollover_enabled: false });

    await taskRepo.create({
      id: 'stay-here',
      title: 'Will not move',
      scheduled_date: yesterday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const result = await rolloverService.processDailyRollover(today);
    expect(result.executed).toBe(false);
    expect(result.rolledOverCount).toBe(0);

    const task = await taskRepo.findById('stay-here');
    expect(task?.scheduled_date).toBe(yesterday);
  });
});
