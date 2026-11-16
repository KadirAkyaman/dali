export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface RecurrenceRule {
  id: string;
  title: string;
  frequency: RecurrenceFrequency;
  interval: number; // e.g. 1 (every day/week/month), 2 (every 2 weeks)
  weekdays: number[]; // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
  month_day: number | null; // 1 - 31
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD or null (indefinite)
  is_active: boolean;
  reminder_at: string | null;
  created_at: string;
}

export interface CreateRecurrenceRuleDTO {
  title: string;
  frequency: RecurrenceFrequency;
  interval?: number;
  weekdays?: number[];
  month_day?: number | null;
  start_date: string;
  end_date?: string | null;
  reminder_at?: string | null;
}
