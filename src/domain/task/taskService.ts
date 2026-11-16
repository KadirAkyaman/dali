import { ITaskRepository, ITaskEventRepository } from '../../repositories/interfaces';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../../types/task';
import { isPastDate, getTodayDateString } from '../date/dateService';

export class TaskService {
  constructor(
    private taskRepo: ITaskRepository,
    private eventRepo: ITaskEventRepository
  ) {}

  async getTasksForDate(date: string): Promise<Task[]> {
    return this.taskRepo.findByDate(date);
  }

  async getAllCompletedTasks(): Promise<Task[]> {
    return this.taskRepo.findAllCompleted();
  }

  async createTask(dto: CreateTaskDTO, todayStr: string = getTodayDateString()): Promise<Task> {
    if (isPastDate(dto.scheduled_date, todayStr)) {
      throw new Error('Past days are read-only. Cannot create tasks in past days.');
    }

    const title = dto.title.trim();
    if (!title) {
      throw new Error('Task title cannot be empty.');
    }

    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const createdTask = await this.taskRepo.create({
      ...dto,
      title,
      id,
      created_at: nowIso,
      updated_at: nowIso,
    });

    await this.eventRepo.create({
      id: crypto.randomUUID(),
      task_id: id,
      event_type: 'created',
      from_date: null,
      to_date: dto.scheduled_date,
      created_at: nowIso,
      metadata: null,
    });

    return createdTask;
  }

  async toggleTaskStatus(id: string, todayStr: string = getTodayDateString()): Promise<Task> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found.`);
    }

    if (isPastDate(task.scheduled_date, todayStr)) {
      throw new Error('Past days are read-only. Cannot modify task status.');
    }

    const nowIso = new Date().toISOString();
    const isNowCompleted = task.status === 'open';

    const updated = await this.taskRepo.update(id, {
      status: isNowCompleted ? 'completed' : 'open',
      completed_at: isNowCompleted ? nowIso : null,
    });

    await this.eventRepo.create({
      id: crypto.randomUUID(),
      task_id: id,
      event_type: isNowCompleted ? 'completed' : 'reopened',
      from_date: task.scheduled_date,
      to_date: task.scheduled_date,
      created_at: nowIso,
      metadata: null,
    });

    return updated;
  }

  async updateTask(
    id: string,
    updates: UpdateTaskDTO,
    todayStr: string = getTodayDateString()
  ): Promise<Task> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found.`);
    }

    if (isPastDate(task.scheduled_date, todayStr)) {
      throw new Error('Past days are read-only. Cannot update tasks.');
    }

    if (updates.title !== undefined) {
      const cleanTitle = updates.title.trim();
      if (!cleanTitle) {
        throw new Error('Task title cannot be empty.');
      }
      updates.title = cleanTitle;
    }

    return this.taskRepo.update(id, updates);
  }

  async deleteTask(id: string, todayStr: string = getTodayDateString()): Promise<boolean> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      return false;
    }

    if (isPastDate(task.scheduled_date, todayStr)) {
      throw new Error('Past days are read-only. Cannot delete tasks.');
    }

    const deleted = await this.taskRepo.delete(id);
    if (deleted) {
      await this.eventRepo.create({
        id: crypto.randomUUID(),
        task_id: id,
        event_type: 'deleted',
        from_date: task.scheduled_date,
        to_date: null,
        created_at: new Date().toISOString(),
        metadata: null,
      });
    }

    return deleted;
  }

  async moveTask(
    id: string,
    targetDate: string,
    todayStr: string = getTodayDateString()
  ): Promise<Task> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found.`);
    }

    if (isPastDate(task.scheduled_date, todayStr)) {
      throw new Error('Past days are read-only. Cannot move past tasks.');
    }

    if (isPastDate(targetDate, todayStr)) {
      throw new Error('Cannot move task to a past date.');
    }

    const fromDate = task.scheduled_date;
    const nowIso = new Date().toISOString();

    const updated = await this.taskRepo.update(id, {
      scheduled_date: targetDate,
    });

    await this.eventRepo.create({
      id: crypto.randomUUID(),
      task_id: id,
      event_type: 'moved',
      from_date: fromDate,
      to_date: targetDate,
      created_at: nowIso,
      metadata: null,
    });

    return updated;
  }

  async reorderTasks(
    orderedTaskIds: string[],
    date: string,
    todayStr: string = getTodayDateString()
  ): Promise<void> {
    if (isPastDate(date, todayStr)) {
      throw new Error('Past days are read-only. Cannot reorder tasks.');
    }

    for (let index = 0; index < orderedTaskIds.length; index++) {
      const id = orderedTaskIds[index];
      await this.taskRepo.update(id, { sort_order: index });
    }
  }

  async getMonthActivity(yearMonth: string): Promise<Record<string, { total: number; completed: number }>> {
    return this.taskRepo.getTaskCountsByMonth(yearMonth);
  }
}
