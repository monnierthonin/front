import { reactive } from 'vue';

export const eventBus = reactive({
  _events: {},
  
  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
    return () => this.off(event, callback);
  },
  
  off(event, callback) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(cb => cb !== callback);
  },
  
  emit(event, ...args) {
    if (!this._events[event]) return;
    this._events[event].forEach(callback => {
      callback(...args);
    });
  }
});

export const APP_EVENTS = {
  PROFILE_PICTURE_UPDATED: 'profile-picture-updated',
  USER_LOGGED_IN: 'user-logged-in',
  USER_LOGGED_OUT: 'user-logged-out'
};
