export type ThemeMode =
  | 'system'
  | 'light'
  | 'dark'
  | 'oled'
  | 'midnight'
  | 'forest'
  | 'amethyst'
  | 'espresso'
  | 'sage'
  | 'slate'
  | 'peach'
  | 'mocha';

export interface AppSettings {
  theme: ThemeMode;
  auto_rollover_enabled: boolean;
  rollover_time: string; // e.g., "00:00"
  move_completed_to_bottom: boolean;
  notifications_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string;   // "08:00"
  week_starts_on: 0 | 1;     // 0: Pazar, 1: Pazartesi
  time_format: '24h' | '12h';
  launch_on_startup: boolean; // Windows başlangıcında otomatik başlatma
  last_active_date: string;  // YYYY-MM-DD

  // Masaüstü Mini Widget Ayarları
  widget_opacity: number; // 20 - 100
  widget_always_on_top: boolean;
  widget_size: 'compact' | 'standard' | 'large';
  widget_show_routines: boolean;
  widget_only_pending: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  auto_rollover_enabled: true,
  rollover_time: '00:00',
  move_completed_to_bottom: true,
  notifications_enabled: false,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  week_starts_on: 1,
  time_format: '24h',
  launch_on_startup: false,
  last_active_date: '',

  // Varsayılan Widget Değerleri
  widget_opacity: 96,
  widget_always_on_top: true,
  widget_size: 'standard',
  widget_show_routines: true,
  widget_only_pending: false,
};
