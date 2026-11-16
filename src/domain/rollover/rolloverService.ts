import { ITaskRepository, ITaskEventRepository, ISettingsRepository } from '../../repositories/interfaces';
import { getTodayDateString } from '../date/dateService';

export interface RolloverResult {
  executed: boolean;
  rolledOverCount: number;
  message: string;
}

export class RolloverService {
  constructor(
    private taskRepo: ITaskRepository,
    private eventRepo: ITaskEventRepository,
    private settingsRepo: ISettingsRepository
  ) {}

  /**
   * Executes rollover process if needed.
   * Finds all open tasks with scheduled_date < todayStr and rolls them over to todayStr.
   * Guaranteed to be idempotent and safe across multi-day gaps.
   */
  async processDailyRollover(todayStr: string = getTodayDateString()): Promise<RolloverResult> {
    const settings = await this.settingsRepo.getSettings();

    // Check if auto-rollover is enabled
    if (!settings.auto_rollover_enabled) {
      await this.settingsRepo.updateSettings({ last_active_date: todayStr });
      return {
        executed: false,
        rolledOverCount: 0,
        message: 'Auto-rollover is disabled in settings.',
      };
    }

    // If last_active_date is already today, we can still ensure no stranded past open tasks exist,
    // but typically rollover checks tasks with scheduled_date < todayStr.
    const strandedOpenTasks = await this.taskRepo.findOpenTasksBeforeDate(todayStr);

    if (strandedOpenTasks.length === 0) {
      await this.settingsRepo.updateSettings({ last_active_date: todayStr });
      return {
        executed: true,
        rolledOverCount: 0,
        message: 'No open tasks needed rollover.',
      };
    }

    const nowIso = new Date().toISOString();
    let count = 0;

    for (const task of strandedOpenTasks) {
      const fromDate = task.scheduled_date;

      // Update task to today, increment rollover_count
      await this.taskRepo.update(task.id, {
        scheduled_date: todayStr,
        rollover_count: (task.rollover_count || 0) + 1,
        source_task_id: task.source_task_id || task.id,
      });

      // Record task event
      await this.eventRepo.create({
        id: crypto.randomUUID(),
        task_id: task.id,
        event_type: 'rolled_over',
        from_date: fromDate,
        to_date: todayStr,
        created_at: nowIso,
        metadata: JSON.stringify({ previousRolloverCount: task.rollover_count }),
      });

      count++;
    }

    // Update last_active_date in settings
    await this.settingsRepo.updateSettings({ last_active_date: todayStr });

    return {
      executed: true,
      rolledOverCount: count,
      message: `Successfully rolled over ${count} task(s) to ${todayStr}.`,
    };
  }
}
