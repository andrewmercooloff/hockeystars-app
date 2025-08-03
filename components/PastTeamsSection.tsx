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
import { PastTeam, searchTeams, Team } from '../utils/playerStorage';

interface PastTeamsSectionProps {
  pastTeams?: PastTeam[];
  isEditing?: boolean;
  onPastTeamsChange?: (pastTeams: PastTeam[]) => void;
  onCurrentTeamChange?: (teamName: string, isCurrent: boolean) => void;
}

export default function PastTeamsSection({ 
  pastTeams = [], 
  isEditing = false,
  onPastTeamsChange,
  onCurrentTeamChange
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

  const handleAddTeam = () => {
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

    const pastTeam: PastTeam = {
      id: Date.now().toString(),
      teamName: newTeam.teamName.trim(),
      teamCountry: newTeam.teamCountry.trim() || undefined,
      teamCity: newTeam.teamCity.trim() || undefined,
      startYear: startYear,
      endYear: endYear,
      isCurrent: newTeam.isCurrent
    };

    const updatedTeams = [...pastTeams, pastTeam];
    onPastTeamsChange?.(updatedTeams);
    
    // Если команда отмечена как текущая, добавляем её в текущие команды
    if (newTeam.isCurrent) {
      console.log('⭐ Команда отмечена как текущая, вызываем callback:', pastTeam.teamName);
      onCurrentTeamChange?.(pastTeam.teamName, true);
    }
    
    setNewTeam({
      teamName: '',
      teamCountry: '',
      teamCity: '',
      startYear: '',
      endYear: '',
      isCurrent: false
    });
    setModalVisible(false);
  };

  const handleEditTeam = () => {
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

    const updatedTeams = pastTeams.map(team =>
      team.id === editingTeam.id ? editingTeam : team
    );
    
    onPastTeamsChange?.(updatedTeams);
    
    // Если команда отмечена как текущая, добавляем её в текущие команды
    if (editingTeam.isCurrent) {
      console.log('⭐ Команда отмечена как текущая (редактирование), вызываем callback:', editingTeam.teamName);
      onCurrentTeamChange?.(editingTeam.teamName, true);
    }
    
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Прошлые команды</Text>
      
             {!hasPastTeams ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>Нет прошлых команд</Text>
        </View>
             ) : (
         <ScrollView style={styles.teamsList}>
           {pastTeams.filter(team => !team.isCurrent).map((team) => (
            <View key={team.id} style={styles.teamItem}>
              <View style={styles.teamHeader}>
                                 <Ionicons 
                   name="time" 
                   size={20} 
                   color="#ccc" 
                 />
                <Text style={styles.teamName}>{team.teamName}</Text>
                {isEditing && (
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(team)}
                    >
                      <Ionicons name="create" size={16} color="#FF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTeam(team.id)}
                    >
                      <Ionicons name="trash" size={16} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.teamDetails}>
                <Text style={styles.teamPeriod}>{getPeriodText(team)}</Text>
                {(team.teamCity || team.teamCountry) && (
                  <Text style={styles.teamLocation}>
                    {[team.teamCity, team.teamCountry].filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
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

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                if (editingTeam) {
                  setEditingTeam({ ...editingTeam, isCurrent: !editingTeam.isCurrent });
                } else {
                  setNewTeam({ ...newTeam, isCurrent: !newTeam.isCurrent });
                }
              }}
            >
              <Ionicons 
                name={(editingTeam?.isCurrent || newTeam.isCurrent) ? "checkbox" : "square-outline"} 
                size={24} 
                color="#FF4444" 
              />
              <Text style={styles.checkboxText}>Текущая команда</Text>
            </TouchableOpacity>

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
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#fff',
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