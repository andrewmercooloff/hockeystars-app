import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getPlayerById, 
  loadCurrentUser, 
  Player, 
  sendMessage, 
  getConversation, 
  markMessagesAsRead,
  Message 
} from '../../utils/playerStorage';

const iceBg = require('../../assets/images/led.jpg');

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [otherPlayer, setOtherPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Очищаем сообщения при смене чата
    setMessages([]);
    setNewMessage('');
    setLoading(true);
    loadChatData();
  }, [id]);

  useEffect(() => {
    // Автообновление сообщений каждые 5 секунд (увеличили интервал для оптимизации)
    const interval = setInterval(() => {
      if (currentUser && otherPlayer && otherPlayer.id === id) {
        loadMessages();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, otherPlayer, id]);

  // Обработка системной кнопки "назад"
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push('/messages');
        return true; // Предотвращаем стандартное поведение
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );

  const loadChatData = async () => {
    try {
      if (id) {
        const otherPlayerData = await getPlayerById(id as string);
        const userData = await loadCurrentUser();
        
        if (!userData) {
          Alert.alert('Ошибка', 'Необходимо войти в профиль');
          router.push('/login');
          return;
        }

        setOtherPlayer(otherPlayerData);
        setCurrentUser(userData);
        
        if (otherPlayerData) {
          // Сразу загружаем сообщения
          const conversation = await getConversation(userData.id, otherPlayerData.id);
          setMessages(conversation);
          
          // Отмечаем сообщения как прочитанные
          await markMessagesAsRead(userData.id, otherPlayerData.id);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных чата:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные чата');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (currentUser && otherPlayer && otherPlayer.id === id) {
      try {
        const conversation = await getConversation(currentUser.id, otherPlayer.id);
        setMessages(conversation);
      } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !otherPlayer) {
      return;
    }

    try {
      const success = await sendMessage(currentUser.id, otherPlayer.id, newMessage.trim());
      if (success) {
        setNewMessage('');
        await loadMessages();
        // Прокручиваем к последнему сообщению
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Загрузка чата...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (!otherPlayer || !currentUser) {
    return (
      <View style={styles.container}>
        <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Пользователь не найден</Text>
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
          {/* Заголовок чата */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/messages')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Image 
                source={{ uri: otherPlayer.avatar || 'https://via.placeholder.com/40/333/fff?text=Player' }} 
                style={styles.headerAvatar}
              />
              <View style={styles.headerText}>
                <Text style={styles.headerName}>{otherPlayer.name}</Text>
                <Text style={styles.headerStatus}>
                  {otherPlayer.status === 'player' ? 'Игрок' : 
                   otherPlayer.status === 'coach' ? 'Тренер' : 
                   otherPlayer.status === 'scout' ? 'Скаут' : 'Звезда'}
                </Text>
              </View>
            </View>
          </View>

          {/* Сообщения */}
          <KeyboardAvoidingView 
            style={styles.chatContainer} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 132 : 20}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {!loading && messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color="#666" />
                  <Text style={styles.emptyText}>Начните разговор с {otherPlayer.name}</Text>
                </View>
              ) : !loading ? (
                messages.map((message) => {
                  const isMyMessage = message.senderId === currentUser.id;
                  return (
                    <View 
                      key={message.id} 
                      style={[
                        styles.messageContainer,
                        isMyMessage ? styles.myMessage : styles.otherMessage
                      ]}
                    >
                      <View style={[
                        styles.messageBubble,
                        isMyMessage ? styles.myBubble : styles.otherBubble
                      ]}>
                        <Text style={[
                          styles.messageText,
                          isMyMessage ? styles.myMessageText : styles.otherMessageText
                        ]}>
                          {message.text}
                        </Text>
                        <Text style={[
                          styles.messageTime,
                          isMyMessage ? styles.myMessageTime : styles.otherMessageTime
                        ]}>
                          {formatTime(message.timestamp)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : null}
            </ScrollView>

            {/* Поле ввода */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Введите сообщение..."
                placeholderTextColor="#888"
                multiline
                maxLength={500}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  !newMessage.trim() && styles.sendButtonDisabled
                ]} 
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Gilroy-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
  },
  headerStatus: {
    color: '#FF4444',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    marginTop: 12,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 6,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#FF4444',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#000',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 18,
    fontFamily: 'Gilroy-Regular',
    lineHeight: 24,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 68, 68, 0.3)',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    backgroundColor: '#FF4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 68, 68, 0.5)',
  },
}); 