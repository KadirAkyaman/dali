import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Plus,
  Check,
  X,
  Pin,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useTasks } from '../../app/providers/TaskProvider';
import { useTheme } from '../../app/providers/ThemeProvider';
import { formatDisplayDate } from '../../domain/date/dateService';
import { QuoteService, Quote } from '../../domain/quote/quoteService';
import { LocalSettingsRepository } from '../../repositories/localRepository';
import styles from './CompanionWidget.module.css';

const settingsRepo = new LocalSettingsRepository();

interface CompanionWidgetProps {
  onExpandToFull: () => void;
}

const WIDGET_SIZES = [
  { id: 'small', label: 'Küçük', width: 300, height: 420 },
  { id: 'medium', label: 'Orta', width: 340, height: 500 },
  { id: 'large', label: 'Geniş', width: 420, height: 620 },
];

const OPACITY_OPTIONS = [50, 70, 85, 95, 100];

export const CompanionWidget: React.FC<CompanionWidgetProps> = ({ onExpandToFull }) => {
  const { todayStr, selectedDate, setSelectedDate, tasks, toggleTask, addTask, refreshTasks } = useTasks();
  const { resolvedTheme } = useTheme();

  // Widget moduna geçildiğinde her zaman bugünü garantiye al ve görevleri tazele
  useEffect(() => {
    if (selectedDate !== todayStr) {
      setSelectedDate(todayStr);
    }
    refreshTasks();
    settingsRepo.getSettings().then((s) => {
      if (s.widget_opacity) {
        setOpacity(s.widget_opacity);
      }
      if (s.widget_always_on_top !== undefined) {
        setIsPinned(s.widget_always_on_top);
        invokeTauri('set_always_on_top', { alwaysOnTop: s.widget_always_on_top });
      }
    });
  }, [todayStr, selectedDate, setSelectedDate, refreshTasks]);

  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [quote, setQuote] = useState<Quote>(() => QuoteService.getDailyQuote(todayStr));

  const [isMiniBar, setIsMiniBar] = useState<boolean>(() => {
    return localStorage.getItem('dali_widget_is_mini') === 'true';
  });

  const [miniTaskIndex, setMiniTaskIndex] = useState(0);

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    return localStorage.getItem('dali_widget_pinned') === 'true';
  });

  const [opacity, setOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('dali_widget_opacity');
    return saved ? parseInt(saved, 10) : 100;
  });

  const [showQuote, setShowQuote] = useState<boolean>(() => {
    return localStorage.getItem('dali_widget_show_quote') !== 'false';
  });

  const [activeSize, setActiveSize] = useState<string>('medium');

  const todayTasks = tasks.filter((t) => t.scheduled_date === todayStr);
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Active uncompleted tasks for mini mode
  const pendingTasks = todayTasks.filter((t) => t.status !== 'completed');

  const invokeTauri = async (command: string, args?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined') {
        const tauriInternals = (window as any).__TAURI_INTERNALS__;
        if (tauriInternals && typeof tauriInternals.invoke === 'function') {
          return await tauriInternals.invoke(command, args);
        }
        const tauriCore = (window as any).__TAURI__?.core;
        if (tauriCore && typeof tauriCore.invoke === 'function') {
          return await tauriCore.invoke(command, args);
        }
      }
    } catch (err) {
      console.warn('Tauri komutu çalıştırılamadı:', command, err);
    }
    return null;
  };

  const handleTogglePin = async () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    localStorage.setItem('dali_widget_pinned', String(nextPinned));
    await invokeTauri('set_always_on_top', { alwaysOnTop: nextPinned });
  };

  const handleToggleMiniBar = async () => {
    const nextState = !isMiniBar;
    setIsMiniBar(nextState);
    localStorage.setItem('dali_widget_is_mini', String(nextState));

    if (nextState) {
      // Switch to ultra mini bar (280x115)
      await invokeTauri('set_widget_size', { width: 280, height: 115 });
    } else {
      // Restore standard widget size
      const currentSizeObj = WIDGET_SIZES.find((s) => s.id === activeSize) || WIDGET_SIZES[1];
      await invokeTauri('set_widget_size', {
        width: currentSizeObj.width,
        height: currentSizeObj.height,
      });
    }
  };

  const handleSetSize = async (sizeId: string) => {
    const size = WIDGET_SIZES.find((s) => s.id === sizeId);
    if (!size) return;
    setActiveSize(sizeId);
    if (isMiniBar) {
      setIsMiniBar(false);
      localStorage.setItem('dali_widget_is_mini', 'false');
    }
    await invokeTauri('set_widget_size', { width: size.width, height: size.height });
  };

  const handleSetOpacity = (val: number) => {
    setOpacity(val);
    localStorage.setItem('dali_widget_opacity', String(val));
  };

  const handleToggleShowQuote = () => {
    const nextVal = !showQuote;
    setShowQuote(nextVal);
    localStorage.setItem('dali_widget_show_quote', String(nextVal));
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTask({ title: trimmed });
    setNewTitle('');
    setIsAdding(false);
  };

  const handleClose = async () => {
    await invokeTauri('close_window');
  };

  // Dynamically calculate background color with opacity based on theme
  const widgetBg =
    resolvedTheme === 'dark'
      ? `rgba(32, 33, 31, ${opacity / 100})`
      : `rgba(255, 255, 255, ${opacity / 100})`;

  // ==========================================
  // ULTRA-MINI BAR MODU RENDER
  // ==========================================
  if (isMiniBar) {
    const currentMiniTask = pendingTasks[miniTaskIndex % (pendingTasks.length || 1)] || null;

    return (
      <div
        className={styles.miniBarContainer}
        style={{
          backgroundColor: widgetBg,
        }}
      >
        <div className={styles.miniBarHeader} data-tauri-drag-region>
          <div className={styles.brandGroup}>
            <div className={styles.brandDot} />
            <span className={styles.brandText}>dali</span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: 2 }}>
              %{Math.round(progressPercent)}
            </span>
          </div>

          <div className={styles.headerControls}>
            {/* Always on top / Pin */}
            <button
              type="button"
              className={`${styles.controlButton} ${isPinned ? styles.controlButtonActive : ''}`}
              onClick={handleTogglePin}
              title={isPinned ? 'Sabitlemeyi kaldır' : 'Her zaman üstte tut'}
              aria-label="Her zaman üstte tut"
            >
              <Pin size={11} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
            </button>

            {/* Genişlet (Normal widgete dön) */}
            <button
              type="button"
              className={styles.controlButton}
              onClick={handleToggleMiniBar}
              title="Normal Widget Görünümüne Genişlet"
              aria-label="Normal Widget Görünümüne Genişlet"
            >
              <Maximize2 size={11} />
            </button>

            {/* Kapat */}
            <button
              type="button"
              className={`${styles.controlButton} ${styles.closeButton}`}
              onClick={handleClose}
              title="Kapat"
              aria-label="Kapat"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        <div className={styles.miniBarContent}>
          {currentMiniTask ? (
            <>
              <div className={styles.miniBarTaskMain}>
                <button
                  type="button"
                  onClick={() => toggleTask(currentMiniTask.id)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: '1.5px solid var(--border-focus)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="Tamamla"
                  aria-label="Tamamla"
                >
                  {currentMiniTask.status === 'completed' && <Check size={10} strokeWidth={2.5} />}
                </button>
                {currentMiniTask.priority && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor:
                        currentMiniTask.priority === 'high'
                          ? '#ef4444'
                          : currentMiniTask.priority === 'medium'
                          ? '#f59e0b'
                          : '#60a5fa',
                    }}
                  />
                )}
                {currentMiniTask.icon && (
                  <span style={{ fontSize: '12px', flexShrink: 0 }}>{currentMiniTask.icon}</span>
                )}
                <span className={styles.miniBarTaskText} title={currentMiniTask.title}>
                  {currentMiniTask.title}
                </span>
              </div>

              {pendingTasks.length > 1 && (
                <div className={styles.miniBarNav}>
                  <button
                    type="button"
                    className={styles.miniBarNavBtn}
                    onClick={() =>
                      setMiniTaskIndex((prev) => (prev > 0 ? prev - 1 : pendingTasks.length - 1))
                    }
                    title="Önceki görev"
                  >
                    <ChevronLeft size={11} />
                  </button>
                  <span>
                    {(miniTaskIndex % pendingTasks.length) + 1}/{pendingTasks.length}
                  </span>
                  <button
                    type="button"
                    className={styles.miniBarNavBtn}
                    onClick={() => setMiniTaskIndex((prev) => prev + 1)}
                    title="Sonraki görev"
                  >
                    <ChevronRight size={11} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span>{totalCount > 0 ? 'Tümü tamamlandı! ✨' : 'Planın boş.'}</span>
              <button
                type="button"
                onClick={onExpandToFull}
                style={{
                  fontSize: '11px',
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Uygulamayı Aç
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // STANDART WIDGET RENDER
  // ==========================================
  return (
    <div
      className={styles.widgetContainer}
      style={{
        backgroundColor: widgetBg,
      }}
    >
      <div>
        <div className={styles.widgetHeader} data-tauri-drag-region>
          <div className={styles.brandGroup}>
            <div className={styles.brandDot} />
            <span className={styles.brandText}>dali</span>
          </div>

          <div className={styles.headerControls}>
            {/* Ultra Mini Bar Toggle Button - Kullanıcı İçin Doğrudan Görünür! */}
            <button
              type="button"
              className={styles.controlButton}
              onClick={handleToggleMiniBar}
              title="Kompakt Mini Bar Moduna Geç"
              aria-label="Kompakt Mini Bar Moduna Geç"
            >
              <Minimize2 size={12} />
            </button>

            {/* Always on top / Pin */}
            <button
              type="button"
              className={`${styles.controlButton} ${isPinned ? styles.controlButtonActive : ''}`}
              onClick={handleTogglePin}
              title={isPinned ? 'Sabitlemeyi kaldır' : 'Her zaman üstte tut'}
              aria-label="Her zaman üstte tut"
            >
              <Pin size={12} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
            </button>

            {/* Modüler Widget Ayarları (Boyut & Opacity & Görünüm) */}
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={styles.controlButton}
                  title="Widget özelleştirme (Boyut, Saydamlık)"
                  aria-label="Widget ayarları"
                >
                  <SlidersHorizontal size={12} />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className={styles.settingsPopover} side="bottom" align="end" sideOffset={6}>
                  <span className={styles.popoverTitle}>Widget Görünümü</span>

                  {/* Boyut Seçimi */}
                  <div className={styles.popoverRow}>
                    <span className={styles.popoverLabel}>Boyut</span>
                    <div className={styles.pillGroup}>
                      <button
                        type="button"
                        className={styles.pillButton}
                        onClick={handleToggleMiniBar}
                        title="Ultra Kompakt Yüzen Bar"
                      >
                        Mini Bar
                      </button>
                      {WIDGET_SIZES.map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          className={`${styles.pillButton} ${
                            !isMiniBar && activeSize === sz.id ? styles.pillButtonActive : ''
                          }`}
                          onClick={() => handleSetSize(sz.id)}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Saydamlık (Opacity) */}
                  <div className={styles.popoverRow}>
                    <span className={styles.popoverLabel}>Saydamlık: %{opacity}</span>
                    <div className={styles.pillGroup}>
                      {OPACITY_OPTIONS.map((op) => (
                        <button
                          key={op}
                          type="button"
                          className={`${styles.pillButton} ${
                            opacity === op ? styles.pillButtonActive : ''
                          }`}
                          onClick={() => handleSetOpacity(op)}
                        >
                          %{op}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alıntı Gösterimi */}
                  <div className={styles.popoverRow} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.popoverLabel}>Günün Sözü</span>
                    <button
                      type="button"
                      className={`${styles.pillButton} ${showQuote ? styles.pillButtonActive : ''}`}
                      style={{ flex: 'none', padding: '3px 10px' }}
                      onClick={handleToggleShowQuote}
                    >
                      {showQuote ? 'Açık' : 'Kapalı'}
                    </button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <button
              type="button"
              className={styles.controlButton}
              onClick={onExpandToFull}
              title="Ana uygulamaya genişlet"
              aria-label="Ana uygulamaya genişlet"
            >
              <Maximize2 size={12} />
            </button>
            <button
              type="button"
              className={`${styles.controlButton} ${styles.closeButton}`}
              onClick={handleClose}
              title="Kapat (Sistem tepsisine küçültür)"
              aria-label="Kapat"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <h2 className={styles.dateTitle}>{formatDisplayDate(todayStr)}</h2>

        {showQuote && quote && (
          <p
            className={styles.miniQuote}
            onClick={() => setQuote(QuoteService.getRandomQuote())}
            title="Tıkla ve yeni bir söz gör"
          >
            “{quote.text}” <span className={styles.miniQuoteAuthor}>— {quote.author}</span>
          </p>
        )}

        {totalCount > 0 && (
          <div>
            <div className={styles.progressRow}>
              <span>{completedCount} / {totalCount} tamamlandı</span>
              <span>%{Math.round(progressPercent)}</span>
            </div>
            <div className={styles.miniProgressBar}>
              <div
                className={styles.miniProgressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className={styles.taskList}>
          {todayTasks.length === 0 ? (
            <div className={styles.emptyState}>
              Bugün için planın boş.
            </div>
          ) : (
            todayTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 6px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(t.id)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: '1.5px solid var(--border-focus)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: t.status === 'completed' ? 'var(--success)' : 'transparent',
                    borderColor: t.status === 'completed' ? 'var(--success)' : 'var(--border-focus)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label={t.status === 'completed' ? 'Tamamlanmadı yap' : 'Tamamla'}
                >
                  {t.status === 'completed' && <Check size={10} strokeWidth={2.5} />}
                </button>
                {t.priority && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor:
                        t.priority === 'high'
                          ? '#ef4444'
                          : t.priority === 'medium'
                          ? '#f59e0b'
                          : '#60a5fa',
                    }}
                  />
                )}
                {t.icon && <span style={{ fontSize: '13px', flexShrink: 0 }}>{t.icon}</span>}
                <span
                  style={{
                    color: t.status === 'completed' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                  }}
                >
                  {t.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.widgetFooter}>
        {isAdding ? (
          <form onSubmit={handleQuickAdd} style={{ width: '100%', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Yeni görev..."
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '4px 6px',
                border: '1px solid var(--accent)',
                borderRadius: '6px',
                outline: 'none',
                color: 'var(--text-primary)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              style={{
                fontSize: '12px',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Ekle
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            <span>Görev ekle</span>
          </button>
        )}

        <button
          type="button"
          className={styles.openFullText}
          onClick={onExpandToFull}
        >
          Dali'yi Aç
        </button>
      </div>
    </div>
  );
};
