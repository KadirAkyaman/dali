import React, { useState, useEffect } from 'react';
import { MOOD_OPTIONS, MoodId } from '../../types/mood';
import styles from './DailyMoodBanner.module.css';

interface DailyMoodBannerProps {
  dateStr: string;
}

export const DailyMoodBanner: React.FC<DailyMoodBannerProps> = ({ dateStr }) => {
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('dali_mood_history');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        setSelectedMood(history[dateStr] || null);
      } else {
        setSelectedMood(null);
      }
    } catch {
      setSelectedMood(null);
    }
  }, [dateStr]);

  const handleSelectMood = (moodId: MoodId) => {
    const nextMood = selectedMood === moodId ? null : moodId;
    setSelectedMood(nextMood);
    try {
      const historyStr = localStorage.getItem('dali_mood_history');
      const history = historyStr ? JSON.parse(historyStr) : {};
      if (nextMood) {
        history[dateStr] = nextMood;
      } else {
        delete history[dateStr];
      }
      localStorage.setItem('dali_mood_history', JSON.stringify(history));
    } catch (e) {
      console.error('Mood kaydetme hatası:', e);
    }
  };

  return (
    <div className={styles.container}>
      <span className={styles.label}>Günün Hissi:</span>
      <div className={styles.moodGroup}>
        {MOOD_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`${styles.moodBtn} ${selectedMood === opt.id ? styles.moodBtnActive : ''}`}
            onClick={() => handleSelectMood(opt.id)}
            title={`${opt.label} (${opt.emoji})`}
            aria-label={opt.label}
          >
            {opt.emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
