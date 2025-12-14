import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Storage from '../services/storage';
import { SupabaseStorage } from '../services/supabaseStorage';
import colors from '../utils/colors';
import { getWorkoutsByDate } from '../utils/stats';

const CalendarScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useFocusEffect(
    React.useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const loadWorkouts = async () => {
    // Carica prima da Supabase, poi da local storage
    await SupabaseStorage.loadCalendar();
    const data = await Storage.getCalendar();
    console.log('[CalendarScreen] Loaded calendar workouts:', data.length);
    console.log('[CalendarScreen] Calendar data:', JSON.stringify(data, null, 2));
    setWorkouts(data);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const getWorkoutsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayWorkouts = getWorkoutsByDate(workouts, dateStr);
    if (dayWorkouts.length > 0) {
      console.log(`[CalendarScreen] Day ${day}: Found ${dayWorkouts.length} workouts for date ${dateStr}`);
    }
    return dayWorkouts;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.dayNamesRow}>
        {dayNames.map((name) => (
          <Text key={name} style={styles.dayName}>
            {name}
          </Text>
        ))}
      </View>

      <ScrollView style={styles.calendarContainer}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.calendarDay} />;
            }

            const dayWorkouts = getWorkoutsForDay(day);
            const hasWorkouts = dayWorkouts.length > 0;
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.calendarDay,
                  isToday && styles.calendarDayToday,
                  hasWorkouts && styles.calendarDayWithWorkout,
                ]}
                onPress={() => {
                  if (hasWorkouts) {
                    // Navigate to workout detail if only one workout
                    if (dayWorkouts.length === 1) {
                      navigation.navigate('WorkoutDetail', {
                        workout: dayWorkouts[0],
                      });
                    }
                  }
                }}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    isToday && styles.calendarDayTextToday,
                    hasWorkouts && styles.calendarDayTextWithWorkout,
                  ]}
                >
                  {day}
                </Text>
                {hasWorkouts && (
                  <View style={styles.workoutIndicator}>
                    <Text style={styles.workoutCount}>{dayWorkouts.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Oggi</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Allenamenti</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 16,
  },
  navButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  dayNamesRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 12,
  },
  dayName: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarContainer: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  calendarDayToday: {
    backgroundColor: colors.primary,
  },
  calendarDayWithWorkout: {
    backgroundColor: colors.success,
  },
  calendarDayText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: colors.white,
    fontWeight: 'bold',
  },
  calendarDayTextWithWorkout: {
    color: colors.white,
    fontWeight: 'bold',
  },
  workoutIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCount: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    padding: 16,
    backgroundColor: colors.surface,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: colors.text,
    fontSize: 14,
  },
});

export default CalendarScreen;
