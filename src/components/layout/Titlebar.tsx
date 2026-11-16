import React, { useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import styles from './Titlebar.module.css';

export const Titlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

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
      // Standart web veya test ortamı
    }
    return null;
  };

  const handleMinimize = async () => {
    await invokeTauri('minimize_window');
  };

  const handleToggleMaximize = async () => {
    const res = await invokeTauri('toggle_maximize');
    if (typeof res === 'boolean') {
      setIsMaximized(res);
    } else {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = async () => {
    await invokeTauri('close_window');
  };

  return (
    <header className={styles.titlebar} data-tauri-drag-region>
      <div className={styles.leftGroup}>
        <div className={styles.brandDot} />
        <span className={styles.title}>dali</span>
      </div>

      <div className={styles.dragRegion} data-tauri-drag-region />

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={handleMinimize}
          aria-label="Küçült"
          title="Simge durumuna küçült"
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={handleToggleMaximize}
          aria-label="Ekranı kapla"
          title={isMaximized ? 'Geri yükle' : 'Ekranı kapla'}
        >
          {isMaximized ? <Copy size={11} /> : <Square size={11} />}
        </button>
        <button
          type="button"
          className={`${styles.controlButton} ${styles.closeButton}`}
          onClick={handleClose}
          aria-label="Kapat"
          title="Kapat (Sistem tepsisine küçültür)"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
};
