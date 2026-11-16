import React from 'react';
import { BarChart2 } from 'lucide-react';
import { Task } from '../../types/task';
import { format, subDays, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import styles from './WeeklyStatsCard.module.css';

interface WeeklyStatsCardProps {
  tasks: Task[];
  todayStr: string;
}

export const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({ tasks, todayStr }) => {
  const today = parseISO(todayStr);

  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const dStr = format(d, 'yyyy-MM-dd');
    const dayName = format(d, 'EEEEEE', { locale: tr }); // Pt, Sa, Ça, Pe, Cu, Ct, Pz
    return { dateStr: dStr, dayName };
  });

  const dayStats = past7Days.map(({ dateStr, dayName }) => {
    const dayTasks = tasks.filter((t) => t.scheduled_date === dateStr);
    const completed = dayTasks.filter((t) => t.status === 'completed').length;
    const total = dayTasks.length;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    return { dateStr, dayName, total, completed, percent };
  });

  const totalWeekTasks = dayStats.reduce((sum, d) => sum + d.total, 0);
  const totalWeekCompleted = dayStats.reduce((sum, d) => sum + d.completed, 0);
  const weekPercent = totalWeekTasks > 0 ? Math.round((totalWeekCompleted / totalWeekTasks) * 100) : 0;

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.title}>
          <BarChart2 size={13} color="var(--accent)" />
          <span>Haftalık Ritim & İstatistik</span>
        </span>
        <span className={styles.rateBadge}>
          {totalWeekCompleted}/{totalWeekTasks} tamamlandı (%{weekPercent})
        </span>
      </div>

      <div className={styles.chartRow}>
        {dayStats.map((st) => (
          <div key={st.dateStr} className={styles.barCol} title={`${st.dateStr}: ${st.completed}/${st.total} tamamlandı`}>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  height: `${st.percent}%`,
                  backgroundColor: st.percent === 100 ? 'var(--success)' : 'var(--accent)',
                }}
              />
            </div>
            <span className={styles.dayLabel}>{st.dayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
