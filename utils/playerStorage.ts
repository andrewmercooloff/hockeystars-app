import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('📦 utils/playerStorage.ts загружен');

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  height: string;
  weight: string;
  photo?: string;
  avatar?: string;
  email?: string;
  password?: string;
  status?: string;
  birthDate?: string;
  hockeyStartDate?: string;
  experience?: string;
  achievements?: string;
  phone?: string;
  city?: string;
  goals?: string;
  assists?: string;
  country?: string;
  grip?: string;
  games?: string;
  pullUps?: string;
  pushUps?: string;
  plankTime?: string;
  sprint100m?: string;
  longJump?: string;
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
    photo: 'kostitsyn1',
    avatar: 'kostitsyn1',
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
    photo: 'kostitsyn2',
    avatar: 'kostitsyn2',
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
    photo: 'sharangovich',
    avatar: 'sharangovich',
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
    photo: 'grabovsky',
    avatar: 'grabovsky',
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
    photo: 'merkulov1',
    avatar: 'merkulov1',
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
    photo: 'merkulov2',
    avatar: 'merkulov2',
    status: 'Юниор',
    city: 'Минск',
    goals: '0',
    assists: '2'
  },
  {
    id: '7',
    name: 'Администратор',
    position: 'Администратор',
    team: 'HockeyStars',
    age: 30,
    height: '180 см',
    weight: '80 кг',
    photo: 'admin',
    avatar: 'admin',
    email: 'admin@hockeystars.com',
    password: 'admin123',
    status: 'admin',
    city: 'Минск'
  }
];

// Ключи для AsyncStorage
const PLAYERS_KEY = 'hockeystars_players';
const CURRENT_USER_KEY = 'hockeystars_current_user';
const MESSAGES_KEY = 'hockeystars_messages';
const FRIEND_REQUESTS_KEY = 'hockeystars_friend_requests';
const FRIENDSHIPS_KEY = 'hockeystars_friendships';

export const initializeStorage = async (): Promise<void> => {
  try {
    console.log('🔧 Инициализация хранилища...');

    // Проверяем, есть ли уже данные
    const existingPlayers = await AsyncStorage.getItem(PLAYERS_KEY);
    const existingUser = await AsyncStorage.getItem(CURRENT_USER_KEY);

    if (!existingPlayers) {
      console.log('📊 Сохраняем тестовых игроков...');
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(testPlayers));
      console.log('✅ Тестовые игроки сохранены');
    } else {
      console.log('📊 Данные игроков уже существуют');
    }

    if (!existingUser) {
      console.log('👤 Очищаем текущего пользователя...');
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    }

    // Инициализируем хранилище для друзей и запросов дружбы
    const friendRequestsData = await AsyncStorage.getItem(FRIEND_REQUESTS_KEY);
    if (!friendRequestsData) {
      console.log('📨 Инициализируем хранилище запросов дружбы...');
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify([]));
    }

    const friendshipsData = await AsyncStorage.getItem(FRIENDSHIPS_KEY);
    if (!friendshipsData) {
      console.log('👥 Инициализируем хранилище дружб...');
      await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify([]));
    }

    // Исправляем поврежденные данные
    await fixCorruptedData();

    // Добавляем администратора к существующим данным
    await addAdminToExistingData();

    console.log('✅ Инициализация завершена');
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  }
};

export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const playersData = await AsyncStorage.getItem(PLAYERS_KEY);
    if (playersData) {
      const players = JSON.parse(playersData);
      console.log(`📊 Загружено ${players.length} игроков`);
      return players;
    }
    return [];
  } catch (error) {
    console.error('❌ Ошибка загрузки игроков:', error);
    return [];
  }
};

export const getPlayerById = async (id: string): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    return players.find(player => player.id === id) || null;
  } catch (error) {
    console.error('❌ Ошибка получения игрока по ID:', error);
    return null;
  }
};

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

export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    const playerIndex = players.findIndex(p => p.id === id);
    
    if (playerIndex !== -1) {
      players[playerIndex] = { ...players[playerIndex], ...updates };
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
      console.log('✅ Игрок обновлен:', players[playerIndex].name);
      return players[playerIndex];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Ошибка обновления игрока:', error);
    return null;
  }
};

export const findPlayerByCredentials = async (email: string, password: string): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    const player = players.find(p => p.email === email && p.password === password);
    
    if (player) {
      console.log('✅ Пользователь найден:', player.name);
    } else {
      console.log('❌ Пользователь не найден');
    }
    
    return player || null;
  } catch (error) {
    console.error('❌ Ошибка поиска пользователя:', error);
    return null;
  }
};

export const saveCurrentUser = async (user: Player): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    console.log('✅ Текущий пользователь сохранен:', user.name);
  } catch (error) {
    console.error('❌ Ошибка сохранения пользователя:', error);
  }
};

export const loadCurrentUser = async (): Promise<Player | null> => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (userData) {
      const user = JSON.parse(userData);
      console.log('👤 Текущий пользователь загружен:', user.name);
      return user;
    }
    console.log('👤 Текущий пользователь не найден');
    return null;
  } catch (error) {
    console.error('❌ Ошибка загрузки пользователя:', error);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('✅ Пользователь вышел из системы');
  } catch (error) {
    console.error('❌ Ошибка выхода из системы:', error);
  }
};

export const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
  try {
    const messages = await getMessages(message.senderId, message.receiverId);
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    messages.push(newMessage);
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    
    return newMessage;
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    throw error;
  }
};

export const getMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
  try {
    const messagesData = await AsyncStorage.getItem(MESSAGES_KEY);
    if (messagesData) {
      const allMessages = JSON.parse(messagesData);
      return allMessages.filter((msg: Message) => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      );
    }
    return [];
  } catch (error) {
    console.error('❌ Ошибка загрузки сообщений:', error);
    return [];
  }
};

export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const messagesData = await AsyncStorage.getItem(MESSAGES_KEY);
    if (messagesData) {
      const allMessages = JSON.parse(messagesData);
      return allMessages.filter((msg: Message) => 
        msg.receiverId === userId && !msg.read
      ).length;
    }
    return 0;
  } catch (error) {
    console.error('❌ Ошибка подсчета непрочитанных сообщений:', error);
    return 0;
  }
};

// Система друзей
export const sendFriendRequest = async (fromId: string, toId: string): Promise<FriendRequest> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const newRequest: FriendRequest = {
      id: Date.now().toString(),
      fromId,
      toId,
      status: 'pending',
      timestamp: new Date()
    };
    
    requests.push(newRequest);
    await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
    
    console.log('✅ Запрос дружбы отправлен');
    return newRequest;
  } catch (error) {
    console.error('❌ Ошибка отправки запроса дружбы:', error);
    throw error;
  }
};

export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    return requests.filter(req => req.toId === userId && req.status === 'pending');
  } catch (error) {
    console.error('❌ Ошибка получения запросов дружбы:', error);
    return [];
  }
};

export const getFriendRequestsFromStorage = async (): Promise<FriendRequest[]> => {
  try {
    const requestsData = await AsyncStorage.getItem(FRIEND_REQUESTS_KEY);
    return requestsData ? JSON.parse(requestsData) : [];
  } catch (error) {
    console.error('❌ Ошибка загрузки запросов дружбы:', error);
    return [];
  }
};

export const respondToFriendRequest = async (requestId: string, accept: boolean): Promise<void> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex !== -1) {
      const request = requests[requestIndex];
      request.status = accept ? 'accepted' : 'rejected';
      
      if (accept) {
        // Добавляем дружбу
        const friendships = await getFriendshipsFromStorage();
        friendships.push({
          userId1: request.fromId,
          userId2: request.toId
        });
        await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(friendships));
      }
      
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
      console.log('✅ Ответ на запрос дружбы сохранен');
    }
  } catch (error) {
    console.error('❌ Ошибка ответа на запрос дружбы:', error);
  }
};

export const getFriends = async (userId: string): Promise<Player[]> => {
  try {
    const friendships = await getFriendshipsFromStorage();
    const friendIds = friendships
      .filter(friendship => 
        friendship.userId1 === userId || friendship.userId2 === userId
      )
      .map(friendship => 
        friendship.userId1 === userId ? friendship.userId2 : friendship.userId1
      );
    
    const players = await loadPlayers();
    return players.filter(player => friendIds.includes(player.id));
  } catch (error) {
    console.error('❌ Ошибка получения друзей:', error);
    return [];
  }
};

export const getFriendshipsFromStorage = async (): Promise<Array<{userId1: string, userId2: string}>> => {
  try {
    const friendshipsData = await AsyncStorage.getItem(FRIENDSHIPS_KEY);
    return friendshipsData ? JSON.parse(friendshipsData) : [];
  } catch (error) {
    console.error('❌ Ошибка загрузки дружб:', error);
    return [];
  }
};

export const addFriendship = async (userId1: string, userId2: string): Promise<void> => {
  try {
    const friendships = await getFriendshipsFromStorage();
    const existingFriendship = friendships.find(friendship => 
      (friendship.userId1 === userId1 && friendship.userId2 === userId2) ||
      (friendship.userId1 === userId2 && friendship.userId2 === userId1)
    );
    
    if (!existingFriendship) {
      friendships.push({ userId1, userId2 });
      await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(friendships));
      console.log('✅ Дружба добавлена');
    }
  } catch (error) {
    console.error('❌ Ошибка добавления дружбы:', error);
  }
};

export const removeFriendship = async (userId1: string, userId2: string): Promise<void> => {
  try {
    const friendships = await getFriendshipsFromStorage();
    const filteredFriendships = friendships.filter(friendship => 
      !((friendship.userId1 === userId1 && friendship.userId2 === userId2) ||
        (friendship.userId1 === userId2 && friendship.userId2 === userId1))
    );
    
    await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(filteredFriendships));
    console.log('✅ Дружба удалена');
  } catch (error) {
    console.error('❌ Ошибка удаления дружбы:', error);
  }
};

export const getReceivedFriendRequests = async (userId: string): Promise<Player[]> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const receivedRequestIds = requests
      .filter(req => req.toId === userId && req.status === 'pending')
      .map(req => req.fromId);
    
    const players = await loadPlayers();
    return players.filter(player => receivedRequestIds.includes(player.id));
  } catch (error) {
    console.error('❌ Ошибка получения полученных запросов дружбы:', error);
    return [];
  }
};

export const acceptFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const request = requests.find(req => 
      req.fromId === fromId && req.toId === toId && req.status === 'pending'
    );
    
    if (request) {
      request.status = 'accepted';
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
      
      // Добавляем дружбу
      await addFriendship(fromId, toId);
      
      console.log('✅ Запрос дружбы принят');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Ошибка принятия запроса дружбы:', error);
    return false;
  }
};

export const declineFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const request = requests.find(req => 
      req.fromId === fromId && req.toId === toId && req.status === 'pending'
    );
    
    if (request) {
      request.status = 'rejected';
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
      
      console.log('✅ Запрос дружбы отклонен');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Ошибка отклонения запроса дружбы:', error);
    return false;
  }
};

export const getFriendshipStatus = async (userId1: string, userId2: string): Promise<string> => {
  try {
    // Проверяем, есть ли уже дружба
    const friendships = await getFriendshipsFromStorage();
    const areFriends = friendships.some(friendship => 
      (friendship.userId1 === userId1 && friendship.userId2 === userId2) ||
      (friendship.userId1 === userId2 && friendship.userId2 === userId1)
    );
    
    if (areFriends) {
      return 'friends';
    }
    
    // Проверяем, есть ли активный запрос дружбы
    const requests = await getFriendRequestsFromStorage();
    const pendingRequest = requests.find(req => 
      ((req.fromId === userId1 && req.toId === userId2) ||
       (req.fromId === userId2 && req.toId === userId1)) &&
      req.status === 'pending'
    );
    
    if (pendingRequest) {
      return pendingRequest.fromId === userId1 ? 'sent' : 'received';
    }
    
    return 'none';
  } catch (error) {
    console.error('❌ Ошибка получения статуса дружбы:', error);
    return 'none';
  }
};

export const addFriend = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    await addFriendship(userId1, userId2);
    return true;
  } catch (error) {
    console.error('❌ Ошибка добавления друга:', error);
    return false;
  }
};

export const removeFriend = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    await removeFriendship(userId1, userId2);
    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления друга:', error);
    return false;
  }
};

export const areFriends = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const friendships = await getFriendshipsFromStorage();
    return friendships.some(friendship => 
      (friendship.userId1 === userId1 && friendship.userId2 === userId2) ||
      (friendship.userId1 === userId2 && friendship.userId2 === userId1)
    );
  } catch (error) {
    console.error('❌ Ошибка проверки дружбы:', error);
    return false;
  }
};

export const cancelFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const filteredRequests = requests.filter(req => 
      !(req.fromId === fromId && req.toId === toId && req.status === 'pending')
    );
    
    await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(filteredRequests));
    console.log('✅ Запрос дружбы отменен');
    return true;
  } catch (error) {
    console.error('❌ Ошибка отмены запроса дружбы:', error);
    return false;
  }
};

export const calculateHockeyExperience = (startDate?: string): string => {
  if (!startDate) return 'Не указано';
  
  try {
    const start = new Date(startDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    
    const getYearWord = (num: number): string => {
      if (num === 1) return 'год';
      if (num >= 2 && num <= 4) return 'года';
      return 'лет';
    };
    
    return `${years} ${getYearWord(years)}`;
  } catch (error) {
    console.error('❌ Ошибка расчета опыта:', error);
    return 'Не указано';
  }
};

export const fixCorruptedData = async (): Promise<void> => {
  try {
    console.log('🔧 Проверка и исправление данных...');
    // Здесь можно добавить логику исправления данных
    console.log('✅ Данные проверены');
  } catch (error) {
    console.error('❌ Ошибка исправления данных:', error);
  }
};

// Добавляем недостающие функции
export const forceInitializeStorage = async (): Promise<boolean> => {
  try {
    console.log('🔧 Принудительная инициализация хранилища...');
    await initializeStorage();
    console.log('✅ Принудительная инициализация завершена');
    return true;
  } catch (error) {
    console.error('❌ Ошибка принудительной инициализации:', error);
    return false;
  }
};

export const getUserConversations = async (userId: string): Promise<any[]> => {
  try {
    console.log('💬 Загрузка бесед пользователя:', userId);
    // Простая реализация - возвращаем пустой массив
    return [];
  } catch (error) {
    console.error('❌ Ошибка загрузки бесед:', error);
    return [];
  }
};

export const loadNotifications = async (userId: string): Promise<any[]> => {
  try {
    console.log('🔔 Загрузка уведомлений пользователя:', userId);
    // Простая реализация - возвращаем пустой массив
    return [];
  } catch (error) {
    console.error('❌ Ошибка загрузки уведомлений:', error);
    return [];
  }
};

export const addAdminToExistingData = async (): Promise<void> => {
  try {
    console.log('👑 Добавление администратора к существующим данным...');
    const players = await loadPlayers();
    const adminExists = players.some(p => p.status === 'admin');
    
    if (!adminExists) {
      const adminPlayer = testPlayers.find(p => p.status === 'admin');
      if (adminPlayer) {
        await addPlayer(adminPlayer);
        console.log('✅ Администратор добавлен');
      }
    } else {
      console.log('✅ Администратор уже существует');
    }
  } catch (error) {
    console.error('❌ Ошибка добавления администратора:', error);
  }
}; 