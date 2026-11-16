import React from 'react';
import {
  CalendarCheck2,
  Timer,
  Flame,
  FileText,
  RotateCw,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Settings2,
  Minimize2,
} from 'lucide-react';
import styles from './Sidebar.module.css';

export type ActiveTab = 'today' | 'focus' | 'habits' | 'notes' | 'routines' | 'analytics' | 'calendar' | 'completed' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onToggleWidgetMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onToggleWidgetMode }) => {
  return (
    <aside className={styles.sidebar}>
      <div>
        <nav className={styles.navGroup}>
          <button
            className={`${styles.navItem} ${activeTab === 'today' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('today')}
            aria-label="Bugün"
          >
            <CalendarCheck2 className={styles.navItemIcon} />
            <span>Bugün</span>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'focus' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('focus')}
            aria-label="Odaklan"
          >
            <Timer className={styles.navItemIcon} />
            <span>Odaklan</span>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'habits' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('habits')}
            aria-label="Alışkanlıklar"
          >
            <Flame className={styles.navItemIcon} />
            <span>Alışkanlıklar</span>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'notes' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('notes')}
            aria-label="Notlar"
          >
            <FileText className={styles.navItemIcon} />
            <span>Notlar</span>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'routines' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('routines')}
            aria-label="Tekrarlananlar"
          >
            <RotateCw className={styles.navItemIcon} />
            <span>Tekrarlananlar</span>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('analytics')}
            aria-label="İstatistikler"
          >
            <BarChart3 className={styles.navItemIcon} />
            <span>İstatistikler</span>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'calendar' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('calendar')}
            aria-label="Takvim"
          >
            <CalendarDays className={styles.navItemIcon} />
            <span>Takvim</span>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'completed' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('completed')}
            aria-label="Tamamlananlar"
          >
            <CheckCircle2 className={styles.navItemIcon} />
            <span>Tamamlananlar</span>
          </button>
        </nav>
      </div>

      <div className={styles.bottomGroup}>
        {onToggleWidgetMode && (
          <button
            className={styles.navItem}
            onClick={onToggleWidgetMode}
            aria-label="Mini Pencere Modu"
            title="Mini pencere görünümüne geç (Ctrl + M)"
          >
            <Minimize2 className={styles.navItemIcon} />
            <span>Mini Mod</span>
          </button>
        )}

        <button
          className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}
          onClick={() => onTabChange('settings')}
          aria-label="Ayarlar"
        >
          <Settings2 className={styles.navItemIcon} />
          <span>Ayarlar</span>
        </button>
      </div>
    </aside>
  );
};
