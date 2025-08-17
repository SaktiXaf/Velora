// Simple EventEmitter implementation for React Native
class SimpleEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  addListener(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  removeListener(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  on = this.addListener;
  off = this.removeListener;
}

// Global auth state manager
class AuthStateManager extends SimpleEventEmitter {
  private _isAuthenticated = false;
  private _user: any = null;
  private _initialized = false;
  private _loading = true;

  setAuthState(user: any, isAuthenticated: boolean, initialized: boolean, loading: boolean) {
    console.log('🌍 AuthStateManager: Setting global auth state:', {
      userEmail: user?.email || 'none',
      isAuthenticated,
      initialized,
      loading
    });
    
    this._user = user;
    this._isAuthenticated = isAuthenticated;
    this._initialized = initialized;
    this._loading = loading;
    
    // Emit change to all listeners
    this.emit('auth-changed', {
      user: this._user,
      isAuthenticated: this._isAuthenticated,
      initialized: this._initialized,
      loading: this._loading
    });
  }

  getAuthState() {
    return {
      user: this._user,
      isAuthenticated: this._isAuthenticated,
      initialized: this._initialized,
      loading: this._loading
    };
  }
}

export const authStateManager = new AuthStateManager();
