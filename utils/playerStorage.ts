import { supabase } from './supabase';

// Интерфейс для данных из Supabase (snake_case)
export interface SupabasePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  height: number;
  weight: number;
  avatar?: string;
  email?: string;
  password?: string;
  status?: string;
  birth_date?: string;
  hockey_start_date?: string;
  experience?: number;
  achievements?: string;
  phone?: string;
  city?: string;
  goals?: number;
  assists?: number;
  country?: string;
  grip?: string;
  games?: number;
  pull_ups?: number;
  push_ups?: number;
  plank_time?: number;
  sprint_100m?: number;
  long_jump?: number;
  favorite_goals?: string;
  photos?: string;
  number?: string;
  created_at?: string;
  updated_at?: string;
}

// Интерфейс для приложения (camelCase) - совместимый со старым кодом
export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  height: string;
  weight: string;
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
  favoriteGoals?: string;
  photos?: string[];
  number?: string;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
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

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

// Функции преобразования данных
const convertSupabaseToPlayer = (supabasePlayer: SupabasePlayer): Player => {
  return {
    id: supabasePlayer.id,
    name: supabasePlayer.name,
    position: supabasePlayer.position,
    team: supabasePlayer.team,
    age: supabasePlayer.age,
    height: supabasePlayer.height ? supabasePlayer.height.toString() : '',
    weight: supabasePlayer.weight ? supabasePlayer.weight.toString() : '',
    avatar: supabasePlayer.avatar,
    email: supabasePlayer.email,
    password: supabasePlayer.password,
    status: supabasePlayer.status,
    birthDate: supabasePlayer.birth_date,
    hockeyStartDate: supabasePlayer.hockey_start_date,
    experience: supabasePlayer.experience ? supabasePlayer.experience.toString() : '',
    achievements: supabasePlayer.achievements,
    phone: supabasePlayer.phone,
    city: supabasePlayer.city,
    goals: supabasePlayer.goals ? supabasePlayer.goals.toString() : '0',
    assists: supabasePlayer.assists ? supabasePlayer.assists.toString() : '0',
    country: supabasePlayer.country,
    grip: supabasePlayer.grip,
    games: supabasePlayer.games ? supabasePlayer.games.toString() : '0',
    pullUps: supabasePlayer.pull_ups ? supabasePlayer.pull_ups.toString() : '0',
    pushUps: supabasePlayer.push_ups ? supabasePlayer.push_ups.toString() : '0',
    plankTime: supabasePlayer.plank_time ? supabasePlayer.plank_time.toString() : '0',
    sprint100m: supabasePlayer.sprint_100m ? supabasePlayer.sprint_100m.toString() : '0',
    longJump: supabasePlayer.long_jump ? supabasePlayer.long_jump.toString() : '0',
    favoriteGoals: supabasePlayer.favorite_goals || '',
    photos: supabasePlayer.photos && supabasePlayer.photos !== '[]' ? 
      (() => {
        try {
          return JSON.parse(supabasePlayer.photos);
        } catch (error) {
          console.error('Ошибка парсинга photos:', error);
          return [];
        }
      })() : [],
    number: supabasePlayer.number || '',
    unreadNotificationsCount: 0,
    unreadMessagesCount: 0
  };
};

const convertPlayerToSupabase = (player: Omit<Player, 'id' | 'unreadNotificationsCount' | 'unreadMessagesCount'>): Omit<SupabasePlayer, 'id' | 'created_at' | 'updated_at'> => {
  return {
    name: player.name,
    position: player.position,
    team: player.team,
    age: player.age,
    height: parseInt(player.height) || 0,
    weight: parseInt(player.weight) || 0,
    avatar: player.avatar,
    email: player.email,
    password: player.password,
    status: player.status,
    birth_date: player.birthDate,
    hockey_start_date: player.hockeyStartDate,
    experience: player.experience ? parseInt(player.experience) : 0,
    achievements: player.achievements,
    phone: player.phone,
    city: player.city,
    goals: player.goals ? parseInt(player.goals) : 0,
    assists: player.assists ? parseInt(player.assists) : 0,
    country: player.country,
    grip: player.grip,
    games: player.games ? parseInt(player.games) : 0,
    pull_ups: player.pullUps ? parseInt(player.pullUps) : 0,
    push_ups: player.pushUps ? parseInt(player.pushUps) : 0,
    plank_time: player.plankTime ? parseInt(player.plankTime) : 0,
    sprint_100m: player.sprint100m ? parseFloat(player.sprint100m) : 0,
    long_jump: player.longJump ? parseInt(player.longJump) : 0,
    favorite_goals: player.favoriteGoals || '',
    photos: player.photos && player.photos.length > 0 ? JSON.stringify(player.photos) : '[]',
    number: player.number || ''
  };
};

// Инициализация хранилища
export const initializeStorage = async (): Promise<void> => {
  try {
    console.log('🔧 Инициализация Supabase хранилища...');
    const { data, error } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Ошибка инициализации Supabase:', error);
      throw error;
    }
    
    console.log('✅ Supabase хранилище инициализировано');
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
    throw error;
  }
};

// Загрузка всех игроков
export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Ошибка загрузки игроков:', error);
      return [];
    }
    
    // Преобразуем данные из Supabase в формат приложения
    return (data || []).map(convertSupabaseToPlayer);
  } catch (error) {
    console.error('❌ Ошибка загрузки игроков:', error);
    return [];
  }
};

// Получение игрока по ID
export const getPlayerById = async (id: string): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Ошибка получения игрока:', error);
      return null;
    }
    
    return convertSupabaseToPlayer(data);
  } catch (error) {
    console.error('❌ Ошибка получения игрока:', error);
    return null;
  }
};

// Добавление нового игрока
export const addPlayer = async (player: Omit<Player, 'id' | 'unreadNotificationsCount' | 'unreadMessagesCount'>): Promise<Player> => {
  try {
    console.log('🔄 Добавляем игрока:', JSON.stringify(player, null, 2));
    
    const supabasePlayer = convertPlayerToSupabase(player);
    console.log('📤 Данные для Supabase:', JSON.stringify(supabasePlayer, null, 2));
    
    const { data, error } = await supabase
      .from('players')
      .insert([supabasePlayer])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка добавления игрока:', error);
      console.error('Детали ошибки:', error.message);
      console.error('Код ошибки:', error.code);
      console.error('Детали:', error.details);
      console.error('Подсказка:', error.hint);
      throw error;
    }
    
    console.log('✅ Игрок добавлен:', data.name);
    return convertSupabaseToPlayer(data);
  } catch (error) {
    console.error('❌ Ошибка добавления игрока:', error);
    throw error;
  }
};

// Обновление игрока
export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  try {
    // Преобразуем обновления в формат Supabase
    const supabaseUpdates: Partial<SupabasePlayer> = {};
    
    if (updates.height) supabaseUpdates.height = parseInt(updates.height) || 0;
    if (updates.weight) supabaseUpdates.weight = parseInt(updates.weight) || 0;
    if (updates.birthDate) supabaseUpdates.birth_date = updates.birthDate;
    if (updates.hockeyStartDate) supabaseUpdates.hockey_start_date = updates.hockeyStartDate;
    if (updates.experience) supabaseUpdates.experience = parseInt(updates.experience) || 0;
    if (updates.goals) supabaseUpdates.goals = parseInt(updates.goals) || 0;
    if (updates.assists) supabaseUpdates.assists = parseInt(updates.assists) || 0;
    if (updates.games) supabaseUpdates.games = parseInt(updates.games) || 0;
    if (updates.pullUps) supabaseUpdates.pull_ups = parseInt(updates.pullUps) || 0;
    if (updates.pushUps) supabaseUpdates.push_ups = parseInt(updates.pushUps) || 0;
    if (updates.plankTime) supabaseUpdates.plank_time = parseInt(updates.plankTime) || 0;
    if (updates.sprint100m) supabaseUpdates.sprint_100m = parseFloat(updates.sprint100m) || 0;
    if (updates.longJump) supabaseUpdates.long_jump = parseInt(updates.longJump) || 0;
    if (updates.favoriteGoals !== undefined) supabaseUpdates.favorite_goals = updates.favoriteGoals;
    if (updates.photos !== undefined) supabaseUpdates.photos = updates.photos && updates.photos.length > 0 ? JSON.stringify(updates.photos) : '[]';
    if (updates.number !== undefined) supabaseUpdates.number = updates.number;
    
    // Добавляем остальные поля напрямую
    Object.assign(supabaseUpdates, {
      name: updates.name,
      position: updates.position,
      team: updates.team,
      age: updates.age,
      avatar: updates.avatar,
      email: updates.email,
      password: updates.password,
      status: updates.status,
      achievements: updates.achievements,
      phone: updates.phone,
      city: updates.city,
      country: updates.country,
      grip: updates.grip
    });
    
    const { data, error } = await supabase
      .from('players')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка обновления игрока:', error);
      return null;
    }
    
    return convertSupabaseToPlayer(data);
  } catch (error) {
    console.error('❌ Ошибка обновления игрока:', error);
    return null;
  }
};

// Поиск игрока по email и паролю
export const findPlayerByCredentials = async (email: string, password: string): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error) {
      console.error('❌ Ошибка поиска игрока:', error);
      return null;
    }
    
    return convertSupabaseToPlayer(data);
  } catch (error) {
    console.error('❌ Ошибка поиска игрока:', error);
    return null;
  }
};

// Сохранение текущего пользователя (в локальном хранилище для сессии)
export const saveCurrentUser = async (user: Player): Promise<void> => {
  try {
    // Используем AsyncStorage только для текущей сессии
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('hockeystars_current_user', JSON.stringify(user));
  } catch (error) {
    console.error('❌ Ошибка сохранения текущего пользователя:', error);
  }
};

// Загрузка текущего пользователя
export const loadCurrentUser = async (): Promise<Player | null> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const userData = await AsyncStorage.getItem('hockeystars_current_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ Ошибка загрузки текущего пользователя:', error);
    return null;
  }
};

// Выход пользователя
export const logoutUser = async (): Promise<void> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('hockeystars_current_user');
  } catch (error) {
    console.error('❌ Ошибка выхода:', error);
  }
};

// Отправка сообщения
export const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
  try {
    const supabaseMessage = {
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      text: message.text,
      read: message.read
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert([supabaseMessage])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      throw error;
    }
    
    return {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      text: data.text,
      timestamp: new Date(data.created_at),
      read: data.read
    };
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    throw error;
  }
};

// Получение сообщений между двумя пользователями
export const getMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Ошибка получения сообщений:', error);
      return [];
    }
    
    return (data || []).map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      text: msg.text,
      timestamp: new Date(msg.created_at),
      read: msg.read
    }));
  } catch (error) {
    console.error('❌ Ошибка получения сообщений:', error);
    return [];
  }
};

// Отправка запроса дружбы
export const sendFriendRequest = async (fromId: string, toId: string): Promise<FriendRequest> => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{
        from_id: fromId,
        to_id: toId,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка отправки запроса дружбы:', error);
      throw error;
    }
    
    return {
      id: data.id,
      fromId: data.from_id,
      toId: data.to_id,
      status: data.status,
      timestamp: new Date(data.created_at)
    };
  } catch (error) {
    console.error('❌ Ошибка отправки запроса дружбы:', error);
    throw error;
  }
};

// Получение запросов дружбы для пользователя
export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`from_id.eq.${userId},to_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Ошибка получения запросов дружбы:', error);
      return [];
    }
    
    return (data || []).map(req => ({
      id: req.id,
      fromId: req.from_id,
      toId: req.to_id,
      status: req.status,
      timestamp: new Date(req.created_at)
    }));
  } catch (error) {
    console.error('❌ Ошибка получения запросов дружбы:', error);
    return [];
  }
};

// Принятие запроса дружбы
export const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    
    if (error) {
      console.error('❌ Ошибка принятия запроса дружбы:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка принятия запроса дружбы:', error);
    return false;
  }
};

// Отклонение запроса дружбы
export const declineFriendRequest = async (requestId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    
    if (error) {
      console.error('❌ Ошибка отклонения запроса дружбы:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка отклонения запроса дружбы:', error);
    return false;
  }
};

// Получение друзей пользователя
export const getFriends = async (userId: string): Promise<Player[]> => {
  try {
    // Получаем принятые запросы дружбы
    const { data: friendRequests, error: requestsError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`from_id.eq.${userId},to_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (requestsError) {
      console.error('❌ Ошибка получения запросов дружбы:', requestsError);
      return [];
    }
    
    if (!friendRequests || friendRequests.length === 0) {
      return [];
    }
    
    // Получаем ID друзей
    const friendIds = friendRequests.map(request => 
      request.from_id === userId ? request.to_id : request.from_id
    );
    
    // Получаем данные друзей
    const { data: friends, error: friendsError } = await supabase
      .from('players')
      .select('*')
      .in('id', friendIds);
    
    if (friendsError) {
      console.error('❌ Ошибка получения друзей:', friendsError);
      return [];
    }
    
    return (friends || []).map(convertSupabaseToPlayer);
  } catch (error) {
    console.error('❌ Ошибка получения друзей:', error);
    return [];
  }
};

// Проверка статуса дружбы
export const getFriendshipStatus = async (userId1: string, userId2: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_id.eq.${userId1},to_id.eq.${userId2}),and(from_id.eq.${userId2},to_id.eq.${userId1})`)
      .single();
    
    if (error) {
      return 'none';
    }
    
    return data.status;
  } catch (error) {
    return 'none';
  }
};

// Очистка всех данных (для тестирования)
export const clearAllData = async (): Promise<boolean> => {
  try {
    console.log('🧹 Очистка всех данных из Supabase...');
    
    // Удаляем все данные из всех таблиц
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('friend_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Все данные очищены');
    return true;
  } catch (error) {
    console.error('❌ Ошибка очистки данных:', error);
    return false;
  }
};

// Исправление поврежденных данных (заглушка для совместимости)
export const fixCorruptedData = async (): Promise<void> => {
  try {
    console.log('🔧 Исправление поврежденных данных...');
    // В Supabase версии эта функция не нужна, так как данные хранятся в базе
    console.log('✅ Данные в Supabase не требуют исправления');
  } catch (error) {
    console.error('❌ Ошибка исправления данных:', error);
  }
};

// Загрузка уведомлений (заглушка для совместимости)
export const loadNotifications = async (userId?: string): Promise<any[]> => {
  try {
    // В локальной версии уведомления не реализованы
    return [];
  } catch (error) {
    console.error('❌ Ошибка загрузки уведомлений:', error);
    return [];
  }
};

// Создание уведомления (заглушка для совместимости)
export const createNotification = async (notification: any): Promise<any> => {
  try {
    console.log('🔔 Создание уведомления (заглушка)...');
    // В локальной версии уведомления не реализованы
    return notification;
  } catch (error) {
    console.error('❌ Ошибка создания уведомления:', error);
    return notification;
  }
};

// Отметка уведомления как прочитанного (заглушка для совместимости)
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    console.log('🔔 Отметка уведомления как прочитанного (заглушка)...');
    // В локальной версии уведомления не реализованы
    return true;
  } catch (error) {
    console.error('❌ Ошибка отметки уведомления:', error);
    return false;
  }
};

// Принудительная инициализация хранилища (заглушка для совместимости)
export const forceInitializeStorage = async (): Promise<boolean> => {
  try {
    console.log('🔧 Принудительная инициализация Supabase хранилища...');
    await initializeStorage();
    return true;
  } catch (error) {
    console.error('❌ Ошибка принудительной инициализации:', error);
    return false;
  }
};

// Создание администратора
export const createAdmin = async (): Promise<Player | null> => {
  try {
    const adminData = {
      name: 'Администратор',
      position: 'Администратор',
      team: 'Система',
      age: 30,
      height: 180,
      weight: 80,
      email: 'admin@hockeystars.com',
      password: 'admin123',
      status: 'admin',
      city: 'Минск',
      goals: 0,
      assists: 0,
      games: 0,
      pull_ups: 0,
      push_ups: 0,
      plank_time: 0,
      sprint_100m: 0,
      long_jump: 0
    };
    
    const { data, error } = await supabase
      .from('players')
      .insert([adminData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка создания администратора:', error);
      return null;
    }
    
    console.log('✅ Администратор создан:', data.name);
    return convertSupabaseToPlayer(data);
  } catch (error) {
    console.error('❌ Ошибка создания администратора:', error);
    return null;
  }
};

// Функция для получения полученных запросов дружбы
export const getReceivedFriendRequests = async (userId: string): Promise<Player[]> => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        players!friend_requests_from_id_fkey(*)
      `)
      .eq('to_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('❌ Ошибка загрузки запросов дружбы:', error);
      return [];
    }
    
    return (data || []).map(item => convertSupabaseToPlayer(item.players));
  } catch (error) {
    console.error('❌ Ошибка загрузки запросов дружбы:', error);
    return [];
  }
};

// Функция для исправления данных администратора
export const fixAdminData = async (): Promise<void> => {
  try {
    console.log('🔧 Исправление данных администратора...');
    
    const { data: admins, error } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'admin');
    
    if (error) {
      console.error('❌ Ошибка поиска администраторов:', error);
      return;
    }
    
    if (admins && admins.length > 0) {
      console.log(`✅ Найдено администраторов: ${admins.length}`);
    } else {
      console.log('⚠️ Администраторы не найдены, создаем нового...');
      await createAdmin();
    }
  } catch (error) {
    console.error('❌ Ошибка исправления данных администратора:', error);
  }
};

// Функция для получения количества непрочитанных сообщений
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', userId)
      .eq('read', false);
    
    if (error) {
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    return 0;
  }
}; 