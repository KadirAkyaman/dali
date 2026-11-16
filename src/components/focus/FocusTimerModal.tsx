import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Sparkles } from 'lucide-react';
import { Task } from '../../types/task';
import { NotificationService } from '../../services/notificationService';
import styles from './FocusTimerModal.module.css';

interface FocusTimerModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskComplete?: (taskId: string) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskComplete,
}) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
      setIsRunning(false);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            const msg =
              mode === 'focus'
                ? 'Odaklanma seansı bitti! 5 dakika mola verebilirsin.'
                : 'Mola bitti! Yeni bir odaklanma seansına hazır mısın?';
            NotificationService.sendNotification('Dali Odak Sayacı', msg);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const handleModeChange = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={16} />
        </button>

        {task ? (
          <div className={styles.taskTag} title={task.title}>
            <span>{task.icon || '🎯'}</span> {task.title}
          </div>
        ) : (
          <div className={styles.taskTag}>
            <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
            Serbest Derin Odak
          </div>
        )}

        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'focus' ? styles.modeBtnActive : ''}`}
            onClick={() => handleModeChange('focus')}
          >
            Odak (25 dk)
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'break' ? styles.modeBtnActive : ''}`}
            onClick={() => handleModeChange('break')}
          >
            Kısa Mola (5 dk)
          </button>
        </div>

        <div className={styles.timerDisplay}>{formattedTime}</div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleReset}
            title="Sıfırla"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleTogglePlay}
            title={isRunning ? 'Duraklat' : 'Başlat'}
          >
            {isRunning ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
          </button>

          {task && onTaskComplete && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                onTaskComplete(task.id);
                onClose();
              }}
              title="Görevi Tamamla ve Kapat"
            >
              <Sparkles size={16} color="var(--success)" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
