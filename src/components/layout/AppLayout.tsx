import React from 'react';
import { Sidebar, ActiveTab } from './Sidebar';
import { Titlebar } from './Titlebar';
import { useTasks } from '../../app/providers/TaskProvider';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onToggleWidgetMode?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  onToggleWidgetMode,
  children,
}) => {
  const { feedback, clearFeedback } = useTasks();

  return (
    <div className={styles.layout}>
      <Titlebar />
      <div className={styles.bodyWrapper}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          onToggleWidgetMode={onToggleWidgetMode}
        />
        <main className={styles.contentWrapper}>
          <div className={styles.content}>{children}</div>
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
