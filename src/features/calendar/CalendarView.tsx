import React, { useState, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, CalendarCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { Task } from '../../types/task';
import { formatMonthYear, isPastDate, formatDisplayDate } from '../../domain/date/dateService';
import { LocalTaskRepository } from '../../repositories/localRepository';
import styles from './CalendarView.module.css';

const turkishWeekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const taskRepo = new LocalTaskRepository();

interface CalendarViewProps {
  onSelectDateAndGoToToday: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onSelectDateAndGoToToday }) => {
  const { todayStr } = useTasks();
  const [inspectedDate, setInspectedDate] = useState<string>(todayStr);
  const [inspectedTasks, setInspectedTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(parseISO(todayStr));
  const [monthCounts, setMonthCounts] = useState<Record<string, { total: number; completed: number }>>({});

  const monthKey = format(currentMonth, 'yyyy-MM');

  useEffect(() => {
    taskRepo.getTaskCountsByMonth(monthKey).then((counts) => {
      setMonthCounts(counts);
    });
  }, [monthKey, inspectedDate]);

  useEffect(() => {
    taskRepo.findByDate(inspectedDate).then((tasks) => {
      setInspectedTasks(tasks);
    });
  }, [inspectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

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

  const handleGoToPlan = () => {
    onSelectDateAndGoToToday(inspectedDate);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.monthTitle}>{formatMonthYear(currentMonth)}</h2>
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
              title={`${formatDisplayDate(dateStr)}${activity ? ` (${activity.completed}/${activity.total} tamamlandı)` : ''}`}
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

      {/* Seçilen Günün Detayları */}
      <div className={styles.selectedDayDetails}>
        <div className={styles.selectedDayHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={16} color="var(--accent)" />
            <span>{formatDisplayDate(inspectedDate)}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
              ({inspectedTasks.length} görev)
            </span>
          </div>

          <button
            type="button"
            className={styles.todayShortcut}
            onClick={handleGoToPlan}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}
          >
            <span>Bu Güne Git</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {inspectedTasks.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px 0' }}>
            Bu tarih için kayıtlı görev bulunmuyor.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
            {inspectedTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-subtle)',
                  fontSize: '13px',
                  color: t.status === 'completed' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                }}
              >
                <CheckCircle2
                  size={14}
                  color={t.status === 'completed' ? 'var(--success)' : 'var(--text-tertiary)'}
                />
                <span>{t.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
