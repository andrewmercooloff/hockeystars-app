import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  height: string;
  weight: string;
  photo?: string;
  email?: string;
  password?: string;
  status?: string;
  birthDate?: string;
  experience?: string;
  achievements?: string;
  phone?: string;
  city?: string;
  goals?: string;
  assists?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
}

// Тестовые игроки как было 24 июля
const testPlayers: Player[] = [
  {
    id: '1',
    name: 'Андрей Костицын',
    position: 'Нападающий',
    team: 'Динамо Минск',
    age: 36,
    height: '183 см',
    weight: '85 кг',
    photo: '../assets/images/me.jpg',
    status: 'star',
    city: 'Минск',
    goals: '25',
    assists: '30'
  },
  {
    id: '2',
    name: 'Сергей Костицын',
    position: 'Нападающий',
    team: 'Динамо Минск',
    age: 34,
    height: '185 см',
    weight: '87 кг',
    photo: '../assets/images/me.jpg',
    status: 'star',
    city: 'Минск',
    goals: '22',
    assists: '28'
  },
  {
    id: '3', 
    name: 'Егор Шарангович',
    position: 'Нападающий',
    team: 'Динамо Минск',
    age: 26,
    height: '188 см',
    weight: '88 кг',
    photo: '../assets/images/me.jpg',
    status: 'star',
    city: 'Минск',
    goals: '18',
    assists: '22'
  },
  {
    id: '4',
    name: 'Михаил Грабовский',
    position: 'Центральный нападающий',
    team: 'Динамо Минск',
    age: 38,
    height: '180 см',
    weight: '82 кг',
    photo: '../assets/images/me.jpg',
    status: 'star',
    city: 'Минск',
    goals: '15',
    assists: '35'
  },
  {
    id: '5',
    name: 'Ivan Merkulov',
    position: 'Защитник',
    team: 'Юность Минск',
    age: 22,
    height: '188 см',
    weight: '90 кг',
    photo: '../assets/images/me.jpg',
    status: 'Молодой игрок',
    city: 'Минск',
    goals: '8',
    assists: '12'
  },
  {
    id: '6',
    name: 'Petr Merkulov',
    position: 'Вратарь',
    team: 'Юность Минск', 
    age: 19,
    height: '190 см',
    weight: '88 кг',
    photo: '../assets/images/me.jpg',
    status: 'Юниор',
    city: 'Минск',
    goals: '0',
    assists: '2'
  }
];

// Ключи для AsyncStorage
const PLAYERS_KEY = 'hockey_players';
const CURRENT_USER_KEY = 'current_user';
const MESSAGES_KEY = 'messages';
const FRIEND_REQUESTS_KEY = 'friend_requests';

// Инициализация хранилища
export const initializeStorage = async (): Promise<void> => {
  try {
    const existingPlayers = await AsyncStorage.getItem(PLAYERS_KEY);
    if (!existingPlayers) {
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(testPlayers));
      console.log('✅ Тестовые игроки добавлены в локальное хранилище');
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации хранилища:', error);
  }
};

// Загрузка всех игроков
export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const playersData = await AsyncStorage.getItem(PLAYERS_KEY);
    if (playersData) {
      return JSON.parse(playersData);
    }
    return testPlayers;
  } catch (error) {
    console.error('❌ Ошибка загрузки игроков:', error);
    return testPlayers;
  }
};

// Получение игрока по ID
export const getPlayerById = async (id: string): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    return players.find(player => player.id === id) || null;
  } catch (error) {
    console.error('❌ Ошибка получения игрока:', error);
    return null;
  }
};

// Добавление нового игрока
export const addPlayer = async (player: Omit<Player, 'id'>): Promise<Player> => {
  try {
    const players = await loadPlayers();
    const newPlayer: Player = {
      ...player,
      id: Date.now().toString()
    };
    
    players.push(newPlayer);
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    
    console.log('✅ Игрок добавлен:', newPlayer.name);
    return newPlayer;
  } catch (error) {
    console.error('❌ Ошибка добавления игрока:', error);
    throw error;
  }
};

// Обновление игрока
export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    const playerIndex = players.findIndex(p => p.id === id);
    
    if (playerIndex === -1) {
      throw new Error('Игрок не найден');
    }
    
    players[playerIndex] = { ...players[playerIndex], ...updates };
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    
    console.log('✅ Игрок обновлен:', players[playerIndex].name);
    return players[playerIndex];
  } catch (error) {
    console.error('❌ Ошибка обновления игрока:', error);
    return null;
  }
};

// Поиск игрока по учетным данным
export const findPlayerByCredentials = async (email: string, password: string): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    return players.find(player => 
      player.email === email && player.password === password
    ) || null;
  } catch (error) {
    console.error('❌ Ошибка поиска игрока:', error);
    return null;
  }
};

// Сохранение текущего пользователя
export const saveCurrentUser = async (user: Player): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    console.log('✅ Текущий пользователь сохранен:', user.name);
  } catch (error) {
    console.error('❌ Ошибка сохранения пользователя:', error);
  }
};

// Загрузка текущего пользователя
export const loadCurrentUser = async (): Promise<Player | null> => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('❌ Ошибка загрузки пользователя:', error);
    return null;
  }
};

// Выход пользователя
export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('✅ Пользователь вышел из системы');
  } catch (error) {
    console.error('❌ Ошибка выхода:', error);
  }
};

// Заглушки для функций сообщений и друзей
export const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
  const newMessage: Message = {
    ...message,
    id: Date.now().toString(),
    timestamp: new Date(),
    read: false
  };
  return newMessage;
};

export const getMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
  return [];
};

export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  return 0;
};

export const sendFriendRequest = async (fromId: string, toId: string): Promise<FriendRequest> => {
  const request: FriendRequest = {
    id: Date.now().toString(),
    fromId,
    toId,
    status: 'pending',
    timestamp: new Date()
  };
  return request;
};

export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  return [];
};

export const respondToFriendRequest = async (requestId: string, accept: boolean): Promise<void> => {
  // Заглушка
};

export const getFriends = async (userId: string): Promise<Player[]> => {
  return [];
};

// Функция для совместимости (не используется в локальной версии)
export const uploadLocalPlayersToFirebase = async (): Promise<void> => {
  console.log('📱 Локальная версия - синхронизация с облаком недоступна');
}; 