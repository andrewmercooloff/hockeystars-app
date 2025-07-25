import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  loadCurrentUser, 
  getUserConversations, 
  getPlayerById,
  getUnreadMessageCount,
  loadNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
  Player,
  Message,
  Notification
} from '../utils/playerStorage';

const iceBg = require('../assets/images/led.jpg');

interface NotificationItem {
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

export default function NotificationsScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotificationsData();
  }, []);

  const loadNotificationsData = async () => {
    try {
      const user = await loadCurrentUser();
      if (!user) {
        Alert.alert('Ошибка', 'Необходимо войти в профиль');
        router.push('/login');
        return;
      }

      setCurrentUser(user);
      
      // Загружаем все уведомления из хранилища
      const storedNotifications = await loadNotifications();
      
      // Фильтруем уведомления, которые относятся к текущему пользователю
      const userNotifications = storedNotifications.filter(notification => {
        // Уведомления о запросах дружбы показываем только если они предназначены для этого пользователя
        if (notification.type === 'friend_request') {
          return notification.receiverId === user.id;
        }
        // Уведомления о сообщениях показываем только если они для этого пользователя
        if (notification.type === 'message') {
          return notification.playerId && notification.playerId !== user.id;
        }
        return true;
      });
      
      // Создаем уведомления на основе непрочитанных сообщений (только если их нет в хранилище)
      const conversations = await getUserConversations(user.id);
      const messageNotifications: NotificationItem[] = [];
      
      for (const [otherUserId, messages] of Object.entries(conversations)) {
        const unreadMessages = messages.filter(m => 
          m.receiverId === user.id && !m.isRead
        );
        
        if (unreadMessages.length > 0) {
          const otherPlayer = await getPlayerById(otherUserId);
          if (otherPlayer) {
            const lastUnreadMessage = unreadMessages[unreadMessages.length - 1];
            
            // Проверяем, нет ли уже такого уведомления в хранилище
            const existingNotification = userNotifications.find(n => 
              n.type === 'message' && n.playerId === otherUserId
            );
            
            if (!existingNotification) {
              messageNotifications.push({
                id: `msg_${otherUserId}_${lastUnreadMessage.timestamp}`,
                type: 'message',
                title: `Новое сообщение от ${otherPlayer.name}`,
                message: lastUnreadMessage.text.length > 50 
                  ? lastUnreadMessage.text.substring(0, 50) + '...' 
                  : lastUnreadMessage.text,
                timestamp: lastUnreadMessage.timestamp,
                isRead: false,
                playerId: otherUserId,
                playerName: otherPlayer.name,
                playerAvatar: otherPlayer.avatar || undefined
              });
            }
          }
        }
      }
      
      // Объединяем уведомления из хранилища и сообщения
      const allNotifications = [...userNotifications, ...messageNotifications];
      
      // Сортируем по времени (новые сверху)
      allNotifications.sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotificationsData();
  };

  const openChat = (playerId: string) => {
    router.push({ pathname: '/chat/[id]', params: { id: playerId } });
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    try {
      // Отмечаем уведомление как прочитанное
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        // Обновляем локальное состояние
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }

      // Выполняем действие в зависимости от типа уведомления
      if (notification.type === 'message' && notification.playerId) {
        openChat(notification.playerId);
      } else if (notification.type === 'friend_request' && notification.playerId) {
        // Переходим к профилю игрока для принятия/отклонения запроса
        router.push(`/player/${notification.playerId}`);
      }
    } catch (error) {
      console.error('Ошибка обработки уведомления:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Только что';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} мин назад`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ч назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return 'chatbubble';
      case 'friend_request':
        return 'person-add';
      case 'system':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Загрузка уведомлений...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
        <View style={styles.overlay}>
          {/* Заголовок */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Уведомления</Text>
              {currentUser && (
                <Text style={styles.headerSubtitle}>
                  {notifications.length} новых уведомлений
                </Text>
              )}
            </View>
            {/* Кнопка очистки уведомлений */}
            {notifications.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={async () => {
                  try {
                    await clearAllNotifications();
                    setNotifications([]);
                    Alert.alert('Успешно', 'Все уведомления очищены');
                  } catch (error) {
                    console.error('Ошибка очистки уведомлений:', error);
                    Alert.alert('Ошибка', 'Не удалось очистить уведомления');
                  }
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#FF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Список уведомлений */}
          <ScrollView 
            style={styles.notificationsContainer}
            contentContainerStyle={styles.notificationsContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF4444"
                colors={["#FF4444"]}
              />
            }
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyContent}>
                  <Ionicons name="notifications-outline" size={64} color="#FF4444" />
                  <Text style={styles.emptyTitle}>Нет уведомлений</Text>
                  <Text style={styles.emptySubtitle}>
                    У вас пока нет новых уведомлений
                  </Text>
                </View>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationItem}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationIcon}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={24} 
                      color="#FF4444" 
                    />
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.timestamp)}
                      </Text>
                    </View>
                    
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    
                    {notification.playerAvatar && (
                      <View style={styles.playerInfo}>
                        <Image 
                          source={{ uri: notification.playerAvatar }} 
                          style={styles.playerAvatar}
                        />
                        <Text style={styles.playerName}>
                          {notification.playerName}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {!notification.isRead && (
                    <View style={styles.unreadDot} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Gilroy-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
  },
  notificationsContainer: {
    flex: 1,
  },
  notificationsContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#FF4444',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
  },
  notificationMessage: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  playerName: {
    color: '#FF4444',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginLeft: 8,
    marginTop: 4,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 