import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
// Эти ключи нужно будет заменить на реальные после создания проекта в Supabase
const supabaseUrl = 'https://jvsypfwiajuwsyuzkyda.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3lwZndpYWp1d3N5dXpreWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTczNTcsImV4cCI6MjA2OTU3MzM1N30.8d8k7HK7lFgIirdHzackMYRn6gGgD5OyqgOUq2rk2RM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Интерфейсы для базы данных
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
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  read: boolean;
}

export interface FriendRequest {
  id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

// Функции для работы с игроками
export const getPlayers = async (): Promise<Player[]> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Ошибка загрузки игроков:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Ошибка загрузки игроков:', error);
    return [];
  }
};

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

    return data;
  } catch (error) {
    console.error('❌ Ошибка получения игрока:', error);
    return null;
  }
};

export const addPlayer = async (player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .insert([player])
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка добавления игрока:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Ошибка добавления игрока:', error);
    return null;
  }
};

export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка обновления игрока:', error);
      return null;
    }


    return data;
  } catch (error) {
    console.error('❌ Ошибка обновления игрока:', error);
    return null;
  }
};

export const deletePlayer = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Ошибка удаления игрока:', error);
      return false;
    }


    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления игрока:', error);
    return false;
  }
};

export const findPlayerByCredentials = async (email: string, password: string): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error) {
      console.error('❌ Ошибка поиска пользователя:', error);
      return null;
    }


    return data;
  } catch (error) {
    console.error('❌ Ошибка поиска пользователя:', error);
    return null;
  }
};

// Функции для работы с сообщениями
export const getMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Ошибка загрузки сообщений:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Ошибка загрузки сообщений:', error);
    return [];
  }
};

export const sendMessage = async (message: Omit<Message, 'id' | 'created_at'>): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      return null;
    }


    return data;
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    return null;
  }
};

// Функции для работы с запросами дружбы
export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('to_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Ошибка загрузки запросов дружбы:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Ошибка загрузки запросов дружбы:', error);
    return [];
  }
};

export const sendFriendRequest = async (fromId: string, toId: string): Promise<FriendRequest | null> => {
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
      return null;
    }


    return data;
  } catch (error) {
    console.error('❌ Ошибка отправки запроса дружбы:', error);
    return null;
  }
};

// Функция для инициализации базы данных
export const initializeDatabase = async (): Promise<boolean> => {
  try {

    
    // Проверяем подключение
    const { data, error } = await supabase
      .from('players')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка подключения к базе данных:', error);
      return false;
    }

    
    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    return false;
  }
};

// Функция для очистки всех данных
export const clearAllData = async (): Promise<boolean> => {
  try {

    
    // Удаляем все данные из всех таблиц
    const tables = ['players', 'messages', 'friend_requests', 'notifications'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Удаляем все записи

      if (error) {
        console.error(`❌ Ошибка очистки таблицы ${table}:`, error);
      } else {

      }
    }


    return true;
  } catch (error) {
    console.error('❌ Ошибка очистки данных:', error);
    return false;
  }
}; 