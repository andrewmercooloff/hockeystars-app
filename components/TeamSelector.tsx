import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { createTeam, searchTeams, Team } from '../utils/playerStorage';

interface TeamSelectorProps {
  selectedTeams: Team[];
  onTeamsChange: (teams: Team[]) => void;
  placeholder?: string;
}

export default function TeamSelector({ selectedTeams, onTeamsChange, placeholder = "Выберите команды" }: TeamSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Поиск команд при изменении поискового запроса
  useEffect(() => {
    const searchTeamsAsync = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchTeams(searchTerm.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Ошибка поиска команд:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchTeamsAsync, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Добавление команды
  const addTeam = (team: Team) => {
    console.log('➕ addTeam вызвана с командой:', team);
    const isAlreadySelected = selectedTeams.some(t => t.id === team.id);
    console.log('Уже выбрана:', isAlreadySelected);
    
    if (!isAlreadySelected) {
      const newTeams = [...selectedTeams, team];
      console.log('Новый список команд:', newTeams);
      onTeamsChange(newTeams);
    } else {
      console.log('Команда уже выбрана, пропускаем');
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  // Удаление команды
  const removeTeam = (teamId: string) => {
    console.log('🗑️ removeTeam вызвана с teamId:', teamId);
    const newTeams = selectedTeams.filter(t => t.id !== teamId);
    console.log('Новый список команд после удаления:', newTeams);
    onTeamsChange(newTeams);
  };

  // Создание новой команды
  const createNewTeam = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Ошибка', 'Введите название команды');
      return;
    }

    try {
      const newTeam = await createTeam({
        name: searchTerm.trim(),
        type: 'club',
        country: 'Беларусь'
      });

      if (newTeam) {
        addTeam(newTeam);
        setShowModal(false);
      } else {
        Alert.alert('Ошибка', 'Не удалось создать команду');
      }
    } catch (error) {
      console.error('Ошибка создания команды:', error);
      Alert.alert('Ошибка', 'Не удалось создать команду');
    }
  };

  // Отображение типа команды
  const getTeamTypeLabel = (type: string) => {
    switch (type) {
      case 'club': return 'Клуб';
      case 'national': return 'Сборная';
      case 'regional': return 'Региональная';
      case 'school': return 'Школа';
      default: return type;
    }
  };

  return (
    <View style={styles.container}>
      {/* Выбранные команды */}
      <View style={styles.selectedTeamsContainer}>
        {selectedTeams.map((team) => (
          <View key={team.id} style={styles.selectedTeam}>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamType}>{getTeamTypeLabel(team.type)}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeTeam(team.id)}
            >
              <Ionicons name="close-circle" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Кнопка добавления команды */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add-circle" size={24} color="#FF4444" />
        <Text style={styles.addButtonText}>Добавить команду</Text>
      </TouchableOpacity>

      {/* Модальное окно выбора команды */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите команду</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Поиск */}
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Начните вводить название команды..."
              placeholderTextColor="#888"
            />

            {/* Результаты поиска */}
            <ScrollView style={styles.searchResults}>
              {isSearching ? (
                <Text style={styles.loadingText}>Поиск...</Text>
              ) : searchResults.length > 0 ? (
                searchResults.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={styles.searchResult}
                    onPress={() => addTeam(team)}
                  >
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{team.name}</Text>
                      <Text style={styles.resultType}>{getTeamTypeLabel(team.type)}</Text>
                      {team.city && (
                        <Text style={styles.resultCity}>{team.city}</Text>
                      )}
                    </View>
                    <Ionicons name="add" size={20} color="#FF4444" />
                  </TouchableOpacity>
                ))
              ) : searchTerm.length >= 2 ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>Команда не найдена</Text>
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={createNewTeam}
                  >
                    <Ionicons name="add-circle" size={20} color="#FF4444" />
                    <Text style={styles.createButtonText}>
                      Создать "{searchTerm}"
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : searchTerm.length > 0 ? (
                <Text style={styles.hintText}>
                  Введите минимум 2 символа для поиска
                </Text>
              ) : (
                <Text style={styles.hintText}>
                  Начните вводить название команды
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectedTeamsContainer: {
    marginBottom: 15,
  },
  selectedTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  teamType: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#FF4444',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginBottom: 15,
  },
  searchResults: {
    flex: 1,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  resultType: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
  },
  resultCity: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    padding: 20,
  },
  noResults: {
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    marginBottom: 15,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#FF4444',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
}); 