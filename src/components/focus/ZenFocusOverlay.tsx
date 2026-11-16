import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Plus } from 'lucide-react';
import styles from './ZenFocusOverlay.module.css';

interface ZenFocusOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (dto: { title: string; scheduled_date?: string }) => Promise<void>;
  todayStr: string;
}

export const ZenFocusOverlay: React.FC<ZenFocusOverlayProps> = ({
  isOpen,
  onClose,
  onAddTask,
  todayStr,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [taskTitle, setTaskTitle] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time clock update (every 500ms for accurate seconds transition)
  useEffect(() => {
    if (!isOpen) return;

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 500);

    return () => clearInterval(clockTimer);
  }, [isOpen]);

  // Focus duration stopwatch
  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      setShowTaskInput(false);
      setTaskTitle('');
      return;
    }

    const durationTimer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(durationTimer);
  }, [isOpen]);

  // Global keydown handler inside Focus Mode (Ctrl+N, Esc, Ctrl+.)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        e.stopPropagation();
        setShowTaskInput(true);
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '.' || e.code === 'Period')) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (showTaskInput) {
          setShowTaskInput(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, showTaskInput, onClose]);

  if (!isOpen) return null;

  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  // Format focus elapsed time
  const focusMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSecs = elapsedSeconds % 60;
  const formattedDuration = `${String(focusMinutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;

  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = taskTitle.trim();
    if (!trimmed) return;

    try {
      await onAddTask({
        title: trimmed,
        scheduled_date: todayStr,
      });

      setTaskTitle('');
      setSuccessMessage(`"${trimmed}" bugüne eklendi`);
      setTimeout(() => setSuccessMessage(null), 2500);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Görev ekleme hatası:', err);
    }
  };

  return (
    <div className={styles.overlay}>
      {/* Üst Bar */}
      <div className={styles.topBar}>
        <div className={styles.focusTag}>
          <span className={styles.pulseDot} />
          <span>Zen Odak Modu</span>
        </div>

        <button
          type="button"
          className={styles.exitBtn}
          onClick={onClose}
          title="Odak modundan çık (Esc veya Ctrl + .)"
        >
          <X size={15} />
          <span>Çıkış [Esc]</span>
        </button>
      </div>

      {/* Orta Alan: Bebas Neue Saat ve Süre */}
      <div className={styles.centerContainer}>
        <div className={styles.clockDisplay} title="Gerçek Zamanlı Saat">
          <span>{hours}:{minutes}:</span>
          <span className={styles.clockSeconds}>{seconds}</span>
        </div>

        <div className={styles.durationBadge}>
          <div className={styles.durationSecondsRow}>
            <span className={styles.durationNumber}>{elapsedSeconds}</span>
            <span className={styles.durationLabel}>saniyedir derin odak modundasınız</span>
          </div>
          <span className={styles.durationSub}>({formattedDuration} odaklanıldı)</span>
        </div>

        {/* Görev Ekleme Alanı (Ctrl + N ile açılır veya tıklanabilir) */}
        {!showTaskInput ? (
          <button
            type="button"
            className={styles.exitBtn}
            onClick={() => {
              setShowTaskInput(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            style={{ marginTop: 24 }}
          >
            <Plus size={14} />
            <span>Görev Ekle <kbd className={styles.shortcutKbd}>Ctrl + N</kbd></span>
          </button>
        ) : (
          <form className={styles.taskInputArea} onSubmit={handleCreateTask}>
            <div className={styles.inputWrapper}>
              <Plus size={18} color="var(--accent)" />
              <input
                ref={inputRef}
                type="text"
                className={styles.taskInput}
                placeholder="Aklına gelen görevi yaz ve [Enter]'a bas..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
              />
            </div>
            {successMessage && (
              <div className={styles.toastSuccess}>
                <Check size={14} />
                <span>{successMessage}</span>
              </div>
            )}
          </form>
        )}

        {/* Kısayol İpuçları */}
        <div className={styles.shortcutHint} style={{ marginTop: 28 }}>
          <span><kbd className={styles.shortcutKbd}>Ctrl + N</kbd> Görev Ekle</span>
          <span>•</span>
          <span><kbd className={styles.shortcutKbd}>Ctrl + .</kbd> veya <kbd className={styles.shortcutKbd}>Esc</kbd> Kapat</span>
        </div>
      </div>
    </div>
  );
};
