import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import Storage from '../services/storage';
import SupabaseStorage from '../services/supabaseStorage';
import colors from '../utils/colors';

const EditWorkoutScreen = ({ route, navigation }) => {
  const { workout: initialWorkout } = route.params;
  
  const [workoutName, setWorkoutName] = useState(initialWorkout.name);
  const [workoutNotes, setWorkoutNotes] = useState(initialWorkout.notes || '');
  const [exercises, setExercises] = useState(
    initialWorkout.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map(s => ({
        reps: s.reps,
        weight: s.weight,
        rest: s.rest || 90,
      })),
    }))
  );
  const [availableExercises, setAvailableExercises] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const exData = await Storage.getExercises();
    setAvailableExercises(exData);
  };

  const addExercise = () => {
    if (availableExercises.length === 0) {
      Alert.alert('Errore', 'Crea prima degli esercizi nella sezione Esercizi');
      return;
    }
    setExercises([
      ...exercises,
      {
        exerciseId: availableExercises[0].id,
        sets: [{ reps: 0, weight: 0, rest: 0 }],
      },
    ]);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const addSet = (exerciseIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({
      reps: 0,
      weight: 0,
      rest: 0,
    });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = parseFloat(value) || 0;
    setExercises(updated);
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per l\'allenamento');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Errore', 'Aggiungi almeno un esercizio');
      return;
    }

    const workoutExercises = exercises.map((ex) => {
      const exercise = availableExercises.find((e) => e.id === ex.exerciseId);
      return {
        exerciseId: ex.exerciseId,
        exerciseName: exercise.name,
        exerciseNotes: exercise.notes || '',
        sets: ex.sets.map((s) => ({ ...s, completed: false })),
      };
    });

    const updatedWorkout = {
      ...initialWorkout,
      name: workoutName.trim(),
      notes: workoutNotes.trim(),
      exercises: workoutExercises,
    };

    // Salva nel local storage
    const templates = await Storage.getTemplates();
    const index = templates.findIndex(w => w.id === initialWorkout.id);
    if (index !== -1) {
      templates[index] = updatedWorkout;
      await Storage.saveTemplates(templates);
    }

    Alert.alert('Successo', 'Allenamento modificato!');
    
    // Resetta lo stack rimuovendo EditWorkout e aggiornando WorkoutDetail
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'WorkoutDetail', params: { workout: updatedWorkout } },
        ],
      })
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome Allenamento</Text>
          <TextInput
            style={styles.input}
            placeholder="Es: Upper Body"
            placeholderTextColor={colors.textSecondary}
            value={workoutName}
            onChangeText={setWorkoutName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Note (opzionale)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Aggiungi note..."
            placeholderTextColor={colors.textSecondary}
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.exercisesSection}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.sectionTitle}>Esercizi</Text>
            <TouchableOpacity style={styles.addButton} onPress={addExercise}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text style={styles.addButtonText}>Aggiungi Esercizio</Text>
            </TouchableOpacity>
          </View>

          {exercises.map((exercise, exIndex) => {
            const selectedExercise = availableExercises.find(
              (e) => e.id === exercise.exerciseId
            );

            return (
              <View key={exIndex} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>
                      {selectedExercise?.name || 'Seleziona esercizio'}
                    </Text>
                    {selectedExercise?.notes && (
                      <Text style={styles.exerciseNotes}>{selectedExercise.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeExercise(exIndex)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={exercise.exerciseId}
                    onValueChange={(value) => updateExercise(exIndex, 'exerciseId', value)}
                    style={styles.picker}
                    dropdownIconColor={colors.text}
                  >
                    {availableExercises.map((ex) => (
                      <Picker.Item
                        key={ex.id}
                        label={`${ex.name}${ex.notes ? ' - ' + ex.notes : ''}`}
                        value={ex.id}
                      />
                    ))}
                  </Picker>
                </View>

                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={styles.setLabel}>Serie {setIndex + 1}</Text>
                    <TextInput
                      style={styles.setInput}
                      placeholder="Reps"
                      placeholderTextColor={colors.textSecondary}
                      value={set.reps > 0 ? set.reps.toString() : ''}
                      onChangeText={(value) => updateSet(exIndex, setIndex, 'reps', value)}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.setInput}
                      placeholder="Kg"
                      placeholderTextColor={colors.textSecondary}
                      value={set.weight > 0 ? set.weight.toString() : ''}
                      onChangeText={(value) => updateSet(exIndex, setIndex, 'weight', value)}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.setInput}
                      placeholder="Sec"
                      placeholderTextColor={colors.textSecondary}
                      value={set.rest > 0 ? set.rest.toString() : ''}
                      onChangeText={(value) => updateSet(exIndex, setIndex, 'rest', value)}
                      keyboardType="numeric"
                    />
                    {exercise.sets.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeSetButton}
                        onPress={() => removeSet(exIndex, setIndex)}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(exIndex)}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={styles.addSetButtonText}>Aggiungi Serie</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
          <Text style={styles.saveButtonText}>Salva Modifiche</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    color: colors.text,
  },
  exercisesSection: {
    marginBottom: 20,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseNotes: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  setLabel: {
    color: colors.text,
    fontSize: 14,
    width: 60,
  },
  setInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeSetButton: {
    padding: 4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    marginTop: 4,
  },
  addSetButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditWorkoutScreen;
