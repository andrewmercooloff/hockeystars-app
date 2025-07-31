import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    getPlayerById,
    getUserConversations,
    loadCurrentUser,
    Message,
    Player
} from '../utils/playerStorage';

const iceBg = require('../assets/images/led.jpg');

interface ChatPreview {
  player: Player;
  lastMessage: Message | null;
  unreadCount: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  // Обновляем список сообщений при фокусе на экране
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Экран сообщений получил фокус, обновляем данные...');
      loadChats();
    }, [])
  );

  const loadChats = async () => {
    try {
      const user = await loadCurrentUser();
      if (!user) {
        Alert.alert('Ошибка', 'Необходимо войти в профиль');
        router.push('/login');
        return;
      }

      // Загружаем чаты для пользователя
      setCurrentUser(user);
      const conversations = await getUserConversations(user.id);
              // Получены беседы
      
      const chatPreviews: ChatPreview[] = [];
      
      for (const [otherUserId, messages] of Object.entries(conversations)) {
        if (messages.length > 0) {
          const otherPlayer = await getPlayerById(otherUserId);
          if (otherPlayer) {
            const lastMessage = messages[messages.length - 1];
            
            // Подсчитываем непрочитанные сообщения только для этой беседы
            const unreadCount = messages.filter(m => 
              m.receiverId === user.id && !m.isRead
            ).length;
            
            // Обрабатываем беседу
            
            chatPreviews.push({
              player: otherPlayer,
              lastMessage,
              unreadCount
            });
          }
        }
      }
      
              // Создано превью чатов
      
      // Сортируем по времени последнего сообщения
      chatPreviews.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.timestamp - a.lastMessage.timestamp;
      });
      
      setChats(chatPreviews);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить чаты');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const openChat = (playerId: string) => {
    router.push({ pathname: '/chat/[id]', params: { id: playerId } });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const formatLastMessage = (message: Message, currentUserId: string) => {
    const isMyMessage = message.senderId === currentUserId;
    const prefix = isMyMessage ? 'Вы: ' : '';
    const text = message.text.length > 30 
      ? message.text.substring(0, 30) + '...' 
      : message.text;
    return prefix + text;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Загрузка чатов...</Text>
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
            <Text style={styles.headerTitle}>Сообщения</Text>
            {currentUser && (
              <Text style={styles.headerSubtitle}>
                {currentUser.name}
              </Text>
            )}
          </View>

          {/* Список чатов */}
          <ScrollView 
            style={styles.chatsContainer}
            contentContainerStyle={styles.chatsContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF4444"
                colors={["#FF4444"]}
              />
            }
          >
            {chats.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyContent}>
                  <Ionicons name="chatbubble-outline" size={64} color="#FF4444" />
                  <Text style={styles.emptyTitle}>Нет сообщений</Text>
                  <Text style={styles.emptySubtitle}>
                    Начните общение с другими игроками
                  </Text>
                </View>
              </View>
            ) : (
              chats.map((chat) => (
                <TouchableOpacity
                  key={chat.player.id}
                  style={styles.chatItem}
                  onPress={() => openChat(chat.player.id)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={{ 
                      uri: chat.player.avatar || 'https://via.placeholder.com/50/333/fff?text=Player' 
                    }} 
                    style={styles.chatAvatar}
                  />
                  
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatName}>{chat.player.name}</Text>
                      {chat.lastMessage && (
                        <Text style={styles.chatTime}>
                          {formatTime(chat.lastMessage.timestamp)}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.chatPreview}>
                      <Text style={styles.chatLastMessage}>
                        {chat.lastMessage 
                          ? formatLastMessage(chat.lastMessage, currentUser!.id)
                          : 'Нет сообщений'
                        }
                      </Text>
                      
                      {chat.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadCount}>
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.chatStatus}>
                      {chat.player.status === 'player' ? 'Игрок' : 
                       chat.player.status === 'coach' ? 'Тренер' : 
                       chat.player.status === 'scout' ? 'Скаут' : 
                       chat.player.status === 'admin' ? 'Техподдержка' : 'Звезда'}
                    </Text>
                  </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
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
  chatsContainer: {
    flex: 1,
  },
  chatsContent: {
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
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
  },
  chatTime: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatLastMessage: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Gilroy-Bold',
  },
  chatStatus: {
    color: '#FF4444',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
  },
}); 