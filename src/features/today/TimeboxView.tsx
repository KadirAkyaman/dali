import React, { useState } from 'react';
import { Check, Plus, Timer } from 'lucide-react';
import { Task } from '../../types/task';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import styles from './TimeboxView.module.css';

interface TimeboxViewProps {
  tasks: Task[];
  isToday: boolean;
  onToggleTask: (taskId: string) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onAddTaskAtHour: (hourStr: string) => void;
  onStartFocus?: (task: Task) => void;
}

const HOURS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
];

export const TimeboxView: React.FC<TimeboxViewProps> = ({
  tasks,
  isToday,
  onToggleTask,
  onUpdateTask,
  onAddTaskAtHour,
  onStartFocus,
}) => {
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

  // Group tasks by hour
  const tasksByHour: Record<string, Task[]> = {};
  const unscheduledTasks: Task[] = [];

  HOURS.forEach((h) => {
    tasksByHour[h] = [];
  });

  tasks.forEach((task) => {
    if (task.reminder_at) {
      // Find matching hour slot (e.g., '09:30' -> '09:00')
      const hourPart = task.reminder_at.split(':')[0] + ':00';
      if (tasksByHour[hourPart]) {
        tasksByHour[hourPart].push(task);
      } else {
        unscheduledTasks.push(task);
      }
    } else {
      unscheduledTasks.push(task);
    }
  });

  const handleAssignToHour = async (hour: string) => {
    if (!assigningTaskId) return;
    await onUpdateTask(assigningTaskId, { reminder_at: hour });
    setAssigningTaskId(null);
  };

  // Current time position calculation
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 7 * 60; // 07:00
  const endMinutes = 23 * 60; // 23:00
  const isCurrentTimeVisible =
    isToday && currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  return (
    <div className={styles.container}>
      {/* Zamanı Belirlenmemiş Görevler */}
      {unscheduledTasks.length > 0 && (
        <div className={styles.unscheduledSection}>
          <div className={styles.unscheduledHeader}>
            <span>
              Zamanı Belirlenmemiş Görevler ({unscheduledTasks.length})
              {assigningTaskId && (
                <span style={{ color: 'var(--accent)', marginLeft: 8, fontWeight: 400 }}>
                  ← Saate yerleştirmek için aşağıdaki bir saat dilimine tıklayın
                </span>
              )}
            </span>
          </div>

          <div className={styles.unscheduledList}>
            {unscheduledTasks.map((t) => {
              const isSelected = assigningTaskId === t.id;
              return (
                <div
                  key={t.id}
                  className={styles.unscheduledChip}
                  style={{
                    borderColor: isSelected ? 'var(--accent)' : undefined,
                    backgroundColor: isSelected ? 'var(--accent-soft)' : undefined,
                  }}
                  onClick={() => setAssigningTaskId(isSelected ? null : t.id)}
                  title="Tıklayıp saat çizelgesine yerleştir"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(t.id);
                    }}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: '1px solid var(--border-focus)',
                      background: t.status === 'completed' ? 'var(--accent)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {t.status === 'completed' && <Check size={9} color="#fff" strokeWidth={3} />}
                  </button>
                  {t.icon && <DynamicIcon name={t.icon} size={11} />}
                  <span
                    style={{
                      textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                      color: t.status === 'completed' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    }}
                  >
                    {t.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 24 Saatlik Akıllı Çizelge */}
      <div className={styles.timeline}>
        {isCurrentTimeVisible && (
          <div
            className={styles.currentTimeLine}
            style={{
              top: `${((currentMinutes - startMinutes) / 60) * 52 + 16}px`,
            }}
          >
            <div className={styles.currentTimeDot} />
          </div>
        )}
        {HOURS.map((hour) => {
          const slotTasks = tasksByHour[hour] || [];

          return (
            <div
              key={hour}
              className={styles.hourRow}
              onClick={() => {
                if (assigningTaskId) {
                  handleAssignToHour(hour);
                }
              }}
            >
              <div className={styles.hourLabel}>{hour}</div>

              <div className={styles.slotContent}>
                {slotTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${styles.taskBox} ${
                      task.status === 'completed' ? styles.taskBoxCompleted : ''
                    }`}
                  >
                    <div className={styles.taskLeft}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: '1.5px solid var(--border-focus)',
                          background: task.status === 'completed' ? 'var(--accent)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {task.status === 'completed' && <Check size={10} color="#fff" strokeWidth={2.5} />}
                      </button>

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

                      {task.icon && <DynamicIcon name={task.icon} size={12} />}

                      <span className={styles.taskTitle} title={task.title}>
                        {task.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {task.reminder_at}
                      </span>
                      {onStartFocus && task.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartFocus(task);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: 2,
                          }}
                          title="Odaklanma Sayacını Başlat"
                        >
                          <Timer size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {slotTasks.length === 0 && (
                  <div
                    className={styles.emptySlotHint}
                    onClick={() => onAddTaskAtHour(hour)}
                  >
                    <Plus size={11} style={{ marginRight: 4 }} />
                    <span>Bu saate görev ekle ({hour})</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
