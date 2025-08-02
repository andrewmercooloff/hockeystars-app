import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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

const TeamSelector = React.memo(({ selectedTeams, onTeamsChange, placeholder = "Выберите команды" }: TeamSelectorProps) => {
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
    setShowSuggestions(false);
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

      {/* Поле ввода для поиска команд */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Введите название команды..."
          placeholderTextColor="#888"
        />
        
                 {/* Подсказки */}
         {showSuggestions && (
           <View style={styles.suggestionsContainer}>
             <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
               {isSearching ? (
                 <Text style={styles.loadingText}>Поиск...</Text>
               ) : searchResults.length > 0 ? (
                 searchResults.map((team) => (
                   <TouchableOpacity
                     key={team.id}
                     style={styles.suggestionItem}
                     onPress={() => addTeam(team)}
                   >
                     <View style={styles.suggestionInfo}>
                       <Text style={styles.suggestionName}>{team.name}</Text>
                       <Text style={styles.suggestionType}>{getTeamTypeLabel(team.type)}</Text>
                       {team.city && (
                         <Text style={styles.suggestionCity}>{team.city}</Text>
                       )}
                     </View>
                     <Ionicons name="add" size={20} color="#FF4444" />
                   </TouchableOpacity>
                 ))
               ) : searchTerm.length >= 2 ? (
                 <TouchableOpacity
                   style={styles.createButton}
                   onPress={createNewTeam}
                 >
                   <Ionicons name="add-circle" size={20} color="#FF4444" />
                   <Text style={styles.createButtonText}>
                     Создать "{searchTerm}"
                   </Text>
                 </TouchableOpacity>
               ) : searchTerm.length > 0 ? (
                 <Text style={styles.hintText}>
                   Введите минимум 2 символа для поиска
                 </Text>
               ) : null}
             </ScrollView>
           </View>
         )}
      </View>
    </View>
  );
});

export default TeamSelector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    zIndex: 999999,
    elevation: 100,
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
  searchContainer: {
    position: 'relative',
    zIndex: 999999,
    elevation: 1000,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    maxHeight: 200,
    zIndex: 999999,
    marginTop: 4,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 4,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  suggestionType: {
    fontSize: 11,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
  },
  suggestionCity: {
    fontSize: 11,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    padding: 10,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  createButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#FF4444',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
    textAlign: 'center',
    padding: 10,
  },
}); 