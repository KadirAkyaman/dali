import React, { useState, useEffect, useRef } from 'react';
import { Calendar, X, Sparkles, CheckSquare, FileText } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { TaskPriority } from '../../types/task';
import { ModernIconPicker } from '../ui/ModernIconPicker';
import { ModernPrioritySelect } from '../ui/ModernPrioritySelect';
import { formatDisplayDate } from '../../domain/date/dateService';
import styles from './QuickCaptureModal.module.css';

interface QuickCaptureModalProps {
  isOpen: boolean;
  todayStr: string;
  onClose: () => void;
  onAddTask: (task: {
    title: string;
    scheduled_date?: string;
    icon?: string | null;
    priority?: TaskPriority | null;
  }) => Promise<void>;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  todayStr,
  onClose,
  onAddTask,
}) => {
  const [captureMode, setCaptureMode] = useState<'task' | 'note'>('task');
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [icon, setIcon] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedDate(todayStr);
      setIcon('');
      setPriority('');
      setIsDatePopoverOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (captureMode === 'note') {
      try {
        const saved = localStorage.getItem('dali_notes_collection');
        const existing = saved ? JSON.parse(saved) : [];
        const newNote = {
          id: `note-${Date.now()}`,
          title: trimmed,
          content: `# ${trimmed}\n\n`,
          dateStr: selectedDate,
          updatedAt: Date.now(),
        };
        localStorage.setItem('dali_notes_collection', JSON.stringify([newNote, ...existing]));
      } catch (err) {
        console.error('Not kaydedilemedi:', err);
      }
      onClose();
      return;
    }

    await onAddTask({
      title: trimmed,
      scheduled_date: selectedDate,
      icon: icon || null,
      priority: priority || null,
    });

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Quick Date Helpers
  const tomorrowStr = (() => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const nextMondayStr = (() => {
    const d = new Date(todayStr);
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  })();

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Mod Seçici (Görev / Not) */}
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${captureMode === 'task' ? styles.modeTabActive : ''}`}
            onClick={() => setCaptureMode('task')}
          >
            <CheckSquare size={13} />
            <span>Görev Ekle</span>
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${captureMode === 'note' ? styles.modeTabActive : ''}`}
            onClick={() => setCaptureMode('note')}
          >
            <FileText size={13} />
            <span>Not Ekle</span>
          </button>
        </div>

        <div className={styles.inputSection}>
          <Sparkles size={18} className={styles.inputIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.inputField}
            placeholder={
              captureMode === 'task'
                ? "Yeni bir görev yazın ve [Enter]'a basın..."
                : "Hızlı bir not başlığı yazın ve [Enter]'a basın..."
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.optionsRow}>
          <div className={styles.toolsGroup}>
            {/* Modern Tarih Seçimi Popover */}
            <Popover.Root open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={`${styles.dateTrigger} ${
                    selectedDate !== todayStr ? styles.dateTriggerActive : ''
                  }`}
                  title="Planlanacak tarihi seçin"
                >
                  <Calendar size={12} />
                  <span>
                    {selectedDate === todayStr
                      ? 'Bugün'
                      : selectedDate === tomorrowStr
                      ? 'Yarın'
                      : formatDisplayDate(selectedDate)}
                  </span>
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  className={styles.datePopoverContent}
                  side="bottom"
                  align="start"
                  sideOffset={6}
                >
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Tarih Seçimi
                  </span>

                  <div className={styles.quickDateList}>
                    <button
                      type="button"
                      className={`${styles.quickDateBtn} ${
                        selectedDate === todayStr ? styles.quickDateBtnActive : ''
                      }`}
                      onClick={() => {
                        setSelectedDate(todayStr);
                        setIsDatePopoverOpen(false);
                      }}
                    >
                      Bugün
                    </button>
                    <button
                      type="button"
                      className={`${styles.quickDateBtn} ${
                        selectedDate === tomorrowStr ? styles.quickDateBtnActive : ''
                      }`}
                      onClick={() => {
                        setSelectedDate(tomorrowStr);
                        setIsDatePopoverOpen(false);
                      }}
                    >
                      Yarın
                    </button>
                    <button
                      type="button"
                      className={`${styles.quickDateBtn} ${
                        selectedDate === nextMondayStr ? styles.quickDateBtnActive : ''
                      }`}
                      onClick={() => {
                        setSelectedDate(nextMondayStr);
                        setIsDatePopoverOpen(false);
                      }}
                    >
                      Gelecek Pazartesi
                    </button>
                  </div>

                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                      Özel Tarih:
                    </span>
                    <input
                      type="date"
                      className={styles.customDateInput}
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDate(e.target.value);
                          setIsDatePopoverOpen(false);
                        }
                      }}
                    />
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <ModernPrioritySelect value={priority} onChange={setPriority} />
            <ModernIconPicker value={icon} onChange={setIcon} />
          </div>

          <div className={styles.keyboardHints}>
            <span>
              <kbd className={styles.keyKbd}>Enter</kbd> Ekle
            </span>
            <span>
              <kbd className={styles.keyKbd}>Esc</kbd> Kapat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
