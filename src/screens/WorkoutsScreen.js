import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Storage from '../services/storage';
import SupabaseStorage from '../services/supabaseStorage';
import SharingService from '../services/sharingService';
import { useAuth } from '../context/AuthContext';
import colors from '../utils/colors';
import { calculateVolume, getWeekWorkouts } from '../utils/stats';

const WorkoutsScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    loadWorkouts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const loadWorkouts = async () => {
    console.log('Loading templates...');
    const data = await Storage.getTemplates();
    console.log('Templates loaded:', data?.length || 0);
    setWorkouts(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await SupabaseStorage.fullSync();
    await loadWorkouts();
    setRefreshing(false);
  };

  const deleteWorkout = async (id) => {
    Alert.alert(
      'Elimina Template',
      'Sei sicuro di voler eliminare questo template di allenamento?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            // Elimina dal local storage
            const updated = workouts.filter((w) => w.id !== id);
            await Storage.saveTemplates(updated);
            setWorkouts(updated);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Esci', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: logout },
    ]);
  };

  const handleImport = async () => {
    if (!shareCode.trim()) {
      Alert.alert('Errore', 'Inserisci un codice di condivisione');
      return;
    }

    const result = await SharingService.importWorkout(shareCode.trim());
    
    if (result.success) {
      setImportModalVisible(false);
      setShareCode('');
      Alert.alert(
        'Successo!',
        'Allenamento importato con successo!',
        [
          {
            text: 'OK',
            onPress: () => loadWorkouts(),
          },
        ]
      );
    } else {
      Alert.alert('Errore', result.error || 'Codice non valido');
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getString();
    if (text) {
      setShareCode(text.trim());
    }
  };

  const renderWorkout = ({ item }) => {
    const volume = calculateVolume(item.exercises);

    return (
      <TouchableOpacity
        style={styles.workoutCard}
        onPress={() => navigation.navigate('WorkoutDetail', { workout: item })}
      >
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{item.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteWorkout(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Esercizi</Text>
            <Text style={styles.statValue}>{item.exercises.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{volume} kg</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>
            <Text style={styles.greetingName}>Ciao {user?.username || user?.email?.split('@')[0]}</Text>
          </Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsBar}>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Template</Text>
            <Text style={styles.statCardValue}>{workouts.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('NewWorkout')}
        >
          <Ionicons name="add-circle" size={20} color={colors.white} />
          <Text style={styles.primaryButtonText}>Nuovo Allenamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setImportModalVisible(true)}
        >
          <Ionicons name="download" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Ionicons name="calendar" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        renderItem={renderWorkout}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nessun allenamento registrato
            </Text>
            <Text style={styles.emptySubtext}>
              Premi "Nuovo Allenamento" per iniziare
            </Text>
          </View>
        }
      />

      <Modal
        visible={importModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Importa Allenamento</Text>
            <Text style={styles.modalDescription}>
              Inserisci il codice di condivisione ricevuto da un amico
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Codice"
                placeholderTextColor={colors.textSecondary}
                value={shareCode}
                onChangeText={setShareCode}
              />
              <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
                <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setImportModalVisible(false);
                  setShareCode('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleImport}
              >
                <Text style={styles.modalButtonPrimaryText}>Importa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 60,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  greeting: {
    color: colors.white,
    fontSize: 24,
    textAlign: 'center',
    flex: 1,
  },
  greetingName: {
    fontWeight: 'bold',
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statCardLabel: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  statCardValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workoutDate: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  deleteButton: {
    padding: 4,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  pasteButton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutsScreen;
