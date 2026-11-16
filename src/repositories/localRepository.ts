import { Task, TaskEvent, CreateTaskDTO } from '../types/task';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../types/settings';
import { RecurrenceRule, CreateRecurrenceRuleDTO } from '../types/recurrence';
import {
  ITaskRepository,
  ITaskEventRepository,
  ISettingsRepository,
  IRecurrenceRepository,
} from './interfaces';

const STORAGE_KEYS = {
  TASKS: 'dali_tasks',
  EVENTS: 'dali_task_events',
  SETTINGS: 'dali_settings',
  RECURRENCE: 'dali_recurrence_rules',
};

export class LocalTaskRepository implements ITaskRepository {
  private getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  async findById(id: string): Promise<Task | null> {
    const tasks = this.getTasks();
    return tasks.find((t) => t.id === id) || null;
  }

  async findByRecurrenceRuleAndDate(ruleId: string, date: string): Promise<Task | null> {
    const tasks = this.getTasks();
    return (
      tasks.find((t) => t.recurrence_rule_id === ruleId && t.scheduled_date === date) || null
    );
  }

  async findByDate(date: string): Promise<Task[]> {
    const tasks = this.getTasks();
    return tasks
      .filter((t) => t.scheduled_date === date)
      .sort((a, b) => {
        // First sort by sort_order
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        // Then by created_at
        return a.created_at.localeCompare(b.created_at);
      });
  }

  async findOpenTasksBeforeDate(date: string): Promise<Task[]> {
    const tasks = this.getTasks();
    return tasks.filter((t) => t.status === 'open' && t.scheduled_date < date);
  }

  async findAllCompleted(): Promise<Task[]> {
    const tasks = this.getTasks();
    return tasks
      .filter((t) => t.status === 'completed')
      .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
  }

  async create(taskData: CreateTaskDTO & { id: string; created_at: string; updated_at: string }): Promise<Task> {
    const tasks = this.getTasks();
    const newTask: Task = {
      id: taskData.id,
      title: taskData.title,
      notes: taskData.notes || null,
      scheduled_date: taskData.scheduled_date,
      status: 'open',
      sort_order: taskData.sort_order ?? tasks.filter((t) => t.scheduled_date === taskData.scheduled_date).length,
      created_at: taskData.created_at,
      updated_at: taskData.updated_at,
      completed_at: null,
      source_task_id: null,
      rollover_count: 0,
      reminder_at: taskData.reminder_at || null,
      recurrence_rule_id: taskData.recurrence_rule_id || null,
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: Task = {
      ...tasks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  async delete(id: string): Promise<boolean> {
    const tasks = this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;
    this.saveTasks(filtered);
    return true;
  }

  async getTaskCountsByMonth(yearMonth: string): Promise<Record<string, { total: number; completed: number }>> {
    const tasks = this.getTasks();
    const result: Record<string, { total: number; completed: number }> = {};

    tasks.forEach((task) => {
      if (task.scheduled_date.startsWith(yearMonth)) {
        if (!result[task.scheduled_date]) {
          result[task.scheduled_date] = { total: 0, completed: 0 };
        }
        result[task.scheduled_date].total += 1;
        if (task.status === 'completed') {
          result[task.scheduled_date].completed += 1;
        }
      }
    });

    return result;
  }
}

export class LocalTaskEventRepository implements ITaskEventRepository {
  private getEvents(): TaskEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveEvents(events: TaskEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  async create(eventData: Omit<TaskEvent, 'id'> & { id: string }): Promise<TaskEvent> {
    const events = this.getEvents();
    const newEvent: TaskEvent = { ...eventData };
    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  }

  async findByTaskId(taskId: string): Promise<TaskEvent[]> {
    const events = this.getEvents();
    return events.filter((e) => e.task_id === taskId);
  }
}

export class LocalSettingsRepository implements ISettingsRepository {
  async getSettings(): Promise<AppSettings> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(data) } : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }
}

export class LocalRecurrenceRepository implements IRecurrenceRepository {
  private getRules(): RecurrenceRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECURRENCE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveRules(rules: RecurrenceRule[]): void {
    localStorage.setItem(STORAGE_KEYS.RECURRENCE, JSON.stringify(rules));
  }

  async findById(id: string): Promise<RecurrenceRule | null> {
    const rules = this.getRules();
    return rules.find((r) => r.id === id) || null;
  }

  async findAllActive(): Promise<RecurrenceRule[]> {
    const rules = this.getRules();
    return rules.filter((r) => r.is_active);
  }

  async create(
    ruleData: CreateRecurrenceRuleDTO & { id: string; created_at: string }
  ): Promise<RecurrenceRule> {
    const rules = this.getRules();
    const newRule: RecurrenceRule = {
      id: ruleData.id,
      title: ruleData.title,
      frequency: ruleData.frequency,
      interval: ruleData.interval || 1,
      weekdays: ruleData.weekdays || [],
      month_day: ruleData.month_day ?? null,
      start_date: ruleData.start_date,
      end_date: ruleData.end_date || null,
      is_active: true,
      reminder_at: ruleData.reminder_at || null,
      created_at: ruleData.created_at,
    };
    rules.push(newRule);
    this.saveRules(rules);
    return newRule;
  }

  async update(id: string, updates: Partial<RecurrenceRule>): Promise<RecurrenceRule> {
    const rules = this.getRules();
    const index = rules.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Recurrence rule ${id} not found`);
    }

    const updated = { ...rules[index], ...updates };
    rules[index] = updated;
    this.saveRules(rules);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const rules = this.getRules();
    const filtered = rules.filter((r) => r.id !== id);
    if (filtered.length === rules.length) return false;
    this.saveRules(filtered);
    return true;
  }
}
