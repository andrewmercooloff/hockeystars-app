import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { firestore } from './firebase';

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
    console.log("[Firebase] Ошибка загрузки игроков (возможно, нет подключения к интернету): ", error);
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
    console.log("[Firebase] Ошибка получения игрока по ID (возможно, нет подключения к интернету): ", error);
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
    console.log("[Firebase] Ошибка добавления игрока (возможно, нет подключения к интернету): ", error);
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
    console.log("[Firebase] Ошибка обновления игрока (возможно, нет подключения к интернету): ", error);
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
        console.log("[Firebase] Ошибка поиска игрока (возможно, нет подключения к интернету): ", error);
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
    console.log('[Кэш] Ошибка сохранения пользователя:', error);
  }
};

export const loadCurrentUser = async (): Promise<Player | null> => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.log('[Кэш] Ошибка загрузки пользователя (возможно, пользователь не авторизован):', error);
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
    console.log("[Firebase] Ошибка инициализации хранилища (возможно, нет подключения к интернету): ", error);
    // Не падаем при ошибке, просто логируем
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
        console.log("Ошибка выгрузки в Firebase (возможно, нет подключения к интернету): ", error);
        return { success: false, message: "Произошла ошибка при выгрузке." };
    }
};

// Функции для работы с друзьями
export const sendFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  console.log('🔧 sendFriendRequest вызвана с:', fromId, '->', toId);
  try {
    const requests = await getFriendRequestsFromStorage();
    console.log('🔧 Текущие запросы:', requests);
    
    const newRequest = {
      id: Date.now().toString(),
      fromId,
      toId,
      status: 'pending',
      timestamp: new Date()
    };
    
    requests.push(newRequest);
    console.log('🔧 Новый запрос:', newRequest);
    console.log('🔧 Обновленные запросы:', requests);
    
    await AsyncStorage.setItem('friend_requests', JSON.stringify(requests));
    
    console.log('✅ Запрос дружбы отправлен');
    return true;
  } catch (error) {
    console.log('❌ Ошибка отправки запроса в друзья:', error);
    return false;
  }
};

export const acceptFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const requestIndex = requests.findIndex(req => req.fromId === fromId && req.toId === toId && req.status === 'pending');
    
    if (requestIndex !== -1) {
      requests[requestIndex].status = 'accepted';
      await AsyncStorage.setItem('friend_requests', JSON.stringify(requests));
      
      // Добавляем дружбу
      const friendships = await getFriendshipsFromStorage();
      friendships.push({ userId1: fromId, userId2: toId });
      await AsyncStorage.setItem('friendships', JSON.stringify(friendships));
      
      console.log('✅ Запрос дружбы принят');
      return true;
    }
    return false;
  } catch (error) {
    console.log('Ошибка принятия запроса в друзья:', error);
    return false;
  }
};

export const declineFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const requestIndex = requests.findIndex(req => req.fromId === fromId && req.toId === toId && req.status === 'pending');
    
    if (requestIndex !== -1) {
      requests[requestIndex].status = 'rejected';
      await AsyncStorage.setItem('friend_requests', JSON.stringify(requests));
      
      console.log('✅ Запрос дружбы отклонен');
      return true;
    }
    return false;
  } catch (error) {
    console.log('Ошибка отклонения запроса в друзья:', error);
    return false;
  }
};

export const getFriendshipStatus = async (userId1: string, userId2: string): Promise<string> => {
  console.log('🔧 getFriendshipStatus вызвана с:', userId1, 'и', userId2);
  try {
    // Проверяем, есть ли уже дружба
    const friendships = await getFriendshipsFromStorage();
    console.log('🔧 Текущие дружбы:', friendships);
    
    const areFriends = friendships.some(friendship => 
      (friendship.userId1 === userId1 && friendship.userId2 === userId2) ||
      (friendship.userId1 === userId2 && friendship.userId2 === userId1)
    );
    
    if (areFriends) {
      console.log('🔧 Найдена дружба, возвращаем "friends"');
      return 'friends';
    }
    
    // Проверяем запросы дружбы
    const requests = await getFriendRequestsFromStorage();
    console.log('🔧 Текущие запросы:', requests);
    
    const sentRequest = requests.find(req => req.fromId === userId1 && req.toId === userId2 && req.status === 'pending');
    if (sentRequest) {
      console.log('🔧 Найден отправленный запрос, возвращаем "sent_request"');
      return 'sent_request';
    }
    
    const receivedRequest = requests.find(req => req.fromId === userId2 && req.toId === userId1 && req.status === 'pending');
    if (receivedRequest) {
      console.log('🔧 Найден полученный запрос, возвращаем "received_request"');
      return 'received_request';
    }
    
    console.log('🔧 Ничего не найдено, возвращаем "none"');
    return 'none';
  } catch (error) {
    console.log('❌ Ошибка получения статуса дружбы:', error);
    return 'none';
  }
};

// Вспомогательные функции
const getFriendRequestsFromStorage = async (): Promise<any[]> => {
  try {
    const requestsData = await AsyncStorage.getItem('friend_requests');
    return requestsData ? JSON.parse(requestsData) : [];
  } catch (error) {
    console.log('Ошибка загрузки запросов дружбы:', error);
    return [];
  }
};

const getFriendshipsFromStorage = async (): Promise<any[]> => {
  try {
    const friendshipsData = await AsyncStorage.getItem('friendships');
    return friendshipsData ? JSON.parse(friendshipsData) : [];
  } catch (error) {
    console.log('Ошибка загрузки дружб:', error);
    return [];
  }
};

export const removeFriend = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const friendships = await getFriendshipsFromStorage();
    const updatedFriendships = friendships.filter(friendship => 
      !((friendship.userId1 === userId1 && friendship.userId2 === userId2) ||
        (friendship.userId1 === userId2 && friendship.userId2 === userId1))
    );
    
    await AsyncStorage.setItem('friendships', JSON.stringify(updatedFriendships));
    console.log('✅ Друг удален');
    return true;
  } catch (error) {
    console.log('Ошибка удаления друга:', error);
    return false;
  }
};

export const cancelFriendRequest = async (fromId: string, toId: string): Promise<boolean> => {
  try {
    const requests = await getFriendRequestsFromStorage();
    const updatedRequests = requests.filter(req => 
      !(req.fromId === fromId && req.toId === toId && req.status === 'pending')
    );
    
    await AsyncStorage.setItem('friend_requests', JSON.stringify(updatedRequests));
    console.log('✅ Запрос дружбы отменен');
    return true;
  } catch (error) {
    console.log('Ошибка отмены запроса дружбы:', error);
    return false;
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
    console.log('Ошибка получения друзей:', error);
    return [];
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
    console.log('Ошибка получения полученных запросов дружбы:', error);
    return [];
  }
};

// Функции для уведомлений
export const loadNotifications = async (userId?: string): Promise<any[]> => {
  try {
    const notificationsData = await AsyncStorage.getItem('notifications');
    const notifications = notificationsData ? JSON.parse(notificationsData) : [];
    return userId ? notifications.filter((n: any) => n.userId === userId) : notifications;
  } catch (error) {
    console.log('Ошибка загрузки уведомлений:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notifications = await loadNotifications();
    const updatedNotifications = notifications.map((notification: any) => 
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    );
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  } catch (error) {
    console.log('Ошибка отметки уведомления как прочитанного:', error);
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notifications = await loadNotifications();
    const updatedNotifications = notifications.filter((notification: any) => notification.id !== notificationId);
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  } catch (error) {
    console.log('Ошибка удаления уведомления:', error);
  }
};

// Функции для сообщений
export const sendMessage = async (senderId: string, receiverId: string, text: string): Promise<any> => {
  try {
    const messages = await getMessagesFromStorage();
    const newMessage = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      text,
      timestamp: new Date(),
      isRead: false
    };
    
    messages.push(newMessage);
    await AsyncStorage.setItem('messages', JSON.stringify(messages));
    
    console.log('✅ Сообщение отправлено');
    return newMessage;
  } catch (error) {
    console.log('Ошибка отправки сообщения:', error);
    throw error;
  }
};

export const getMessages = async (userId1: string, userId2: string): Promise<any[]> => {
  try {
    const messages = await getMessagesFromStorage();
    return messages.filter(msg => 
      (msg.senderId === userId1 && msg.receiverId === userId2) ||
      (msg.senderId === userId2 && msg.receiverId === userId1)
    );
  } catch (error) {
    console.log('Ошибка получения сообщений:', error);
    return [];
  }
};

export const getConversation = async (userId1: string, userId2: string): Promise<any[]> => {
  try {
    const messages = await getMessages(userId1, userId2);
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.log('Ошибка получения диалога:', error);
    return [];
  }
};

const getMessagesFromStorage = async (): Promise<any[]> => {
  try {
    const messagesData = await AsyncStorage.getItem('messages');
    return messagesData ? JSON.parse(messagesData) : [];
  } catch (error) {
    console.log('Ошибка загрузки сообщений:', error);
    return [];
  }
};

export const getUserConversations = async (userId: string): Promise<any[]> => {
  try {
    const messages = await getMessagesFromStorage();
    const userMessages = messages.filter(msg => 
      msg.senderId === userId || msg.receiverId === userId
    );
    
    // Группируем сообщения по собеседникам
    const conversations = new Map();
    userMessages.forEach(msg => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg,
          unreadCount: 0
        });
      } else {
        const conv = conversations.get(otherUserId);
        if (new Date(msg.timestamp) > new Date(conv.lastMessage.timestamp)) {
          conv.lastMessage = msg;
        }
      }
      
      // Подсчитываем непрочитанные сообщения
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversations.get(otherUserId);
        conv.unreadCount++;
      }
    });
    
    return Array.from(conversations.values());
  } catch (error) {
    console.log('Ошибка получения диалогов пользователя:', error);
    return [];
  }
};
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const messages = await getMessagesFromStorage();
    const unreadMessages = messages.filter(msg => 
      msg.receiverId === userId && !msg.isRead
    );
    return unreadMessages.length;
  } catch (error) {
    console.log('Ошибка получения количества непрочитанных сообщений:', error);
    return 0;
  }
};
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
  } catch (error) {
    console.log('Ошибка расчета опыта хоккея:', error);
    return '';
  }
}; 