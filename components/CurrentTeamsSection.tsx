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
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { createTeam, PastTeam, searchTeams, Team } from '../utils/playerStorage';
import DraggableTeamItem from './DraggableTeamItem';

interface CurrentTeamsSectionProps {
  currentTeams?: PastTeam[];
  isEditing?: boolean;
  onCurrentTeamsChange?: (currentTeams: PastTeam[]) => void;
  onMoveToPastTeams?: (team: PastTeam) => void;
  readOnly?: boolean;
}

export default function CurrentTeamsSection({ 
  currentTeams = [], 
  isEditing = false,
  onCurrentTeamsChange,
  readOnly = false
}: CurrentTeamsSectionProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<PastTeam | null>(null);
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    teamCountry: '',
    teamCity: '',
    startYear: '',
    endYear: '',
    isCurrent: true
  });

  // Состояние для автодополнения команд
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedExistingTeam, setSelectedExistingTeam] = useState<Team | null>(null);

  // Поиск команд при изменении поискового запроса
  useEffect(() => {
    const searchTeamsAsync = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      setShowSuggestions(true);
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

  // Выбор команды из автодополнения
  const selectTeam = (team: Team) => {
    if (editingTeam) {
      setEditingTeam({ 
        ...editingTeam, 
        teamName: team.name,
        teamCountry: team.country || '',
        teamCity: team.city || ''
      });
    } else {
      setNewTeam({ 
        ...newTeam, 
        teamName: team.name,
        teamCountry: team.country || '',
        teamCity: team.city || ''
      });
      // Сохраняем выбранную команду
      setSelectedExistingTeam(team);
    }
    setSearchTerm('');
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const handleAddTeam = async () => {
    if (!newTeam.teamName.trim()) {
      Alert.alert('Ошибка', 'Введите название команды');
      return;
    }

    const startYear = parseInt(newTeam.startYear);
    if (isNaN(startYear) || startYear < 1900 || startYear > new Date().getFullYear()) {
      Alert.alert('Ошибка', 'Введите корректный год начала');
      return;
    }

    let endYear: number | undefined;
    if (newTeam.endYear.trim()) {
      endYear = parseInt(newTeam.endYear);
      if (isNaN(endYear) || endYear < startYear || endYear > new Date().getFullYear()) {
        Alert.alert('Ошибка', 'Введите корректный год окончания');
        return;
      }
    }

    // Проверяем, была ли выбрана существующая команда
    let teamId: string;
    
    if (selectedExistingTeam && selectedExistingTeam.name.toLowerCase() === newTeam.teamName.trim().toLowerCase()) {
      // Используем выбранную существующую команду
      teamId = selectedExistingTeam.id;
      console.log('✅ Используем выбранную существующую команду:', selectedExistingTeam.name);
    } else {
      // Проверяем, есть ли команда в результатах поиска
      const existingTeam = searchResults.find(team => 
        team.name.toLowerCase() === newTeam.teamName.trim().toLowerCase()
      );

      if (existingTeam) {
        // Используем существующую команду из результатов поиска
        teamId = existingTeam.id;
        console.log('✅ Используем существующую команду из поиска:', existingTeam.name);
      } else {
        // Создаем новую команду в базе данных
        console.log('🆕 Создаем новую команду в базе данных:', newTeam.teamName.trim());
        console.log('🆕 Данные для создания команды:', {
          name: newTeam.teamName.trim(),
          type: 'club',
          country: newTeam.teamCountry.trim() || 'Беларусь',
          city: newTeam.teamCity.trim() || undefined
        });
        
        const createdTeam = await createTeam({
          name: newTeam.teamName.trim(),
          type: 'club', // По умолчанию тип "клуб"
          country: newTeam.teamCountry.trim() || 'Беларусь',
          city: newTeam.teamCity.trim() || undefined
        });

        if (createdTeam) {
          teamId = createdTeam.id;
          console.log('✅ Команда успешно создана в базе данных:', createdTeam.name, 'с ID:', createdTeam.id);
        } else {
          console.error('❌ Не удалось создать команду в базе данных для:', newTeam.teamName.trim());
          Alert.alert('Ошибка', 'Не удалось создать команду в базе данных');
          return;
        }
      }
    }

    const currentTeam: PastTeam = {
      id: teamId, // Используем ID из базы данных
      teamName: newTeam.teamName.trim(),
      teamCountry: newTeam.teamCountry.trim() || undefined,
      teamCity: newTeam.teamCity.trim() || undefined,
      startYear: startYear,
      endYear: undefined, // Для текущих команд год окончания всегда undefined
      isCurrent: true // Все команды в CurrentTeamsSection - текущие
    };

    // Добавляем команду в текущие команды
    const updatedTeams = [...currentTeams, currentTeam];
    onCurrentTeamsChange?.(updatedTeams);
    
    setNewTeam({
      teamName: '',
      teamCountry: '',
      teamCity: '',
      startYear: '',
      endYear: '',
      isCurrent: true // Всегда true для CurrentTeamsSection
    });
    setSelectedExistingTeam(null);
    setModalVisible(false);
  };

  const handleEditTeam = async () => {
    if (!editingTeam) return;

    if (!editingTeam.teamName.trim()) {
      Alert.alert('Ошибка', 'Введите название команды');
      return;
    }

    if (editingTeam.startYear < 1900 || editingTeam.startYear > new Date().getFullYear()) {
      Alert.alert('Ошибка', 'Введите корректный год начала');
      return;
    }

    if (editingTeam.endYear && (editingTeam.endYear < editingTeam.startYear || editingTeam.endYear > new Date().getFullYear())) {
      Alert.alert('Ошибка', 'Введите корректный год окончания');
      return;
    }

    // Проверяем, была ли выбрана существующая команда
    let teamId: string;
    
    if (selectedExistingTeam && selectedExistingTeam.name.toLowerCase() === editingTeam.teamName.trim().toLowerCase()) {
      // Используем выбранную существующую команду
      teamId = selectedExistingTeam.id;
      console.log('✅ Используем выбранную существующую команду при редактировании:', selectedExistingTeam.name);
    } else {
      // Проверяем, есть ли команда в результатах поиска
      const existingTeam = searchResults.find(team => 
        team.name.toLowerCase() === editingTeam.teamName.trim().toLowerCase()
      );

      if (existingTeam) {
        teamId = existingTeam.id;
        console.log('✅ Используем существующую команду из поиска при редактировании:', existingTeam.name);
      } else {
        const createdTeam = await createTeam({
          name: editingTeam.teamName.trim(),
          type: 'club',
          country: editingTeam.teamCountry.trim() || 'Беларусь',
          city: editingTeam.teamCity.trim() || undefined
        });

        if (createdTeam) {
          teamId = createdTeam.id;
          console.log('✅ Команда успешно создана в базе данных при редактировании:', createdTeam.name);
        } else {
          Alert.alert('Ошибка', 'Не удалось создать команду в базе данных');
          return;
        }
      }
    }

    // Обновляем команду в текущих командах (всегда остается текущей)
    const updatedTeam = { 
      ...editingTeam, 
      id: teamId, 
      teamName: editingTeam.teamName.trim(),
      endYear: undefined, // Для текущих команд год окончания всегда undefined
      isCurrent: true // Всегда true для CurrentTeamsSection
    };
    
    const updatedTeams = currentTeams.map(team => 
      team.id === editingTeam.id ? updatedTeam : team
    );
    onCurrentTeamsChange?.(updatedTeams);
    
    setEditingTeam(null);
    setSelectedExistingTeam(null);
    setModalVisible(false);
  };

  const handleDeleteTeam = (id: string) => {
    Alert.alert(
      'Удаление команды',
      'Вы уверены, что хотите удалить эту команду?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            const updatedTeams = currentTeams.filter(team => team.id !== id);
            onCurrentTeamsChange?.(updatedTeams);
          }
        }
      ]
    );
  };

  const openEditModal = (team: PastTeam) => {
    setEditingTeam(team);
    setSelectedExistingTeam(null);
    setModalVisible(true);
  };

  const handleDragEnd = ({ data }: { data: PastTeam[] }) => {
    console.log('🔄 Порядок текущих команд изменен:', data);
    onCurrentTeamsChange?.(data);
  };

  const renderCurrentTeamItem = ({ item, drag, isActive }: RenderItemParams<PastTeam>) => {
    return (
      <DraggableTeamItem
        team={item}
        onRemove={readOnly ? undefined : () => handleDeleteTeam(item.id)}
        onEdit={readOnly ? undefined : () => openEditModal(item)}
        drag={readOnly ? undefined : drag}
        isActive={isActive}
        readOnly={readOnly}
      />
    );
  };

  const getPeriodText = (team: PastTeam) => {
    // Для текущих команд всегда показываем "настоящее время"
    return `(${team.startYear} - настоящее время)`;
  };

  return (
    <View style={styles.container}>
      {currentTeams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>Нет текущих команд</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={currentTeams}
          renderItem={renderCurrentTeamItem}
          keyExtractor={(item) => item.id}
          onDragEnd={readOnly ? undefined : handleDragEnd}
          contentContainerStyle={styles.teamsList}
        />
      )}

      {isEditing && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setModalVisible(true);
            setSelectedExistingTeam(null);
          }}
        >
          <Ionicons name="add-circle" size={24} color="#FF4444" />
          <Text style={styles.addButtonText}>Добавить команду</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTeam ? 'Редактировать команду' : 'Добавить команду'}
            </Text>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Поиск команды..."
                placeholderTextColor="#888"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {isSearching ? (
                    <Text style={styles.suggestionText}>Поиск...</Text>
                  ) : searchResults.length > 0 ? (
                    <ScrollView style={styles.suggestionsList}>
                      {searchResults.map((team) => (
                        <TouchableOpacity
                          key={team.id}
                          style={styles.suggestionItem}
                          onPress={() => selectTeam(team)}
                        >
                          <Text style={styles.suggestionText}>{team.name}</Text>
                          {(team.city || team.country) && (
                            <Text style={styles.suggestionSubtext}>
                              {[team.city, team.country].filter(Boolean).join(', ')}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : searchTerm.trim().length >= 2 ? (
                    <Text style={styles.suggestionText}>Команды не найдены</Text>
                  ) : null}
                </View>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Название команды *"
              placeholderTextColor="#888"
              value={editingTeam?.teamName || newTeam.teamName}
              onChangeText={(text) => {
                if (editingTeam) {
                  setEditingTeam({ ...editingTeam, teamName: text });
                } else {
                  setNewTeam({ ...newTeam, teamName: text });
                }
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Страна (необязательно)"
              placeholderTextColor="#888"
              value={editingTeam?.teamCountry || newTeam.teamCountry}
              onChangeText={(text) => {
                if (editingTeam) {
                  setEditingTeam({ ...editingTeam, teamCountry: text });
                } else {
                  setNewTeam({ ...newTeam, teamCountry: text });
                }
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Город (необязательно)"
              placeholderTextColor="#888"
              value={editingTeam?.teamCity || newTeam.teamCity}
              onChangeText={(text) => {
                if (editingTeam) {
                  setEditingTeam({ ...editingTeam, teamCity: text });
                } else {
                  setNewTeam({ ...newTeam, teamCity: text });
                }
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Год начала *"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={editingTeam?.startYear?.toString() || newTeam.startYear}
              onChangeText={(text) => {
                if (editingTeam) {
                  setEditingTeam({ ...editingTeam, startYear: parseInt(text) || 0 });
                } else {
                  setNewTeam({ ...newTeam, startYear: text });
                }
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Год окончания (необязательно)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={editingTeam?.endYear?.toString() || newTeam.endYear}
              onChangeText={(text) => {
                if (editingTeam) {
                  setEditingTeam({ ...editingTeam, endYear: text ? parseInt(text) : undefined });
                } else {
                  setNewTeam({ ...newTeam, endYear: text });
                }
              }}
            />



            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingTeam(null);
                  setNewTeam({
                    teamName: '',
                    teamCountry: '',
                    teamCity: '',
                    startYear: '',
                    endYear: '',
                    isCurrent: true
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={editingTeam ? handleEditTeam : handleAddTeam}
              >
                <Text style={styles.saveButtonText}>
                  {editingTeam ? 'Сохранить' : 'Добавить'}
                </Text>
              </TouchableOpacity>
            </View>
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#666',
    marginTop: 10,
  },
  teamsList: {
    paddingBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  suggestionSubtext: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
    marginTop: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
}); 