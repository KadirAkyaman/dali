import { TaskPriority } from './task';

export interface RoutineTaskItem {
  id: string;
  title: string;
  reminder_at?: string | null;
  icon?: string | null;
  priority?: TaskPriority | null;
}

export interface DayRoutine {
  dayNumber: number; // 1 = Pazartesi, ..., 7 = Pazar
  dayName: string;
  tasks: RoutineTaskItem[];
}

export const DAYS_OF_WEEK: { dayNumber: number; dayName: string; shortName: string }[] = [
  { dayNumber: 1, dayName: 'Pazartesi', shortName: 'Pzt' },
  { dayNumber: 2, dayName: 'Salı', shortName: 'Sal' },
  { dayNumber: 3, dayName: 'Çarşamba', shortName: 'Çar' },
  { dayNumber: 4, dayName: 'Perşembe', shortName: 'Per' },
  { dayNumber: 5, dayName: 'Cuma', shortName: 'Cum' },
  { dayNumber: 6, dayName: 'Cumartesi', shortName: 'Cmt' },
  { dayNumber: 7, dayName: 'Pazar', shortName: 'Paz' },
];

export const DEFAULT_WEEKLY_ROUTINES: DayRoutine[] = [
  { dayNumber: 1, dayName: 'Pazartesi', tasks: [] },
  { dayNumber: 2, dayName: 'Salı', tasks: [] },
  { dayNumber: 3, dayName: 'Çarşamba', tasks: [] },
  { dayNumber: 4, dayName: 'Perşembe', tasks: [] },
  { dayNumber: 5, dayName: 'Cuma', tasks: [] },
  { dayNumber: 6, dayName: 'Cumartesi', tasks: [] },
  { dayNumber: 7, dayName: 'Pazar', tasks: [] },
];
