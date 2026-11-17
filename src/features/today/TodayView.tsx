import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, Timer, List, Clock } from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { Task, TaskPriority } from '../../types/task';
import { RecurrenceFrequency } from '../../types/recurrence';
import { TaskItem } from '../../components/tasks/TaskItem';
import { TaskInput } from '../../components/tasks/TaskInput';
import { TaskFilterBar } from '../../components/tasks/TaskFilterBar';
import { RoutineTemplatesModal } from '../../components/tasks/RoutineTemplatesModal';
import { FocusTimerModal } from '../../components/focus/FocusTimerModal';
import { TimeboxView } from './TimeboxView';
import { formatDisplayDate } from '../../domain/date/dateService';
import { QuoteService, Quote } from '../../domain/quote/quoteService';
import styles from './TodayView.module.css';

export const TodayView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    todayStr,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    reorderTasks,
    snoozeTaskToTomorrow,
  } = useTasks();

  // Günlük Akış sekmesi her zaman bugünün tarihine sabitlenir
  useEffect(() => {
    if (selectedDate !== todayStr) {
      setSelectedDate(todayStr);
    }
  }, [todayStr, selectedDate, setSelectedDate]);

  const [viewMode, setViewMode] = useState<'list' | 'timebox'>('list');

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [quote, setQuote] = useState<Quote>(() => QuoteService.getDailyQuote(todayStr));
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

  useEffect(() => {
    setQuote(QuoteService.getDailyQuote(todayStr));
  }, [todayStr]);

  const handleNextQuote = () => {
    setQuote(QuoteService.getRandomQuote());
  };

  const isReadOnly = false;
  const isCurrentToday = true;
  const isPast = false;

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  // Available icons in current day's tasks
  const availableIcons = Array.from(
    new Set(tasks.map((t) => t.icon).filter(Boolean))
  ) as string[];

  // Tamamlanmamış olanlar üstte, tamamlananlar altta
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'completed' ? 1 : -1;
    }
    return a.sort_order - b.sort_order;
  });

  const displayedTasks = activeFilter
    ? sortedTasks.filter((t) => t.icon === activeFilter)
    : sortedTasks;

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

  const handleApplyTemplate = async (
    templateTasks: { title: string; icon?: string; priority?: TaskPriority }[]
  ) => {
    for (const t of templateTasks) {
      await addTask({
        title: t.title,
        icon: t.icon || null,
        priority: t.priority || null,
      });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.dateRow}>
          <h1 className={styles.title}>{formatDisplayDate(todayStr)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 2 Mod Switcher: Liste vs Zaman Çizelgesi */}
            <div className={styles.viewModePillGroup}>
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.viewModeBtnActive : ''}`}
                onClick={() => setViewMode('list')}
                title="Standart Liste Görünümü"
              >
                <List size={12} />
                <span>Liste</span>
              </button>
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'timebox' ? styles.viewModeBtnActive : ''}`}
                onClick={() => setViewMode('timebox')}
                title="Saatlik Zaman Çizelgesi (Timebox)"
              >
                <Clock size={12} />
                <span>Çizelge</span>
              </button>
            </div>

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  className={styles.returnTodayButton}
                  onClick={() => setIsTemplatesOpen(true)}
                  title="Hazır rutin şablonu yükle"
                >
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Şablonlar
                </button>

                <button
                  type="button"
                  className={styles.returnTodayButton}
                  onClick={() => {
                    setFocusTask(null);
                    setIsFocusModalOpen(true);
                  }}
                  title="Serbest Odak Sayacı (Pomodoro)"
                >
                  <Timer size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Odaklan
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <span className={styles.subTitle}>
            Bugüne yer aç.
          </span>
        </div>

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

      {/* İkon / Kategori Filtreleme Çubuğu */}
      {viewMode === 'list' && (
        <TaskFilterBar
          availableIcons={availableIcons}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      )}

      {viewMode === 'timebox' ? (
        <TimeboxView
          tasks={tasks}
          isToday={isCurrentToday}
          onToggleTask={toggleTask}
          onUpdateTask={(id, updates) => updateTask(id, updates)}
          onAddTaskAtHour={(hourStr) =>
            addTask({
              title: 'Yeni Görev',
              reminder_at: hourStr,
            })
          }
          onStartFocus={(t) => {
            setFocusTask(t);
            setIsFocusModalOpen(true);
          }}
        />
      ) : (
        <section
          className={styles.taskList}
          onDragEnter={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
          }}
        >
          {displayedTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              totalTasks={displayedTasks.length}
              isReadOnly={isReadOnly}
              onToggle={toggleTask}
              onUpdate={(id, updates) => updateTask(id, updates)}
              onDelete={deleteTask}
              onSnooze={snoozeTaskToTomorrow}
              onStartFocus={(t) => {
                setFocusTask(t);
                setIsFocusModalOpen(true);
              }}
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
            onAddTask={(
              title: string,
              reminderAt?: string | null,
              recurrenceFrequency?: RecurrenceFrequency | null,
              icon?: string | null,
              priority?: TaskPriority | null,
              projectId?: string | null
            ) =>
              addTask({
                title,
                reminder_at: reminderAt,
                recurrence_frequency: recurrenceFrequency,
                icon: icon || null,
                priority: priority || null,
                project_id: projectId || null,
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
      )}

      {/* Rutin Şablonları Modalı */}
      <RoutineTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Odaklanma (Pomodoro) Modalı */}
      <FocusTimerModal
        task={focusTask}
        isOpen={isFocusModalOpen}
        onClose={() => {
          setIsFocusModalOpen(false);
          setFocusTask(null);
        }}
        onTaskComplete={(taskId) => toggleTask(taskId)}
      />
    </div>
  );
};
