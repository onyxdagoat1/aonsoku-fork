import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = 'push_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'now_playing' | 'new_release' | 'playlist_update' | 'social' | 'general';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private pushToken: string | null = null;

  async init(): Promise<string | null> {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual project ID
      });
      this.pushToken = token.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);
      return this.pushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  async getPushToken(): Promise<string | null> {
    if (this.pushToken) return this.pushToken;
    
    const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (stored) {
      this.pushToken = stored;
      return stored;
    }
    
    return this.init();
  }

  // Schedule a local notification
  async scheduleNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null, // null = immediate
    });
    return id;
  }

  // Now playing notification
  async showNowPlaying(title: string, artist: string, albumArt?: string): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('now_playing', {
        name: 'Now Playing',
        importance: Notifications.AndroidImportance.LOW,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: null,
        vibrationPattern: null,
        enableVibrate: false,
      });
    }

    await this.scheduleNotification(
      title,
      `by ${artist}`,
      { type: 'now_playing', title, artist, albumArt }
    );
  }

  // New release notification
  async notifyNewRelease(albumName: string, artistName: string): Promise<void> {
    await this.scheduleNotification(
      'New Release',
      `${albumName} by ${artistName} is now available`,
      { type: 'new_release', albumName, artistName }
    );
  }

  // Social notification (comments, likes, etc.)
  async notifySocial(message: string, data?: Record<string, unknown>): Promise<void> {
    await this.scheduleNotification(
      'yedits.net',
      message,
      { type: 'social', ...data }
    );
  }

  // Cancel all notifications
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Add notification listeners
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
