import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loadPlayers, Player } from '../utils/playerStorage';

// Компонент для фильтра
const FilterButton = ({ 
  title, 
  options, 
  selectedValue, 
  onSelect 
}: { 
  title: string, 
  options: string[], 
  selectedValue: string | null, 
  onSelect: (value: string | null) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={styles.filterButton} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.filterButtonText}>
          {selectedValue || title}
        </Text>
        <Text style={styles.filterButtonIcon}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.filterDropdown}>
          <TouchableOpacity 
            style={styles.filterDropdownItem} 
            onPress={() => {
              onSelect(null);
              setIsOpen(false);
            }}
          >
            <Text style={styles.filterDropdownItemText}>Все</Text>
          </TouchableOpacity>
          {options.map((option) => (
            <TouchableOpacity 
              key={option}
              style={[
                styles.filterDropdownItem,
                selectedValue === option && styles.selectedFilterItem
              ]} 
              onPress={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              <Text style={styles.filterDropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function SearchScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMinHeight, setSelectedMinHeight] = useState<string | null>(null);
  const [selectedMinWeight, setSelectedMinWeight] = useState<string | null>(null);

  // Загрузка игроков при монтировании
  React.useEffect(() => {
    const loadPlayersData = async () => {
      const allPlayers = await loadPlayers();
      // Фильтруем только игроков, тренеров и администраторов
      const filteredPlayers = allPlayers.filter(
        player => 
          player.status === 'player' || 
          player.status === 'coach' || 
          player.status === 'admin'
      );
      
      setPlayers(filteredPlayers);
    };
    loadPlayersData();
  }, []);

  // Получаем уникальные значения для фильтров
  const countries = useMemo(() => 
    Array.from(new Set(players.map(p => p.country).filter(Boolean))).sort(), 
    [players]
  );
  const hands = useMemo(() => 
    ['Левый', 'Правый'], 
    []
  );
  const positions = useMemo(() => 
    Array.from(new Set(players.map(p => p.position).filter(Boolean))).sort(), 
    [players]
  );
  const years = useMemo(() => 
    Array.from(new Set(
      players
        .map(p => p.birthDate ? p.birthDate.split('-')[0] : null)
        .filter(Boolean)
    )).sort(), 
    [players]
  );
  const heights = useMemo(() => 
    Array.from(new Set(
      players
        .map(p => p.height ? Math.round(parseInt(p.height) / 10) * 10 : null)
        .filter(Boolean)
    )).sort((a, b) => a - b).map(h => `${h} см`), 
    [players]
  );
  const weights = useMemo(() => 
    Array.from(new Set(
      players
        .map(p => p.weight ? Math.round(parseInt(p.weight) / 10) * 10 : null)
        .filter(Boolean)
    )).sort((a, b) => a - b).map(w => `${w} кг`), 
    [players]
  );

  // Фильтрация игроков
  const filteredPlayers = useMemo(() => {
    const filtered = players.filter(player => {
      // Администратор всегда виден
      if (player.status === 'admin') return true;

      // Фильтр по поиску
      const matchesSearch = !searchQuery || 
        player.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Фильтр по стране
      const matchesCountry = !selectedCountry || player.country === selectedCountry;
      
      // Фильтр по хвату
      const matchesHand = !selectedHand || 
        (selectedHand === 'Левый' && player.grip === 'Левый') || 
        (selectedHand === 'Правый' && player.grip === 'Правый');
      
      // Фильтр по позиции
      const matchesPosition = !selectedPosition || player.position === selectedPosition;
      
      // Фильтр по году
      const matchesYear = !selectedYear || 
        (player.birthDate && player.birthDate.startsWith(selectedYear));
      
      // Фильтр по росту (от)
      const matchesHeight = !selectedMinHeight || 
        (player.height && parseInt(player.height) >= parseInt(selectedMinHeight));
      
      // Фильтр по весу (от)
      const matchesWeight = !selectedMinWeight || 
        (player.weight && parseInt(player.weight) >= parseInt(selectedMinWeight));
      
      return matchesSearch && 
             matchesCountry && 
             matchesHand && 
             matchesPosition && 
             matchesYear &&
             matchesHeight &&
             matchesWeight;
    });

    return filtered;
  }, [players, searchQuery, selectedCountry, selectedHand, selectedPosition, selectedYear, selectedMinHeight, selectedMinWeight]);

  // Рендер элемента списка игроков
  const renderPlayerItem = ({ item }: { item: Player }) => {
    // Приоритет: avatar, photos[0], default
    const playerPhoto = 
      item.avatar || 
      (item.photos && item.photos.length > 0 && item.photos[0]) || 
      require('../assets/images/default-avatar.png');

    // Определяем стиль контура в зависимости от статуса
    const photoContainerStyle = 
      item.status === 'coach' 
        ? styles.coachPhotoContainer 
        : styles.playerPhotoContainer;

    return (
      <TouchableOpacity 
        style={styles.playerItem} 
        onPress={() => router.push({ pathname: '/player/[id]', params: { id: item.id } })}
      >
        <View style={photoContainerStyle}>
          <Image 
            source={typeof playerPhoto === 'string' ? { uri: playerPhoto } : playerPhoto} 
            style={styles.playerPhoto} 
          />
        </View>
        <View style={styles.playerDetails}>
          <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          {item.status !== 'admin' && (
            <Text style={styles.playerInfo} numberOfLines={2} ellipsizeMode="tail">
              {item.country} | {item.position} | {item.birthDate?.split('-')[0]} | {item.height} см | {item.weight} кг | {item.grip === 'Левый' ? 'Л' : 'П'} хват
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Поле поиска */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск игроков..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Контейнер фильтров */}
      <View style={styles.filtersContainer}>
        <FilterButton 
          title="Страна" 
          options={countries} 
          selectedValue={selectedCountry}
          onSelect={setSelectedCountry}
        />
        <FilterButton 
          title="Хват" 
          options={hands} 
          selectedValue={selectedHand}
          onSelect={setSelectedHand}
        />
        <FilterButton 
          title="Позиция" 
          options={positions} 
          selectedValue={selectedPosition}
          onSelect={setSelectedPosition}
        />
        <FilterButton 
          title="Год" 
          options={years} 
          selectedValue={selectedYear}
          onSelect={setSelectedYear}
        />
        <FilterButton 
          title="Рост от" 
          options={heights} 
          selectedValue={selectedMinHeight}
          onSelect={setSelectedMinHeight}
        />
        <FilterButton 
          title="Вес от" 
          options={weights} 
          selectedValue={selectedMinWeight}
          onSelect={setSelectedMinWeight}
        />
      </View>

      {/* Список игроков */}
      <FlatList
        data={filteredPlayers}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Игроки не найдены</Text>
          </View>
        }
        contentContainerStyle={styles.playersList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontFamily: 'Gilroy-Medium',
    fontSize: 16,
    height: 50,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Разрешаем перенос на новую строку
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterContainer: {
    position: 'relative',
    width: '30%', // Уменьшаем ширину для 3 столбцов
    marginBottom: 10, // Отступ между строками
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444', // Красный фон
    paddingHorizontal: 10, // Уменьшаем горизонтальные отступы
    paddingVertical: 8, // Уменьшаем вертикальные отступы
    borderRadius: 15,
    justifyContent: 'space-between',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12, // Уменьшаем размер шрифта
    fontFamily: 'Gilroy-Medium',
    flex: 1,
  },
  filterButtonIcon: {
    color: '#fff',
    fontSize: 10,
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    marginTop: 5,
    zIndex: 20,
    maxHeight: 200,
  },
  filterDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedFilterItem: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  filterDropdownItemText: {
    color: '#fff',
    fontFamily: 'Gilroy-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  playersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  playerPhotoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  coachPhotoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF4444', // Красный цвет для тренеров
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerPhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  playerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  playerName: {
    color: '#fff',
    fontFamily: 'Gilroy-Bold',
    fontSize: 14, // Уменьшаем размер шрифта
    marginBottom: 4, // Уменьшаем отступ
  },
  playerInfo: {
    color: '#ccc',
    fontFamily: 'Gilroy-Medium',
    fontSize: 12, // Уменьшаем размер шрифта
    flexWrap: 'wrap', // Разрешаем перенос текста
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    fontFamily: 'Gilroy-Medium',
    fontSize: 16,
  },
});
