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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { formatMonthYear, isPastDate, formatDisplayDate } from '../../domain/date/dateService';
import { LocalTaskRepository } from '../../repositories/localRepository';
import styles from './CalendarView.module.css';

const turkishWeekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const taskRepo = new LocalTaskRepository();

interface CalendarViewProps {
  onSelectDateAndGoToToday: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onSelectDateAndGoToToday }) => {
  const { todayStr, selectedDate, setSelectedDate } = useTasks();
  const [currentMonth, setCurrentMonth] = useState<Date>(parseISO(selectedDate));
  const [monthCounts, setMonthCounts] = useState<Record<string, { total: number; completed: number }>>({});

  const monthKey = format(currentMonth, 'yyyy-MM');

  useEffect(() => {
    taskRepo.getTaskCountsByMonth(monthKey).then((counts) => {
      setMonthCounts(counts);
    });
  }, [monthKey, selectedDate]);

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
    setSelectedDate(todayStr);
  };

  const handleDayClick = (dayDate: Date) => {
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    onSelectDateAndGoToToday(dateStr);
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
          const isSelected = dateStr === selectedDate;
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
    </div>
  );
};
