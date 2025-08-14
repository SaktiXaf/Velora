import { Notification, notificationService } from '@/lib/notificationService';
import { useCallback, useEffect, useState } from 'react';

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications from service
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const notifs = await notificationService.getNotifications(userId);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
    
    try {
      await notificationService.markAsRead(userId, notificationId);
      await loadNotifications(); // Refresh after marking as read
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userId, loadNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await notificationService.markAllAsRead(userId);
      await loadNotifications(); // Refresh after marking all as read
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId, loadNotifications]);

  // Add follow notification (used by follow service)
  const addFollowNotification = useCallback(async (targetUserId: string, followerUsername: string) => {
    try {
      await notificationService.addFollowNotification(targetUserId, followerUsername);
      // Refresh if this is for current user
      if (targetUserId === userId) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error adding follow notification:', error);
    }
  }, [userId, loadNotifications]);

  // Add event notification
  const addEventNotification = useCallback(async (eventTitle: string, eventMessage: string) => {
    if (!userId) return;
    
    try {
      await notificationService.addEventNotification(userId, eventTitle, eventMessage);
      await loadNotifications(); // Refresh after adding
    } catch (error) {
      console.error('Error adding event notification:', error);
    }
  }, [userId, loadNotifications]);

  // Initialize notifications
  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [loadNotifications, userId]);

  // Simulate periodic event notifications (for demo purposes)
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(async () => {
      // 10% chance to add a new event notification every 2 minutes
      if (Math.random() < 0.1) {
        try {
          await notificationService.generatePeriodicEventNotifications();
          await loadNotifications();
        } catch (error) {
          console.error('Error generating periodic notification:', error);
        }
      }
    }, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [userId, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    addFollowNotification,
    addEventNotification,
  };
};
