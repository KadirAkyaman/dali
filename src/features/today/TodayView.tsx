import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Sparkles } from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { TaskItem } from '../../components/tasks/TaskItem';
import { TaskInput } from '../../components/tasks/TaskInput';
import { formatDisplayDate, isTodayDate, isPastDate } from '../../domain/date/dateService';
import { QuoteService, Quote } from '../../domain/quote/quoteService';
import styles from './TodayView.module.css';

export const TodayView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    todayStr,
    isReadOnly,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    reorderTasks,
    snoozeTaskToTomorrow,
  } = useTasks();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [quote, setQuote] = useState<Quote>(() => QuoteService.getDailyQuote(selectedDate));

  useEffect(() => {
    setQuote(QuoteService.getDailyQuote(selectedDate));
  }, [selectedDate]);

  const handleNextQuote = () => {
    setQuote(QuoteService.getRandomQuote());
  };

  const isCurrentToday = isTodayDate(selectedDate, todayStr);
  const isPast = isPastDate(selectedDate, todayStr);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  // Tamamlanmamış olanlar üstte, tamamlananlar altta
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'completed' ? 1 : -1;
    }
    return a.sort_order - b.sort_order;
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const reordered = [...sortedTasks];
    const item = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = item;
    await reorderTasks(reordered.map((t) => t.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index >= sortedTasks.length - 1) return;
    const reordered = [...sortedTasks];
    const item = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = item;
    await reorderTasks(reordered.map((t) => t.id));
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...sortedTasks];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    await reorderTasks(reordered.map((t) => t.id));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.dateRow}>
          <h1 className={styles.title}>{formatDisplayDate(selectedDate)}</h1>
          {!isCurrentToday && (
            <button
              type="button"
              className={styles.returnTodayButton}
              onClick={() => setSelectedDate(todayStr)}
            >
              Bugüne Dön
            </button>
          )}
        </div>
        <span className={styles.subTitle}>
          {isCurrentToday
            ? 'Bugüne yer aç.'
            : isPast
            ? 'Geçmiş gün arşivi.'
            : 'Gelecek günlerin planı.'}
        </span>

        {isPast && (
          <div className={styles.readOnlyBanner}>
            <ShieldAlert size={14} />
            <span>Geçmiş günler salt okunurdur. Görev eklenemez veya düzenlenemez.</span>
          </div>
        )}

        {/* Günün Motivasyon Cümlesi */}
        {quote && (
          <div className={styles.quoteContainer}>
            <div className={styles.quoteTextCol}>
              <span className={styles.quoteText}>“{quote.text}”</span>
              <span className={styles.quoteAuthor}>— {quote.author}</span>
            </div>
            <button
              type="button"
              className={styles.quoteRefreshBtn}
              onClick={handleNextQuote}
              title="Başka bir motivasyon sözü göster"
              aria-label="Başka bir motivasyon sözü göster"
            >
              <Sparkles size={14} />
            </button>
          </div>
        )}
      </header>

      {totalCount > 0 && (
        <section className={styles.progressSection}>
          <div className={styles.progressTextRow}>
            <span>
              {completedCount} / {totalCount} tamamlandı
            </span>
            <span>%{Math.round(progressPercent)}</span>
          </div>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
      )}

      <section className={styles.taskList}>
        {sortedTasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            index={index}
            totalTasks={sortedTasks.length}
            isReadOnly={isReadOnly}
            onToggle={toggleTask}
            onUpdate={(id, updates) => updateTask(id, updates)}
            onDelete={deleteTask}
            onSnooze={snoozeTaskToTomorrow}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            isDragging={draggedIndex === index}
            isDragOver={dragOverIndex === index}
          />
        ))}

        <TaskInput
          onAddTask={(title, reminderAt, recurrenceFrequency) =>
            addTask({
              title,
              reminder_at: reminderAt,
              recurrence_frequency: recurrenceFrequency,
            })
          }
          isReadOnly={isReadOnly}
        />

        {totalCount === 0 && (
          <div className={styles.emptyState}>
            {isCurrentToday
              ? 'Bugün için planın boş. İstersen küçük bir şey ekle.'
              : 'Bu gün için planlanmış bir görev bulunmuyor.'}
          </div>
        )}

        {allCompleted && !isPast && (
          <div className={styles.completedAllMessage}>
            <CheckCircle size={14} />
            <span>Tüm görevler tamamlandı. Harika bir gün.</span>
          </div>
        )}
      </section>
    </div>
  );
};
