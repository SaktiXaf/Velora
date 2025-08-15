// Simple event system for coordinating auth state across components
type AuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: AuthEventListener[] = [];

  addListener(listener: AuthEventListener) {
    this.listeners.push(listener);
    console.log('🔔 Auth event listener added. Total:', this.listeners.length);
  }

  removeListener(listener: AuthEventListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
    console.log('🔕 Auth event listener removed. Total:', this.listeners.length);
  }

  emit() {
    console.log('📢 Emitting auth state change to', this.listeners.length, 'listeners');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }
}

export const authEventEmitter = new AuthEventEmitter();
