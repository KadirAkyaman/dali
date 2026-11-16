import { Task, TaskEvent, CreateTaskDTO, UpdateTaskDTO } from '../types/task';
import { AppSettings } from '../types/settings';
import { RecurrenceRule, CreateRecurrenceRuleDTO } from '../types/recurrence';

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByDate(date: string): Promise<Task[]>;
  findByRecurrenceRuleAndDate(ruleId: string, date: string): Promise<Task | null>;
  findOpenTasksBeforeDate(date: string): Promise<Task[]>;
  findAllCompleted(): Promise<Task[]>;
  create(task: CreateTaskDTO & { id: string; created_at: string; updated_at: string }): Promise<Task>;
  update(id: string, updates: UpdateTaskDTO & Partial<Task>): Promise<Task>;
  delete(id: string): Promise<boolean>;
  getTaskCountsByMonth(yearMonth: string): Promise<Record<string, { total: number; completed: number }>>;
}

export interface IRecurrenceRepository {
  findById(id: string): Promise<RecurrenceRule | null>;
  findAllActive(): Promise<RecurrenceRule[]>;
  create(rule: CreateRecurrenceRuleDTO & { id: string; created_at: string }): Promise<RecurrenceRule>;
  update(id: string, updates: Partial<RecurrenceRule>): Promise<RecurrenceRule>;
  delete(id: string): Promise<boolean>;
}

export interface ITaskEventRepository {
  create(event: Omit<TaskEvent, 'id'> & { id: string }): Promise<TaskEvent>;
  findByTaskId(taskId: string): Promise<TaskEvent[]>;
}

export interface ISettingsRepository {
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
}
