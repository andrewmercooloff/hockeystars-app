import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PageWrapper from '../components/PageWrapper';
import {
    getUserConversations,
    loadCurrentUser,
    Message,
    Player
} from '../utils/playerStorage';

interface ChatPreview {
  player: Player;
  lastMessage: Message | null;
  unreadCount: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [conversations, setConversations] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const convos = await getUserConversations(currentUser.id);
      setConversations(convos);
    } catch (error) {
      console.error('❌ Ошибка загрузки диалогов:', error);
    }
  }, [currentUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        setLoading(true);
        const user = await loadCurrentUser();
        setCurrentUser(user);
        
        if (user) {
          await loadConversations();
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации экрана сообщений:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeScreen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadConversations();
      }
    }, [currentUser, loadConversations])
  );

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'только что';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}ч назад`;
    } else {
      return messageTime.toLocaleDateString('ru-RU');
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Сообщения" showBottomNav={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка сообщений...</Text>
        </View>
      </PageWrapper>
    );
  }

  if (!currentUser) {
    return (
      <PageWrapper title="Сообщения" showBottomNav={false}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#FF4444" />
          <Text style={styles.errorTitle}>Требуется авторизация</Text>
          <Text style={styles.errorMessage}>
            Для просмотра сообщений необходимо войти в систему
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Ionicons name="log-in" size={20} color="#fff" />
            <Text style={styles.loginButtonText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Сообщения" showBottomNav={false}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#fff']}
          />
        }
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Нет сообщений</Text>
            <Text style={styles.emptyMessage}>
              Начните общение с другими игроками!
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.player.id}
              style={styles.conversationItem}
              onPress={() => router.push(`/chat/${conversation.player.id}`)}
            >
              <View style={styles.avatarContainer}>
                {conversation.player.avatar ? (
                  <Image 
                    source={{ uri: conversation.player.avatar }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={30} color="#fff" />
                  </View>
                )}
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.playerName}>{conversation.player.name}</Text>
                  {conversation.lastMessage && (
                    <Text style={styles.messageTime}>
                      {formatTime(conversation.lastMessage.timestamp)}
                    </Text>
                  )}
                </View>
                
                {conversation.lastMessage ? (
                  <Text 
                    style={[
                      styles.lastMessage,
                      conversation.unreadCount > 0 && styles.unreadMessage
                    ]}
                    numberOfLines={2}
                  >
                    {conversation.lastMessage.text}
                  </Text>
                ) : (
                  <Text style={styles.noMessages}>Нет сообщений</Text>
                )}
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginTop: 20,
  },
  emptyMessage: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Gilroy-Bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  playerName: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
  },
  unreadMessage: {
    color: '#fff',
    fontFamily: 'Gilroy-Bold',
  },
  noMessages: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
    fontStyle: 'italic',
  },
}); 