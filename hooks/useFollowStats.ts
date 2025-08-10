import { followService } from '@/lib/followService';
import { useCallback, useEffect, useState } from 'react';

export interface FollowStats {
  followers: number;
  following: number;
}

// Simple event emitter untuk React Native compatibility
class FollowStatsEmitter {
  private listeners: Array<(userId: string, stats: FollowStats) => void> = [];

  subscribe(callback: (userId: string, stats: FollowStats) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emit(userId: string, stats: FollowStats) {
    this.listeners.forEach(listener => {
      try {
        listener(userId, stats);
      } catch (error) {
        console.error('Error in FollowStatsEmitter listener:', error);
      }
    });
  }

  // Method to trigger stats update for a user
  async updateStats(userId: string) {
    try {
      console.log(`🔔 Updating stats for user: ${userId}`);
      const stats = await followService.getFollowStats(userId);
      console.log(`📊 Updated stats for ${userId}:`, stats);
      this.emit(userId, stats);
    } catch (error) {
      console.error('Error updating follow stats:', error);
    }
  }
}

// Global singleton instance
const followStatsEmitter = new FollowStatsEmitter();

// Hook for using follow stats with real-time updates
export const useFollowStats = (userId: string | null) => {
  const [stats, setStats] = useState<FollowStats>({ followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Load initial stats
  const loadStats = useCallback(async () => {
    if (!userId) {
      setStats({ followers: 0, following: 0 });
      return;
    }

    setIsLoading(true);
    try {
      const initialStats = await followService.getFollowStats(userId);
      setStats(initialStats);
    } catch (error) {
      console.error('Error loading follow stats:', error);
      setStats({ followers: 0, following: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = followStatsEmitter.subscribe((updatedUserId, updatedStats) => {
      if (updatedUserId === userId) {
        setStats(updatedStats);
      }
    });

    return unsubscribe;
  }, [userId]);

  // Load stats on mount and when userId changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Function to manually refresh stats
  const refreshStats = useCallback(async () => {
    if (userId) {
      await followStatsEmitter.updateStats(userId);
    }
  }, [userId]);

  return {
    stats,
    isLoading,
    refreshStats,
  };
};

// Function to trigger stats update from anywhere in the app
export const triggerFollowStatsUpdate = async (userId: string) => {
  await followStatsEmitter.updateStats(userId);
};

// Export emitter for direct access if needed
export { followStatsEmitter };

