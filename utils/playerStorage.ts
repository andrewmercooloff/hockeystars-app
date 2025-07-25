import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserStatus = 'player' | 'coach' | 'scout' | 'star';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
}

export interface Player {
  id: string;
  username: string;
  password: string;
  name: string;
  status: UserStatus;
  birthDate?: string;
  country: string;
  team?: string;
  position?: string;
  number?: string;
  grip?: string;
  height?: string;
  weight?: string;
  favoriteGoals?: string;
  avatar: string | null;
  friends?: string[]; // Массив ID друзей
  sentFriendRequests?: string[]; // Массив ID пользователей, которым отправлены запросы дружбы
  receivedFriendRequests?: string[]; // Массив ID пользователей, от которых получены запросы дружбы
  // Статистика игрока
  games?: string; // Количество игр
  goals?: string; // Количество голов
  assists?: string; // Количество передач
  points?: string; // Количество очков (голы + передачи)
  // Новые поля
  hockeyStartDate?: string; // Дата начала занятий хоккеем (MM.YYYY)
  photos?: string[]; // Массив URL фотографий
  // Нормативы
  pullUps?: string; // Максимальное количество подтягиваний
  pushUps?: string; // Максимальное количество отжиманий
  plankTime?: string; // Максимальное время в планке (в секундах)
  sprint100m?: string; // Время на 100 метров (в секундах)
  longJump?: string; // Прыжок в длину с места (в см)
}

// Начальные игроки (знаменитые белорусские хоккеисты)
export const initialPlayers: Player[] = [
  {
    id: '1',
    username: 'kostitsyn_andrei',
    password: '',
    name: 'Андрей Костицын',
    status: 'star',
    birthDate: '03.02.1985',
    country: 'Беларусь',
    team: 'Динамо Минск',
    position: 'Нападающий',
    number: '74',
    grip: 'Левый',
    height: '183',
    weight: '95',
    favoriteGoals: 'https://www.youtube.com/watch?v=3GwjfUFyY6M (время: 1:25)\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ (время: 0:45)',
    avatar: 'https://img.championat.com/i/article/16/75/1359651675_b_andrej-kosticyn.jpg',
    games: '45',
    goals: '12',
    assists: '18',
    points: '30',
    hockeyStartDate: '09.1995',
    photos: [
      'https://img.championat.com/i/article/16/75/1359651675_b_andrej-kosticyn.jpg',
      'https://i.pinimg.com/736x/19/8c/3c/198c3c422366229f143c93ab00a51e82.jpg'
    ]
  },
  {
    id: '2',
    username: 'kostitsyn_sergei',
    password: '',
    name: 'Сергей Костицын',
    status: 'star',
    birthDate: '20.03.1987',
    country: 'Беларусь',
    team: 'Динамо Минск',
    position: 'Нападающий',
    number: '76',
    grip: 'Левый',
    height: '180',
    weight: '88',
    favoriteGoals: 'https://www.youtube.com/watch?v=3GwjfUFyY6M (время: 2:10)',
    avatar: 'https://i.pinimg.com/736x/19/8c/3c/198c3c422366229f143c93ab00a51e82.jpg',
    games: '42',
    goals: '15',
    assists: '22',
    points: '37',
    hockeyStartDate: '09.1997',
    photos: [
      'https://i.pinimg.com/736x/19/8c/3c/198c3c422366229f143c93ab00a51e82.jpg'
    ]
  },
  {
    id: '3',
    username: 'grabovski_mikhail',
    password: '',
    name: 'Михаил Грабовский',
    status: 'star',
    birthDate: '31.01.1984',
    country: 'Беларусь',
    team: 'Динамо Минск',
    position: 'Нападающий',
    number: '84',
    grip: 'Левый',
    height: '180',
    weight: '83',
    favoriteGoals: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ (время: 1:30)',
    avatar: 'https://belarushockey.com/files/news/139422.jpg',
    games: '38',
    goals: '8',
    assists: '14',
    points: '22',
    hockeyStartDate: '09.1993',
    photos: [
      'https://belarushockey.com/files/news/139422.jpg'
    ]
  },
  {
    id: '4',
    username: 'sharangovich_egor',
    password: '',
    name: 'Егор Шарангович',
    status: 'star',
    birthDate: '06.06.1999',
    country: 'Беларусь',
    team: 'Динамо Минск',
    position: 'Нападающий',
    number: '17',
    grip: 'Левый',
    height: '188',
    weight: '88',
    favoriteGoals: 'https://www.youtube.com/watch?v=3GwjfUFyY6M\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ',
    avatar: 'https://pressball.by/wp-content/uploads/optimize/wp-content/uploads/entities/stories/2025/02/444124.jpg/890x560.jpg.webp',
    games: '50',
    goals: '20',
    assists: '25',
    points: '45',
    hockeyStartDate: '09.2006',
    photos: [
      'https://pressball.by/wp-content/uploads/optimize/wp-content/uploads/entities/stories/2025/02/444124.jpg/890x560.jpg.webp'
    ]
  },
  {
    id: '5',
    username: 'kudryavtsev_vitaly',
    password: '',
    name: 'Виталий Кудрявцев',
    status: 'star',
    birthDate: '15.08.1995',
    country: 'Беларусь',
    team: 'Динамо Минск',
    position: 'Вратарь',
    number: '30',
    grip: 'Левый',
    height: '185',
    weight: '82',
    favoriteGoals: 'https://www.youtube.com/watch?v=3GwjfUFyY6M (время: 0:30)\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ (время: 1:15)',
    avatar: 'https://via.placeholder.com/150/333/fff?text=GK',
    games: '35',
    goals: '0',
    assists: '2',
    points: '2'
  }
];

const PLAYERS_STORAGE_KEY = 'hockeystars_players';
const CURRENT_USER_KEY = 'hockeystars_current_user';
const MESSAGES_STORAGE_KEY = 'hockeystars_messages';

// Начальные тестовые сообщения
const initialMessages: Message[] = [
  {
    id: '1',
    senderId: '1', // Андрей Костицын
    receiverId: '5', // Виталий Кудрявцев
    text: 'Привет! Как дела?',
    timestamp: Date.now() - 3600000, // 1 час назад
    isRead: false
  },
  {
    id: '2',
    senderId: '2', // Сергей Костицын
    receiverId: '5', // Виталий Кудрявцев
    text: 'Готов к тренировке!',
    timestamp: Date.now() - 1800000, // 30 минут назад
    isRead: false
  }
];

// Сохранение всех игроков
export const savePlayers = async (players: Player[]) => {
  try {
    await AsyncStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
    console.log('Игроки сохранены:', players.length);
  } catch (error) {
    console.error('Ошибка сохранения игроков:', error);
  }
};

// Загрузка всех игроков
export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const playersData = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
    if (playersData) {
      const players = JSON.parse(playersData);
      console.log('Игроки загружены:', players.length);
      return players;
    }
  } catch (error) {
    console.error('Ошибка загрузки игроков:', error);
  }
  
  // Если данных нет, возвращаем начальных игроков
  console.log('Загружены начальные игроки');
  return initialPlayers;
};

// Добавление нового игрока
export const addPlayer = async (playerData: Omit<Player, 'id'>) => {
  try {
    const players = await loadPlayers();
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString(),
    };
    
    players.push(newPlayer);
    await savePlayers(players);
    console.log('Новый игрок добавлен:', newPlayer.name);
    return newPlayer;
  } catch (error) {
    console.error('Ошибка добавления игрока:', error);
    throw error;
  }
};

// Поиск игрока по ID
export const getPlayerById = async (id: string): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    return players.find(player => player.id === id) || null;
  } catch (error) {
    console.error('Ошибка поиска игрока:', error);
    return null;
  }
};

// Поиск игрока по логину и паролю
export const findPlayerByCredentials = async (username: string, password: string): Promise<Player | null> => {
  try {
    const players = await loadPlayers();
    return players.find(player => 
      player.username === username && player.password === password
    ) || null;
  } catch (error) {
    console.error('Ошибка поиска игрока по учетным данным:', error);
    return null;
  }
};

// Сохранение текущего пользователя
export const saveCurrentUser = async (player: Player | null) => {
  try {
    if (player) {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(player));
      console.log('Текущий пользователь сохранен:', player.name);
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      console.log('Текущий пользователь удален');
    }
  } catch (error) {
    console.error('Ошибка сохранения текущего пользователя:', error);
  }
};

// Загрузка текущего пользователя
export const loadCurrentUser = async (): Promise<Player | null> => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (userData) {
      const user = JSON.parse(userData);
      console.log('Текущий пользователь загружен:', user.name);
      return user;
    }
  } catch (error) {
    console.error('Ошибка загрузки текущего пользователя:', error);
  }
  return null;
};

// Обновление данных игрока
export const updatePlayer = async (updatedPlayer: Player) => {
  try {
    const players = await loadPlayers();
    const index = players.findIndex(player => player.id === updatedPlayer.id);
    
    if (index !== -1) {
      players[index] = updatedPlayer;
      await savePlayers(players);
      console.log('Игрок обновлен:', updatedPlayer.name);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка обновления игрока:', error);
    return false;
  }
};

// Инициализация хранилища (вызывается при первом запуске)
export const initializeStorage = async () => {
  try {
    const playersData = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!playersData) {
      // Если данных нет, сохраняем начальных игроков
      await savePlayers(initialPlayers);
      console.log('Хранилище инициализировано с начальными игроками');
    }
    
    const messagesData = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!messagesData) {
      // Если сообщений нет, сохраняем начальные тестовые сообщения
      await saveMessages(initialMessages);
      console.log('Хранилище инициализировано с начальными сообщениями');
    }
  } catch (error) {
    console.error('Ошибка инициализации хранилища:', error);
  }
};

// Функции для управления друзьями

// Добавление друга
export const addFriend = async (currentUserId: string, friendId: string): Promise<boolean> => {
  try {
    const players = await loadPlayers();
    const currentUserIndex = players.findIndex(player => player.id === currentUserId);
    const friendIndex = players.findIndex(player => player.id === friendId);
    
    if (currentUserIndex === -1 || friendIndex === -1) {
      console.log('Пользователь или друг не найден');
      return false;
    }
    
    // Инициализируем массив друзей, если его нет
    if (!players[currentUserIndex].friends) {
      players[currentUserIndex].friends = [];
    }
    if (!players[friendIndex].friends) {
      players[friendIndex].friends = [];
    }
    
    // Проверяем, не добавлен ли уже друг
    if (players[currentUserIndex].friends!.includes(friendId)) {
      console.log('Пользователь уже в друзьях');
      return false;
    }
    
    // Добавляем друг друга
    players[currentUserIndex].friends!.push(friendId);
    players[friendIndex].friends!.push(currentUserId);
    
    await savePlayers(players);
    console.log('Друг добавлен:', players[friendIndex].name);
    return true;
  } catch (error) {
    console.error('Ошибка добавления друга:', error);
    return false;
  }
};

// Удаление друга
export const removeFriend = async (currentUserId: string, friendId: string): Promise<boolean> => {
  try {
    const players = await loadPlayers();
    const currentUserIndex = players.findIndex(player => player.id === currentUserId);
    const friendIndex = players.findIndex(player => player.id === friendId);
    
    if (currentUserIndex === -1 || friendIndex === -1) {
      console.log('Пользователь или друг не найден');
      return false;
    }
    
    // Удаляем друг друга из списков друзей
    if (players[currentUserIndex].friends) {
      players[currentUserIndex].friends = players[currentUserIndex].friends!.filter(id => id !== friendId);
    }
    if (players[friendIndex].friends) {
      players[friendIndex].friends = players[friendIndex].friends!.filter(id => id !== currentUserId);
    }
    
    await savePlayers(players);
    console.log('Друг удален:', players[friendIndex].name);
    return true;
  } catch (error) {
    console.error('Ошибка удаления друга:', error);
    return false;
  }
};

// Проверка, являются ли пользователи друзьями
export const areFriends = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const players = await loadPlayers();
    const player1 = players.find(player => player.id === userId1);
    
    if (!player1 || !player1.friends) {
      return false;
    }
    
    return player1.friends.includes(userId2);
  } catch (error) {
    console.error('Ошибка проверки дружбы:', error);
    return false;
  }
};

// Получение списка друзей пользователя
export const getFriends = async (userId: string): Promise<Player[]> => {
  try {
    const players = await loadPlayers();
    const user = players.find(player => player.id === userId);
    
    if (!user || !user.friends) {
      return [];
    }
    
    return players.filter(player => user.friends!.includes(player.id));
  } catch (error) {
    console.error('Ошибка получения списка друзей:', error);
    return [];
  }
};

// Функции для управления запросами дружбы

// Отправка запроса дружбы
export const sendFriendRequest = async (senderId: string, receiverId: string): Promise<boolean> => {
  try {
    const players = await loadPlayers();
    const senderIndex = players.findIndex(player => player.id === senderId);
    const receiverIndex = players.findIndex(player => player.id === receiverId);
    
    if (senderIndex === -1 || receiverIndex === -1) {
      console.log('Отправитель или получатель не найден');
      return false;
    }
    
    // Инициализируем массивы запросов, если их нет
    if (!players[senderIndex].sentFriendRequests) {
      players[senderIndex].sentFriendRequests = [];
    }
    if (!players[receiverIndex].receivedFriendRequests) {
      players[receiverIndex].receivedFriendRequests = [];
    }
    
    // Проверяем, не отправлен ли уже запрос
    if (players[senderIndex].sentFriendRequests!.includes(receiverId)) {
      console.log('Запрос дружбы уже отправлен');
      return false;
    }
    
    // Проверяем, не являются ли уже друзьями
    if (players[senderIndex].friends && players[senderIndex].friends.includes(receiverId)) {
      console.log('Пользователи уже друзья');
      return false;
    }
    
    // Добавляем запрос
    players[senderIndex].sentFriendRequests!.push(receiverId);
    players[receiverIndex].receivedFriendRequests!.push(senderId);
    
    await savePlayers(players);
    console.log('Запрос дружбы отправлен:', players[receiverIndex].name);
    return true;
  } catch (error) {
    console.error('Ошибка отправки запроса дружбы:', error);
    return false;
  }
};

// Принятие запроса дружбы
export const acceptFriendRequest = async (accepterId: string, requesterId: string): Promise<boolean> => {
  try {
    const players = await loadPlayers();
    const accepterIndex = players.findIndex(player => player.id === accepterId);
    const requesterIndex = players.findIndex(player => player.id === requesterId);
    
    if (accepterIndex === -1 || requesterIndex === -1) {
      console.log('Принимающий или отправитель не найден');
      return false;
    }
    
    // Инициализируем массивы друзей, если их нет
    if (!players[accepterIndex].friends) {
      players[accepterIndex].friends = [];
    }
    if (!players[requesterIndex].friends) {
      players[requesterIndex].friends = [];
    }
    
    // Удаляем запросы из массивов
    if (players[accepterIndex].receivedFriendRequests) {
      players[accepterIndex].receivedFriendRequests = players[accepterIndex].receivedFriendRequests.filter(id => id !== requesterId);
    }
    if (players[requesterIndex].sentFriendRequests) {
      players[requesterIndex].sentFriendRequests = players[requesterIndex].sentFriendRequests.filter(id => id !== accepterId);
    }
    
    // Добавляем друг друга в друзья
    players[accepterIndex].friends!.push(requesterId);
    players[requesterIndex].friends!.push(accepterId);
    
    await savePlayers(players);
    console.log('Запрос дружбы принят:', players[requesterIndex].name);
    return true;
  } catch (error) {
    console.error('Ошибка принятия запроса дружбы:', error);
    return false;
  }
};

// Отклонение запроса дружбы
export const declineFriendRequest = async (declinerId: string, requesterId: string): Promise<boolean> => {
  try {
    const players = await loadPlayers();
    const declinerIndex = players.findIndex(player => player.id === declinerId);
    const requesterIndex = players.findIndex(player => player.id === requesterId);
    
    if (declinerIndex === -1 || requesterIndex === -1) {
      console.log('Отклоняющий или отправитель не найден');
      return false;
    }
    
    // Удаляем запросы из массивов
    if (players[declinerIndex].receivedFriendRequests) {
      players[declinerIndex].receivedFriendRequests = players[declinerIndex].receivedFriendRequests.filter(id => id !== requesterId);
    }
    if (players[requesterIndex].sentFriendRequests) {
      players[requesterIndex].sentFriendRequests = players[requesterIndex].sentFriendRequests.filter(id => id !== declinerId);
    }
    
    await savePlayers(players);
    console.log('Запрос дружбы отклонен:', players[requesterIndex].name);
    return true;
  } catch (error) {
    console.error('Ошибка отклонения запроса дружбы:', error);
    return false;
  }
};

// Отмена отправленного запроса дружбы
export const cancelFriendRequest = async (cancellerId: string, receiverId: string): Promise<boolean> => {
  try {
    const players = await loadPlayers();
    const cancellerIndex = players.findIndex(player => player.id === cancellerId);
    const receiverIndex = players.findIndex(player => player.id === receiverId);
    
    if (cancellerIndex === -1 || receiverIndex === -1) {
      console.log('Отменяющий или получатель не найден');
      return false;
    }
    
    // Удаляем запросы из массивов
    if (players[cancellerIndex].sentFriendRequests) {
      players[cancellerIndex].sentFriendRequests = players[cancellerIndex].sentFriendRequests.filter(id => id !== receiverId);
    }
    if (players[receiverIndex].receivedFriendRequests) {
      players[receiverIndex].receivedFriendRequests = players[receiverIndex].receivedFriendRequests.filter(id => id !== cancellerId);
    }
    
    await savePlayers(players);
    console.log('Запрос дружбы отменен:', players[receiverIndex].name);
    return true;
  } catch (error) {
    console.error('Ошибка отмены запроса дружбы:', error);
    return false;
  }
};

// Проверка статуса дружбы между пользователями
export const getFriendshipStatus = async (userId1: string, userId2: string): Promise<'friends' | 'sent_request' | 'received_request' | 'none'> => {
  try {
    const players = await loadPlayers();
    const player1 = players.find(player => player.id === userId1);
    const player2 = players.find(player => player.id === userId2);
    
    if (!player1 || !player2) {
      return 'none';
    }
    
    // Проверяем, являются ли друзьями
    if (player1.friends && player1.friends.includes(userId2)) {
      return 'friends';
    }
    
    // Проверяем, отправлен ли запрос от userId1 к userId2
    if (player1.sentFriendRequests && player1.sentFriendRequests.includes(userId2)) {
      return 'sent_request';
    }
    
    // Проверяем, получен ли запрос от userId2 к userId1
    if (player1.receivedFriendRequests && player1.receivedFriendRequests.includes(userId2)) {
      return 'received_request';
    }
    
    return 'none';
  } catch (error) {
    console.error('Ошибка проверки статуса дружбы:', error);
    return 'none';
  }
};

// Получение списка отправленных запросов дружбы
export const getSentFriendRequests = async (userId: string): Promise<Player[]> => {
  try {
    const players = await loadPlayers();
    const user = players.find(player => player.id === userId);
    
    if (!user || !user.sentFriendRequests) {
      return [];
    }
    
    return players.filter(player => user.sentFriendRequests!.includes(player.id));
  } catch (error) {
    console.error('Ошибка получения отправленных запросов дружбы:', error);
    return [];
  }
};

// Получение списка полученных запросов дружбы
export const getReceivedFriendRequests = async (userId: string): Promise<Player[]> => {
  try {
    const players = await loadPlayers();
    const user = players.find(player => player.id === userId);
    
    if (!user || !user.receivedFriendRequests) {
      return [];
    }
    
    return players.filter(player => user.receivedFriendRequests!.includes(player.id));
  } catch (error) {
    console.error('Ошибка получения полученных запросов дружбы:', error);
    return [];
  }
};

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С СООБЩЕНИЯМИ =====

// Загрузка всех сообщений
export const loadMessages = async (): Promise<Message[]> => {
  try {
    const messagesData = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    if (messagesData) {
      const messages = JSON.parse(messagesData);
      console.log('Сообщения загружены:', messages.length);
      return messages;
    }
  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error);
  }
  return [];
};

// Сохранение всех сообщений
export const saveMessages = async (messages: Message[]) => {
  try {
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    console.log('Сообщения сохранены:', messages.length);
  } catch (error) {
    console.error('Ошибка сохранения сообщений:', error);
  }
};

// Отправка сообщения
export const sendMessage = async (senderId: string, receiverId: string, text: string): Promise<boolean> => {
  try {
    const messages = await loadMessages();
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
      isRead: false
    };
    
    messages.push(newMessage);
    await saveMessages(messages);
    console.log('Сообщение отправлено:', newMessage.id);
    return true;
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    return false;
  }
};

// Получение диалога между двумя пользователями
export const getConversation = async (userId1: string, userId2: string): Promise<Message[]> => {
  try {
    const messages = await loadMessages();
    return messages.filter(message => 
      (message.senderId === userId1 && message.receiverId === userId2) ||
      (message.senderId === userId2 && message.receiverId === userId1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Ошибка получения диалога:', error);
    return [];
  }
};

// Получение всех диалогов пользователя
export const getUserConversations = async (userId: string): Promise<{ [key: string]: Message[] }> => {
  try {
    const messages = await loadMessages();
    const conversations: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      if (message.senderId === userId || message.receiverId === userId) {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        if (!conversations[otherUserId]) {
          conversations[otherUserId] = [];
        }
        conversations[otherUserId].push(message);
      }
    });
    
    // Сортируем сообщения в каждом диалоге по времени
    Object.keys(conversations).forEach(key => {
      conversations[key].sort((a, b) => a.timestamp - b.timestamp);
    });
    
    return conversations;
  } catch (error) {
    console.error('Ошибка получения диалогов пользователя:', error);
    return {};
  }
};

// Отметка сообщений как прочитанные
export const markMessagesAsRead = async (userId: string, otherUserId: string): Promise<boolean> => {
  try {
    const messages = await loadMessages();
    let updated = false;
    
    messages.forEach(message => {
      if (message.senderId === otherUserId && message.receiverId === userId && !message.isRead) {
        message.isRead = true;
        updated = true;
      }
    });
    
    if (updated) {
      await saveMessages(messages);
      console.log('Сообщения отмечены как прочитанные');
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка отметки сообщений как прочитанные:', error);
    return false;
  }
};

// Получение количества непрочитанных сообщений
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const messages = await loadMessages();
    const unreadMessages = messages.filter(message => message.receiverId === userId && !message.isRead);
    console.log('getUnreadMessageCount: Всего сообщений:', messages.length, 'Непрочитанных для', userId, ':', unreadMessages.length);
    return unreadMessages.length;
  } catch (error) {
    console.error('Ошибка получения количества непрочитанных сообщений:', error);
    return 0;
  }
};

// Очистка кэша текущего пользователя (для принудительного обновления)
export const clearCurrentUserCache = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('Кэш текущего пользователя очищен');
  } catch (error) {
    console.error('Ошибка очистки кэша пользователя:', error);
  }
};

// Функция для принудительной инициализации данных (для новых устройств)
export const forceInitializeStorage = async () => {
  try {
    // Очищаем все данные
    await AsyncStorage.removeItem(PLAYERS_STORAGE_KEY);
    await AsyncStorage.removeItem(MESSAGES_STORAGE_KEY);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    
    // Инициализируем заново
    await savePlayers(initialPlayers);
    await saveMessages(initialMessages);
    
    console.log('Хранилище принудительно инициализировано');
    return true;
  } catch (error) {
    console.error('Ошибка принудительной инициализации:', error);
    return false;
  }
};

// Функция для экспорта данных (для синхронизации между устройствами)
export const exportPlayerData = async (): Promise<string> => {
  try {
    const players = await loadPlayers();
    const messages = await loadMessages();
    const notifications = await loadNotifications();
    const currentUser = await loadCurrentUser();
    
    const exportData = {
      players,
      messages,
      notifications,
      currentUser,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData);
  } catch (error) {
    console.error('Ошибка экспорта данных:', error);
    throw error;
  }
};

// Функция для импорта данных (для синхронизации между устройствами)
export const importPlayerData = async (dataString: string): Promise<boolean> => {
  try {
    const importData = JSON.parse(dataString);
    
    // Проверяем версию данных
    if (importData.version !== '1.0') {
      throw new Error('Несовместимая версия данных');
    }
    
    // Импортируем данные
    if (importData.players) {
      await savePlayers(importData.players);
    }
    
    if (importData.messages) {
      await saveMessages(importData.messages);
    }
    
    if (importData.notifications) {
      await saveNotifications(importData.notifications);
    }
    
    if (importData.currentUser) {
      await saveCurrentUser(importData.currentUser);
    }
    
    console.log('Данные успешно импортированы');
    return true;
  } catch (error) {
    console.error('Ошибка импорта данных:', error);
    return false;
  }
};

// Функция для создания QR-кода с данными (для быстрой синхронизации)
export const createSyncQRCode = async (): Promise<string> => {
  try {
    const data = await exportPlayerData();
    // Создаем короткий URL или код для синхронизации
    const syncCode = btoa(data).substring(0, 100); // Ограничиваем размер
    return `hockeystars://sync/${syncCode}`;
  } catch (error) {
    console.error('Ошибка создания QR-кода:', error);
    throw error;
  }
};

// Функция для синхронизации через QR-код
export const syncFromQRCode = async (qrData: string): Promise<boolean> => {
  try {
    if (!qrData.startsWith('hockeystars://sync/')) {
      throw new Error('Неверный формат QR-кода');
    }
    
    const syncCode = qrData.replace('hockeystars://sync/', '');
    const dataString = atob(syncCode);
    
    return await importPlayerData(dataString);
  } catch (error) {
    console.error('Ошибка синхронизации из QR-кода:', error);
    return false;
  }
};

// Функция для расчета стажа в хоккее
export const calculateHockeyExperience = (startDate?: string): string => {
  if (!startDate) return '';
  
  try {
    // Парсим дату в формате MM.YYYY
    const [month, year] = startDate.split('.');
    const startMonth = parseInt(month);
    const startYear = parseInt(year);
    
    if (isNaN(startMonth) || isNaN(startYear)) return '';
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() возвращает 0-11
    
    let years = currentYear - startYear;
    let months = currentMonth - startMonth;
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
    } else {
      return 'менее месяца';
    }
  } catch (error) {
    console.error('Ошибка расчета стажа в хоккее:', error);
    return '';
  }
};

// Интерфейс для уведомлений
export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'system';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  playerId?: string;
  playerName?: string;
  playerAvatar?: string;
  receiverId?: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'hockeystars_notifications';

// Загрузка уведомлений
export const loadNotifications = async (): Promise<Notification[]> => {
  try {
    const notificationsData = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (notificationsData) {
      const notifications = JSON.parse(notificationsData);
      console.log('Уведомления загружены:', notifications.length);
      return notifications;
    }
  } catch (error) {
    console.error('Ошибка загрузки уведомлений:', error);
  }
  return [];
};

// Сохранение уведомлений
export const saveNotifications = async (notifications: Notification[]) => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    console.log('Уведомления сохранены:', notifications.length);
  } catch (error) {
    console.error('Ошибка сохранения уведомлений:', error);
  }
};

// Добавление уведомления
export const addNotification = async (notification: Omit<Notification, 'id'>) => {
  try {
    const notifications = await loadNotifications();
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
    };
    
    notifications.push(newNotification);
    await saveNotifications(notifications);
    console.log('Уведомление добавлено:', newNotification.title);
    return newNotification;
  } catch (error) {
    console.error('Ошибка добавления уведомления:', error);
    throw error;
  }
};

// Создание уведомления о запросе дружбы
export const createFriendRequestNotification = async (senderId: string, receiverId: string) => {
  try {
    const sender = await getPlayerById(senderId);
    if (!sender) return;
    
    const notification: Omit<Notification, 'id'> = {
      type: 'friend_request',
      title: 'Новый запрос дружбы',
      message: `${sender.name} хочет добавить вас в друзья`,
      timestamp: Date.now(),
      isRead: false,
      playerId: senderId,
      playerName: sender.name,
      playerAvatar: sender.avatar || undefined,
      receiverId: receiverId
    };
    
    await addNotification(notification);
    console.log('Уведомление о запросе дружбы создано для:', receiverId);
  } catch (error) {
    console.error('Ошибка создания уведомления о запросе дружбы:', error);
  }
};

// Получение количества непрочитанных уведомлений
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const notifications = await loadNotifications();
    const userNotifications = notifications.filter(notification => {
      if (notification.type === 'friend_request') {
        return notification.receiverId === userId;
      }
      if (notification.type === 'message') {
        return notification.playerId && notification.playerId !== userId;
      }
      return true;
    });
    
    const unreadNotifications = userNotifications.filter(notification => !notification.isRead);
    console.log('getUnreadNotificationCount: Пользователь:', userId, 'Всего уведомлений:', userNotifications.length, 'Непрочитанных:', unreadNotifications.length);
    return unreadNotifications.length;
  } catch (error) {
    console.error('Ошибка получения количества непрочитанных уведомлений:', error);
    return 0;
  }
};

// Отметка уведомления как прочитанное
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const notifications = await loadNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      await saveNotifications(notifications);
      console.log('Уведомление отмечено как прочитанное:', notificationId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка отметки уведомления как прочитанного:', error);
    return false;
  }
};

// Удаление уведомления
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const notifications = await loadNotifications();
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    
    if (filteredNotifications.length !== notifications.length) {
      await saveNotifications(filteredNotifications);
      console.log('Уведомление удалено:', notificationId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка удаления уведомления:', error);
    return false;
  }
};

// Очистка всех уведомлений
export const clearAllNotifications = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    console.log('Все уведомления очищены');
    return true;
  } catch (error) {
    console.error('Ошибка очистки уведомлений:', error);
    return false;
  }
}; 