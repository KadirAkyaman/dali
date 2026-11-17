import React, { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { ThemeProvider } from './providers/ThemeProvider';
import { TaskProvider, useTasks } from './providers/TaskProvider';
import { AppLayout } from '../components/layout/AppLayout';
import { ActiveTab } from '../components/layout/Sidebar';
import { TodayView } from '../features/today/TodayView';
import { FocusView } from '../features/focus/FocusView';
import { HabitsView } from '../features/habits/HabitsView';
import { NotesView } from '../features/notes/NotesView';
import { RoutinesView } from '../features/routines/RoutinesView';
import { AnalyticsView } from '../features/analytics/AnalyticsView';
import { CalendarView } from '../features/calendar/CalendarView';
import { CompletedView } from '../features/completed/CompletedView';
import { SettingsView } from '../features/settings/SettingsView';
import { CompanionWidget } from '../features/widget/CompanionWidget';
import { QuickCaptureModal } from '../components/capture/QuickCaptureModal';

const DaliApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'widget';
    }
    return false;
  });

  const { addTask, todayStr } = useTasks();

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

  const [wasMaxBeforeCapture, setWasMaxBeforeCapture] = useState(false);

  const handleOpenQuickCapture = useCallback(async () => {
    setIsQuickCaptureOpen(true);
    if (isTauri()) {
      try {
        const wasMax = await invoke<boolean>('enter_capture_overlay');
        setWasMaxBeforeCapture(Boolean(wasMax));
      } catch {
        // web fallback
      }
    }
  }, []);

  const handleCloseQuickCapture = useCallback(async () => {
    setIsQuickCaptureOpen(false);
    if (isTauri()) {
      try {
        await invoke('exit_capture_overlay', { wasMaximized: wasMaxBeforeCapture });
      } catch {
        // web fallback
      }
    }
  }, [wasMaxBeforeCapture]);

  // Tauri Global Shortcut Event Dinleyicileri (Ctrl+Space)
  useEffect(() => {
    if (!isTauri()) return;

    let unlistenCapture: (() => void) | undefined;

    const setupTauriEvents = async () => {
      try {
        unlistenCapture = await listen('trigger-quick-capture', () => {
          handleOpenQuickCapture();
        });
      } catch (err) {
        console.warn('Tauri event dinleyicisi başlatılamadı:', err);
      }
    };

    setupTauriEvents();

    return () => {
      if (unlistenCapture) unlistenCapture();
    };
  }, [handleOpenQuickCapture]);

  // Genel Klavye Kısayolları (Ctrl+Space, Ctrl+., Ctrl+1, Ctrl+2, Ctrl+3, Ctrl+,, Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.code === 'Space') {
          e.preventDefault();
          if (isQuickCaptureOpen) {
            handleCloseQuickCapture();
          } else {
            handleOpenQuickCapture();
          }
        } else if (e.key === '1') {
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
      {activeTab === 'routines' && <RoutinesView />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'completed' && <CompletedView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Global Raycast / Spotlight Hızlı Yakalama Modalı (Ctrl + Space) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        todayStr={todayStr}
        onClose={handleCloseQuickCapture}
        onAddTask={addTask}
      />
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
