import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Trash2,
  Edit2,
  Clock,
  GripVertical,
  RotateCw,
  CalendarArrowDown,
  ChevronUp,
  ChevronDown,
  Timer,
  ListTree,
} from 'lucide-react';
import { Task, TaskPriority, Subtask } from '../../types/task';
import { RecurrenceFrequency } from '../../types/recurrence';
import { ModernTimePicker } from '../ui/ModernTimePicker';
import { ModernRepeatSelect } from '../ui/ModernRepeatSelect';
import { ModernIconPicker } from '../ui/ModernIconPicker';
import { ModernPrioritySelect } from '../ui/ModernPrioritySelect';
import { SubtaskList } from './SubtaskList';
import { DynamicIcon } from '../ui/DynamicIcon';
import { LocalRecurrenceRepository } from '../../repositories/localRepository';
import styles from './TaskItem.module.css';

const recurrenceRepo = new LocalRecurrenceRepository();

interface TaskItemProps {
  task: Task;
  index?: number;
  totalTasks?: number;
  isReadOnly: boolean;
  onToggle: (id: string) => void;
  onUpdate: (
    id: string,
    updates: {
      title?: string;
      notes?: string | null;
      reminder_at?: string | null;
      recurrence_frequency?: RecurrenceFrequency | null;
      icon?: string | null;
      priority?: TaskPriority | null;
      subtasks?: Subtask[];
    }
  ) => void;
  onDelete: (id: string) => void;
  onSnooze?: (id: string) => void;
  onStartFocus?: (task: Task) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDrop?: (index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index = 0,
  totalTasks = 1,
  isReadOnly,
  onToggle,
  onUpdate,
  onDelete,
  onSnooze,
  onStartFocus,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [editTime, setEditTime] = useState(task.reminder_at || '');
  const [editRepeat, setEditRepeat] = useState<RecurrenceFrequency | ''>('');
  const [editIcon, setEditIcon] = useState(task.icon || '');
  const [editPriority, setEditPriority] = useState<TaskPriority | ''>(task.priority || '');
  const [showSparkles, setShowSparkles] = useState(false);
  const sparklesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (sparklesTimeoutRef.current) {
        clearTimeout(sparklesTimeoutRef.current);
      }
    };
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditTitle(task.title);
      setEditNotes(task.notes || '');
      setEditTime(task.reminder_at || '');
      setEditIcon(task.icon || '');
      setEditPriority(task.priority || '');
      if (task.recurrence_rule_id) {
        recurrenceRepo.findById(task.recurrence_rule_id).then((rule) => {
          if (rule) {
            setEditRepeat(rule.frequency);
          }
        });
      } else {
        setEditRepeat('');
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing, task]);

  const handleToggle = () => {
    if (isReadOnly) return;
    if (task.status === 'open') {
      setShowSparkles(true);
      if (sparklesTimeoutRef.current) clearTimeout(sparklesTimeoutRef.current);
      sparklesTimeoutRef.current = setTimeout(() => setShowSparkles(false), 500);
    }
    onToggle(task.id);
  };

  const handleSave = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle) {
      onUpdate(task.id, {
        title: trimmedTitle,
        notes: editNotes.trim() ? editNotes.trim() : null,
        reminder_at: editTime || null,
        recurrence_frequency: editRepeat ? (editRepeat as RecurrenceFrequency) : null,
        icon: editIcon || null,
        priority: editPriority || null,
      });
    } else {
      setEditTitle(task.title);
      setEditNotes(task.notes || '');
      setEditTime(task.reminder_at || '');
      setEditIcon(task.icon || '');
      setEditPriority(task.priority || '');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditTime(task.reminder_at || '');
    setEditIcon(task.icon || '');
    setEditPriority(task.priority || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  const getPriorityDotClass = (p?: TaskPriority | null) => {
    if (p === 'low') return styles.priorityLow;
    if (p === 'medium') return styles.priorityMedium;
    if (p === 'high') return styles.priorityHigh;
    return '';
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
      className={isDragging ? styles.dragging : ''}
    >
      <div
        className={`${styles.taskItem} ${isDragOver ? styles.dragOver : ''}`}
        draggable={!isReadOnly && !isEditing}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', String(index));
          e.dataTransfer.effectAllowed = 'move';
          onDragStart && onDragStart(index);
        }}
        onDragEnd={() => {
          onDragEnd && onDragEnd();
        }}
        onDragOver={(e) => {
          if (!isReadOnly) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            onDragOver && onDragOver(index);
          }
        }}
        onDrop={(e) => {
          if (!isReadOnly) {
            e.preventDefault();
            onDrop && onDrop(index);
          }
        }}
      >
        {!isReadOnly && !isEditing && (
          <div className={styles.dragControls}>
            <div
              className={styles.dragHandle}
              title="Sıralamak için sürükle"
              draggable={!isReadOnly && !isEditing}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('text/plain', String(index));
                e.dataTransfer.effectAllowed = 'move';
                onDragStart && onDragStart(index);
              }}
            >
              <GripVertical size={13} style={{ pointerEvents: 'none' }} />
            </div>
            {onMoveUp && index > 0 && (
              <button
                type="button"
                className={styles.reorderBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(index);
                }}
                title="Yukarı taşı"
              >
                <ChevronUp size={11} />
              </button>
            )}
            {onMoveDown && index < totalTasks - 1 && (
              <button
                type="button"
                className={styles.reorderBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(index);
                }}
                title="Aşağı taşı"
              >
                <ChevronDown size={11} />
              </button>
            )}
          </div>
        )}

        {!isEditing && (
          <div className={styles.checkboxContainer}>
            {showSparkles && (
              <div className={styles.sparkles}>
                <span className={styles.sparkle} />
                <span className={styles.sparkle} />
                <span className={styles.sparkle} />
                <span className={styles.sparkle} />
                <span className={styles.sparkle} />
                <span className={styles.sparkle} />
              </div>
            )}

            <button
              type="button"
              className={`${styles.checkbox} ${task.status === 'completed' ? styles.checkboxCompleted : ''} ${
                isReadOnly ? styles.checkboxDisabled : ''
              }`}
              onClick={handleToggle}
              disabled={isReadOnly}
              aria-label={task.status === 'completed' ? 'Görevi tamamlanmadı olarak işaretle' : 'Görevi tamamla'}
            >
              {task.status === 'completed' && (
                <Check size={12} strokeWidth={2.6} className={styles.checkIcon} />
              )}
            </button>
          </div>
        )}

        <div className={styles.contentWrapper}>
          {isEditing ? (
            <div className={styles.editContainer}>
              <input
                ref={inputRef}
                type="text"
                className={styles.editInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Görev adı..."
              />
              <input
                type="text"
                className={styles.editNotesInput}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Not ekle (opsiyonel)..."
              />
              <div className={styles.editControlsRow}>
                <div className={styles.editToolsGroup}>
                  <ModernIconPicker value={editIcon} onChange={setEditIcon} />
                  <ModernPrioritySelect value={editPriority} onChange={setEditPriority} />
                  <ModernTimePicker value={editTime} onChange={setEditTime} />
                  <ModernRepeatSelect value={editRepeat} onChange={setEditRepeat} />
                </div>
                <div className={styles.editActionsGroup}>
                  <button
                    type="button"
                    className={styles.editCancelBtn}
                    onClick={handleCancel}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    className={styles.editSaveBtn}
                    onClick={handleSave}
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div className={styles.titleRow}>
                {task.priority && (
                  <span
                    className={`${styles.priorityDot} ${getPriorityDotClass(task.priority)}`}
                    title={`Öncelik: ${task.priority}`}
                  />
                )}

                {task.icon && (
                  <span className={styles.taskIconBadge} title="Kategori">
                    <DynamicIcon name={task.icon} size={12} />
                  </span>
                )}

                <span
                  className={`${styles.title} ${task.status === 'completed' ? styles.titleCompleted : ''}`}
                  onDoubleClick={() => !isReadOnly && setIsEditing(true)}
                >
                  {task.title}
                </span>

                <div className={styles.metaGroup}>
                  {subtasks.length > 0 && (
                    <button
                      type="button"
                      className={styles.subtaskBadge}
                      onClick={() => setShowSubtasks(!showSubtasks)}
                      title="Alt görevleri göster/gizle"
                    >
                      <ListTree size={10} />
                      <span>{completedSubtasksCount}/{subtasks.length}</span>
                    </button>
                  )}

                  {task.reminder_at && (
                    <span className={styles.timeBadge} title="Hatırlatıcı saati">
                      <Clock size={11} strokeWidth={2} />
                      <span>{task.reminder_at}</span>
                    </span>
                  )}

                  {task.recurrence_rule_id && (
                    <span className={styles.recurrenceBadge} title="Tekrarlanan görev">
                      <RotateCw size={10} strokeWidth={2} />
                      <span>Tekrarlanan</span>
                    </span>
                  )}

                  {task.rollover_count > 0 && (
                    <span className={styles.rolloverBadge} title={`${task.rollover_count} kez aktarıldı`}>
                      {task.rollover_count === 1 ? 'Dünden aktarıldı' : `${task.rollover_count}x aktarıldı`}
                    </span>
                  )}
                </div>
              </div>

              {task.notes && (
                <span
                  className={styles.notesRow}
                  onDoubleClick={() => !isReadOnly && setIsEditing(true)}
                >
                  {task.notes}
                </span>
              )}
            </div>
          )}
        </div>

        {!isReadOnly && !isEditing && (
          <div className={styles.actions}>
            {onStartFocus && task.status === 'open' && (
              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionButtonFocus}`}
                onClick={() => onStartFocus(task)}
                aria-label="Odak sayacını başlat"
                title="Odaklan (Pomodoro)"
              >
                <Timer size={13} />
              </button>
            )}

            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setShowSubtasks(!showSubtasks)}
              aria-label="Alt görev ekle/göster"
              title="Alt Görevler"
            >
              <ListTree size={13} />
            </button>

            {onSnooze && task.status === 'open' && (
              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionButtonSnooze}`}
                onClick={() => onSnooze(task.id)}
                aria-label="Yarına ertele"
                title="Yarına ertele"
              >
                <CalendarArrowDown size={13} />
              </button>
            )}

            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setIsEditing(true)}
              aria-label="Görevi düzenle"
              title="Düzenle"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionButtonDanger}`}
              onClick={() => onDelete(task.id)}
              aria-label="Görevi sil"
              title="Sil"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Alt Görevler Bölümü */}
      {showSubtasks && !isEditing && (
        <SubtaskList
          subtasks={subtasks}
          isReadOnly={isReadOnly}
          onChange={(newSubtasks) => onUpdate(task.id, { subtasks: newSubtasks })}
        />
      )}
    </div>
  );
};
