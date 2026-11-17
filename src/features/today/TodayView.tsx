import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, Timer, List, Clock, CalendarDays } from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { Task, TaskPriority } from '../../types/task';
import { RecurrenceFrequency } from '../../types/recurrence';
import { TaskItem } from '../../components/tasks/TaskItem';
import { TaskInput } from '../../components/tasks/TaskInput';
import { TaskFilterBar } from '../../components/tasks/TaskFilterBar';
import { RoutineTemplatesModal } from '../../components/tasks/RoutineTemplatesModal';
import { FocusTimerModal } from '../../components/focus/FocusTimerModal';
import { TimeboxView } from './TimeboxView';
import { formatDisplayDate, isPastDate } from '../../domain/date/dateService';
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

  const isCurrentToday = selectedDate === todayStr;
  const isPast = isPastDate(selectedDate, todayStr);
  const isReadOnly = isPast;

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
  const openTasks = displayedTasks.filter((task) => task.status === 'open');
  const completedTasks = displayedTasks.filter((task) => task.status === 'completed');

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
        <div className={styles.headerMain}>
          <div className={styles.headingCopy}>
            <span className={styles.eyebrow}>Günlük akış</span>
            <div className={styles.titleLine}>
              <h1 className={styles.title}>{formatDisplayDate(selectedDate)}</h1>
              {!isCurrentToday && (
                <button
                  type="button"
                  className={styles.returnTodayButton}
                  onClick={() => setSelectedDate(todayStr)}
                  title="Bugünün tarihine dön"
                >
                  <CalendarDays size={14} />
                  Bugüne dön
                </button>
              )}
            </div>
            <p className={styles.subTitle}>Bugüne yer aç. Küçük adımlarla ilerle.</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.viewModePillGroup} aria-label="Görünüm seçimi">
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.viewModeBtnActive : ''}`}
                onClick={() => setViewMode('list')}
                title="Liste görünümü"
              >
                <List size={15} />
                <span>Liste</span>
              </button>
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'timebox' ? styles.viewModeBtnActive : ''}`}
                onClick={() => setViewMode('timebox')}
                title="Zaman çizelgesi görünümü"
              >
                <Clock size={15} />
                <span>Çizelge</span>
              </button>
            </div>

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={() => setIsTemplatesOpen(true)}
                  title="Hazır rutin şablonu yükle"
                >
                  <Sparkles size={15} />
                  <span>Şablonlar</span>
                </button>
                <button
                  type="button"
                  className={`${styles.toolbarButton} ${styles.focusButton}`}
                  onClick={() => {
                    setFocusTask(null);
                    setIsFocusModalOpen(true);
                  }}
                  title="Serbest odak sayacı"
                >
                  <Timer size={15} />
                  <span>Odaklan</span>
                </button>
              </>
            )}
          </div>
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
            <div className={styles.progressCopy}>
              <span className={styles.progressEyebrow}>Günlük ilerleme</span>
              <span className={styles.progressCount}>{completedCount} / {totalCount} görev tamamlandı</span>
            </div>
            <span className={styles.progressPercent}>%{Math.round(progressPercent)}</span>
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
          {openTasks.length > 0 && (
            <div className={styles.taskSectionHeading}>
              <span><span className={styles.openDot} />Yapılacaklar</span>
              <span className={styles.sectionCount}>{openTasks.length}</span>
            </div>
          )}

          {openTasks.map((task) => {
            const index = displayedTasks.indexOf(task);
            return (
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
            );
          })}

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
              <span className={styles.emptyIcon}><CheckCircle size={19} /></span>
              <span className={styles.emptyTitle}>{isCurrentToday ? 'Güne açık bir sayfa' : 'Bu gün henüz planlanmamış'}</span>
              <span className={styles.emptyDescription}>
                {isCurrentToday ? 'İlk görevini ekleyerek ritmini kur.' : 'Seçtiğin tarih için planlanmış görev bulunmuyor.'}
              </span>
            </div>
          )}

          {completedTasks.length > 0 && (
            <>
              <div className={`${styles.taskSectionHeading} ${styles.completedHeading}`}>
                <span><CheckCircle size={15} />Tamamlananlar</span>
                <span className={styles.sectionCount}>{completedTasks.length}</span>
              </div>
              {completedTasks.map((task) => {
                const index = displayedTasks.indexOf(task);
                return (
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
                    onStartFocus={(t) => { setFocusTask(t); setIsFocusModalOpen(true); }}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                  />
                );
              })}
            </>
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
