import { RecurrenceFrequency } from './recurrence';

export type TaskStatus = 'open' | 'completed';

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  scheduled_date: string; // YYYY-MM-DD
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  source_task_id: string | null;
  rollover_count: number;
  reminder_at: string | null;
  recurrence_rule_id: string | null;
}

export type TaskEventType =
  | 'created'
  | 'completed'
  | 'reopened'
  | 'moved'
  | 'rolled_over'
  | 'deleted';

export interface TaskEvent {
  id: string;
  task_id: string;
  event_type: TaskEventType;
  from_date: string | null;
  to_date: string | null;
  created_at: string;
  metadata: string | null;
}

export interface CreateTaskDTO {
  title: string;
  scheduled_date: string; // YYYY-MM-DD
  notes?: string | null;
  reminder_at?: string | null;
  recurrence_rule_id?: string | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  sort_order?: number;
}

export interface UpdateTaskDTO {
  title?: string;
  notes?: string | null;
  reminder_at?: string | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  sort_order?: number;
}
