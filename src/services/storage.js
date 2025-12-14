import AsyncStorage from '@react-native-async-storage/async-storage';

const Storage = {
  async get(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      console.log(`[Storage] get(${key}):`, data ? `${data.length} chars` : 'null');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  async set(key, value) {
    try {
      console.log(`[Storage] set(${key}):`, value);
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  },

  async getWorkouts() {
    const workouts = (await this.get('workouts')) || [];
    console.log(`[Storage] getWorkouts: ${workouts.length} workouts`);
    return workouts;
  },

  async saveWorkouts(workouts) {
    await this.set('workouts', workouts);
  },

  async getExercises() {
    return (await this.get('exercises')) || [];
  },

  async saveExercises(exercises) {
    await this.set('exercises', exercises);
  },

  async getTemplates() {
    return (await this.get('workout-templates')) || [];
  },

  async saveTemplates(templates) {
    await this.set('workout-templates', templates);
  },

  async getCalendar() {
    const calendar = (await this.get('calendar')) || [];
    console.log(`[Storage] getCalendar: ${calendar.length} calendar workouts`);
    return calendar;
  },

  async saveCalendar(calendar) {
    await this.set('calendar', calendar);
  },

  async getCurrentUser() {
    return (await this.get('gym-current-user')) || null;
  },

  async setCurrentUser(user) {
    await this.set('gym-current-user', user);
  },

  async removeCurrentUser() {
    await AsyncStorage.removeItem('gym-current-user');
  },
};

export default Storage;
