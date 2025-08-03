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
  past_teams?: string;
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
export interface Team {
  id: string;
  name: string;
  type: 'club' | 'national' | 'regional' | 'school';
  country?: string;
  city?: string;
}

export interface PlayerTeam {
  teamId: string;
  teamName: string;
  teamType: string;
  teamCountry?: string;
  teamCity?: string;
  isPrimary: boolean;
  joinedDate?: string;
}

// Интерфейс для достижения
export interface Achievement {
  id: string;
  competition: string;
  year: number;
  place: 1 | 2 | 3;
  description?: string;
}

// Интерфейс для прошлой команды
export interface PastTeam {
  id: string;
  teamName: string;
  teamCountry?: string;
  teamCity?: string;
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string; // основная команда (для обратной совместимости)
  teams?: PlayerTeam[]; // текущие команды игрока
  pastTeams?: PastTeam[]; // прошлые команды игрока
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
  achievements?: Achievement[]; // новые достижения
  oldAchievements?: string; // старые достижения (для обратной совместимости)
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
  // Преобразование данных из Supabase в Player
  console.log(`🔄 Конвертируем игрока: ${supabasePlayer.name}`);
  console.log(`   Аватар из базы: ${supabasePlayer.avatar || 'null'}`);
  console.log(`   Фотографии из базы: ${supabasePlayer.photos || 'null'}`);
  
  const result = {
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
    hockeyStartDate: (() => {
      if (!supabasePlayer.hockey_start_date || supabasePlayer.hockey_start_date === '' || supabasePlayer.hockey_start_date === 'null') {
        return '';
      }
      
      // Конвертируем из YYYY-MM-DD в MM.YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(supabasePlayer.hockey_start_date)) {
        const [year, month] = supabasePlayer.hockey_start_date.split('-');
        return `${parseInt(month)}.${year}`;
      }
      
      return supabasePlayer.hockey_start_date; // Возвращаем как есть, если формат не распознан
    })(),
    experience: supabasePlayer.experience ? supabasePlayer.experience.toString() : '',
    achievements: (() => {
      if (supabasePlayer.achievements && supabasePlayer.achievements !== '[]' && supabasePlayer.achievements !== 'null') {
        try {
          return JSON.parse(supabasePlayer.achievements);
        } catch (error) {
          console.error('Ошибка парсинга achievements:', error);
          return [];
        }
      }
      return [];
    })(),
    oldAchievements: supabasePlayer.achievements, // старые достижения для обратной совместимости
    pastTeams: (() => {
      if (supabasePlayer.past_teams && supabasePlayer.past_teams !== '[]' && supabasePlayer.past_teams !== 'null') {
        try {
          return JSON.parse(supabasePlayer.past_teams);
        } catch (error) {
          console.error('Ошибка парсинга past_teams:', error);
          return [];
        }
      }
      return [];
    })(),
    phone: supabasePlayer.phone,
    city: supabasePlayer.city,
    goals: supabasePlayer.goals ? supabasePlayer.goals.toString() : '0',
    assists: supabasePlayer.assists ? supabasePlayer.assists.toString() : '0',
    country: supabasePlayer.country,
    grip: supabasePlayer.grip,
    games: supabasePlayer.games ? supabasePlayer.games.toString() : '0',
    pullUps: supabasePlayer.pull_ups && String(supabasePlayer.pull_ups) !== '0' && String(supabasePlayer.pull_ups) !== 'null' ? supabasePlayer.pull_ups.toString() : '',
    pushUps: supabasePlayer.push_ups && String(supabasePlayer.push_ups) !== '0' && String(supabasePlayer.push_ups) !== 'null' ? supabasePlayer.push_ups.toString() : '',
    plankTime: supabasePlayer.plank_time && String(supabasePlayer.plank_time) !== '0' && String(supabasePlayer.plank_time) !== 'null' ? supabasePlayer.plank_time.toString() : '',
    sprint100m: supabasePlayer.sprint_100m && String(supabasePlayer.sprint_100m) !== '0' && String(supabasePlayer.sprint_100m) !== 'null' ? supabasePlayer.sprint_100m.toString() : '',
    longJump: supabasePlayer.long_jump && String(supabasePlayer.long_jump) !== '0' && String(supabasePlayer.long_jump) !== 'null' ? supabasePlayer.long_jump.toString() : '',
    favoriteGoals: supabasePlayer.favorite_goals && supabasePlayer.favorite_goals.trim() !== '' ? supabasePlayer.favorite_goals : '',
    photos: supabasePlayer.photos && supabasePlayer.photos !== '[]' && supabasePlayer.photos !== 'null' ? 
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
  
  console.log(`   Результат конвертации:`);
  console.log(`     Аватар: ${result.avatar || 'null'}`);
  console.log(`     Фотографии: ${result.photos ? result.photos.length : 0} шт.`);
  
  return result;
};

// Функции для работы с командами

// Поиск команд по названию
export const searchTeams = async (searchTerm: string): Promise<Team[]> => {
  try {
    const { data, error } = await supabase
      .rpc('search_teams', { search_term: searchTerm });
    
    if (error) {
      console.error('❌ Ошибка поиска команд:', error);
      return [];
    }
    
    return (data || []).map((team: any) => ({
      id: team.id,
      name: team.name,
      type: team.type,
      country: team.country,
      city: team.city
    }));
  } catch (error) {
    console.error('❌ Ошибка поиска команд:', error);
    return [];
  }
};

// Создание новой команды
export const createTeam = async (teamData: Omit<Team, 'id'>): Promise<Team | null> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        type: teamData.type,
        country: teamData.country,
        city: teamData.city
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка создания команды:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      country: data.country,
      city: data.city
    };
  } catch (error) {
    console.error('❌ Ошибка создания команды:', error);
    return null;
  }
};

// Получение команд игрока
export const getPlayerTeams = async (playerId: string): Promise<PlayerTeam[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_player_teams', { player_uuid: playerId });
    
    if (error) {
      console.error('❌ Ошибка получения команд игрока:', error);
      return [];
    }
    
    const teams = (data || []).map((team: any) => ({
      teamId: team.team_id,
      teamName: team.team_name,
      teamType: team.team_type,
      teamCountry: team.team_country,
      teamCity: team.team_city,
      isPrimary: team.is_primary,
      joinedDate: team.joined_date
    }));
    
    // Сортируем команды по дате добавления (сначала новые)
    teams.sort((a: PlayerTeam, b: PlayerTeam) => {
      const dateA = new Date(a.joinedDate || '1970-01-01');
      const dateB = new Date(b.joinedDate || '1970-01-01');
      return dateB.getTime() - dateA.getTime();
    });
    
    return teams;
  } catch (error) {
    console.error('❌ Ошибка получения команд игрока:', error);
    return [];
  }
};

// Добавление команды игроку
export const addPlayerTeam = async (playerId: string, teamId: string, isPrimary: boolean = false): Promise<boolean> => {
  try {
    console.log('➕ addPlayerTeam: добавляем команду', teamId, 'игроку', playerId, '(основная:', isPrimary, ')');
    
    // Сначала проверяем, существует ли уже такая запись
    const { data: existingTeam, error: checkError } = await supabase
      .from('player_teams')
      .select('*')
      .eq('player_id', playerId)
      .eq('team_id', teamId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Ошибка проверки существующей команды:', checkError);
      return false;
    }
    
    if (existingTeam) {
      console.log('🔄 Команда уже существует, обновляем статус');
      // Обновляем существующую запись
      const { error: updateError } = await supabase
        .from('player_teams')
        .update({
          is_primary: isPrimary,
          joined_date: new Date().toISOString().split('T')[0]
        })
        .eq('player_id', playerId)
        .eq('team_id', teamId);
      
      if (updateError) {
        console.error('❌ Ошибка обновления команды игроку:', updateError);
        return false;
      }
      
      console.log('✅ Команда успешно обновлена у игрока');
      return true;
    } else {
      // Создаем новую запись
      const { error: insertError } = await supabase
        .from('player_teams')
        .insert({
          player_id: playerId,
          team_id: teamId,
          is_primary: isPrimary,
          joined_date: new Date().toISOString().split('T')[0]
        });
      
      if (insertError) {
        console.error('❌ Ошибка добавления команды игроку:', insertError);
        return false;
      }
      
      console.log('✅ Команда успешно добавлена игроку');
      return true;
    }
  } catch (error) {
    console.error('❌ Ошибка добавления команды игроку:', error);
    return false;
  }
};

// Удаление команды у игрока
export const removePlayerTeam = async (playerId: string, teamId: string): Promise<boolean> => {
  try {
    console.log('🗑️ removePlayerTeam: удаляем команду', teamId, 'у игрока', playerId);
    
    const { error } = await supabase
      .from('player_teams')
      .delete()
      .eq('player_id', playerId)
      .eq('team_id', teamId);
    
    if (error) {
      console.error('❌ Ошибка удаления команды у игрока:', error);
      return false;
    }
    
    console.log('✅ Команда успешно удалена у игрока');
    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления команды у игрока:', error);
    return false;
  }
};

// Установка основной команды
export const setPrimaryTeam = async (playerId: string, teamId: string): Promise<boolean> => {
  try {
    // Сначала сбрасываем все команды как не основные
    const { error: resetError } = await supabase
      .from('player_teams')
      .update({ is_primary: false })
      .eq('player_id', playerId);
    
    if (resetError) {
      console.error('❌ Ошибка сброса основных команд:', resetError);
      return false;
    }
    
    // Затем устанавливаем выбранную команду как основную
    const { error: setError } = await supabase
      .from('player_teams')
      .update({ is_primary: true })
      .eq('player_id', playerId)
      .eq('team_id', teamId);
    
    if (setError) {
      console.error('❌ Ошибка установки основной команды:', setError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка установки основной команды:', error);
    return false;
  }
};

const convertPlayerToSupabase = (player: Omit<Player, 'id' | 'unreadNotificationsCount' | 'unreadMessagesCount'>): Omit<SupabasePlayer, 'id' | 'created_at' | 'updated_at'> => {
  // Функция для конвертации даты из DD.MM.YYYY в YYYY-MM-DD
  const convertDate = (dateString?: string): string | undefined => {
    if (!dateString) return undefined;
    
    // Проверяем, если дата уже в формате YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Конвертируем из DD.MM.YYYY в YYYY-MM-DD
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString; // Возвращаем как есть, если формат не распознан
  };

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
    birth_date: convertDate(player.birthDate),
    hockey_start_date: convertDate(player.hockeyStartDate),
    experience: player.experience ? parseInt(player.experience) : 0,
    achievements: player.achievements ? JSON.stringify(player.achievements) : '[]',
    past_teams: player.pastTeams ? JSON.stringify(player.pastTeams) : '[]',
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
    
    // Supabase хранилище инициализировано
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
    
    console.log('📊 Загружено игроков из базы:', data?.length || 0);
    
    // Преобразуем данные из Supabase в формат приложения
    const players = (data || []).map(convertSupabaseToPlayer);
    
    // Логируем информацию об аватарах и фотографиях
    players.forEach(player => {
      console.log(`👤 ${player.name}:`);
      console.log(`   ID: ${player.id}`);
      console.log(`   Аватар: ${player.avatar ? 'есть' : 'нет'} (${player.avatar || 'null'})`);
      
      // Проверяем фотографии
      if (player.photos && player.photos.length > 0) {
        console.log(`   Фотографии: ${player.photos.length} шт.`);
        player.photos.forEach((photo, index) => {
          console.log(`     Фото ${index + 1}: ${photo}`);
        });
      } else {
        console.log(`   Фотографии: нет`);
      }
      console.log('');
    });
    
    return players;
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
    // Добавляем игрока
    
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
    
    // Игрок добавлен
    return convertSupabaseToPlayer(data);
  } catch (error) {
    console.error('❌ Ошибка добавления игрока:', error);
    throw error;
  }
};

// Обновление игрока
export const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  try {
    // Обновление игрока в Supabase
          // Логи обновления убраны для чистоты консоли
    // Функция для конвертации даты из MM.YYYY в YYYY-MM-DD
    const convertDate = (dateString?: string): string | undefined => {
      if (!dateString) return undefined;
      
      // Проверяем, если дата уже в формате YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Конвертируем из MM.YYYY в YYYY-MM-DD
      const parts = dateString.split('.');
      if (parts.length === 2) {
        const [month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-01`; // Добавляем день 01
      }
      
      // Конвертируем из DD.MM.YYYY в YYYY-MM-DD (для обратной совместимости)
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return dateString; // Возвращаем как есть, если формат не распознан
    };

    // Преобразуем обновления в формат Supabase
    const supabaseUpdates: Partial<SupabasePlayer> = {};
    
    if (updates.height) supabaseUpdates.height = parseInt(updates.height) || 0;
    if (updates.weight) supabaseUpdates.weight = parseInt(updates.weight) || 0;
    if (updates.birthDate) supabaseUpdates.birth_date = convertDate(updates.birthDate);
    if (updates.hockeyStartDate !== undefined) supabaseUpdates.hockey_start_date = convertDate(updates.hockeyStartDate);
    if (updates.experience) supabaseUpdates.experience = parseInt(updates.experience) || 0;
    if (updates.goals) supabaseUpdates.goals = parseInt(updates.goals) || 0;
    if (updates.assists) supabaseUpdates.assists = parseInt(updates.assists) || 0;
    if (updates.games) supabaseUpdates.games = parseInt(updates.games) || 0;
    if (updates.pullUps !== undefined) supabaseUpdates.pull_ups = parseInt(updates.pullUps) || 0;
    if (updates.pushUps !== undefined) supabaseUpdates.push_ups = parseInt(updates.pushUps) || 0;
    if (updates.plankTime !== undefined) supabaseUpdates.plank_time = parseInt(updates.plankTime) || 0;
    if (updates.sprint100m !== undefined) supabaseUpdates.sprint_100m = parseFloat(updates.sprint100m) || 0;
    if (updates.longJump !== undefined) supabaseUpdates.long_jump = parseInt(updates.longJump) || 0;
    if (updates.favoriteGoals !== undefined) supabaseUpdates.favorite_goals = updates.favoriteGoals;
    if (updates.photos !== undefined) supabaseUpdates.photos = updates.photos && updates.photos.length > 0 ? JSON.stringify(updates.photos) : '[]';
    if (updates.number !== undefined) supabaseUpdates.number = updates.number;
    
    // Обрабатываем достижения (конвертируем массив в JSON строку)
    if (updates.achievements !== undefined) {
      supabaseUpdates.achievements = JSON.stringify(updates.achievements);
    }
    
    // Обрабатываем прошлые команды (конвертируем массив в JSON строку)
    if (updates.pastTeams !== undefined) {
      supabaseUpdates.past_teams = JSON.stringify(updates.pastTeams);
    }
    
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
      phone: updates.phone,
      city: updates.city,
      country: updates.country,
      grip: updates.grip
    });
    
    console.log('📤 Данные для обновления в Supabase:', JSON.stringify(supabaseUpdates, null, 2));
    
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
    
    // Игрок успешно обновлен в Supabase
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
    // Загрузка текущего пользователя
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const userData = await AsyncStorage.getItem('hockeystars_current_user');
    
    if (!userData) {
      return null;
    }
    
    const user = JSON.parse(userData);
    
    // Загружаем актуальные данные из Supabase
    if (user && user.id) {
      // Загружаем актуальные данные из Supabase для пользователя
      const updatedUser = await getPlayerById(user.id);
      if (updatedUser) {
        // Получены актуальные данные из Supabase
        // Логи нормативов убраны для чистоты консоли
        // Обновляем данные в AsyncStorage
        await saveCurrentUser(updatedUser);
        return updatedUser;
      } else {
        // Не удалось получить актуальные данные из Supabase
      }
    }
    
    // Возвращаем данные из AsyncStorage
    return user;
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

// Получение диалога между двумя пользователями
export const getConversation = async (userId1: string, userId2: string): Promise<Message[]> => {
  try {
    const messages = await getMessages(userId1, userId2);
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error('❌ Ошибка загрузки диалога:', error);
    return [];
  }
};

// Упрощенная отправка сообщения
export const sendMessageSimple = async (senderId: string, receiverId: string, text: string): Promise<boolean> => {
  try {
    const message = {
      senderId,
      receiverId,
      text,
      read: false
    };
    
    await sendMessage(message);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    return false;
  }
};

// Отметка сообщений как прочитанные
export const markMessagesAsRead = async (userId: string, otherUserId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .eq('read', false);
    
    if (error) {
      console.error('❌ Ошибка отметки сообщений как прочитанные:', error);
    }
  } catch (error) {
    console.error('❌ Ошибка отметки сообщений как прочитанные:', error);
  }
};

// Получение всех диалогов пользователя
export const getUserConversations = async (userId: string): Promise<Record<string, Message[]>> => {
  try {
    // Получаем все сообщения пользователя
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Ошибка получения диалогов:', error);
      return {};
    }
    
    // Группируем сообщения по собеседникам
    const conversations: Record<string, Message[]> = {};
    
    (data || []).forEach(msg => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = [];
      }
      
      conversations[otherUserId].push({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        text: msg.text,
        timestamp: new Date(msg.created_at),
        read: msg.read
      });
    });
    
    return conversations;
  } catch (error) {
    console.error('❌ Ошибка получения диалогов пользователя:', error);
    return {};
  }
};

// Отправка запроса дружбы
export const sendFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    console.log('🔔 Отправка запроса дружбы от', fromId, 'к', toId);
    
    // Получаем данные отправителя для уведомления
    const { data: senderData } = await supabase
      .from('players')
      .select('name')
      .eq('id', fromId)
      .single();
    
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
      return false;
    }
    
    // Создаем уведомление для получателя
    if (senderData) {
      try {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            user_id: toId,
            type: 'friend_request',
            title: 'Новый запрос дружбы',
            message: `${senderData.name} хочет добавить вас в друзья`,
            is_read: false,
            data: { from_id: fromId, request_id: data.id }
          }]);
        
        if (notificationError) {
          console.error('❌ Ошибка создания уведомления:', notificationError);
        } else {
          console.log('✅ Уведомление о запросе дружбы создано');
        }
      } catch (notificationError) {
        console.error('❌ Ошибка создания уведомления:', notificationError);
      }
    }
    
    console.log('✅ Запрос дружбы отправлен успешно');
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки запроса дружбы:', error);
    return false;
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
export const acceptFriendRequest = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .or(`and(from_id.eq.${userId1},to_id.eq.${userId2}),and(from_id.eq.${userId2},to_id.eq.${userId1})`)
      .eq('status', 'pending');
    
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
export const declineFriendRequest = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .or(`and(from_id.eq.${userId1},to_id.eq.${userId2}),and(from_id.eq.${userId2},to_id.eq.${userId1})`)
      .eq('status', 'pending');
    
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

// Отмена запроса дружбы (удаление записи)
export const cancelFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(from_id.eq.${fromId},to_id.eq.${toId}),and(from_id.eq.${toId},to_id.eq.${fromId})`)
      .eq('status', 'pending');
    
    if (error) {
      console.error('❌ Ошибка отмены запроса дружбы:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка отмены запроса дружбы:', error);
    return false;
  }
};

// Удаление из друзей
export const removeFriend = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(from_id.eq.${userId1},to_id.eq.${userId2}),and(from_id.eq.${userId2},to_id.eq.${userId1})`)
      .eq('status', 'accepted');
    
    if (error) {
      console.error('❌ Ошибка удаления из друзей:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления из друзей:', error);
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
    console.log('🔍 getFriendshipStatus вызвана для:', userId1, 'и', userId2);
    
    // Сначала проверяем, есть ли принятый запрос дружбы (друзья)
    const { data: friendsData, error: friendsError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_id.eq.${userId1},to_id.eq.${userId2},status.eq.accepted),and(from_id.eq.${userId2},to_id.eq.${userId1},status.eq.accepted)`)
      .maybeSingle();
    
    if (friendsData) {
      console.log('🔍 Найдены друзья:', friendsData);
      return 'friends';
    }
    
    // Проверяем, отправил ли userId1 запрос userId2
    const { data: sentData, error: sentError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_id', userId1)
      .eq('to_id', userId2)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (sentData) {
      console.log('🔍 userId1 отправил запрос userId2:', sentData);
      return 'sent_request';
    }
    
    // Проверяем, получил ли userId1 запрос от userId2
    const { data: receivedData, error: receivedError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_id', userId2)
      .eq('to_id', userId1)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (receivedData) {
      console.log('🔍 userId1 получил запрос от userId2:', receivedData);
      return 'received_request';
    }
    
    console.log('🔍 Нет запросов дружбы между пользователями');
    return 'none';
  } catch (error) {
    console.error('❌ Ошибка в getFriendshipStatus:', error);
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

// Загрузка уведомлений
export const loadNotifications = async (userId?: string): Promise<any[]> => {
  try {
    if (!userId) {
      const currentUser = await loadCurrentUser();
      if (!currentUser) return [];
      userId = currentUser.id;
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Ошибка загрузки уведомлений:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка загрузки уведомлений:', error);
    return [];
  }
};

// Создание уведомления
export const createNotification = async (notification: any): Promise<any> => {
  try {
    console.log('🔔 Создание уведомления:', notification);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка создания уведомления:', error);
      return null;
    }
    
    console.log('✅ Уведомление создано:', data);
    return data;
  } catch (error) {
    console.error('❌ Ошибка создания уведомления:', error);
    return null;
  }
};

// Отметка уведомления как прочитанного
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    console.log('🔔 Отметка уведомления как прочитанного:', notificationId);
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('❌ Ошибка отметки уведомления:', error);
      return false;
    }
    
    console.log('✅ Уведомление отмечено как прочитанное');
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
      email: 'admin',
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
      
      // Исправляем аватар для каждого администратора
      for (const admin of admins) {
        console.log(`🔧 Проверяем администратора: ${admin.name} (ID: ${admin.id})`);
        console.log(`📸 Текущий аватар: ${admin.avatar}`);
        
        // Если аватар пустой или содержит некорректные данные, очищаем его
        if (!admin.avatar || admin.avatar === '' || admin.avatar === 'admin' || admin.avatar.includes('admin')) {
          console.log('⚠️ Аватар администратора некорректный, очищаем...');
          
          const { error: updateError } = await supabase
            .from('players')
            .update({ avatar: null })
            .eq('id', admin.id);
          
          if (updateError) {
            console.error('❌ Ошибка очистки аватара:', updateError);
          } else {
            console.log('✅ Аватар администратора очищен');
          }
        }
      }
    } else {
      console.log('⚠️ Администраторы не найдены, создаем нового...');
      await createAdmin();
    }
  } catch (error) {
    console.error('❌ Ошибка исправления данных администратора:', error);
  }
};

// Функция для принудительного исправления аватара администратора
export const fixAdminAvatar = async (): Promise<void> => {
  try {
    console.log('🔧 Принудительное исправление аватара администратора...');
    
    // Находим текущего пользователя
    const currentUser = await loadCurrentUser();
    if (!currentUser || currentUser.status !== 'admin') {
      console.log('❌ Текущий пользователь не является администратором');
      return;
    }
    
    console.log(`👑 Исправляем аватар для администратора: ${currentUser.name}`);
    console.log(`📸 Текущий аватар: ${currentUser.avatar}`);
    
    // Очищаем аватар администратора
    const { error } = await supabase
      .from('players')
      .update({ avatar: null })
      .eq('id', currentUser.id);
    
    if (error) {
      console.error('❌ Ошибка очистки аватара:', error);
    } else {
      console.log('✅ Аватар администратора очищен, теперь можно загрузить новый');
      
      // Обновляем текущего пользователя
      const updatedUser = { ...currentUser, avatar: undefined };
      await saveCurrentUser(updatedUser);
    }
  } catch (error) {
    console.error('❌ Ошибка исправления аватара администратора:', error);
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

// Функция для расчета стажа в хоккее
export const calculateHockeyExperience = (startDate?: string): string => {
  // Расчет опыта хоккея для даты
  if (!startDate || startDate === '' || startDate === 'null') {
    return '';
  }
  
  try {
    const [month, year] = startDate.split('.');
    
    if (!month || !year) {
      return '';
    }
    
    const start = new Date(parseInt(year), parseInt(month) - 1);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Правильное склонение для русского языка
    const getYearWord = (num: number): string => {
      if (num === 1) return 'год';
      if (num >= 2 && num <= 4) return 'года';
      return 'лет';
    };
    
    const result = years > 0 ? `${years} ${getYearWord(years)}` : `${months} мес.`;
    return result;
  } catch (error) {
    console.error('❌ Ошибка расчета опыта хоккея:', error);
    return '';
  }
}; 

// Функция для принудительной миграции всех изображений в Storage
export const migrateAllImagesToStorage = async (): Promise<void> => {
  try {
    console.log('🔄 Начинаем принудительную миграцию всех изображений...');
    
    // Загружаем всех игроков
    const players = await loadPlayers();
    console.log(`📊 Найдено игроков для миграции: ${players.length}`);
    
    let migratedCount = 0;
    
    for (const player of players) {
      let hasChanges = false;
      const updates: Partial<Player> = {};
      
      // Мигрируем аватар
      if (player.avatar && (player.avatar.startsWith('file://') || player.avatar.startsWith('content://') || player.avatar.startsWith('data:'))) {
        console.log(`🔄 Мигрируем аватар игрока ${player.name}: ${player.avatar}`);
        const { uploadImageToStorage } = await import('./uploadImage');
        const migratedAvatarUrl = await uploadImageToStorage(player.avatar);
        if (migratedAvatarUrl) {
          updates.avatar = migratedAvatarUrl;
          hasChanges = true;
          console.log(`✅ Аватар игрока ${player.name} мигрирован: ${migratedAvatarUrl}`);
        }
      }
      
      // Мигрируем фотографии
      if (player.photos && player.photos.length > 0) {
        const migratedPhotos = [];
        let photosChanged = false;
        
        for (const photo of player.photos) {
          if (photo.startsWith('file://') || photo.startsWith('content://') || photo.startsWith('data:')) {
            console.log(`🔄 Мигрируем фото игрока ${player.name}: ${photo}`);
            const { uploadImageToStorage } = await import('./uploadImage');
            const migratedUrl = await uploadImageToStorage(photo);
            if (migratedUrl) {
              migratedPhotos.push(migratedUrl);
              photosChanged = true;
              console.log(`✅ Фото игрока ${player.name} мигрировано: ${migratedUrl}`);
            }
          } else {
            migratedPhotos.push(photo);
          }
        }
        
        if (photosChanged) {
          updates.photos = migratedPhotos;
          hasChanges = true;
        }
      }
      
      // Обновляем игрока, если были изменения
      if (hasChanges) {
        const updatedPlayer = await updatePlayer(player.id, updates);
        if (updatedPlayer) {
          migratedCount++;
          console.log(`✅ Игрок ${player.name} обновлен`);
        }
      }
    }
    
    console.log(`🎉 Миграция завершена! Обновлено игроков: ${migratedCount}`);
  } catch (error) {
    console.error('❌ Ошибка миграции изображений:', error);
  }
}; 

// Функция для диагностики состояния изображений
export const diagnoseImages = async (): Promise<void> => {
  try {
    console.log('🔍 Диагностика состояния изображений...');
    
    // Загружаем всех игроков
    const players = await loadPlayers();
    console.log(`📊 Всего игроков: ${players.length}`);
    
    let totalAvatars = 0;
    let localAvatars = 0;
    let storageAvatars = 0;
    let nullAvatars = 0;
    
    let totalPhotos = 0;
    let localPhotos = 0;
    let storagePhotos = 0;
    
    for (const player of players) {
      // Анализируем аватары
      if (player.avatar) {
        totalAvatars++;
        if (player.avatar.startsWith('file://') || player.avatar.startsWith('content://') || player.avatar.startsWith('data:')) {
          localAvatars++;
          console.log(`⚠️ Локальный аватар: ${player.name} - ${player.avatar}`);
        } else if (player.avatar.startsWith('http')) {
          storageAvatars++;
          console.log(`✅ Storage аватар: ${player.name} - ${player.avatar}`);
        }
      } else {
        nullAvatars++;
        console.log(`❌ Нет аватара: ${player.name}`);
      }
      
      // Анализируем фотографии
      if (player.photos && player.photos.length > 0) {
        totalPhotos += player.photos.length;
        for (const photo of player.photos) {
          if (photo.startsWith('file://') || photo.startsWith('content://') || photo.startsWith('data:')) {
            localPhotos++;
            console.log(`⚠️ Локальное фото: ${player.name} - ${photo}`);
          } else if (photo.startsWith('http')) {
            storagePhotos++;
          }
        }
      }
    }
    
    console.log('\n📊 Статистика изображений:');
    console.log(`   Аватары:`);
    console.log(`     Всего: ${totalAvatars}`);
    console.log(`     В Storage: ${storageAvatars}`);
    console.log(`     Локальные: ${localAvatars}`);
    console.log(`     Отсутствуют: ${nullAvatars}`);
    console.log(`   Фотографии:`);
    console.log(`     Всего: ${totalPhotos}`);
    console.log(`     В Storage: ${storagePhotos}`);
    console.log(`     Локальные: ${localPhotos}`);
    
    if (localAvatars > 0 || localPhotos > 0) {
      console.log('\n⚠️ Обнаружены локальные изображения, требующие миграции!');
    } else {
      console.log('\n✅ Все изображения находятся в Storage');
    }
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error);
  }
}; 

// Функция для очистки некорректных данных в базе
export const cleanupDatabaseData = async (): Promise<void> => {
  try {
    console.log('🧹 Начинаем очистку некорректных данных...');
    
    // Получаем всех игроков напрямую из Supabase
    const { data, error } = await supabase
      .from('players')
      .select('*');
    
    if (error) {
      console.error('❌ Ошибка получения данных:', error);
      return;
    }
    
    console.log(`📊 Найдено записей для проверки: ${data?.length || 0}`);
    
    let updatedCount = 0;
    
    for (const player of data || []) {
      const updates: any = {};
      let hasUpdates = false;
      
      // Исправляем пустые JSON поля
      if (player.achievements === 'null' || player.achievements === null) {
        updates.achievements = '[]';
        hasUpdates = true;
        console.log(`🔄 Исправляем achievements для ${player.name}`);
      }
      
      if (player.past_teams === 'null' || player.past_teams === null) {
        updates.past_teams = '[]';
        hasUpdates = true;
        console.log(`🔄 Исправляем past_teams для ${player.name}`);
      }
      
      if (player.photos === 'null' || player.photos === null) {
        updates.photos = '[]';
        hasUpdates = true;
        console.log(`🔄 Исправляем photos для ${player.name}`);
      }
      
      // Обновляем запись, если есть изменения
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('players')
          .update(updates)
          .eq('id', player.id);
        
        if (updateError) {
          console.error(`❌ Ошибка обновления ${player.name}:`, updateError);
        } else {
          updatedCount++;
          console.log(`✅ ${player.name} обновлен`);
        }
      }
    }
    
    console.log(`🎉 Очистка завершена! Обновлено записей: ${updatedCount}`);
  } catch (error) {
    console.error('❌ Ошибка очистки данных:', error);
  }
}; 

// Комбинированная функция для полного исправления проблемы с изображениями
export const fixAllImageIssues = async (): Promise<void> => {
  try {
    console.log('🚀 Начинаем полное исправление проблем с изображениями...');
    
    // Шаг 1: Очистка некорректных данных
    console.log('\n📋 Шаг 1: Очистка некорректных данных...');
    await cleanupDatabaseData();
    
    // Шаг 2: Диагностика текущего состояния
    console.log('\n📋 Шаг 2: Диагностика текущего состояния...');
    await diagnoseImages();
    
    // Шаг 3: Миграция изображений
    console.log('\n📋 Шаг 3: Миграция изображений...');
    await migrateAllImagesToStorage();
    
    // Шаг 4: Финальная диагностика
    console.log('\n📋 Шаг 4: Финальная диагностика...');
    await diagnoseImages();
    
    console.log('\n🎉 Полное исправление завершено!');
  } catch (error) {
    console.error('❌ Ошибка полного исправления:', error);
  }
}; 