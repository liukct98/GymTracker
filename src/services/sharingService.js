import { supabase } from './supabase';
import Storage from './storage';

export const SharingService = {
  // Genera un link condivisibile con l'ID del workout
  async shareWorkout(workout) {
    try {
      const user = await Storage.getCurrentUser();
      if (!user) throw new Error('Utente non autenticato');

      // Usa semplicemente l'ID del workout come codice
      const shareCode = workout.id;

      return { success: true, shareCode };
    } catch (error) {
      console.error('Error sharing workout:', error);
      return { success: false, error: error.message };
    }
  },

  // Importa un allenamento copiando dalla tabella workouts
  async importWorkout(workoutId) {
    try {
      const user = await Storage.getCurrentUser();
      if (!user) throw new Error('Utente non autenticato');

      // Cerca l'allenamento originale nella tabella workouts
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Allenamento non trovato');

      // Crea una copia dell'allenamento per l'utente corrente
      const workouts = await Storage.getWorkouts();
      const newWorkout = {
        id: Date.now().toString(),
        name: `${data.name} (Importato)`,
        date: new Date().toISOString().split('T')[0],
        exercises: data.exercises,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      };

      workouts.unshift(newWorkout);
      await Storage.saveWorkouts(workouts);

      // Sincronizza con Supabase
      const { error: syncError } = await supabase
        .from('workouts')
        .insert({
          id: newWorkout.id,
          user_id: user.id,
          name: newWorkout.name,
          date: newWorkout.date,
          notes: newWorkout.notes,
          exercises: newWorkout.exercises,
          created_at: newWorkout.createdAt,
        });

      if (syncError) console.error('Error syncing imported workout:', syncError);

      return { success: true, workout: newWorkout };
    } catch (error) {
      console.error('Error importing workout:', error);
      return { success: false, error: error.message };
    }
  },
};

export default SharingService;
