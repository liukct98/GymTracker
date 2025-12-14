import { supabase } from './supabase';
import Storage from './storage';

export const SupabaseStorage = {
  async getCurrentUser() {
    return await Storage.getCurrentUser();
  },

  async syncTemplates() {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'No user' };

    const templates = await Storage.getTemplates();

    try {
      const { data, error } = await supabase
        .from('workouts')
        .upsert(
          templates.map((w) => ({
            id: w.id,
            user_id: user.id,
            name: w.name,
            notes: w.notes,
            exercises: w.exercises,
            created_at: w.createdAt,
          })),
          { onConflict: 'id' }
        );

      if (error) throw error;
      console.log('✓ Templates synced to cloud');
      return { success: true };
    } catch (error) {
      console.error('Error syncing templates:', error);
      return { success: false, error };
    }
  },

  async syncCalendar() {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'No user' };

    const calendar = await Storage.getCalendar();

    try {
      const { data, error } = await supabase
        .from('calendar')
        .upsert(
          calendar.map((w) => ({
            id: w.id,
            user_id: user.id,
            name: w.name,
            date: w.date,
            notes: w.notes,
            duration: w.duration,
            completed_at: w.completedAt,
            exercises: w.exercises,
            created_at: w.createdAt,
          })),
          { onConflict: 'id' }
        );

      if (error) throw error;
      console.log('✓ Calendar synced to cloud');
      return { success: true };
    } catch (error) {
      console.error('Error syncing calendar:', error);
      return { success: false, error };
    }
  },

  async loadTemplates() {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'No user' };

    try {
      console.log('[SupabaseStorage] Loading templates for user:', user.id);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[SupabaseStorage] Loaded from cloud:', data?.length || 0, 'templates');

      const templates = data.map((w) => ({
        id: w.id,
        name: w.name,
        notes: w.notes,
        exercises: w.exercises,
        createdAt: w.created_at,
      }));

      await Storage.saveTemplates(templates);
      console.log('✓ Templates loaded from cloud and saved to storage');
      return { success: true, data: templates };
    } catch (error) {
      console.error('Error loading templates:', error);
      return { success: false, error };
    }
  },

  async loadCalendar() {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'No user' };

    try {
      console.log('[SupabaseStorage] Loading calendar for user:', user.id);
      const { data, error } = await supabase
        .from('calendar')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      console.log('[SupabaseStorage] Loaded from cloud:', data?.length || 0, 'calendar workouts');

      const calendar = data.map((w) => ({
        id: w.id,
        name: w.name,
        date: w.date.split('T')[0], // Assicura formato YYYY-MM-DD
        notes: w.notes,
        duration: w.duration,
        completedAt: w.completed_at,
        exercises: w.exercises,
        createdAt: w.created_at,
      }));

      await Storage.saveCalendar(calendar);
      console.log('✓ Calendar loaded from cloud and saved to storage');
      return { success: true, data: calendar };
    } catch (error) {
      console.error('Error loading calendar:', error);
      return { success: false, error };
    }
  },

  async syncExercises() {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'No user' };

    // Solo admin può sincronizzare esercizi
    if (!user.isAdmin) {
      console.log('[SupabaseStorage] Non-admin user, skipping exercise sync');
      return { success: true };
    }

    const exercises = await Storage.getExercises();

    try {
      const { data, error } = await supabase
        .from('exercises')
        .upsert(
          exercises.map((e) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            notes: e.notes || null,
            created_at: e.createdAt,
          })),
          { onConflict: 'id' }
        );

      if (error) throw error;
      console.log('✓ Exercises synced to cloud');
      return { success: true };
    } catch (error) {
      console.error('Error syncing exercises:', error);
      return { success: false, error };
    }
  },

  async loadExercises() {
    try {
      console.log('[SupabaseStorage] Fetching all exercises (global)');
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      console.log('[SupabaseStorage] Supabase response - data:', data, 'error:', error);

      if (error) throw error;

      console.log('[SupabaseStorage] Raw exercises from DB:', data ? data.length : 0);

      const exercises = data.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        notes: e.notes || '',
        createdAt: e.created_at,
      }));

      console.log('[SupabaseStorage] Mapped exercises:', exercises);
      await Storage.saveExercises(exercises);
      console.log('✓ Exercises loaded from cloud:', exercises.length);
      return { success: true, data: exercises };
    } catch (error) {
      console.error('[SupabaseStorage] Error loading exercises:', error);
      return { success: false, error };
    }
  },

  async fullSync() {
    console.log('Starting full sync...');
    await this.loadTemplates();
    await this.loadCalendar();
    await this.loadExercises();
    await this.syncTemplates();
    await this.syncCalendar();
    await this.syncExercises();
    console.log('Full sync completed');
  },
};

export default SupabaseStorage;
