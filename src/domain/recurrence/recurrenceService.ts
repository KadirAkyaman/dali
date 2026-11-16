import { parseISO, getDay, getDate, differenceInCalendarDays, differenceInCalendarWeeks } from 'date-fns';
import { ITaskRepository, IRecurrenceRepository, ITaskEventRepository } from '../../repositories/interfaces';
import { RecurrenceRule, CreateRecurrenceRuleDTO } from '../../types/recurrence';
import { Task } from '../../types/task';
import { getTodayDateString, isPastDate } from '../date/dateService';

export class RecurrenceService {
  constructor(
    private recurrenceRepo: IRecurrenceRepository,
    private taskRepo: ITaskRepository,
    private eventRepo: ITaskEventRepository
  ) {}

  /**
   * Checks if a recurrence rule should trigger on a specific date (YYYY-MM-DD)
   */
  isRuleApplicableOnDate(rule: RecurrenceRule, targetDateStr: string): boolean {
    if (!rule.is_active) return false;
    if (targetDateStr < rule.start_date) return false;
    if (rule.end_date && targetDateStr > rule.end_date) return false;

    const targetDate = parseISO(targetDateStr);
    const startDate = parseISO(rule.start_date);

    // date-fns getDay: 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // In our domain: 1: Monday .. 7: Sunday
    const dayOfWeek = getDay(targetDate);
    const normalizedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    switch (rule.frequency) {
      case 'daily': {
        const diffDays = differenceInCalendarDays(targetDate, startDate);
        return diffDays % (rule.interval || 1) === 0;
      }
      case 'weekdays': {
        // Monday (1) through Friday (5)
        return normalizedDayOfWeek >= 1 && normalizedDayOfWeek <= 5;
      }
      case 'weekly': {
        const diffWeeks = differenceInCalendarWeeks(targetDate, startDate, { weekStartsOn: 1 });
        if (diffWeeks % (rule.interval || 1) !== 0) return false;

        const targetDays = rule.weekdays.length > 0 ? rule.weekdays : [normalizedDayOfWeek];
        return targetDays.includes(normalizedDayOfWeek);
      }
      case 'monthly': {
        const targetDayOfMonth = getDate(targetDate);
        const expectedDay = rule.month_day || getDate(startDate);
        return targetDayOfMonth === expectedDay;
      }
      default:
        return false;
    }
  }

  /**
   * Creates a new recurrence rule and immediately syncs the task for the start date
   */
  async createRule(
    dto: CreateRecurrenceRuleDTO,
    todayStr: string = getTodayDateString()
  ): Promise<{ rule: RecurrenceRule; initialTask: Task | null }> {
    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const rule = await this.recurrenceRepo.create({
      ...dto,
      id,
      created_at: nowIso,
    });

    let initialTask: Task | null = null;

    // If the start_date is not in the past, spawn the first task
    if (!isPastDate(dto.start_date, todayStr) && this.isRuleApplicableOnDate(rule, dto.start_date)) {
      initialTask = await this.taskRepo.create({
        id: crypto.randomUUID(),
        title: rule.title,
        scheduled_date: dto.start_date,
        reminder_at: rule.reminder_at,
        recurrence_rule_id: rule.id,
        created_at: nowIso,
        updated_at: nowIso,
      });

      await this.eventRepo.create({
        id: crypto.randomUUID(),
        task_id: initialTask.id,
        event_type: 'created',
        from_date: null,
        to_date: dto.start_date,
        created_at: nowIso,
        metadata: JSON.stringify({ recurrence_rule_id: rule.id }),
      });
    }

    return { rule, initialTask };
  }

  /**
   * Synchronizes and generates recurring tasks for a specific date if not yet spawned.
   * Fully idempotent: will never create duplicate tasks for the same rule and date.
   */
  async syncRecurringTasksForDate(
    targetDateStr: string,
    todayStr: string = getTodayDateString()
  ): Promise<Task[]> {
    // If target date is in the past, do not generate new tasks (past days are read-only)
    if (isPastDate(targetDateStr, todayStr)) {
      return [];
    }

    const activeRules = await this.recurrenceRepo.findAllActive();
    const createdTasks: Task[] = [];
    const nowIso = new Date().toISOString();

    for (const rule of activeRules) {
      if (this.isRuleApplicableOnDate(rule, targetDateStr)) {
        // Check if task already exists for this rule on this date
        const existingTask = await this.taskRepo.findByRecurrenceRuleAndDate(
          rule.id,
          targetDateStr
        );

        if (!existingTask) {
          const newTask = await this.taskRepo.create({
            id: crypto.randomUUID(),
            title: rule.title,
            scheduled_date: targetDateStr,
            reminder_at: rule.reminder_at,
            recurrence_rule_id: rule.id,
            created_at: nowIso,
            updated_at: nowIso,
          });

          await this.eventRepo.create({
            id: crypto.randomUUID(),
            task_id: newTask.id,
            event_type: 'created',
            from_date: null,
            to_date: targetDateStr,
            created_at: nowIso,
            metadata: JSON.stringify({ recurrence_rule_id: rule.id }),
          });

          createdTasks.push(newTask);
        }
      }
    }

    return createdTasks;
  }
}
