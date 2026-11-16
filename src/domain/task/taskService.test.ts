import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from './taskService';
import { LocalTaskRepository, LocalTaskEventRepository } from '../../repositories/localRepository';

describe('TaskService & Past-Day Read-Only Rules', () => {
  let taskRepo: LocalTaskRepository;
  let eventRepo: LocalTaskEventRepository;
  let taskService: TaskService;
  const today = '2026-11-12';
  const yesterday = '2026-11-11';
  const tomorrow = '2026-11-13';

  beforeEach(() => {
    localStorage.clear();
    taskRepo = new LocalTaskRepository();
    eventRepo = new LocalTaskEventRepository();
    taskService = new TaskService(taskRepo, eventRepo);
  });

  it('allows creating tasks for today and future days', async () => {
    const taskToday = await taskService.createTask(
      { title: 'Write unit tests', scheduled_date: today },
      today
    );
    expect(taskToday.id).toBeDefined();
    expect(taskToday.title).toBe('Write unit tests');
    expect(taskToday.status).toBe('open');

    const taskFuture = await taskService.createTask(
      { title: 'Future plan', scheduled_date: tomorrow },
      today
    );
    expect(taskFuture.id).toBeDefined();
  });

  it('rejects creating tasks for past days', async () => {
    await expect(
      taskService.createTask(
        { title: 'Past task', scheduled_date: yesterday },
        today
      )
    ).rejects.toThrow('Past days are read-only');
  });

  it('allows toggling task status for today', async () => {
    const task = await taskService.createTask(
      { title: 'Finish MVP', scheduled_date: today },
      today
    );

    const completed = await taskService.toggleTaskStatus(task.id, today);
    expect(completed.status).toBe('completed');
    expect(completed.completed_at).toBeTruthy();

    const reopened = await taskService.toggleTaskStatus(task.id, today);
    expect(reopened.status).toBe('open');
    expect(reopened.completed_at).toBeNull();
  });

  it('rejects modifying task status in past days', async () => {
    // Create task in past using raw repo (simulating old data)
    const oldTask = await taskRepo.create({
      id: 'old-1',
      title: 'Old task',
      scheduled_date: yesterday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await expect(taskService.toggleTaskStatus(oldTask.id, today)).rejects.toThrow(
      'Past days are read-only'
    );
  });

  it('rejects updating and deleting tasks in past days', async () => {
    const oldTask = await taskRepo.create({
      id: 'old-2',
      title: 'Untouchable task',
      scheduled_date: yesterday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await expect(
      taskService.updateTask(oldTask.id, { title: 'New title' }, today)
    ).rejects.toThrow('Past days are read-only');

    await expect(taskService.deleteTask(oldTask.id, today)).rejects.toThrow(
      'Past days are read-only'
    );
  });
});
