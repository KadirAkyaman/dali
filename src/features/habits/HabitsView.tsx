import React, { useState, useEffect } from 'react';
import { Flame, Plus, Check, Trash2, Trophy, X } from 'lucide-react';
import { Habit, DEFAULT_HABITS, HABIT_ICONS, calculateHabitStreak } from '../../types/habit';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import styles from './HabitsView.module.css';

export const HabitsView: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem('dali_habits');
      if (saved) {
        return JSON.parse(saved);
      }
      return DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('sparkles');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('dali_habits', JSON.stringify(habits));
    } catch (e) {
      console.error('Alışkanlıklar kaydedilemedi:', e);
    }
  }, [habits]);

  // Last 7 days for the dots
  const last7Days: { dateStr: string; label: string; isToday: boolean }[] = [];
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    last7Days.push({
      dateStr: dStr,
      label: i === 0 ? 'Bugün' : dayNames[d.getDay()],
      isToday: i === 0,
    });
  }

  const handleToggleHabitToday = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(todayStr);
        const nextDates = exists
          ? h.completedDates.filter((d) => d !== todayStr)
          : [...h.completedDates, todayStr];
        return {
          ...h,
          completedDates: nextDates,
        };
      })
    );
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: trimmed,
      icon: newIcon,
      category: newCategory.trim() || 'Genel',
      completedDates: [],
      createdDate: todayStr,
    };

    setHabits((prev) => [...prev, newHabit]);
    setNewTitle('');
    setNewCategory('');
    setNewIcon('✨');
    setIsAddModalOpen(false);
  };

  const handleDeleteHabit = (habitId: string, habitTitle: string) => {
    if (window.confirm(`"${habitTitle}" alışkanlığını silmek istediğine emin misin?`)) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
    }
  };

  const totalCount = habits.length;
  const completedTodayCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const progressPercent = totalCount > 0 ? (completedTodayCount / totalCount) * 100 : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <Flame size={24} color="#f59e0b" /> Alışkanlıklar & Zincir
          </h1>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={14} /> Yeni Alışkanlık
          </button>
        </div>
        <p className={styles.subTitle}>
          Zinciri kırma. Günlük küçük ritüellerle hayatına sürdürülebilir düzen kat.
        </p>
      </header>

      {/* Günlük Tamamlanma Kartı */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span>Günün Alışkanlık Ritmi ({completedTodayCount} / {totalCount} tamamlandı)</span>
          <span>%{Math.round(progressPercent)}</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Alışkanlık Listesi */}
      <div className={styles.habitList}>
        {habits.map((habit) => {
          const isDoneToday = habit.completedDates.includes(todayStr);
          const { currentStreak, bestStreak } = calculateHabitStreak(habit.completedDates, todayStr);

          return (
            <div
              key={habit.id}
              className={`${styles.habitCard} ${isDoneToday ? styles.habitCardCompleted : ''}`}
            >
              <div className={styles.habitTopRow}>
                <div className={styles.habitLeft}>
                  <button
                    type="button"
                    className={`${styles.checkBtn} ${isDoneToday ? styles.checkBtnChecked : ''}`}
                    onClick={() => handleToggleHabitToday(habit.id)}
                    title={isDoneToday ? 'Tamamlanmadı olarak işaretle' : 'Bugün tamamla'}
                  >
                    {isDoneToday && <Check size={14} strokeWidth={2.5} />}
                  </button>

                  <span className={styles.habitIcon}>
                    <DynamicIcon name={habit.icon} size={18} />
                  </span>

                  <div className={styles.habitMeta}>
                    <span className={`${styles.habitTitle} ${isDoneToday ? styles.habitTitleChecked : ''}`}>
                      {habit.title}
                    </span>
                    {habit.category && (
                      <span className={styles.habitCategory}>{habit.category}</span>
                    )}
                  </div>
                </div>

                <div className={styles.habitBadges}>
                  {currentStreak > 0 && (
                    <div className={styles.streakBadge} title="Mevcut kesintisiz gün zinciri">
                      <Flame size={12} color="#f59e0b" />
                      <span>{currentStreak} gün</span>
                    </div>
                  )}

                  {bestStreak > 0 && (
                    <div className={styles.bestBadge} title="Tüm zamanların en iyi zinciri">
                      <Trophy size={11} style={{ display: 'inline', marginRight: 3 }} />
                      En iyi: {bestStreak} gün
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteHabit(habit.id, habit.title)}
                    title="Alışkanlığı sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Son 7 Gün Dot Matrisi */}
              <div className={styles.historyRow}>
                {last7Days.map((day) => {
                  const isDone = habit.completedDates.includes(day.dateStr);
                  return (
                    <div key={day.dateStr} className={styles.historyDay}>
                      <span className={styles.historyDayLabel}>{day.label}</span>
                      <div
                        className={`${styles.historyDot} ${
                          isDone ? styles.historyDotCompleted : ''
                        } ${day.isToday ? styles.historyDotToday : ''}`}
                        title={`${day.dateStr}: ${isDone ? 'Tamamlandı' : 'Tamamlanmadı'}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Yeni Alışkanlık Modalı */}
      {isAddModalOpen && (
        <div className={styles.addModalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.addModalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.modalTitle}>Yeni Alışkanlık Ekle</h2>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddHabit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  İkon Seç
                </label>
                <div className={styles.iconSelectRow}>
                  {HABIT_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className={`${styles.iconBtn} ${newIcon === ic ? styles.iconBtnActive : ''}`}
                      onClick={() => setNewIcon(ic)}
                      title={ic}
                    >
                      <DynamicIcon name={ic} size={15} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Alışkanlık Başlığı
                </label>
                <input
                  type="text"
                  autoFocus
                  className={styles.inputField}
                  placeholder="Örn: 15 Dakika İngilizce Dinle..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Kategori (Opsiyonel)
                </label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Örn: Dil, Sağlık, Kariyer..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className={styles.saveBtn}
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
