import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { RecurrenceFrequency } from '../../types/recurrence';
import { TaskPriority } from '../../types/task';
import { ModernTimePicker } from '../ui/ModernTimePicker';
import { ModernRepeatSelect } from '../ui/ModernRepeatSelect';
import { ModernIconPicker } from '../ui/ModernIconPicker';
import { ModernPrioritySelect } from '../ui/ModernPrioritySelect';
import styles from './TaskInput.module.css';

interface TaskInputProps {
  onAddTask: (
    title: string,
    reminderAt?: string | null,
    recurrenceFrequency?: RecurrenceFrequency | null,
    icon?: string | null,
    priority?: TaskPriority | null
  ) => Promise<void>;
  isReadOnly: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, isReadOnly }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | ''>('');
  const [icon, setIcon] = useState('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Global Ctrl+N kısayolu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        if (!isReadOnly) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadOnly]);

  if (isReadOnly) {
    return null;
  }

  const handleClose = () => {
    setTitle('');
    setReminderTime('');
    setRecurrence('');
    setIcon('');
    setPriority('');
    setIsOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask(
        trimmed,
        reminderTime || null,
        recurrence || null,
        icon || null,
        priority || null
      );
      setTitle('');
      setReminderTime('');
      setRecurrence('');
      setIcon('');
      setPriority('');
      // Bir sonraki görev için girişi hazır tut
      inputRef.current?.focus();
    } catch {
      // Hata TaskProvider feedback üzerinden gösterilir
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) {
    return (
      <div className={styles.container}>
        <button
          type="button"
          className={styles.triggerButton}
          onClick={() => setIsOpen(true)}
          aria-label="Görev ekle"
        >
          <div className={styles.triggerLeft}>
            <Plus size={16} strokeWidth={2} className={styles.triggerIcon} />
            <span>Yeni bir görev ekle...</span>
          </div>
          <span className={styles.shortcutBadge}>Ctrl + N</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputCard}>
        <div className={styles.inputMainRow}>
          <div className={styles.dummyCheckbox} />
          <input
            ref={inputRef}
            type="text"
            className={styles.textInput}
            placeholder="Bugün neyi tamamlamak istersin?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.actionBar}>
          <div className={styles.optionsGroup}>
            <ModernIconPicker value={icon} onChange={setIcon} />

            <ModernPrioritySelect value={priority} onChange={setPriority} />

            <ModernTimePicker
              value={reminderTime}
              onChange={setReminderTime}
            />

            <ModernRepeatSelect
              value={recurrence}
              onChange={setRecurrence}
            />
          </div>

          <div className={styles.buttonsGroup}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
            >
              Vazgeç
            </button>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => handleSubmit()}
              disabled={!title.trim() || isSubmitting}
            >
              Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
