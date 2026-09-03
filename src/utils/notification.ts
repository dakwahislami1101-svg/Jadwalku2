import { soundManager } from './audio';

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  sound?: 'bell' | 'chime' | 'digital' | 'gong' | 'none';
}

class NotificationService {
  private hasNotificationApi: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasNotificationApi = true;
    }
  }

  public isSupported(): boolean {
    return this.hasNotificationApi;
  }

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.hasNotificationApi) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.hasNotificationApi) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public triggerNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      sound?: 'bell' | 'chime' | 'digital' | 'gong' | 'none';
      tag?: string;
    }
  ) {
    const sound = options?.sound || 'bell';
    soundManager.playSound(sound);

    if (this.hasNotificationApi && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: options?.body,
          icon: options?.icon || 'https://api.iconify.design/lucide:bell-ring.svg?color=%232563eb',
          tag: options?.tag,
          requireInteraction: false,
        });
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }
  }
}

export const notificationService = new NotificationService();
