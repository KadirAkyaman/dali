import React, { useState, useEffect, useCallback } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Plus,
  ExternalLink,
  ListTree,
} from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { Task } from '../../types/task';
import { formatMonthYear, isPastDate, formatDisplayDate } from '../../domain/date/dateService';
import { LocalTaskRepository } from '../../repositories/localRepository';
import styles from './CalendarView.module.css';

const turkishWeekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const taskRepo = new LocalTaskRepository();

interface CalendarViewProps {
  onOpenDayInTodayView?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenDayInTodayView }) => {
  const { todayStr, addTask, toggleTask, deleteTask, tasks } = useTasks();
  const [inspectedDate, setInspectedDate] = useState<string>(todayStr);
  const [inspectedTasks, setInspectedTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<Date>(parseISO(todayStr));
  const [monthCounts, setMonthCounts] = useState<Record<string, { total: number; completed: number }>>({});

  const monthKey = format(currentMonth, 'yyyy-MM');

  const refreshInspectedTasks = useCallback(async () => {
    const list = await taskRepo.findByDate(inspectedDate);
    setInspectedTasks(list);
    const counts = await taskRepo.getTaskCountsByMonth(monthKey);
    setMonthCounts(counts);
  }, [inspectedDate, monthKey]);

  useEffect(() => {
    refreshInspectedTasks();
  }, [refreshInspectedTasks, tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const monthTaskTotal = Object.values(monthCounts).reduce((sum, item) => sum + item.total, 0);
  const monthCompletedTotal = Object.values(monthCounts).reduce((sum, item) => sum + item.completed, 0);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleTodayClick = () => {
    const todayDate = parseISO(todayStr);
    setCurrentMonth(todayDate);
    setInspectedDate(todayStr);
  };

  const handleDayClick = (dayDate: Date) => {
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    setInspectedDate(dateStr);
  };

  const handleCreateTaskForInspectedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    await addTask({
      title: trimmed,
      scheduled_date: inspectedDate,
    });
    setNewTaskTitle('');
    await refreshInspectedTasks();
  };

  const handleToggle = async (taskId: string) => {
    await toggleTask(taskId);
    await refreshInspectedTasks();
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    await refreshInspectedTasks();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <span className={styles.eyebrow}>Planlama</span>
          <div className={styles.titleLine}>
            <CalendarDays size={22} className={styles.titleIcon} />
            <h1 className={styles.monthTitle}>{formatMonthYear(currentMonth)}</h1>
          </div>
          <span className={styles.headerSubtitle}>Ayını gör, günlerini planla ve ilerlemeyi takip et.</span>
        </div>
        <div className={styles.navButtons}>
          <button
            type="button"
            className={styles.todayShortcut}
            onClick={handleTodayClick}
          >
            Bugün
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={handlePrevMonth}
            aria-label="Önceki ay"
            title="Önceki ay"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={handleNextMonth}
            aria-label="Sonraki ay"
            title="Sonraki ay"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <section className={styles.calendarCard} aria-label="Aylık takvim">
      <div className={styles.grid}>
        {turkishWeekdays.map((wd) => (
          <div key={wd} className={styles.weekdayHeader}>
            {wd}
          </div>
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, parseISO(todayStr));
          const isSelected = dateStr === inspectedDate;
          const isPast = isPastDate(dateStr, todayStr);
          const activity = monthCounts[dateStr];

          return (
            <button
              key={dateStr}
              type="button"
              className={`
                ${styles.dayCell}
                ${!isCurrentMonthDay ? styles.emptyCell : ''}
                ${isPast && isCurrentMonthDay ? styles.pastDay : ''}
                ${isToday ? styles.isToday : ''}
                ${isSelected ? styles.isSelected : ''}
              `}
              onClick={() => handleDayClick(day)}
              title={`${formatDisplayDate(dateStr)}${
                activity ? ` (${activity.completed}/${activity.total} tamamlandı)` : ''
              }`}
            >
              <span>{format(day, 'd')}</span>
              {activity && activity.total > 0 && (
                <div
                  className={`${styles.taskIndicator} ${
                    activity.completed === activity.total ? styles.taskIndicatorDone : ''
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className={styles.monthSummary}>
        <span><i className={styles.summaryDot} />{monthTaskTotal} planlı görev</span>
        <span><i className={`${styles.summaryDot} ${styles.summaryDotDone}`} />{monthCompletedTotal} tamamlandı</span>
      </div>
      </section>

      {/* Seçilen Günün Detayları */}
      <div className={styles.selectedDayDetails}>
        <div className={styles.selectedDayHeader}>
          <div className={styles.headerLeftInfo}>
            <CalendarCheck size={18} className={styles.headerIcon} />
            <span className={styles.headerDateText}>{formatDisplayDate(inspectedDate)}</span>
            <span className={styles.taskCountBadge}>
              {inspectedTasks.length} görev
            </span>
          </div>

          {onOpenDayInTodayView && (
            <button
              type="button"
              className={styles.openInDailyFlowBtn}
              onClick={() => onOpenDayInTodayView(inspectedDate)}
              title="Bu günü Günlük Akış görünümünde aç ve planla"
            >
              <ExternalLink size={13} />
              <span>Günlük Akışta Aç</span>
            </button>
          )}
        </div>

        {/* Tarihe Görev Ekleme Alanı */}
        <form onSubmit={handleCreateTaskForInspectedDate} className={styles.addTaskForm}>
          <input
            type="text"
            placeholder={`${formatDisplayDate(inspectedDate)} için görev ekle (Enter)...`}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className={styles.addTaskInput}
          />
          <button
            type="submit"
            className={styles.addTaskSubmitBtn}
            disabled={!newTaskTitle.trim()}
          >
            <Plus size={14} />
            <span>Ekle</span>
          </button>
        </form>

        {/* Görev Listesi */}
        {inspectedTasks.length === 0 ? (
          <div className={styles.emptyDayNotice}>
            <p>Bu tarih için henüz planlanmış bir görev bulunmuyor.</p>
            <span>Yukarıdaki kutudan hızlıca yeni bir görev ekleyebilirsiniz.</span>
          </div>
        ) : (
          <div className={styles.taskListContainer}>
            {inspectedTasks.map((t) => {
              const isDone = t.status === 'completed';
              const subtasks = t.subtasks || [];
              const completedSubtasks = subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={t.id}
                  className={`${styles.taskRow} ${isDone ? styles.taskRowDone : ''}`}
                >
                  <button
                    type="button"
                    className={`${styles.taskCheckbox} ${isDone ? styles.taskCheckboxDone : ''}`}
                    onClick={() => handleToggle(t.id)}
                    aria-label={isDone ? 'Tamamlanmadı yap' : 'Tamamla'}
                  >
                    {isDone ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Circle size={16} />
                    )}
                  </button>

                  <div className={styles.taskTitleGroup}>
                    <span className={`${styles.taskTitle} ${isDone ? styles.taskTitleDone : ''}`}>
                      {t.title}
                    </span>

                    <div className={styles.taskMetaRow}>
                      {t.reminder_at && (
                        <span className={styles.taskMetaTag}>
                          <Clock size={11} />
                          {t.reminder_at}
                        </span>
                      )}

                      {subtasks.length > 0 && (
                        <span className={styles.taskMetaTag}>
                          <ListTree size={11} />
                          {completedSubtasks}/{subtasks.length}
                        </span>
                      )}

                      {t.priority && (
                        <span
                          className={`${styles.taskMetaTag} ${
                            t.priority === 'high'
                              ? styles.priorityHigh
                              : t.priority === 'medium'
                              ? styles.priorityMedium
                              : styles.priorityLow
                          }`}
                        >
                          {t.priority === 'high'
                            ? 'Yüksek'
                            : t.priority === 'medium'
                            ? 'Orta'
                            : 'Düşük'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.deleteTaskBtn}
                    onClick={() => handleDelete(t.id)}
                    title="Görevi sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
