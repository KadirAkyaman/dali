import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import styles from './ZenFocusOverlay.module.css';

interface ZenFocusOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (dto: { title: string; scheduled_date?: string }) => Promise<void>;
  todayStr?: string;
}

export const ZenFocusOverlay: React.FC<ZenFocusOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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
      return;
    }

    const durationTimer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(durationTimer);
  }, [isOpen]);

  // Global keydown handler inside Focus Mode (Esc, Ctrl+.)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '.' || e.code === 'Period')) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  // Format focus elapsed time
  const focusMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSecs = elapsedSeconds % 60;
  const formattedDuration = `${String(focusMinutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;

  return (
    <div className={styles.focusHudBar}>
      <div className={styles.hudLeft}>
        <div className={styles.focusTag}>
          <span className={styles.pulseDot} />
          <span>Derin Odak</span>
        </div>
      </div>

      <div className={styles.hudCenter}>
        {/* Bebas Neue Dijital Saat */}
        <div className={styles.clockDisplay} title="Gerçek Zamanlı Saat">
          <span>{hours}:{minutes}:</span>
          <span className={styles.clockSeconds}>{seconds}</span>
        </div>

        {/* Odaklanma Sayacı */}
        <div className={styles.durationBadge}>
          <Clock size={12} color="var(--accent, #a69ceb)" />
          <span className={styles.durationHighlight}>{formattedDuration}</span>
          <span className={styles.durationSub}>({elapsedSeconds} sn odaklanıldı)</span>
        </div>
      </div>

      <div className={styles.hudRight}>
        <button
          type="button"
          className={styles.exitBtn}
          onClick={onClose}
          title="Odak modundan çık (Esc veya Ctrl + .)"
        >
          <X size={14} />
          <span>Bitir</span>
          <kbd className={styles.kbdShortcut}>Ctrl + .</kbd>
        </button>
      </div>
    </div>
  );
};
