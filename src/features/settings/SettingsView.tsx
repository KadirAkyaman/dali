import React, { useEffect, useState, useRef } from 'react';
import { Download, Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../app/providers/ThemeProvider';
import { useTasks } from '../../app/providers/TaskProvider';
import { ThemeMode, AppSettings } from '../../types/settings';
import { LocalSettingsRepository } from '../../repositories/localRepository';
import { UpdaterService, UpdateStatus } from '../../services/updaterService';
import { NotificationService } from '../../services/notificationService';
import styles from './SettingsView.module.css';

const settingsRepo = new LocalSettingsRepository();

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { exportData, importData } = useTasks();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [updateState, setUpdateState] = useState<UpdateStatus>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckUpdate = async () => {
    setUpdateState({ status: 'checking' });
    const res = await UpdaterService.checkForUpdates();
    if (res.error) {
      setUpdateState({ status: 'error', error: res.error });
    } else if (res.available && res.version) {
      setUpdateState({
        status: 'available',
        version: res.version,
        notes: res.notes,
      });
    } else {
      setUpdateState({ status: 'up-to-date' });
    }
  };

  const handleInstallUpdate = async () => {
    setUpdateState((prev) => ({ ...prev, status: 'downloading', progress: 0 }));
    const res = await UpdaterService.downloadAndInstall((progress) => {
      setUpdateState((prev) => ({ ...prev, progress }));
    });
    if (!res.success) {
      setUpdateState((prev) => ({ ...prev, status: 'error', error: res.error }));
    }
  };

  useEffect(() => {
    settingsRepo.getSettings().then(setSettings);
    NotificationService.hasPermission().then((has) => {
      setNotificationPermission(has ? 'granted' : 'default');
    });
  }, []);

  const handleAutoRolloverToggle = async () => {
    if (!settings) return;
    const newValue = !settings.auto_rollover_enabled;
    const updated = await settingsRepo.updateSettings({ auto_rollover_enabled: newValue });
    setSettings(updated);
  };

  const handleNotificationsToggle = async () => {
    if (!settings) return;

    if (!settings.notifications_enabled) {
      const granted = await NotificationService.requestPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
      if (!granted) {
        alert(
          'Windows bildirim izni verilmedi. Windows Ayarları > Sistem > Bildirimler bölümünden Dali için bildirimlere izin verebilirsiniz.'
        );
        return;
      }
      await NotificationService.sendNotification(
        'Dali',
        'Masaüstü bildirimleri başarıyla etkinleştirildi.'
      );
    }

    const newValue = !settings.notifications_enabled;
    const updated = await settingsRepo.updateSettings({ notifications_enabled: newValue });
    setSettings(updated);
  };

  const handleQuietHoursToggle = async () => {
    if (!settings) return;
    const newValue = !settings.quiet_hours_enabled;
    const updated = await settingsRepo.updateSettings({ quiet_hours_enabled: newValue });
    setSettings(updated);
  };

  const handleExport = async () => {
    const dataStr = await exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dali-yedek-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        await importData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const themeLabels: Record<ThemeMode, string> = {
    system: 'Sistem',
    light: 'Leylak',
    dark: 'Koyu',
    sage: 'Adaçayı',
    slate: 'Nordic Mavi',
    peach: 'Şeftali',
    mocha: 'Kahve',
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ayarlar</h1>
        <span className={styles.subTitle}>
          Kişisel çalışma alanını özelleştir.
        </span>
      </header>

      {/* Görünüm */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Görünüm</h2>
        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Tema Tercihi</span>
            <span className={styles.description}>
              Açık, koyu veya Windows sistem ayarını takip et.
            </span>
          </div>

          <div className={styles.segmentedControl} style={{ flexWrap: 'wrap', maxWidth: '360px' }}>
            {(['system', 'light', 'dark', 'sage', 'slate', 'peach', 'mocha'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`${styles.segmentButton} ${
                  theme === mode ? styles.segmentButtonActive : ''
                }`}
                onClick={() => setTheme(mode)}
              >
                {themeLabels[mode]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Görev Aktarımı */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Görev Aktarımı</h2>
        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Otomatik Aktarım</span>
            <span className={styles.description}>
              Gününde tamamlanmayan görevleri ertesi güne otomatik olarak taşır.
            </span>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              settings?.auto_rollover_enabled ? styles.toggleSwitchChecked : ''
            }`}
            onClick={handleAutoRolloverToggle}
            aria-label="Otomatik aktarımı aç veya kapat"
          >
            <div className={styles.toggleThumb} />
          </button>
        </div>
      </section>

      {/* Hatırlatıcılar ve Bildirimler (Faz 2) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Hatırlatıcılar ve Bildirimler</h2>
        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Masaüstü Bildirimleri</span>
            <span className={styles.description}>
              {notificationPermission === 'denied'
                ? 'Windows bildirim izni kapalı. Açmak için tıklayabilirsiniz.'
                : 'Saatli görevler için zamanında masaüstü bildirimi al.'}
            </span>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              settings?.notifications_enabled ? styles.toggleSwitchChecked : ''
            }`}
            onClick={handleNotificationsToggle}
            aria-label="Bildirimleri aç veya kapat"
          >
            <div className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Sessiz Saatler</span>
            <span className={styles.description}>
              22:00 ile 08:00 arasında bildirim sesleri ve uyarılar iletilmez.
            </span>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              settings?.quiet_hours_enabled ? styles.toggleSwitchChecked : ''
            }`}
            onClick={handleQuietHoursToggle}
            aria-label="Sessiz saatleri aç veya kapat"
          >
            <div className={styles.toggleThumb} />
          </button>
        </div>
      </section>

      {/* Masaüstü ve Sistem Entegrasyonu (Faz 3) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Masaüstü ve Windows Entegrasyonu</h2>
        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Windows ile Birlikte Başlat</span>
            <span className={styles.description}>
              Bilgisayar açıldığında Dali arka planda hazır bekler.
            </span>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              settings?.launch_on_startup ? styles.toggleSwitchChecked : ''
            }`}
            onClick={async () => {
              if (!settings) return;
              const val = !settings.launch_on_startup;
              const updated = await settingsRepo.updateSettings({ launch_on_startup: val });
              setSettings(updated);
            }}
            aria-label="Windows başlangıcında başlatmayı aç veya kapat"
          >
            <div className={styles.toggleThumb} />
          </button>
        </div>
      </section>

      {/* Veri Yönetimi & Yedekleme (Faz 2) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Veri Yönetimi</h2>
        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Yedekleme ve Geri Yükleme</span>
            <span className={styles.description}>
              Tüm plan ve görev geçmişini JSON dosyası olarak indir veya geri yükle.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={styles.actionButtonOutline}
              onClick={handleExport}
              title="Yedeği JSON olarak dışa aktar"
            >
              <Download size={14} />
              <span>Dışa Aktar</span>
            </button>
            <button
              type="button"
              className={styles.actionButtonOutline}
              onClick={() => fileInputRef.current?.click()}
              title="JSON yedeğinden geri yükle"
            >
              <Upload size={14} />
              <span>İçe Aktar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        </div>
      </section>

      {/* Hakkında & Otomatik Güncelleme */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dali Hakkında ve Güncellemeler</h2>
        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Sürüm 0.5.0</span>
            <span className={styles.description}>
              Bugüne yer aç. Minimalist kişisel günlük çalışma planlayıcısı.
            </span>
          </div>

          <button
            type="button"
            className={styles.actionButtonOutline}
            onClick={handleCheckUpdate}
            disabled={updateState.status === 'checking' || updateState.status === 'downloading'}
            title="Yeni sürüm kontrolü yap"
          >
            <RefreshCw
              size={13}
              style={{
                animation: updateState.status === 'checking' ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>
              {updateState.status === 'checking' ? 'Kontrol Ediliyor...' : 'Güncellemeleri Kontrol Et'}
            </span>
          </button>
        </div>

        {/* Güncelleme Durumu Bildirimi */}
        {updateState.status === 'up-to-date' && (
          <div className={styles.updateCard} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CheckCircle2 size={16} color="var(--success, #10b981)" />
            <span className={styles.statusText}>Dali en güncel sürümde. Yeni bir güncelleme yok.</span>
          </div>
        )}

        {updateState.status === 'available' && (
          <div className={styles.updateCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  Yeni Sürüm Mevcut: v{updateState.version}
                </strong>
                <p className={styles.statusText} style={{ margin: '4px 0 0 0' }}>
                  {updateState.notes}
                </p>
              </div>
              <button
                type="button"
                className={styles.actionButtonPrimary}
                onClick={handleInstallUpdate}
              >
                <Download size={13} />
                <span>Güncelle ve Yeniden Başlat</span>
              </button>
            </div>
          </div>
        )}

        {updateState.status === 'downloading' && (
          <div className={styles.updateCard}>
            <span className={styles.statusText}>
              Güncelleme indiriliyor ve kuruluyor... {updateState.progress ?? 0}%
            </span>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${updateState.progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {updateState.status === 'error' && (
          <div className={styles.updateCard}>
            <span className={styles.statusError}>
              {updateState.error}
            </span>
          </div>
        )}
      </section>
    </div>
  );
};
