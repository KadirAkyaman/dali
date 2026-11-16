import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'error';
  version?: string;
  notes?: string;
  error?: string;
  progress?: number;
}

export class UpdaterService {
  private static cachedUpdate: Update | null = null;

  static async checkForUpdates(): Promise<{
    available: boolean;
    version?: string;
    notes?: string;
    update?: Update;
    error?: string;
  }> {
    try {
      // Check if Tauri environment
      if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
        return {
          available: false,
          error: 'Otomatik güncelleme yalnızca masaüstü uygulamasında etkindir.',
        };
      }

      const update = await check();
      if (update && update.available) {
        this.cachedUpdate = update;
        return {
          available: true,
          version: update.version,
          notes: update.body || 'Hata düzeltmeleri ve performans iyileştirmeleri.',
          update,
        };
      }

      return { available: false };
    } catch (err: any) {
      console.warn('Güncelleme kontrolü başarısız:', err);
      return {
        available: false,
        error: err?.message || 'Güncelleme sunucusuna erişilemedi.',
      };
    }
  }

  static async downloadAndInstall(
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let update = this.cachedUpdate;
      if (!update) {
        const checkResult = await this.checkForUpdates();
        if (!checkResult.available || !checkResult.update) {
          return { success: false, error: 'Yüklenecek güncelleme bulunamadı.' };
        }
        update = checkResult.update;
      }

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0 && onProgress) {
              onProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            if (onProgress) onProgress(100);
            break;
        }
      });

      // Relaunch the application seamlessly
      await relaunch();
      return { success: true };
    } catch (err: any) {
      console.error('Güncelleme yüklenirken hata oluştu:', err);
      return {
        success: false,
        error: err?.message || 'Güncelleme indirilemedi veya kurulamadı.',
      };
    }
  }
}
