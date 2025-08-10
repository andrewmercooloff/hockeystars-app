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
import DraggablePastTeamItem from './DraggablePastTeamItem';

interface PastTeamsSectionProps {
  pastTeams?: PastTeam[];
  isEditing?: boolean;
  onPastTeamsChange?: (pastTeams: PastTeam[]) => void;
  onMoveToCurrentTeams?: (team: PastTeam) => void;
  readOnly?: boolean;
}

export default function PastTeamsSection({ 
  pastTeams = [], 
  isEditing = false,
  onPastTeamsChange,
  onMoveToCurrentTeams,
  readOnly = false
}: PastTeamsSectionProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<PastTeam | null>(null);
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    teamCountry: '',
    teamCity: '',
    startYear: '',
    endYear: '',
    isCurrent: false
  });

  // Состояние для автодополнения команд
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

    // Проверяем, есть ли команда в результатах поиска
    const existingTeam = searchResults.find(team => 
      team.name.toLowerCase() === newTeam.teamName.trim().toLowerCase()
    );

    let teamId: string;
    
    if (existingTeam) {
      // Используем существующую команду
      teamId = existingTeam.id;
      
    } else {
      // Создаем новую команду в базе данных
      
      const createdTeam = await createTeam({
        name: newTeam.teamName.trim(),
        type: 'club', // По умолчанию тип "клуб"
        country: newTeam.teamCountry.trim() || 'Беларусь',
        city: newTeam.teamCity.trim() || undefined
      });

      if (createdTeam) {
        teamId = createdTeam.id;

      } else {
        Alert.alert('Ошибка', 'Не удалось создать команду в базе данных');
        return;
      }
    }

    const pastTeam: PastTeam = {
      id: teamId, // Используем ID из базы данных
      teamName: newTeam.teamName.trim(),
      teamCountry: newTeam.teamCountry.trim() || undefined,
      teamCity: newTeam.teamCity.trim() || undefined,
      startYear: startYear,
      endYear: endYear || undefined, // Для прошлых команд год окончания может быть undefined
      isCurrent: false // Все команды в PastTeamsSection - прошлые
    };

    // Добавляем команду в прошлые команды
    const updatedTeams = [...pastTeams, pastTeam];
    onPastTeamsChange?.(updatedTeams);
    
    setNewTeam({
      teamName: '',
      teamCountry: '',
      teamCity: '',
      startYear: '',
      endYear: '',
      isCurrent: false // Всегда false для PastTeamsSection
    });
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

    // Проверяем, есть ли команда в результатах поиска
    const existingTeam = searchResults.find(team => 
      team.name.toLowerCase() === editingTeam.teamName.trim().toLowerCase()
    );

    let teamId: string;
    if (existingTeam) {
      teamId = existingTeam.id;
      
    } else {
      // Создаем новую команду в базе данных
      
      const createdTeam = await createTeam({
        name: editingTeam.teamName.trim(),
        type: 'club', // По умолчанию тип "клуб"
        country: editingTeam.teamCountry || 'Беларусь',
        city: editingTeam.teamCity || undefined
      });

      if (!createdTeam) {
        Alert.alert('Ошибка', 'Не удалось создать команду в базе данных');
        return;
      }
      
      teamId = createdTeam.id;

    }

    // Обновляем команду с правильным ID (всегда остается прошлой)
    const updatedTeam = { 
      ...editingTeam, 
      id: teamId, 
      teamName: editingTeam.teamName.trim(),
      isCurrent: false // Всегда false для PastTeamsSection
    };

    // Обновляем команду в прошлых командах
    const updatedTeams = pastTeams.map(team =>
      team.id === editingTeam.id ? updatedTeam : team
    );
    onPastTeamsChange?.(updatedTeams);
    
    setEditingTeam(null);
    setModalVisible(false);
  };

  const handleDeleteTeam = (id: string) => {
    Alert.alert(
      'Удаление команды',
      'Вы уверены, что хотите удалить эту команду из истории?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            const updatedTeams = pastTeams.filter(team => team.id !== id);
            onPastTeamsChange?.(updatedTeams);
          }
        }
      ]
    );
  };

  const openEditModal = (team: PastTeam) => {
    setEditingTeam(team);
    setModalVisible(true);
  };

  // Обработка изменения порядка прошлых команд
  const handleDragEnd = ({ data }: { data: PastTeam[] }) => {

    onPastTeamsChange?.(data);
  };

  // Рендер элемента прошлой команды
  const renderPastTeamItem = ({ item, drag, isActive }: RenderItemParams<PastTeam>) => {
    return (
      <DraggablePastTeamItem
        team={item}
        onEdit={openEditModal}
        onDelete={handleDeleteTeam}
        drag={readOnly ? undefined : drag}
        isActive={isActive}
        isEditing={isEditing}
      />
    );
  };

  const getPeriodText = (team: PastTeam) => {
    if (team.isCurrent) {
      return `${team.startYear} - настоящее время`;
    }
    if (team.endYear) {
      return `${team.startYear} - ${team.endYear}`;
    }
    return `${team.startYear}`;
  };

     // Проверяем, есть ли команды, которые не являются текущими
   const hasPastTeams = pastTeams.some(team => !team.isCurrent);
   
   if (pastTeams.length === 0 && !isEditing) {
     return null;
   }

  return (
    <View style={styles.pastTeamsContainer}>
      
             {!hasPastTeams ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>Нет прошлых команд</Text>
        </View>
             ) : (
         <DraggableFlatList
           data={pastTeams.filter(team => !team.isCurrent)}
           renderItem={renderPastTeamItem}
           keyExtractor={(item) => item.id}
           onDragEnd={readOnly ? undefined : handleDragEnd}
           contentContainerStyle={styles.teamsList}
         />
      )}

      {isEditing && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
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
              placeholder="Год начала * (например: 2020)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={editingTeam ? String(editingTeam.startYear) : newTeam.startYear}
              onChangeText={(text) => {
                if (editingTeam) {
                  const year = parseInt(text) || 0;
                  setEditingTeam({ ...editingTeam, startYear: year });
                } else {
                  setNewTeam({ ...newTeam, startYear: text });
                }
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Год окончания (необязательно, например: 2023)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={editingTeam ? (editingTeam.endYear ? String(editingTeam.endYear) : '') : newTeam.endYear}
              onChangeText={(text) => {
                if (editingTeam) {
                  const year = text ? parseInt(text) : undefined;
                  setEditingTeam({ ...editingTeam, endYear: year });
                } else {
                  setNewTeam({ ...newTeam, endYear: text });
                }
              }}
            />



            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setEditingTeam(null);
                  setNewTeam({
                    teamName: '',
                    teamCountry: '',
                    teamCity: '',
                    startYear: '',
                    endYear: '',
                    isCurrent: false
                  });
                  setSearchTerm('');
                  setSearchResults([]);
                  setShowSuggestions(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
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
  pastTeamsContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    marginTop: 10,
  },
  teamsList: {
    maxHeight: 300,
  },
  teamItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  teamDetails: {
    marginLeft: 30,
  },
  teamPeriod: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginBottom: 2,
  },
  teamLocation: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
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
    color: '#ccc',
    marginTop: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
  checkboxText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
}); 