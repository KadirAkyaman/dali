import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../../types/task';
import { TaskService } from '../../domain/task/taskService';
import { RolloverService } from '../../domain/rollover/rolloverService';
import { ReminderService } from '../../domain/reminder/reminderService';
import { RecurrenceService } from '../../domain/recurrence/recurrenceService';
import { DayRoutine, RoutineTaskItem } from '../../types/routine';
import {
  LocalTaskRepository,
  LocalTaskEventRepository,
  LocalSettingsRepository,
  LocalRecurrenceRepository,
} from '../../repositories/localRepository';
import { getTodayDateString, isPastDate } from '../../domain/date/dateService';
import { addDays, parseISO, format } from 'date-fns';

export interface FeedbackAction {
  message: string;
  onUndo?: () => Promise<void>;
}

interface TaskContextType {
  todayStr: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  tasks: Task[];
  isLoading: boolean;
  isReadOnly: boolean;
  feedback: FeedbackAction | null;
  clearFeedback: () => void;
  setFeedback: (msg: string, onUndo?: () => Promise<void>) => void;
  addTask: (dto: Omit<CreateTaskDTO, 'scheduled_date'> & { scheduled_date?: string }) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTaskToDate: (id: string, targetDate: string) => Promise<void>;
  snoozeTaskToTomorrow: (id: string) => Promise<void>;
  reorderTasks: (orderedTaskIds: string[]) => Promise<void>;
  refreshTasks: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (jsonStr: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const taskRepo = new LocalTaskRepository();
const eventRepo = new LocalTaskEventRepository();
const settingsRepo = new LocalSettingsRepository();
const recurrenceRepo = new LocalRecurrenceRepository();

const taskService = new TaskService(taskRepo, eventRepo);
const rolloverService = new RolloverService(taskRepo, eventRepo, settingsRepo);
const recurrenceService = new RecurrenceService(recurrenceRepo, taskRepo, eventRepo);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedbackState] = useState<FeedbackAction | null>(null);

  const clearFeedback = () => setFeedbackState(null);

  const setFeedback = (message: string, onUndo?: () => Promise<void>) => {
    setFeedbackState({ message, onUndo });
  };

  // Görevleri yükleme
  const loadTasksForDate = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const currentToday = getTodayDateString();
      // O gün için tekrarlanan kural görevlerini senkronize et
      await recurrenceService.syncRecurringTasksForDate(date, currentToday);

      // Haftanın gününe ait haftalık rutinleri otomatik yükle ve senkronize et
      try {
        const routinesStr = typeof window !== 'undefined' ? localStorage.getItem('dali_weekly_routines') : null;
        if (routinesStr) {
          const routinesList: DayRoutine[] = JSON.parse(routinesStr);
          const d = new Date(date);
          const day = d.getDay();
          const dayNumber = day === 0 ? 7 : day;
          const matchingDay = routinesList.find((r) => r.dayNumber === dayNumber);
          if (matchingDay && matchingDay.tasks.length > 0) {
            const currentExisting = await taskService.getTasksForDate(date);
            const existingTitles = new Set(currentExisting.map((t) => t.title.trim().toLowerCase()));
            let routinesModified = false;
            const remainingTasks: RoutineTaskItem[] = [];

            for (const t of matchingDay.tasks) {
              if (!existingTitles.has(t.title.trim().toLowerCase())) {
                await taskService.createTask(
                  {
                    title: t.title,
                    scheduled_date: date,
                    reminder_at: t.reminder_at || null,
                    icon: t.icon || null,
                    priority: t.priority || null,
                  },
                  currentToday
                );
              }

              // Tek seferlik rutinler günü gelip aktarıldıktan sonra şablondan silinir
              if (t.repeatWeekly === false) {
                routinesModified = true;
              } else {
                remainingTasks.push(t);
              }
            }

            if (routinesModified) {
              const nextRoutines = routinesList.map((r) =>
                r.dayNumber === dayNumber ? { ...r, tasks: remainingTasks } : r
              );
              localStorage.setItem('dali_weekly_routines', JSON.stringify(nextRoutines));
            }
          }
        }
      } catch (routErr) {
        console.error('Haftalık rutin senkronizasyon hatası:', routErr);
      }

      const data = await taskService.getTasksForDate(date);
      setTasks(data);
    } catch (err: any) {
      setFeedback(err.message || 'Görevler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Başlangıç: Aktarım kontrolü ve bugünü yükleme
  useEffect(() => {
    const init = async () => {
      const currentToday = getTodayDateString();
      setTodayStr(currentToday);
      setSelectedDate(currentToday);

      try {
        const rolloverRes = await rolloverService.processDailyRollover(currentToday);
        if (rolloverRes.rolledOverCount > 0) {
          setFeedback(`${rolloverRes.rolledOverCount} açık görev bugüne aktarıldı.`);
        }
      } catch (e) {
        console.error('Aktarım hatası:', e);
      }

      await loadTasksForDate(currentToday);
    };

    init();
  }, [loadTasksForDate]);

  // Hatırlatıcı kontrol aralığı (Her 30 saniyede bir kontrol)
  useEffect(() => {
    const interval = setInterval(async () => {
      const settings = await settingsRepo.getSettings();
      if (!settings.notifications_enabled) return;

      const currentTasks = await taskService.getTasksForDate(todayStr);
      const dueTasks = ReminderService.getDueTasks(currentTasks, settings, todayStr);

      for (const dueTask of dueTasks) {
        ReminderService.sendNotification(dueTask);
        setFeedback(`Hatırlatıcı: ${dueTask.title}`);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [todayStr]);

  // Seçili tarih değişince yükle
  useEffect(() => {
    loadTasksForDate(selectedDate);
  }, [selectedDate, loadTasksForDate]);

  const isReadOnly = isPastDate(selectedDate, todayStr);

  const addTask = async (dto: Omit<CreateTaskDTO, 'scheduled_date'> & { scheduled_date?: string }) => {
    try {
      const targetDate = dto.scheduled_date || selectedDate;
      if (dto.recurrence_frequency) {
        await recurrenceService.createRule(
          {
            title: dto.title,
            frequency: dto.recurrence_frequency,
            start_date: targetDate,
            reminder_at: dto.reminder_at || null,
          },
          todayStr
        );
      } else {
        await taskService.createTask(
          {
            ...dto,
            scheduled_date: targetDate,
          },
          todayStr
        );
      }
      await loadTasksForDate(selectedDate);
    } catch (err: any) {
      const msg = err.message.includes('Past days are read-only')
        ? 'Geçmiş günler salt okunurdur. Görev eklenemez.'
        : err.message;
      setFeedback(msg);
      throw err;
    }
  };

  const toggleTask = async (id: string) => {
    try {
      await taskService.toggleTaskStatus(id, todayStr);
      await loadTasksForDate(selectedDate);
    } catch (err: any) {
      const msg = err.message.includes('Past days are read-only')
        ? 'Geçmiş günler salt okunurdur. Durum değiştirilemez.'
        : err.message;
      setFeedback(msg);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: UpdateTaskDTO) => {
    try {
      const task = await taskRepo.findById(id);
      if (!task) return;

      let nextRuleId = task.recurrence_rule_id;
      if (updates.recurrence_frequency !== undefined) {
        if (!updates.recurrence_frequency) {
          if (task.recurrence_rule_id) {
            await recurrenceRepo.delete(task.recurrence_rule_id);
            nextRuleId = null;
          }
        } else {
          if (task.recurrence_rule_id) {
            await recurrenceRepo.update(task.recurrence_rule_id, {
              frequency: updates.recurrence_frequency,
              title: updates.title || task.title,
            });
          } else {
            const { rule } = await recurrenceService.createRule(
              {
                title: updates.title || task.title,
                frequency: updates.recurrence_frequency,
                start_date: task.scheduled_date,
              },
              todayStr
            );
            nextRuleId = rule.id;
          }
        }
      }

      await taskService.updateTask(
        id,
        {
          title: updates.title,
          notes: updates.notes,
          reminder_at: updates.reminder_at,
          sort_order: updates.sort_order,
          icon: updates.icon,
          priority: updates.priority,
          subtasks: updates.subtasks,
        },
        todayStr
      );

      if (nextRuleId !== task.recurrence_rule_id) {
        await taskRepo.update(id, { recurrence_rule_id: nextRuleId });
      }

      await loadTasksForDate(selectedDate);
    } catch (err: any) {
      setFeedback(err.message);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const taskToDelete = await taskRepo.findById(id);
      if (!taskToDelete) return;

      await taskService.deleteTask(id, todayStr);
      await loadTasksForDate(selectedDate);

      // Geri Al (Undo) desteği
      setFeedback(`"${taskToDelete.title}" silindi.`, async () => {
        await taskRepo.create({
          id: taskToDelete.id,
          title: taskToDelete.title,
          notes: taskToDelete.notes,
          scheduled_date: taskToDelete.scheduled_date,
          reminder_at: taskToDelete.reminder_at,
          sort_order: taskToDelete.sort_order,
          created_at: taskToDelete.created_at,
          updated_at: new Date().toISOString(),
        });
        await loadTasksForDate(selectedDate);
        setFeedback('İşlem geri alındı.');
      });
    } catch (err: any) {
      setFeedback(err.message);
      throw err;
    }
  };

  const moveTaskToDate = async (id: string, targetDate: string) => {
    try {
      await taskService.moveTask(id, targetDate, todayStr);
      await loadTasksForDate(selectedDate);
    } catch (err: any) {
      setFeedback(err.message);
      throw err;
    }
  };

  const snoozeTaskToTomorrow = async (id: string) => {
    try {
      const task = await taskRepo.findById(id);
      if (!task) return;

      const tomorrow = format(addDays(parseISO(task.scheduled_date), 1), 'yyyy-MM-dd');
      const originalDate = task.scheduled_date;

      await taskService.moveTask(id, tomorrow, todayStr);
      await loadTasksForDate(selectedDate);

      // Geri Al (Undo) desteği
      setFeedback(`"${task.title}" yarına ertelendi.`, async () => {
        await taskService.moveTask(id, originalDate, todayStr);
        await loadTasksForDate(selectedDate);
        setFeedback('Erteleme geri alındı.');
      });
    } catch (err: any) {
      setFeedback(err.message);
      throw err;
    }
  };

  const reorderTasks = async (orderedTaskIds: string[]) => {
    try {
      await taskService.reorderTasks(orderedTaskIds, selectedDate, todayStr);
      await loadTasksForDate(selectedDate);
    } catch (err: any) {
      setFeedback(err.message);
      throw err;
    }
  };

  const refreshTasks = useCallback(async () => {
    await loadTasksForDate(selectedDate);
  }, [loadTasksForDate, selectedDate]);

  // Faz 2: Veri Yedekleme Dışa Aktarma
  const exportData = async (): Promise<string> => {
    const rawTasks = localStorage.getItem('dali_tasks') || '[]';
    const rawEvents = localStorage.getItem('dali_task_events') || '[]';
    const rawSettings = localStorage.getItem('dali_settings') || '{}';

    const backup = {
      version: '0.1.0',
      exported_at: new Date().toISOString(),
      tasks: JSON.parse(rawTasks),
      events: JSON.parse(rawEvents),
      settings: JSON.parse(rawSettings),
    };

    return JSON.stringify(backup, null, 2);
  };

  // Faz 2: Veri Yedekleme İçe Aktarma
  const importData = async (jsonStr: string): Promise<void> => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        localStorage.setItem('dali_tasks', JSON.stringify(parsed.tasks));
      }
      if (parsed.events && Array.isArray(parsed.events)) {
        localStorage.setItem('dali_task_events', JSON.stringify(parsed.events));
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        localStorage.setItem('dali_settings', JSON.stringify(parsed.settings));
      }
      await loadTasksForDate(selectedDate);
      setFeedback('Yedek verileri başarıyla geri yüklendi.');
    } catch {
      setFeedback('Geçersiz yedek dosyası.');
    }
  };

  return (
    <TaskContext.Provider
      value={{
        todayStr,
        selectedDate,
        setSelectedDate,
        tasks,
        isLoading,
        isReadOnly,
        feedback,
        clearFeedback,
        setFeedback,
        addTask,
        toggleTask,
        updateTask,
        deleteTask,
        moveTaskToDate,
        snoozeTaskToTomorrow,
        reorderTasks,
        refreshTasks,
        exportData,
        importData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
