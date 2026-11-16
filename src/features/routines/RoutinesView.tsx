import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import {
  DayRoutine,
  DAYS_OF_WEEK,
  DEFAULT_WEEKLY_ROUTINES,
  RoutineTaskItem,
} from '../../types/routine';
import { TaskPriority } from '../../types/task';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { ModernPrioritySelect } from '../../components/ui/ModernPrioritySelect';
import { ModernIconPicker } from '../../components/ui/ModernIconPicker';
import { ModernTimePicker } from '../../components/ui/ModernTimePicker';
import styles from './RoutinesView.module.css';

export const RoutinesView: React.FC = () => {
  const { todayStr, addTask } = useTasks();

  // Load weekly routines
  const [routines, setRoutines] = useState<DayRoutine[]>(() => {
    try {
      const saved = localStorage.getItem('dali_weekly_routines');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 7) return parsed;
      }
      return DEFAULT_WEEKLY_ROUTINES;
    } catch {
      return DEFAULT_WEEKLY_ROUTINES;
    }
  });

  // Adding form state
  const [addingDayNumber, setAddingDayNumber] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority | ''>('');
  const [syncedToday, setSyncedToday] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dali_weekly_routines', JSON.stringify(routines));
    } catch (e) {
      console.error('Haftalık rutinler kaydedilemedi:', e);
    }
  }, [routines]);

  // Determine current day of week (1 = Mon, ..., 7 = Sun)
  const currentDayOfWeek = (() => {
    const d = new Date(todayStr);
    const day = d.getDay();
    return day === 0 ? 7 : day;
  })();

  const handleOpenAddForm = (dayNum: number) => {
    setAddingDayNumber(dayNum);
    setNewTitle('');
    setNewTime('');
    setNewIcon('');
    setNewPriority('');
  };

  const handleSaveRoutineTask = async (dayNum: number, e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    const newTask: RoutineTaskItem = {
      id: `rout-${Date.now()}`,
      title: trimmed,
      reminder_at: newTime || null,
      icon: newIcon || null,
      priority: (newPriority as TaskPriority) || null,
    };

    setRoutines((prev) =>
      prev.map((d) =>
        d.dayNumber === dayNum ? { ...d, tasks: [...d.tasks, newTask] } : d
      )
    );

    // Eğer eklenen gün bugünse, bugünün akışına da doğrudan ekle
    if (dayNum === currentDayOfWeek) {
      await addTask({
        title: newTask.title,
        reminder_at: newTask.reminder_at || null,
        icon: newTask.icon || null,
        priority: newTask.priority || null,
      });
    }

    setAddingDayNumber(null);
  };

  const handleDeleteRoutineTask = (dayNum: number, taskId: string) => {
    setRoutines((prev) =>
      prev.map((d) =>
        d.dayNumber === dayNum
          ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) }
          : d
      )
    );
  };

  // Sync today's routines to the daily task list
  const handleApplyTodayRoutines = async () => {
    const todayRoutine = routines.find((r) => r.dayNumber === currentDayOfWeek);
    if (!todayRoutine || todayRoutine.tasks.length === 0) {
      alert('Bugün için kayıtlı bir tekrarlanan rutin görev bulunmuyor.');
      return;
    }

    for (const t of todayRoutine.tasks) {
      await addTask({
        title: t.title,
        reminder_at: t.reminder_at || null,
        icon: t.icon || null,
        priority: t.priority || null,
      });
    }

    setSyncedToday(true);
    setTimeout(() => setSyncedToday(false), 2500);
  };

  const totalWeeklyRoutinesCount = routines.reduce((acc, d) => acc + d.tasks.length, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <RotateCw size={24} color="var(--accent)" /> Tekrarlı Görevler & Haftalık Rutinler
          </h1>

          <button
            type="button"
            className={styles.syncBtn}
            onClick={handleApplyTodayRoutines}
            title="Bugünün gününe ait rutin görevleri bugünkü planlayıcıya aktar"
          >
            {syncedToday ? (
              <>
                <CheckCircle2 size={13} color="var(--success)" />
                <span>Bugüne Eklendi!</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Bugünün Rutinlerini Yükle</span>
              </>
            )}
          </button>
        </div>

        <p className={styles.subTitle}>
          Haftanın 7 günü için tekrarlanmasını istediğin işleri ayarla. O gün geldiğinde otomatik olarak devreye girer. (Toplam {totalWeeklyRoutinesCount} rutin görev)
        </p>
      </header>

      {/* 7 Günlük Rutin Listesi */}
      <div className={styles.daysGrid}>
        {DAYS_OF_WEEK.map((dayInfo) => {
          const dayData = routines.find((r) => r.dayNumber === dayInfo.dayNumber) || {
            dayNumber: dayInfo.dayNumber,
            dayName: dayInfo.dayName,
            tasks: [],
          };

          const isToday = dayInfo.dayNumber === currentDayOfWeek;
          const isAdding = addingDayNumber === dayInfo.dayNumber;

          return (
            <div
              key={dayInfo.dayNumber}
              className={`${styles.dayCard} ${isToday ? styles.dayCardToday : ''}`}
            >
              <div className={styles.dayHeader}>
                <div className={styles.dayTitleRow}>
                  <Calendar size={14} color={isToday ? 'var(--accent)' : 'var(--text-tertiary)'} />
                  <span className={styles.dayTitle}>{dayInfo.dayName}</span>
                  {isToday && <span className={styles.todayBadge}>Bugün</span>}
                  <span className={styles.taskCountBadge}>
                    ({dayData.tasks.length} görev)
                  </span>
                </div>

                {!isAdding && (
                  <button
                    type="button"
                    className={styles.addTriggerBtn}
                    onClick={() => handleOpenAddForm(dayInfo.dayNumber)}
                  >
                    <Plus size={11} /> Görev Ekle
                  </button>
                )}
              </div>

              {/* Günün Görevleri */}
              <div className={styles.tasksList}>
                {dayData.tasks.map((task) => (
                  <div key={task.id} className={styles.taskRow}>
                    <div className={styles.taskLeft}>
                      {task.priority && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            flexShrink: 0,
                            backgroundColor:
                              task.priority === 'high'
                                ? '#ef4444'
                                : task.priority === 'medium'
                                ? '#f59e0b'
                                : '#60a5fa',
                          }}
                        />
                      )}
                      {task.icon && <DynamicIcon name={task.icon} size={13} />}
                      <span className={styles.taskTitle}>{task.title}</span>
                    </div>

                    <div className={styles.taskMeta}>
                      {task.reminder_at && (
                        <span className={styles.timeTag}>
                          <Clock size={10} />
                          <span>{task.reminder_at}</span>
                        </span>
                      )}

                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteRoutineTask(dayInfo.dayNumber, task.id)}
                        title="Rutin görevi sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {dayData.tasks.length === 0 && !isAdding && (
                  <div className={styles.emptyState}>
                    Bu gün için ayarlanmış tekrarlı görev bulunmuyor.
                  </div>
                )}
              </div>

              {/* Form: Görev Ekle */}
              {isAdding && (
                <form
                  onSubmit={(e) => handleSaveRoutineTask(dayInfo.dayNumber, e)}
                  className={styles.addForm}
                >
                  <input
                    type="text"
                    autoFocus
                    className={styles.addInput}
                    placeholder={`Her ${dayInfo.dayName} günü için görev adı...`}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />

                  <div className={styles.addControlsRow}>
                    <div className={styles.toolsGroup}>
                      <ModernTimePicker value={newTime} onChange={setNewTime} />
                      <ModernPrioritySelect value={newPriority} onChange={setNewPriority} />
                      <ModernIconPicker value={newIcon} onChange={setNewIcon} />
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => setAddingDayNumber(null)}
                      >
                        Vazgeç
                      </button>
                      <button
                        type="submit"
                        disabled={!newTitle.trim()}
                        className={styles.submitBtn}
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
