import React, { useEffect, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Task } from '../../types/task';
import { LocalTaskRepository } from '../../repositories/localRepository';
import { formatDisplayDate } from '../../domain/date/dateService';
import styles from './CompletedView.module.css';

const taskRepo = new LocalTaskRepository();

export const CompletedView: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskRepo.findAllCompleted().then((tasks) => {
      setCompletedTasks(tasks);
      setLoading(false);
    });
  }, []);

  const filteredTasks = completedTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Tarihe göre gruplandırma
  const groupedTasks: Record<string, Task[]> = {};
  filteredTasks.forEach((task) => {
    const key = task.scheduled_date;
    if (!groupedTasks[key]) {
      groupedTasks[key] = [];
    }
    groupedTasks[key].push(task);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tamamlananlar</h1>
        <span className={styles.subTitle}>
          Tamamladığın işlerin sakin ve düzenli kaydı.
        </span>
      </header>

      {completedTasks.length > 0 && (
        <div className={styles.searchBar}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tamamlanan görevlerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>Tamamlanan görevler yükleniyor...</div>
      ) : completedTasks.length === 0 ? (
        <div className={styles.emptyState}>
          Tamamladığın görevler burada görünecek.
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          Bu aramayla eşleşen görev bulunamadı.
        </div>
      ) : (
        Object.entries(groupedTasks).map(([dateStr, tasks]) => (
          <div key={dateStr} className={styles.dateGroup}>
            <div className={styles.groupDateHeader}>{formatDisplayDate(dateStr)}</div>
            {tasks.map((t) => (
              <div key={t.id} className={styles.completedItem}>
                <Check size={16} className={styles.checkIcon} strokeWidth={2.5} />
                <span className={styles.taskTitle}>{t.title}</span>
                {t.completed_at && (
                  <span className={styles.time}>
                    {new Date(t.completed_at).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};
