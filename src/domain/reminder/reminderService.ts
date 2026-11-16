import { Task } from '../../types/task';
import { AppSettings } from '../../types/settings';
import { getTodayDateString } from '../date/dateService';

export class ReminderService {
  private static sentNotificationIds: Set<string> = new Set();

  /**
   * Checks if current time is inside quiet hours
   */
  static isQuietHours(settings: AppSettings, now: Date = new Date()): boolean {
    if (!settings.quiet_hours_enabled) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = settings.quiet_hours_end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight (e.g. 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Evaluates due tasks for notification
   */
  static getDueTasks(
    tasks: Task[],
    settings: AppSettings,
    todayStr: string = getTodayDateString(),
    now: Date = new Date()
  ): Task[] {
    if (!settings.notifications_enabled) return [];
    if (this.isQuietHours(settings, now)) return [];

    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    return tasks.filter((task) => {
      if (task.status === 'completed') return false;
      if (task.scheduled_date !== todayStr) return false;
      if (!task.reminder_at) return false;

      // task.reminder_at can be "HH:mm" or full ISO
      const reminderTime = task.reminder_at.includes('T')
        ? task.reminder_at.substring(11, 16)
        : task.reminder_at;

      const notificationKey = `${task.id}_${todayStr}_${reminderTime}`;
      if (this.sentNotificationIds.has(notificationKey)) return false;

      if (reminderTime === currentHourMin) {
        this.sentNotificationIds.add(notificationKey);
        return true;
      }
      return false;
    });
  }

  /**
   * Dispatches system notification
   */
  static async sendNotification(task: Task): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('Dali Hatırlatıcı', {
        body: task.title,
        icon: '/vite.svg',
      });
    }
  }
}
