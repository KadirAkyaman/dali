import React, { useMemo } from 'react';
import { BarChart3, CheckCircle2, Flame, Timer, TrendingUp, Calendar } from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import styles from './AnalyticsView.module.css';

export const AnalyticsView: React.FC = () => {
  const { tasks, todayStr } = useTasks();

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Focus time from localStorage
  const focusSessions = (() => {
    try {
      const saved = localStorage.getItem('dali_focus_sessions');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  })();
  const totalFocusMinutes = focusSessions * 25;

  // Generate last 52 weeks (364 days) of date strings
  const heatmapData = useMemo(() => {
    const countsByDate: Record<string, number> = {};

    tasks.forEach((t) => {
      if (t.status === 'completed' && t.scheduled_date) {
        countsByDate[t.scheduled_date] = (countsByDate[t.scheduled_date] || 0) + 1;
      }
    });

    const days: { dateStr: string; count: number; level: number }[] = [];
    const today = new Date(todayStr);

    // 52 weeks = 364 days
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = countsByDate[dStr] || 0;

      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2 || count === 3) level = 2;
      else if (count === 4 || count === 5) level = 3;
      else if (count >= 6) level = 4;

      days.push({ dateStr: dStr, count, level });
    }

    return days;
  }, [tasks, todayStr]);

  // Current streak calculation
  const currentStreak = useMemo(() => {
    const completedDates = new Set(
      tasks.filter((t) => t.status === 'completed').map((t) => t.scheduled_date)
    );

    let streak = 0;
    const checkDate = new Date(todayStr);

    if (completedDates.has(todayStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      const yesterday = new Date(todayStr);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (completedDates.has(yesterdayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        return 0;
      }
    }

    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (completedDates.has(dStr)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [tasks, todayStr]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <BarChart3 size={24} color="var(--accent)" /> Derin Verimlilik & İstatistikler
        </h1>
        <p className={styles.subTitle}>
          Zaman içindeki ivmeni, odak alışkanlıklarını ve tamamlanan başarılarını görselleştir.
        </p>
      </header>

      {/* Özet Metrik Kartları */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Tamamlanan Görev</span>
          <span className={styles.metricValue}>
            <CheckCircle2 size={16} color="var(--success)" />
            {completedTasks}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Başarı Oranı</span>
          <span className={styles.metricValue}>
            <TrendingUp size={16} color="var(--accent)" />
            %{overallRate}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Günlük Kesintisiz Seri</span>
          <span className={styles.metricValue}>
            <Flame size={16} color="#f59e0b" />
            {currentStreak} gün
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Toplam Derin Odak</span>
          <span className={styles.metricValue}>
            <Timer size={16} color="var(--accent)" />
            {totalFocusMinutes > 60
              ? `${Math.floor(totalFocusMinutes / 60)} sa ${totalFocusMinutes % 60} dk`
              : `${totalFocusMinutes} dk`}
          </span>
        </div>
      </div>

      {/* Yıllık Yaşam & Verimlilik Isı Haritası (Year in Pixels) */}
      <div className={styles.heatmapCard}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>
            <Calendar size={15} /> Yıllık Üretkenlik Isı Haritası (Son 52 Hafta)
          </span>

          <div className={styles.legendRow}>
            <span>Az</span>
            <div className={styles.legendBoxes}>
              <div className={`${styles.legendBox} ${styles.level0}`} />
              <div className={`${styles.legendBox} ${styles.level1}`} />
              <div className={`${styles.legendBox} ${styles.level2}`} />
              <div className={`${styles.legendBox} ${styles.level3}`} />
              <div className={`${styles.legendBox} ${styles.level4}`} />
            </div>
            <span>Çok</span>
          </div>
        </div>

        <div className={styles.heatmapScroll}>
          <div className={styles.heatmapGrid}>
            {heatmapData.map((d) => (
              <div
                key={d.dateStr}
                className={`${styles.heatmapCell} ${styles[`level${d.level}`]}`}
                title={`${d.dateStr}: ${d.count} görev tamamlandı`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
