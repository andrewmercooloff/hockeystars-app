import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ImageBackground,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    acceptFriendRequest,
    declineFriendRequest,
    getReceivedFriendRequests,
    loadCurrentUser,
    loadNotifications,
    Player
} from '../utils/playerStorage';

const iceBg = require('../assets/images/led.jpg');

interface NotificationItem {
  id: string;
  type: 'friend_request' | 'autograph_request' | 'stick_request' | 'system' | 'achievement' | 'team_invite';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  playerId?: string;
  playerName?: string;
  playerAvatar?: string;
  receiverId?: string;
}

interface FriendRequestItem {
  id: string;
  type: 'friend_request';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  receiverId: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotificationsData();
  }, []);

  // Обновляем уведомления при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadNotificationsData();
    }, [])
  );

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
      const storedNotifications = await loadNotifications(user.id);
      
      // Фильтруем уведомления, которые относятся к текущему пользователю
      // Исключаем уведомления о сообщениях
      const userNotifications = storedNotifications.filter(notification => {
        // Уведомления о запросах дружбы показываем только если они предназначены для этого пользователя
        if (notification.type === 'friend_request') {
          return notification.receiverId === user.id;
        }
        // Уведомления о автографах, клюшках и других действиях
        if (notification.type === 'autograph_request' || 
            notification.type === 'stick_request' || 
            notification.type === 'achievement' || 
            notification.type === 'team_invite' || 
            notification.type === 'system') {
          return notification.receiverId === user.id || notification.playerId === user.id;
        }
        return false; // Исключаем все остальные типы (включая message)
      });
      
      // Сортируем по времени (новые сверху)
      userNotifications.sort((a, b) => b.timestamp - a.timestamp);
      
      // Загружаем запросы в друзья
      const receivedFriendRequests = await getReceivedFriendRequests(user.id);
      const friendRequestItems: FriendRequestItem[] = receivedFriendRequests.map(player => ({
        id: `friend_request_${player.id}`,
        type: 'friend_request',
        title: 'Запрос в друзья',
        message: `${player.name} хочет добавить вас в друзья`,
        timestamp: Date.now(), // Используем текущее время, так как в friend_requests нет timestamp
        isRead: false,
        playerId: player.id,
        playerName: player.name,
        playerAvatar: player.avatar,
        receiverId: user.id
      }));
      
      setNotifications(userNotifications);
      setFriendRequests(friendRequestItems);
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

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Обработка нажатия на уведомление
    if (notification.type === 'friend_request') {
      // Для запросов в друзья показываем профиль игрока
      if (notification.playerId) {
        router.push(`/player/${notification.playerId}`);
      }
    } else if (notification.type === 'autograph_request' || notification.type === 'stick_request') {
      // Для запросов автографов и клюшек показываем профиль игрока
      if (notification.playerId) {
        router.push(`/player/${notification.playerId}`);
      }
    }
  };

  const handleFriendRequest = async (request: FriendRequestItem, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await acceptFriendRequest(request.playerId, request.receiverId);
        Alert.alert('Успех', 'Запрос в друзья принят!');
      } else {
        await declineFriendRequest(request.playerId, request.receiverId);
        Alert.alert('Успех', 'Запрос в друзья отклонен');
      }
      
      // Обновляем список запросов
      setFriendRequests(prev => prev.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Ошибка обработки запроса в друзья:', error);
      Alert.alert('Ошибка', 'Не удалось обработать запрос в друзья');
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
      case 'friend_request':
        return 'person-add';
      case 'autograph_request':
        return 'create';
      case 'stick_request':
        return 'key';
      case 'achievement':
        return 'trophy';
      case 'team_invite':
        return 'people';
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
          {/* Заголовок страницы */}
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Уведомления</Text>
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
            {friendRequests.map((request) => (
              <View key={request.id} style={styles.friendRequestItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="people" size={24} color="#FF4444" />
                </View>
                
                <View style={styles.friendRequestContent}>
                  <View style={styles.friendRequestHeader}>
                    <Text style={styles.friendRequestTitle} numberOfLines={1} ellipsizeMode="tail">
                      {request.title}
                    </Text>
                    <Text style={styles.friendRequestTime}>
                      {formatTime(request.timestamp)}
                    </Text>
                  </View>
                  
                  <View style={styles.friendRequestMessageRow}>
                    {request.playerAvatar && (
                      <Image 
                        source={{ uri: request.playerAvatar }} 
                        style={styles.friendRequestAvatar}
                      />
                    )}
                    <Text style={styles.friendRequestMessage}>
                      {request.message}
                    </Text>
                  </View>
                  
                  <View style={styles.friendRequestActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleFriendRequest(request, 'accept')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.acceptButtonText}>Принять</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineButton]}
                      onPress={() => handleFriendRequest(request, 'decline')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.declineButtonText}>Отклонить</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            {/* Обычные уведомления */}
            {notifications.length > 0 && friendRequests.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Другие уведомления</Text>
              </View>
            )}
            
            {notifications.map((notification) => (
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
                    <Text style={styles.notificationTitle} numberOfLines={1} ellipsizeMode="tail">
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTime(notification.timestamp)}
                    </Text>
                  </View>
                  
                  <Text style={styles.notificationMessage} numberOfLines={3} ellipsizeMode="tail">
                    {notification.message}
                  </Text>
                  
                  {notification.playerAvatar && (
                    <View style={styles.playerInfo}>
                      <Image 
                        source={{ uri: notification.playerAvatar }} 
                        style={styles.playerAvatar}
                      />
                      <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
                        {notification.playerName}
                      </Text>
                    </View>
                  )}
                </View>
                
                {!notification.isRead && (
                  <View style={styles.unreadDot} />
                )}
              </TouchableOpacity>
            ))}
            
            {/* Показываем пустое состояние только если нет ни уведомлений, ни запросов в друзья */}
            {notifications.length === 0 && friendRequests.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyContent}>
                  <Ionicons name="notifications-outline" size={64} color="#FF4444" />
                  <Text style={styles.emptyTitle}>Нет уведомлений</Text>
                  <Text style={styles.emptySubtitle}>
                    У вас пока нет уведомлений о дружбе, автографах или других действиях
                  </Text>
                </View>
              </View>
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
  pageHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    flex: 1,
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
    padding: 20, // Точно такой же padding как в сообщениях
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
    marginHorizontal: 16, // Такая же ширина как у элементов чатов
  },
  emptyTitle: {
    color: '#FFFFFF', // Изменили с #fff на #FFFFFF (белый)
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#FFFFFF', // Изменили с #FF4444 на #FFFFFF (белый)
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    textAlign: 'center',
    paddingHorizontal: 20, // Точно такой же paddingHorizontal как в сообщениях
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
    minHeight: 80,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 60,
    paddingRight: 120,
    flexShrink: 1,
    flexDirection: 'column',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginRight: 8,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    flex: 1,
    marginRight: 8,
    maxWidth: '70%',
    flexShrink: 1,
  },
  notificationTime: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    marginLeft: 8,
    flexShrink: 0,
    textAlign: 'right',
  },
  notificationMessage: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    lineHeight: 22,
    marginBottom: 8,
    flexShrink: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexShrink: 1,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    flexShrink: 0,
  },
  playerName: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    flexShrink: 1,
    flex: 1,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
    marginLeft: 12,
    marginTop: 4,
    flexShrink: 0,
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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
  },
  friendRequestItem: {
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
  friendRequestActions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
  },
  declineButton: {
    backgroundColor: '#FF4444',
    borderWidth: 1,
    borderColor: '#FF4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
  },
  // Новые стили для запросов в друзья
  friendRequestContent: {
    flex: 1,
    flexDirection: 'column',
    paddingRight: 16,
  },
  friendRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  friendRequestTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    flex: 1,
    marginRight: 8,
    maxWidth: '70%',
    flexShrink: 1,
  },
  friendRequestTime: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    marginLeft: 8,
    flexShrink: 0,
    textAlign: 'right',
  },
  friendRequestMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'nowrap',
  },
  friendRequestAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    flexShrink: 0,
  },
  friendRequestMessage: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    flex: 1,
    flexShrink: 1,
  },
}); 