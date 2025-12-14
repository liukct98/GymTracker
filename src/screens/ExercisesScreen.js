import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../utils/colors';
import Storage from '../services/storage';
import SupabaseStorage from '../services/supabaseStorage';

const ExercisesScreen = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tutte');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'Petto',
    notes: '',
  });
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    'Tutte',
    'Petto',
    'Schiena',
    'Spalle',
    'Bicipiti',
    'Tricipiti',
    'Gambe',
    'Core',
  ];

  useFocusEffect(
    React.useCallback(() => {
      console.log('ExercisesScreen focused, loading exercises...');
      loadExercises();
    }, [])
  );

  const loadExercises = async () => {
    try {
      console.log('Loading exercises from storage...');
      const stored = await Storage.getExercises();
      console.log('Exercises loaded:', stored ? stored.length : 0);
      if (stored && stored.length > 0) {
        // Log unique categories
        const categories = [...new Set(stored.map(e => e.category))];
        console.log('[ExercisesScreen] Available categories:', categories);
        console.log('[ExercisesScreen] Sample exercises:', stored.slice(0, 3).map(e => ({ name: e.name, category: e.category })));
        
        setExercises(stored);
        filterExercises(stored, selectedCategory, searchQuery);
      } else {
        console.log('No exercises found in storage');
        setExercises([]);
        setFilteredExercises([]);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Errore', 'Impossibile caricare gli esercizi');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Syncing exercises from cloud...');
      await SupabaseStorage.syncExercises();
      await loadExercises();
    } catch (error) {
      console.error('Error syncing exercises:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterExercises = (allExercises, category, query) => {
    console.log('[ExercisesScreen] Filtering - total:', allExercises.length, 'category:', category, 'query:', query);
    let filtered = allExercises;

    if (category !== 'Tutte') {
      filtered = filtered.filter((ex) => ex.category.toLowerCase() === category.toLowerCase());
      console.log('[ExercisesScreen] After category filter:', filtered.length);
    }

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(lowerQuery) ||
          ex.notes?.toLowerCase().includes(lowerQuery)
      );
      console.log('[ExercisesScreen] After search filter:', filtered.length);
    }

    console.log('[ExercisesScreen] Final filtered exercises:', filtered.length);
    setFilteredExercises(filtered);
  };

  useEffect(() => {
    filterExercises(exercises, selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, exercises]);

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) {
      Alert.alert('Errore', 'Inserisci il nome dell\'esercizio');
      return;
    }

    try {
      const exercise = {
        id: Date.now().toString(),
        name: newExercise.name.trim(),
        category: newExercise.category,
        notes: newExercise.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = [...exercises, exercise];
      await Storage.saveExercises(updated);
      await SupabaseStorage.syncExercises();
      setExercises(updated);
      setShowAddModal(false);
      setNewExercise({ name: '', category: 'Petto', notes: '' });
      Alert.alert('Successo', 'Esercizio aggiunto con successo!');
    } catch (error) {
      console.error('Error adding exercise:', error);
      Alert.alert('Errore', 'Impossibile aggiungere l\'esercizio');
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler eliminare questo esercizio?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = exercises.filter((ex) => ex.id !== exerciseId);
              await Storage.saveExercises(updated);
              await SupabaseStorage.syncExercises();
              setExercises(updated);
              Alert.alert('Successo', 'Esercizio eliminato');
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Errore', 'Impossibile eliminare l\'esercizio');
            }
          },
        },
      ]
    );
  };

  const renderExercise = ({ item }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.exerciseMeta}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
          {item.notes ? (
            <Text style={styles.muscleGroup}>{item.notes}</Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteExercise(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderCategoryFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item && styles.categoryChipTextActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca esercizio..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        horizontal
        data={categories}
        renderItem={renderCategoryFilter}
        keyExtractor={(item) => item}
        style={styles.categoryList}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryListContent}
      />

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nessun esercizio trovato</Text>
            <Text style={styles.emptySubtext}>
              {exercises.length === 0
                ? 'Aggiungi il tuo primo esercizio!'
                : 'Prova con un altro filtro'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuovo Esercizio</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nome Esercizio</Text>
              <TextInput
                style={styles.input}
                placeholder="Es. Panca Piana"
                placeholderTextColor={colors.textSecondary}
                value={newExercise.name}
                onChangeText={(text) =>
                  setNewExercise({ ...newExercise, name: text })
                }
              />

              <Text style={styles.inputLabel}>Categoria</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryPickerScroll}
              >
                {categories.slice(1).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPickerChip,
                      newExercise.category === cat &&
                        styles.categoryPickerChipActive,
                    ]}
                    onPress={() =>
                      setNewExercise({ ...newExercise, category: cat })
                    }
                  >
                    <Text
                      style={[
                        styles.categoryPickerChipText,
                        newExercise.category === cat &&
                          styles.categoryPickerChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Note (Opzionale)</Text>
              <TextInput
                style={styles.input}
                placeholder="Es. Cavi, Manubri, Bilanciere..."
                placeholderTextColor={colors.textSecondary}
                value={newExercise.notes}
                onChangeText={(text) =>
                  setNewExercise({ ...newExercise, notes: text })
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddExercise}
              >
                <Text style={styles.addButtonText}>Aggiungi</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoryList: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryListContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  muscleGroup: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  categoryPickerScroll: {
    maxHeight: 50,
  },
  categoryPickerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  categoryPickerChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryPickerChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryPickerChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExercisesScreen;
