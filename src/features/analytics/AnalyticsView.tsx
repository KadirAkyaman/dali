import React, { useMemo } from 'react';
import { BarChart3, CheckCircle2, Flame, Timer, TrendingUp, Calendar, Zap } from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { WeeklyStatsCard } from '../../components/stats/WeeklyStatsCard';
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

  // Son 28 Gün (4 Hafta) - Kaydırma gerektirmeyen, ekrana %100 sığan grid
  const recent28Days = useMemo(() => {
    const countsByDate: Record<string, { total: number; completed: number }> = {};

    tasks.forEach((t) => {
      if (t.scheduled_date) {
        if (!countsByDate[t.scheduled_date]) {
          countsByDate[t.scheduled_date] = { total: 0, completed: 0 };
        }
        countsByDate[t.scheduled_date].total += 1;
        if (t.status === 'completed') {
          countsByDate[t.scheduled_date].completed += 1;
        }
      }
    });

    const days: { dateStr: string; dayNum: number; count: number; isToday: boolean; level: number }[] = [];
    const today = new Date(todayStr);

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const data = countsByDate[dStr] || { total: 0, completed: 0 };
      const count = data.completed;

      let level = 0;
      if (count === 1) level = 1;
      else if (count >= 2 && count <= 3) level = 2;
      else if (count >= 4 && count <= 5) level = 3;
      else if (count >= 6) level = 4;

      days.push({
        dateStr: dStr,
        dayNum: d.getDate(),
        count,
        isToday: dStr === todayStr,
        level,
      });
    }

    return days;
  }, [tasks, todayStr]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <BarChart3 size={24} color="var(--accent)" /> Derin Verimlilik & İstatistikler
        </h1>
        <p className={styles.subTitle}>
          Zaman içindeki ivmeni, odak alışkanlıklarını ve haftalık başarı ritmini incele.
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
          <span className={styles.metricLabel}>Genel Başarı Oranı</span>
          <span className={styles.metricValue}>
            <TrendingUp size={16} color="var(--accent)" />
            %{overallRate}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Kesintisiz Seri</span>
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

      {/* Günlük Akış'tan Taşınan Haftalık Ritim & İstatistikler */}
      <section className={styles.sectionBlock}>
        <WeeklyStatsCard tasks={tasks} todayStr={todayStr} />
      </section>

      {/* Son 4 Hafta (28 Gün) Tam Ekran Sabit Üretkenlik Matrisi */}
      <div className={styles.cleanHeatmapCard}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>
            <Calendar size={15} /> Son 4 Haftalık Üretkenlik Matrisi (28 Gün)
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

        {/* Kaydırmasız, doğrudan kart genişliğini dolduran 7 sütun x 4 satır modern grid */}
        <div className={styles.matrixContainer}>
          <div className={styles.matrixGrid}>
            {recent28Days.map((d) => (
              <div
                key={d.dateStr}
                className={`${styles.matrixCell} ${styles[`level${d.level}`]} ${
                  d.isToday ? styles.matrixCellToday : ''
                }`}
                title={`${d.dateStr}: ${d.count} görev tamamlandı ${d.isToday ? '(Bugün)' : ''}`}
              >
                <span className={styles.cellDayNum}>{d.dayNum}</span>
                {d.count > 0 && <span className={styles.cellCountDot}>{d.count}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verimlilik İpuçları & Başarı Rozeti */}
      <div className={styles.insightCard}>
        <div className={styles.insightIconCol}>
          <Zap size={20} color="var(--accent)" />
        </div>
        <div className={styles.insightTextCol}>
          <span className={styles.insightTitle}>Ritim Notu</span>
          <p className={styles.insightDesc}>
            {currentStreak > 2
              ? `Harika bir ivme yakaladın! ${currentStreak} gündür kesintisiz olarak planlarını tamamlıyorsun.`
              : 'Her gün küçük bir görevi tamamlamak bile alışkanlık halkasını güçlü tutar. Bugün odaklanmak istediğin ana göreve başla.'}
          </p>
        </div>
      </div>
    </div>
  );
};
