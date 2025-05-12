import { reactive } from 'vue';

export const eventBus = reactive({
  // Liste des événements et de leurs abonnés
  _events: {},
  
  // S'abonner à un événement
  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
    return () => this.off(event, callback); // Retourne une fonction pour se désabonner
  },
  
  // Se désabonner d'un événement
  off(event, callback) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(cb => cb !== callback);
  },
  
  // Émettre un événement
  emit(event, ...args) {
    if (!this._events[event]) return;
    this._events[event].forEach(callback => {
      callback(...args);
    });
  }
});

// Événements spécifiques à l'application
export const APP_EVENTS = {
  PROFILE_PICTURE_UPDATED: 'profile-picture-updated',
  USER_LOGGED_IN: 'user-logged-in',
  USER_LOGGED_OUT: 'user-logged-out'
};
