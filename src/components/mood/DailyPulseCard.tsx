import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { MOOD_OPTIONS, MoodId } from '../../types/mood';
import { DynamicIcon } from '../ui/DynamicIcon';
import styles from './DailyPulseCard.module.css';

interface DailyPulseCardProps {
  dateStr: string;
}

const MOOD_INSIGHTS: Record<MoodId, string> = {
  calm: 'Dingin bir zihinle adım adım ilerle. Acele yok, sadece istikrar.',
  energetic: 'Harika bir ivme! En zorlu veya yaratıcı görevlerini öne alıp hız kazanabilirsin.',
  focused: 'Akıştasın. Bildirimleri sessize alıp derin odak bloğunu tamamla.',
  resting: 'Nefes almayı unutma. Düzenli küçük molalar zihnini ve verimliliğini taze tutar.',
  tired: 'Kendine nazik davran. Bugün yalnızca en kritik 1-2 görevi bitirip dinlenmeye alan aç.',
};

export const DailyPulseCard: React.FC<DailyPulseCardProps> = ({ dateStr }) => {
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

  const handleClear = () => {
    setSelectedMood(null);
    try {
      const historyStr = localStorage.getItem('dali_mood_history');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        delete history[dateStr];
        localStorage.setItem('dali_mood_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error('Mood sıfırlama hatası:', e);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.title}>
          <Sparkles size={14} /> Günün Ritmi & Hissi
        </span>
        {selectedMood && (
          <button type="button" className={styles.clearBtn} onClick={handleClear}>
            Temizle
          </button>
        )}
      </div>

      <div className={styles.pillsRow}>
        {MOOD_OPTIONS.map((opt) => {
          const isActive = selectedMood === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`${styles.moodPill} ${isActive ? styles.moodPillActive : ''}`}
              onClick={() => handleSelectMood(opt.id)}
            >
              <DynamicIcon name={opt.icon} size={18} />
              <span className={styles.label}>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {selectedMood && (
        <div className={styles.insightBox}>
          {MOOD_INSIGHTS[selectedMood]}
        </div>
      )}
    </div>
  );
};
