import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  type: 'follow' | 'event';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

const NOTIFICATIONS_KEY = 'user_notifications';

export class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Get storage key for user notifications
  private getNotificationsKey(userId: string): string {
    return `${NOTIFICATIONS_KEY}_${userId}`;
  }

  // Get notifications for user
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const key = this.getNotificationsKey(userId);
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const notifications = JSON.parse(stored) as Notification[];
        return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      
      return [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Save notifications for user
  async saveNotifications(userId: string, notifications: Notification[]): Promise<void> {
    try {
      const key = this.getNotificationsKey(userId);
      await AsyncStorage.setItem(key, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Add new notification
  async addNotification(userId: string, notification: Omit<Notification, 'id'>): Promise<void> {
    try {
      const notifications = await this.getNotifications(userId);
      
      const newNotification: Notification = {
        ...notification,
        id: `${notification.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const updatedNotifications = [newNotification, ...notifications];
      await this.saveNotifications(userId, updatedNotifications);
      
      console.log('📱 Notification added for user:', userId, '|', newNotification.title);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  // Add follow notification
  async addFollowNotification(targetUserId: string, followerUsername: string): Promise<void> {
    await this.addNotification(targetUserId, {
      type: 'follow',
      title: 'New Follower',
      message: `${followerUsername} started following you`,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        followerUsername,
      },
    });
  }

  // Add event notification
  async addEventNotification(userId: string, eventTitle: string, eventMessage: string): Promise<void> {
    await this.addNotification(userId, {
      type: 'event',
      title: eventTitle,
      message: eventMessage,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        eventTitle,
      },
    });
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(userId);
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      
      await this.saveNotifications(userId, updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(userId);
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      
      await this.saveNotifications(userId, updatedNotifications);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(notif => !notif.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Broadcast event notifications to all users
  async broadcastEventNotification(eventTitle: string, eventMessage: string): Promise<void> {
    try {
      // In a real app, this would get all user IDs from database
      // For demo, we'll use a mock list of user IDs
      const mockUserIds = ['user1', 'user2', 'user3']; // This should come from your user database
      
      for (const userId of mockUserIds) {
        await this.addEventNotification(userId, eventTitle, eventMessage);
      }
      
      console.log('📢 Event notification broadcasted to all users');
    } catch (error) {
      console.error('Error broadcasting event notification:', error);
    }
  }

  // Generate periodic event notifications (for demo)
  async generatePeriodicEventNotifications(): Promise<void> {
    const eventNotifications = [
      {
        title: 'New Event Available',
        message: 'Charity Fun Run - Register now for next month!',
      },
      {
        title: 'Weekend Challenge',
        message: 'Join our 5K Weekend Challenge this Saturday',
      },
      {
        title: 'Health Awareness Walk',
        message: 'Free health screening + walk this Sunday',
      },
      {
        title: 'Marathon Training',
        message: 'Free marathon training session - Every Tuesday 6 AM',
      },
      {
        title: 'Community Run',
        message: 'Monthly community run at Central Park - This Saturday',
      },
    ];

    const randomEvent = eventNotifications[Math.floor(Math.random() * eventNotifications.length)];
    
    // For demo, we'll add to a mock user ID
    // In real app, this would broadcast to all users
    const mockUserId = 'current-user'; // Replace with actual current user ID
    await this.addEventNotification(mockUserId, randomEvent.title, randomEvent.message);
  }
}

export const notificationService = NotificationService.getInstance();
