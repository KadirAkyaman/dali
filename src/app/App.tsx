import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './providers/ThemeProvider';
import { TaskProvider, useTasks } from './providers/TaskProvider';
import { AppLayout } from '../components/layout/AppLayout';
import { ActiveTab } from '../components/layout/Sidebar';
import { TodayView } from '../features/today/TodayView';
import { FocusView } from '../features/focus/FocusView';
import { HabitsView } from '../features/habits/HabitsView';
import { NotesView } from '../features/notes/NotesView';
import { CalendarView } from '../features/calendar/CalendarView';
import { CompletedView } from '../features/completed/CompletedView';
import { SettingsView } from '../features/settings/SettingsView';
import { CompanionWidget } from '../features/widget/CompanionWidget';

const DaliApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isWidgetMode, setIsWidgetMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'widget';
    }
    return false;
  });

  const { setSelectedDate } = useTasks();

  const invokeTauri = async (command: string) => {
    try {
      if (typeof window !== 'undefined') {
        const tauriInternals = (window as any).__TAURI_INTERNALS__;
        if (tauriInternals && typeof tauriInternals.invoke === 'function') {
          return await tauriInternals.invoke(command);
        }
        const tauriCore = (window as any).__TAURI__?.core;
        if (tauriCore && typeof tauriCore.invoke === 'function') {
          return await tauriCore.invoke(command);
        }
      }
    } catch {
      // Standart web fallback
    }
    return null;
  };

  const handleEnterWidgetMode = useCallback(async () => {
    setIsWidgetMode(true);
    await invokeTauri('enter_widget_mode');
  }, []);

  const handleExitWidgetMode = useCallback(async () => {
    setIsWidgetMode(false);
    await invokeTauri('exit_widget_mode');
  }, []);

  // Genel Klavye Kısayolları (Ctrl+1, Ctrl+2, Ctrl+3, Ctrl+,, Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          handleExitWidgetMode();
          setActiveTab('today');
        } else if (e.key === '2') {
          e.preventDefault();
          handleExitWidgetMode();
          setActiveTab('calendar');
        } else if (e.key === '3') {
          e.preventDefault();
          handleExitWidgetMode();
          setActiveTab('completed');
        } else if (e.key === ',') {
          e.preventDefault();
          handleExitWidgetMode();
          setActiveTab('settings');
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          if (isWidgetMode) {
            handleExitWidgetMode();
          } else {
            handleEnterWidgetMode();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWidgetMode, handleEnterWidgetMode, handleExitWidgetMode]);

  const handleSelectDateFromCalendar = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveTab('today');
  };

  if (isWidgetMode) {
    return <CompanionWidget onExpandToFull={handleExitWidgetMode} />;
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onToggleWidgetMode={handleEnterWidgetMode}
    >
      {activeTab === 'today' && <TodayView />}
      {activeTab === 'focus' && <FocusView />}
      {activeTab === 'habits' && <HabitsView />}
      {activeTab === 'notes' && <NotesView />}
      {activeTab === 'calendar' && (
        <CalendarView onSelectDateAndGoToToday={handleSelectDateFromCalendar} />
      )}
      {activeTab === 'completed' && <CompletedView />}
      {activeTab === 'settings' && <SettingsView />}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <TaskProvider>
        <DaliApp />
      </TaskProvider>
    </ThemeProvider>
  );
};

export default App;
