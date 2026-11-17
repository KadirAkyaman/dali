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

  const THEME_OPTIONS: { id: ThemeMode; label: string; bg: string; accent: string; isDark: boolean }[] = [
    { id: 'dark', label: 'Klasik Koyu', bg: '#171816', accent: '#A69CEB', isDark: true },
    { id: 'oled', label: 'Saf OLED', bg: '#000000', accent: '#818CF8', isDark: true },
    { id: 'midnight', label: 'Gece Mavisi', bg: '#0B0F19', accent: '#38BDF8', isDark: true },
    { id: 'forest', label: 'Zümrüt Ormanı', bg: '#08120C', accent: '#10B981', isDark: true },
    { id: 'amethyst', label: 'Ametist Moru', bg: '#0E0A19', accent: '#C084FC', isDark: true },
    { id: 'espresso', label: 'Sıcak Espresso', bg: '#14100D', accent: '#D97706', isDark: true },
    { id: 'light', label: 'Minimalist Açık', bg: '#F7F7F5', accent: '#8C83D8', isDark: false },
    { id: 'sage', label: 'Adaçayı Yeşili', bg: '#F4F6F4', accent: '#558B6E', isDark: false },
    { id: 'slate', label: 'Nordic Mavi', bg: '#F3F5F7', accent: '#4F7296', isDark: false },
    { id: 'peach', label: 'Şeftali', bg: '#F8F5F3', accent: '#C86D51', isDark: false },
    { id: 'mocha', label: 'Sıcak Kahve', bg: '#F6F4F2', accent: '#876751', isDark: false },
    { id: 'system', label: 'Sistem Tercihi', bg: '#252624', accent: '#A69CEB', isDark: false },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ayarlar</h1>
        <span className={styles.subTitle}>
          Kişisel çalışma alanını özelleştir.
        </span>
      </header>

      {/* Görünüm ve Renk Temaları */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Görünüm</h2>
        <div className={styles.labelCol} style={{ marginBottom: 4 }}>
          <span className={styles.label}>Tema Koleksiyonu ({THEME_OPTIONS.length} Tema)</span>
          <span className={styles.description}>
            Gözünü yormayan karanlık OLED, gece mavisi, orman yeşili veya açık çalışma ortamları arasından seçim yap.
          </span>
        </div>

        <div className={styles.themeGrid}>
          {THEME_OPTIONS.map((item) => {
            const isSelected = theme === item.id;
            return (
              <div
                key={item.id}
                className={`${styles.themeCard} ${isSelected ? styles.themeCardActive : ''}`}
                onClick={() => setTheme(item.id)}
                title={`${item.label} (${item.isDark ? 'Karanlık Mod' : 'Açık Mod'})`}
              >
                <div
                  className={styles.themeSwatch}
                  style={{ background: item.bg }}
                >
                  <span
                    className={styles.themeSwatchDot}
                    style={{ backgroundColor: item.accent }}
                  />
                </div>
                <span className={styles.themeLabel}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Masaüstü Mini Widget Ayarları */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Masaüstü Mini Widget Ayarları</h2>

        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Widget Opaklığı (Saydamlık Çubuğu)</span>
            <span className={styles.description}>
              Masaüstünde açıkken widget penceresinin şeffaflık seviyesini ayarlar (%20 - %100).
            </span>
          </div>

          <div className={styles.sliderRow}>
            <input
              type="range"
              min="20"
              max="100"
              value={settings?.widget_opacity ?? 96}
              onChange={async (e) => {
                const val = parseInt(e.target.value, 10);
                const updated = await settingsRepo.updateSettings({ widget_opacity: val });
                setSettings(updated);
                localStorage.setItem('dali_widget_opacity', String(val));
              }}
              className={styles.rangeSlider}
            />
            <span className={styles.sliderBadge}>%{settings?.widget_opacity ?? 96}</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Her Zaman Üstte Kal</span>
            <span className={styles.description}>
              Mini widget diğer çalışma pencerelerinin ve uygulamaların üzerinde sabit kalır.
            </span>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              settings?.widget_always_on_top ? styles.toggleSwitchChecked : ''
            }`}
            onClick={async () => {
              if (!settings) return;
              const val = !settings.widget_always_on_top;
              const updated = await settingsRepo.updateSettings({ widget_always_on_top: val });
              setSettings(updated);
              localStorage.setItem('dali_widget_pinned', String(val));
            }}
            aria-label="Her zaman üstte kal ayarını aç veya kapat"
          >
            <div className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Varsayılan Widget Boyutu</span>
            <span className={styles.description}>
              Masaüstü widget açıldığında tercih edilen başlangıç boyutu.
            </span>
          </div>

          <div className={styles.segmentedControl}>
            {(['compact', 'standard', 'large'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                className={`${styles.segmentButton} ${
                  (settings?.widget_size || 'standard') === sz ? styles.segmentButtonActive : ''
                }`}
                onClick={async () => {
                  const updated = await settingsRepo.updateSettings({ widget_size: sz });
                  setSettings(updated);
                }}
              >
                {sz === 'compact' ? 'Kompakt' : sz === 'standard' ? 'Standart' : 'Geniş'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Tekrarlanan Rutinleri Göster</span>
            <span className={styles.description}>
              Bugüne ait haftalık rutinleri ve tekrarlanan görevleri widget modunda listeler.
            </span>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              settings?.widget_show_routines ? styles.toggleSwitchChecked : ''
            }`}
            onClick={async () => {
              if (!settings) return;
              const val = !settings.widget_show_routines;
              const updated = await settingsRepo.updateSettings({ widget_show_routines: val });
              setSettings(updated);
            }}
            aria-label="Widget'ta rutinleri göster ayarını aç veya kapat"
          >
            <div className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Yalnızca Kalan Görevleri Göster</span>
            <span className={styles.description}>
              Tamamlanan görevleri widget ekranından gizleyerek dikkat dağınıklığını önler.
            </span>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              settings?.widget_only_pending ? styles.toggleSwitchChecked : ''
            }`}
            onClick={async () => {
              if (!settings) return;
              const val = !settings.widget_only_pending;
              const updated = await settingsRepo.updateSettings({ widget_only_pending: val });
              setSettings(updated);
            }}
            aria-label="Widget'ta tamamlananları gizle ayarını aç veya kapat"
          >
            <div className={styles.toggleThumb} />
          </button>
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
            <span className={styles.label}>Sürüm 0.9.3</span>
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
