import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import Storage from '../services/storage';
import colors from '../utils/colors';
import { calculateVolume, getWeekWorkouts, getMonthWorkouts } from '../utils/stats';

const StatsScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const calendarData = await Storage.getCalendar();
    const exercisesData = await Storage.getExercises();
    
    console.log('[StatsScreen] Calendar workouts loaded:', calendarData.length);
    
    setWorkouts(calendarData);
    setExercises(exercisesData);
    
    // Seleziona il primo esercizio per default
    if (exercisesData.length > 0 && !selectedExercise) {
      setSelectedExercise(exercisesData[0].name);
    }
  };

  const totalVolume = workouts.reduce((sum, w) => sum + calculateVolume(w.exercises), 0);
  const weekWorkouts = getWeekWorkouts(workouts);
  const now = new Date();
  const monthWorkouts = getMonthWorkouts(workouts, now.getFullYear(), now.getMonth());

  // Volume per categoria
  const volumeByCategory = {};
  workouts.forEach((workout) => {
    workout.exercises.forEach((ex) => {
      const exercise = exercises.find((e) => e.id === ex.exerciseId);
      if (exercise) {
        const category = exercise.category;
        const volume = calculateVolume([ex]);
        volumeByCategory[category] = (volumeByCategory[category] || 0) + volume;
      }
    });
  });

  const sortedCategories = Object.entries(volumeByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Esercizi più frequenti
  const exerciseFrequency = {};
  workouts.forEach((workout) => {
    workout.exercises.forEach((ex) => {
      exerciseFrequency[ex.exerciseName] = (exerciseFrequency[ex.exerciseName] || 0) + 1;
    });
  });

  const topExercises = Object.entries(exerciseFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Dati progressi per esercizio selezionato
  const getProgressData = () => {
    if (!selectedExercise) return null;

    const exerciseWorkouts = [];
    workouts.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        if (ex.exerciseName === selectedExercise) {
          exerciseWorkouts.push({
            date: new Date(workout.date),
            exercise: ex,
          });
        }
      });
    });

    // Ordina per data
    exerciseWorkouts.sort((a, b) => a.date - b.date);

    if (exerciseWorkouts.length < 2) return null;

    // Prendi gli ultimi 10 allenamenti
    const recent = exerciseWorkouts.slice(-10);

    const labels = recent.map((w) => {
      const date = w.date;
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const maxWeights = recent.map((w) => {
      const sets = w.exercise.sets || [];
      if (sets.length === 0) return 0;
      return Math.max(...sets.map((s) => parseFloat(s.weight) || 0));
    });

    const volumes = recent.map((w) => {
      return calculateVolume([w.exercise]);
    });

    return {
      labels,
      maxWeights,
      volumes,
    };
  };

  const progressData = getProgressData();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Panoramica</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{workouts.length}</Text>
            <Text style={styles.statLabel}>Allenamenti Totali</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weekWorkouts}</Text>
            <Text style={styles.statLabel}>Questa Settimana</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{monthWorkouts}</Text>
            <Text style={styles.statLabel}>Questo Mese</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalVolume.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Volume Totale (kg)</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Volume per Categoria</Text>
        {sortedCategories.length > 0 ? (
          sortedCategories.map(([category, volume]) => {
            const maxVolume = sortedCategories[0][1];
            const percentage = (volume / maxVolume) * 100;
            return (
              <View key={category} style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barLabel}>{category}</Text>
                  <Text style={styles.barValue}>{volume.toLocaleString()} kg</Text>
                </View>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Nessun dato disponibile</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Esercizi Più Frequenti</Text>
        {topExercises.length > 0 ? (
          topExercises.map(([exercise, count], index) => (
            <View key={exercise} style={styles.listItem}>
              <View style={styles.listIndex}>
                <Text style={styles.listIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.listItemText}>{exercise}</Text>
              <Text style={styles.listItemValue}>{count}x</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nessun dato disponibile</Text>
        )}
      </View>

      {exercises.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progressi Esercizio</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedExercise}
              onValueChange={(value) => setSelectedExercise(value)}
              style={styles.picker}
              dropdownIconColor={colors.text}
            >
              {exercises.map((ex) => (
                <Picker.Item key={ex.id} label={ex.name} value={ex.name} />
              ))}
            </Picker>
          </View>

          {progressData ? (
            <>
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Carico Massimo (kg)</Text>
                <LineChart
                  data={{
                    labels: progressData.labels,
                    datasets: [
                      {
                        data: progressData.maxWeights,
                      },
                    ],
                  }}
                  width={Dimensions.get('window').width - 32}
                  height={220}
                  yAxisSuffix=" kg"
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: colors.primary,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>

              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Volume Totale (kg)</Text>
                <LineChart
                  data={{
                    labels: progressData.labels,
                    datasets: [
                      {
                        data: progressData.volumes,
                      },
                    ],
                  }}
                  width={Dimensions.get('window').width - 32}
                  height={220}
                  yAxisSuffix=" kg"
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#10b981',
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>
              Servono almeno 2 allenamenti con questo esercizio per mostrare i progressi
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    width: (Dimensions.get('window').width - 44) / 2,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  barItem: {
    marginBottom: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  barValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  barBackground: {
    backgroundColor: colors.surfaceLight,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: colors.primary,
    height: '100%',
    borderRadius: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  listIndex: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listIndexText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  listItemText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  listItemValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
    backgroundColor: colors.surface,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default StatsScreen;
