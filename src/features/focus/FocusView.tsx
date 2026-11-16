import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Sparkles, Check, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTasks } from '../../app/providers/TaskProvider';
import { Task } from '../../types/task';
import { NotificationService } from '../../services/notificationService';
import { ambientSound } from '../../services/ambientSoundService';
import styles from './FocusView.module.css';

export const FocusView: React.FC = () => {
  const { tasks, todayStr, toggleTask } = useTasks();
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [soundMode, setSoundMode] = useState<'off' | 'rain' | 'waves'>('off');
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    const val = localStorage.getItem('dali_pomodoro_sessions');
    return val ? parseInt(val, 10) : 0;
  });

  const timerRef = useRef<any>(null);

  const openTasks = tasks.filter((t) => t.scheduled_date === todayStr && t.status === 'open');

  const getDuration = (m: 'focus' | 'short_break' | 'long_break') => {
    if (m === 'focus') return 25 * 60;
    if (m === 'short_break') return 5 * 60;
    return 15 * 60;
  };

  const handleModeChange = (newMode: 'focus' | 'short_break' | 'long_break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(getDuration(newMode));
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);

            if (mode === 'focus') {
              const nextCount = completedSessions + 1;
              setCompletedSessions(nextCount);
              localStorage.setItem('dali_pomodoro_sessions', String(nextCount));
              NotificationService.sendNotification(
                'Dali Odak Sayacı',
                'Tebrikler! 25 dakikalık odak seansını başarıyla tamamladın. Şimdi kısa bir mola zamanı.'
              );
            } else {
              NotificationService.sendNotification(
                'Dali Mola Sayacı',
                'Mola bitti! Yeni bir odaklanma seansına hazır mısın?'
              );
            }
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
  }, [isRunning, mode, completedSessions]);

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };

  const handleSoundChange = (s: 'off' | 'rain' | 'waves') => {
    setSoundMode(s);
    if (s === 'rain') {
      ambientSound.playRain();
    } else if (s === 'waves') {
      ambientSound.playWaves();
    } else {
      ambientSound.stop();
    }
  };

  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Odaklanma & Pomodoro</h1>
        <span className={styles.subTitle}>
          Zihnini topla, tek bir göreve derinleş ve dingin bir ritim yakala.
        </span>
      </header>

      {/* Ana Sayaç Kartı */}
      <div className={styles.timerCard}>
        {/* Mod Seçici */}
        <div className={styles.modeGroup}>
          <button
            type="button"
            className={`${styles.modeButton} ${mode === 'focus' ? styles.modeButtonActive : ''}`}
            onClick={() => handleModeChange('focus')}
          >
            Odak (25 dk)
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${mode === 'short_break' ? styles.modeButtonActive : ''}`}
            onClick={() => handleModeChange('short_break')}
          >
            Kısa Mola (5 dk)
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${mode === 'long_break' ? styles.modeButtonActive : ''}`}
            onClick={() => handleModeChange('long_break')}
          >
            Uzun Mola (15 dk)
          </button>
        </div>

        {/* Görev Seçimi */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className={styles.taskSelector}>
              {selectedTask ? (
                <>
                  <span>{selectedTask.icon || '🎯'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedTask.title}
                  </span>
                </>
              ) : (
                <span>Serbest Odaklanma (Görev Seçmek İçin Tıkla)</span>
              )}
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              style={{
                width: 280,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '4px',
                boxShadow: 'var(--shadow-popover)',
                zIndex: 1000,
              }}
              sideOffset={4}
            >
              <DropdownMenu.Item
                style={{
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
                onSelect={() => setSelectedTask(null)}
              >
                Serbest Odaklanma (Görevsiz)
              </DropdownMenu.Item>
              {openTasks.map((t) => (
                <DropdownMenu.Item
                  key={t.id}
                  style={{
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-primary)',
                  }}
                  onSelect={() => setSelectedTask(t)}
                >
                  <span>{t.icon || '🎯'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </span>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Büyük Zaman Göstergesi */}
        <div className={styles.timerNumber}>{formattedTime}</div>

        {/* Kontrol Butonları */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
            title="Sıfırla"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className={styles.playBtn}
            onClick={handleTogglePlay}
            title={isRunning ? 'Duraklat' : 'Başlat'}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
          </button>

          {selectedTask && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                toggleTask(selectedTask.id);
                setSelectedTask(null);
              }}
              title="Görevi Tamamla"
            >
              <Check size={16} color="var(--success)" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Çevrimdışı Ambiyans Sesleri */}
      <div className={styles.ambientCard}>
        <span className={styles.ambientTitle}>
          <Volume2 size={14} color="var(--accent)" />
          <span>Arka Plan Ambiyansı</span>
        </span>

        <div className={styles.soundPills}>
          <button
            type="button"
            className={`${styles.soundPill} ${soundMode === 'off' ? styles.soundPillActive : ''}`}
            onClick={() => handleSoundChange('off')}
          >
            Sessiz
          </button>
          <button
            type="button"
            className={`${styles.soundPill} ${soundMode === 'rain' ? styles.soundPillActive : ''}`}
            onClick={() => handleSoundChange('rain')}
          >
            🌧️ Yağmur
          </button>
          <button
            type="button"
            className={`${styles.soundPill} ${soundMode === 'waves' ? styles.soundPillActive : ''}`}
            onClick={() => handleSoundChange('waves')}
          >
            🌊 Dalgalar
          </button>
        </div>
      </div>

      {/* İstatistik Kutuları */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{completedSessions}</span>
          <span className={styles.statLabel}>Tamamlanan Seans</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{completedSessions * 25} dk</span>
          <span className={styles.statLabel}>Toplam Odak Süresi</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue}>
            <Sparkles size={18} color="var(--warning)" style={{ display: 'inline', marginRight: 4 }} />
            {completedSessions >= 4 ? 'Mükemmel' : completedSessions >= 2 ? 'İyi Ritim' : 'Başlangıç'}
          </span>
          <span className={styles.statLabel}>Günün Verimi</span>
        </div>
      </div>
    </div>
  );
};
