import {
  isPermissionGranted,
  requestPermission,
  sendNotification as tauriSendNotification,
} from '@tauri-apps/plugin-notification';

export class NotificationService {
  private static isTauri(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
    );
  }

  static async hasPermission(): Promise<boolean> {
    try {
      if (this.isTauri()) {
        return await isPermissionGranted();
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission === 'granted';
      }
    } catch (err) {
      console.warn('Bildirim izni kontrol edilemedi:', err);
    }
    return false;
  }

  static async requestPermission(): Promise<boolean> {
    try {
      if (this.isTauri()) {
        const permission = await requestPermission();
        return permission === 'granted';
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    } catch (err) {
      console.error('Bildirim izni istenirken hata oluştu:', err);
    }
    return false;
  }

  static async sendNotification(title: string, body: string): Promise<void> {
    try {
      if (this.isTauri()) {
        const granted = await isPermissionGranted();
        if (granted) {
          tauriSendNotification({ title, body });
          return;
        }
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/vite.svg' });
        }
      }
    } catch (err) {
      console.warn('Bildirim gönderilemedi:', err);
    }
  }
}
