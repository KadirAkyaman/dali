import React from 'react';
import { Sidebar, ActiveTab } from './Sidebar';
import { Titlebar } from './Titlebar';
import { useTasks } from '../../app/providers/TaskProvider';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onToggleWidgetMode?: () => void;
  immersive?: boolean;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  onToggleWidgetMode,
  immersive = false,
  children,
}) => {
  const { feedback, clearFeedback, setSelectedDate, todayStr } = useTasks();

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'today') {
      setSelectedDate(todayStr);
    }
    onTabChange(tab);
  };

  return (
    <div className={`${styles.layout} ${immersive ? styles.immersive : ''}`}>
      <Titlebar immersive={immersive} />
      <div className={styles.bodyWrapper}>
        {!immersive && <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onToggleWidgetMode={onToggleWidgetMode}
        />}
        <main className={styles.contentWrapper}>
          <div className={styles.content}>
            {children}
            <div className={styles.bottomSpacer} />
          </div>
          {feedback && (
            <div className={styles.toast} onClick={clearFeedback}>
              <span>{feedback.message}</span>
              {feedback.onUndo && (
                <button
                  type="button"
                  className={styles.toastUndoButton}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (feedback.onUndo) {
                      await feedback.onUndo();
                    }
                  }}
                >
                  Geri Al
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
