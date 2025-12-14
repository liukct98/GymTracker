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
import Storage from '../services/storage';
import SupabaseStorage from '../services/supabaseStorage';
import colors from '../utils/colors';

const NewWorkoutScreen = ({ navigation }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exercises, setExercises] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const exData = await Storage.getExercises();
    const tempData = await Storage.getTemplates();
    setAvailableExercises(exData);
    setTemplates(tempData);
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

    const newWorkout = {
      id: Date.now().toString(),
      name: workoutName,
      notes: workoutNotes,
      exercises: workoutExercises,
      createdAt: new Date().toISOString(),
    };

    const templates = await Storage.getTemplates();
    const updated = [newWorkout, ...templates];
    await Storage.saveTemplates(updated);

    Alert.alert('Successo', 'Template salvato!', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const loadTemplate = (templateId) => {
    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setWorkoutName(template.name);
    setWorkoutNotes(template.notes || '');
    setExercises(
      template.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
      }))
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
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

        {templates.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Carica Template</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue=""
                onValueChange={(value) => loadTemplate(value)}
                style={styles.picker}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Nessun template" value="" />
                {templates.map((t) => (
                  <Picker.Item key={t.id} label={t.name} value={t.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

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
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={styles.setInput}
                      placeholder="Sec"
                      placeholderTextColor={colors.textSecondary}
                      value={set.rest > 0 ? set.rest.toString() : ''}
                      onChangeText={(value) => updateSet(exIndex, setIndex, 'rest', value)}
                      keyboardType="numeric"
                    />
                    {setIndex > 0 && (
                      <TouchableOpacity
                        style={styles.removeSetButton}
                        onPress={() => removeSet(exIndex, setIndex)}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => addSet(exIndex)}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={styles.addSetButtonText}>Aggiungi Serie</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
          <Text style={styles.saveButtonText}>Salva Allenamento</Text>
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
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
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
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
  },
  exercisesSection: {
    marginTop: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NewWorkoutScreen;
