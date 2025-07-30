import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where,
  limit,
  orderBy,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- ТИПЫ ДАННЫХ ---
export type UserStatus = 'player' | 'coach' | 'scout' | 'star';

export interface Player {
  id: string; 
  username: string;
  password?: string;
  email?: string;
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
  friends?: string[];
  sentFriendRequests?: string[];
  receivedFriendRequests?: string[];
  games?: string;
  goals?: string;
  assists?: string;
  points?: string;
  hockeyStartDate?: string;
  photos?: string[];
  pullUps?: string;
  pushUps?: string;
  plankTime?: string;
  sprint100m?: string;
  longJump?: string;
  createdAt?: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Timestamp;
  isRead: boolean;
}

// --- КОНСТАНТЫ ---
const PLAYERS_COLLECTION = 'players';
const MESSAGES_COLLECTION = 'messages';
const CURRENT_USER_KEY = 'hockeystars_current_user_local_v2';

// --- РАБОТА С ИГРОКАМИ (FIRESTORE) ---

export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const playersCollection = collection(firestore, PLAYERS_COLLECTION);
    const q = query(playersCollection, orderBy("name"), limit(100));
    const querySnapshot = await getDocs(q);
    
    const players: Player[] = [];
    querySnapshot.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() } as Player);
    });
    
    console.log(`[Firebase] Загружено ${players.length} игроков.`);
    return players;
  } catch (error) {
    console.error("[Firebase] Ошибка загрузки игроков: ", error);
    return [];
  }
};

export const getPlayerById = async (id: string): Promise<Player | null> => {
  try {
    if (!id) return null;
    const playerDocRef = doc(firestore, PLAYERS_COLLECTION, id);
    const docSnap = await getDoc(playerDocRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Player;
    } else {
      console.log("[Firebase] Игрок с ID", id, "не найден.");
      return null;
    }
  } catch (error) {
    console.error("[Firebase] Ошибка получения игрока по ID: ", error);
    return null;
  }
};

export const addPlayer = async (playerData: Omit<Player, 'id'>): Promise<Player | null> => {
  try {
    const playersCollection = collection(firestore, PLAYERS_COLLECTION);
    const docRef = await addDoc(playersCollection, {
      ...playerData,
      createdAt: Timestamp.now()
    });
    console.log("[Firebase] Новый игрок добавлен с ID: ", docRef.id);
    const newPlayer = { id: docRef.id, ...playerData };
    
    // Если это текущий пользователь, сохраняем в кэш
    if (playerData.username === (await loadCurrentUser())?.username) {
        await saveCurrentUser(newPlayer as Player);
    }
    
    return newPlayer as Player;
  } catch (error) {
    console.error("[Firebase] Ошибка добавления игрока: ", error);
    return null;
  }
};

export const updatePlayer = async (updatedPlayer: Player): Promise<boolean> => {
  try {
    const playerDocRef = doc(firestore, PLAYERS_COLLECTION, updatedPlayer.id);
    await updateDoc(playerDocRef, { ...updatedPlayer });
    console.log(`[Firebase] Данные игрока ${updatedPlayer.id} обновлены.`);
    
    // Обновляем кэш, если это текущий пользователь
    const currentUser = await loadCurrentUser();
    if (currentUser && currentUser.id === updatedPlayer.id) {
        await saveCurrentUser(updatedPlayer);
    }
    
    return true;
  } catch (error) {
    console.error("[Firebase] Ошибка обновления игрока: ", error);
    return false;
  }
};

export const findPlayerByCredentials = async (username: string, password?: string): Promise<Player | null> => {
    try {
        const playersCollection = collection(firestore, PLAYERS_COLLECTION);
        const q = query(playersCollection, where("username", "==", username), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        
        const player = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Player;
        return player;
    } catch (error) {
        console.error("[Firebase] Ошибка поиска игрока: ", error);
        return null;
    }
};

// --- РАБОТА С ТЕКУЩИМ ПОЛЬЗОВАТЕЛЕМ (ЛОКАЛЬНЫЙ КЭШ) ---

export const saveCurrentUser = async (player: Player | null) => {
  try {
    if (player) {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(player));
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error('[Кэш] Ошибка сохранения пользователя:', error);
  }
};

export const loadCurrentUser = async (): Promise<Player | null> => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('[Кэш] Ошибка загрузки пользователя:', error);
    return null;
  }
};

// --- ИНИЦИАЛИЗАЦИЯ ДАННЫХ ---

const initialPlayers: Omit<Player, 'id'>[] = [
    {
        username: 'ovechkin_alex', name: 'Александр Овечкин', status: 'star', country: 'Россия',
        team: 'Washington Capitals', position: 'Нападающий', number: '8', avatar: 'https://www.khl.ru/images/players/25470/366481.jpg'
    },
    {
        username: 'malkin_evgeni', name: 'Евгений Малкин', status: 'star', country: 'Россия',
        team: 'Pittsburgh Penguins', position: 'Нападающий', number: '71', avatar: 'https://www.khl.ru/images/players/25470/366433.jpg'
    },
];

export const initializeStorage = async () => {
  try {
    const playersCollection = collection(firestore, PLAYERS_COLLECTION);
    const q = query(playersCollection, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("[Firebase] База пуста. Загружаем начальных игроков-звезд...");
      const batch = writeBatch(firestore);
      initialPlayers.forEach(playerData => {
        const newPlayerRef = doc(playersCollection);
        batch.set(newPlayerRef, { ...playerData, createdAt: Timestamp.now() });
      });
      await batch.commit();
      console.log("[Firebase] Начальные игроки успешно загружены!");
    } else {
      console.log("[Firebase] База данных уже содержит данные.");
    }
  } catch (error) {
    console.error("[Firebase] Ошибка инициализации хранилища: ", error);
  }
};

/**
 * Однократная выгрузка игроков из старого локального AsyncStorage в Firebase.
 */
export const uploadLocalPlayersToFirebase = async (): Promise<{success: boolean, message: string}> => {
    try {
        console.log("Начинаем выгрузку локальных игроков в Firebase...");
        const oldPlayersData = await AsyncStorage.getItem('hockeystars_players'); // Старый ключ
        if (!oldPlayersData) {
            return { success: true, message: "Локальных игроков для выгрузки не найдено." };
        }
        const localPlayers: Player[] = JSON.parse(oldPlayersData);
        
        const playersCollection = collection(firestore, PLAYERS_COLLECTION);
        const serverSnapshot = await getDocs(query(playersCollection));
        const serverUsernames = new Set(serverSnapshot.docs.map(doc => doc.data().username));

        const playersToUpload = localPlayers.filter(p => !serverUsernames.has(p.username));

        if (playersToUpload.length === 0) {
            return { success: true, message: "Все локальные игроки уже синхронизированы." };
        }
        
        const batch = writeBatch(firestore);
        playersToUpload.forEach(playerData => {
            const { id, ...firebaseData } = playerData; 
            const newPlayerRef = doc(collection(firestore, PLAYERS_COLLECTION));
            batch.set(newPlayerRef, { ...firebaseData, createdAt: Timestamp.now() });
        });

        await batch.commit();
        
        const message = `Успешно выгружено ${playersToUpload.length} новых игроков в Firebase!`;
        return { success: true, message };

    } catch (error) {
        console.error("Ошибка выгрузки в Firebase: ", error);
        return { success: false, message: "Произошла ошибка при выгрузке." };
    }
};

// Заглушки для функций, которые мы пока не реализуем
export const sendFriendRequest = async () => true;
export const acceptFriendRequest = async () => true;
export const declineFriendRequest = async () => true;
export const getFriendshipStatus = async () => 'none';
export const getUnreadMessageCount = async () => 0;
export const calculateHockeyExperience = (startDate?: string): string => {
  if (!startDate) return '';
  try {
    const [month, year] = startDate.split('.');
    const start = new Date(parseInt(year), parseInt(month) - 1);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return years > 0 ? `${years} лет` : `${months} мес.`;
  } catch {
    return '';
  }
}; 