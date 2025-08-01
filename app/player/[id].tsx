import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ImageBackground,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import NormativesSection from '../../components/NormativesSection';
import PhotosSection from '../../components/PhotosSection';
import VideoCarousel from '../../components/VideoCarousel';
import YouTubeVideo from '../../components/YouTubeVideo';
import { acceptFriendRequest, cancelFriendRequest, clearAllFriendRequests, createFriendRequestNotification, debugFriendRequests, declineFriendRequest, getFriends, getFriendshipStatus, getPlayerById, loadCurrentUser, Player, removeFriend, sendFriendRequest } from '../../utils/playerStorage';
import { supabase } from '../../utils/supabase';

const iceBg = require('../../assets/images/led.jpg');

export default function PlayerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'friends' | 'sent_request' | 'received_request' | 'none'>('none');
  const [friendLoading, setFriendLoading] = useState(false);
  const [friends, setFriends] = useState<Player[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; timeCode?: string } | null>(null);
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: () => {},
    onCancel: () => {},
    onSecondary: () => {},
    showCancel: false,
    showSecondary: false,
    confirmText: 'OK',
    cancelText: 'Отмена',
    secondaryText: 'Дополнительно'
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  // Локальная функция для расчета опыта в хоккее (временное решение)
  const calculateHockeyExperience = (startDate?: string): string => {
    console.log('🔧 Локальная calculateHockeyExperience вызвана с:', startDate);
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
      
      // Правильное склонение для русского языка
      const getYearWord = (num: number): string => {
        if (num === 1) return 'год';
        if (num >= 2 && num <= 4) return 'года';
        return 'лет';
      };
      
      const result = years > 0 ? `${years} ${getYearWord(years)}` : `${months} мес.`;
      console.log('🔧 Локальная calculateHockeyExperience результат:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка в локальной calculateHockeyExperience:', error);
      return '';
    }
  };

  useEffect(() => {
    loadPlayerData();
  }, [id]);

  // Добавляем обновление при фокусе экрана
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Экран профиля игрока получил фокус, обновляем данные...');
      loadPlayerData();
    }, [id])
  );

  const loadPlayerData = async () => {
    try {
      if (id) {
        const playerData = await getPlayerById(id as string);
        const userData = await loadCurrentUser();
        console.log('Loaded player data:', playerData?.name, 'Status:', playerData?.status, 'Is star:', playerData?.status === 'star');
        console.log('📸 Аватар игрока:', {
          name: playerData?.name,
          hasAvatar: !!playerData?.avatar,
          avatarLength: playerData?.avatar?.length || 0
        });
        setPlayer(playerData);
        setCurrentUser(userData);
        
        // Проверяем статус дружбы, если пользователь авторизован
        if (userData && playerData) {
          // Если пользователь смотрит свой профиль, устанавливаем статус 'friends'
          if (userData.id === playerData.id) {
            console.log('🔍 Пользователь смотрит свой профиль, устанавливаем статус friends');
            setFriendshipStatus('friends');
          } else {
            console.log('🔍 Проверяем статус дружбы между пользователем', userData.name, 'и игроком', playerData.name);
            const friendsStatus = await getFriendshipStatus(userData.id, playerData.id);
            console.log('🔍 Получен статус дружбы:', friendsStatus);
            setFriendshipStatus(friendsStatus);
          }
        }
        
        // Загружаем список друзей игрока
        if (playerData) {
          const friendsList = await getFriends(playerData.id);
          setFriends(friendsList);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных игрока:', error);
      showCustomAlert('Ошибка', 'Не удалось загрузить данные игрока', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlert({ ...alert, visible: false })),
      onCancel: () => {},
      onSecondary: () => {},
      showCancel: false,
      showSecondary: false,
      confirmText: 'OK',
      cancelText: 'Отмена',
      secondaryText: 'Дополнительно'
    });
  };

  const handleSendMessage = () => {
    if (!currentUser) {
      showCustomAlert('Ошибка', 'Необходимо войти в профиль для отправки сообщений', 'error', () => router.push('/login'));
      return;
    }
    
    // Открываем чат с игроком
    router.push({ pathname: '/chat/[id]', params: { id: player!.id } });
  };

  const handleAddFriend = async () => {
    console.log('🔧 handleAddFriend вызвана!');
    console.log('🔧 friendshipStatus:', friendshipStatus);
    console.log('🔧 currentUser.id:', currentUser?.id);
    console.log('🔧 player.id:', player?.id);
    
    if (!currentUser || !player) {
      showCustomAlert('Ошибка', 'Необходимо войти в профиль для добавления в друзья', 'error', () => router.push('/login'));
      return;
    }
    
    setFriendLoading(true);
    try {
      if (friendshipStatus === 'friends') {
        console.log('🔧 Удаляем из друзей');
        // Удаляем из друзей
        const success = await removeFriend(currentUser.id, player.id);
        console.log('🔧 removeFriend результат:', success);
        if (success) {
          setFriendshipStatus('none');
          showCustomAlert('Успешно', `${player.name} удален из друзей`, 'success');
        } else {
          showCustomAlert('Ошибка', 'Не удалось удалить из друзей', 'error');
        }
      } else if (friendshipStatus === 'none') {
        console.log('🔧 Отправляем запрос дружбы');
        // Отправляем запрос дружбы
        const success = await sendFriendRequest(currentUser.id, player.id);
        console.log('🔧 sendFriendRequest результат:', success);
        if (success) {
          setFriendshipStatus('sent_request');
          showCustomAlert('Запрос отправлен', `Запрос дружбы отправлен ${player.name}`, 'success');
        } else {
          showCustomAlert('Ошибка', 'Не удалось отправить запрос дружбы', 'error');
        }
      } else if (friendshipStatus === 'sent' || friendshipStatus === 'sent_request') {
        console.log('🔧 Отменяем запрос');
        // Отменяем запрос
        const success = await cancelFriendRequest(currentUser.id, player.id);
        console.log('🔧 cancelFriendRequest результат:', success);
        if (success) {
          setFriendshipStatus('none');
          showCustomAlert('Запрос отменен', 'Запрос дружбы отменен', 'info');
        } else {
          showCustomAlert('Ошибка', 'Не удалось отменить запрос', 'error');
        }
      } else if (friendshipStatus === 'received_request') {
        console.log('🔧 Принимаем запрос');
        console.log('🔧 Параметры для acceptFriendRequest:', { currentUserId: currentUser.id, playerId: player.id });
        // Принимаем запрос
        const success = await acceptFriendRequest(currentUser.id, player.id);
        console.log('🔧 acceptFriendRequest результат:', success);
        if (success) {
          setFriendshipStatus('friends');
          showCustomAlert('Дружба принята', `${player.name} добавлен в друзья`, 'success');
        } else {
          showCustomAlert('Ошибка', 'Не удалось принять запрос', 'error');
        }
      }
      
      // Обновляем данные игрока после изменения друзей
      await loadPlayerData();
    } catch (error) {
      console.error('❌ Ошибка управления друзьями:', error);
      showCustomAlert('Ошибка', 'Произошла ошибка при управлении друзьями', 'error');
    } finally {
      setFriendLoading(false);
    }
  };

  const handleDeclineFriend = async () => {
    if (!currentUser || !player) {
      showCustomAlert('Ошибка', 'Необходимо войти в профиль', 'error', () => router.push('/login'));
      return;
    }
    
    setFriendLoading(true);
    try {
      const success = await declineFriendRequest(currentUser.id, player.id);
      if (success) {
        setFriendshipStatus('none');
        showCustomAlert('Запрос отклонен', 'Запрос дружбы отклонен', 'info');
      } else {
        showCustomAlert('Ошибка', 'Не удалось отклонить запрос', 'error');
      }
      
      // Обновляем данные игрока после изменения друзей
      await loadPlayerData();
    } catch (error) {
      console.error('Ошибка отклонения запроса дружбы:', error);
      showCustomAlert('Ошибка', 'Произошла ошибка при отклонении запроса', 'error');
    } finally {
      setFriendLoading(false);
    }
  };

  // Функция для парсинга URL и таймкода
  const parseVideoUrl = (input: string): { url: string; timeCode?: string } => {
    const timeMatch = input.match(/\(время:\s*(\d{1,2}:\d{2})\)/);
    const timeCode = timeMatch ? timeMatch[1] : undefined;
    const url = input.replace(/\s*\(время:\s*\d{1,2}:\d{2}\)/, '').trim();
    return { url, timeCode };
  };

  const openYouTubeLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Ошибка', 'Не удалось открыть ссылку');
      });
    }
  };

  const handleRequestAutograph = () => {
    if (!currentUser || !player) {
      showCustomAlert('Ошибка', 'Необходимо войти в профиль для отправки запроса', 'error', () => router.push('/login'));
      return;
    }
    showCustomAlert(
      'Запрос автографа', 
      `Ваш запрос автографа от ${player.name} отправлен! Звезда получит уведомление.`,
      'success'
    );
  };

  const handleRequestStick = () => {
    if (!currentUser || !player) {
      showCustomAlert('Ошибка', 'Необходимо войти в профиль для отправки запроса', 'error', () => router.push('/login'));
      return;
    }
    showCustomAlert(
      'Запрос клюшки', 
      `Ваш запрос клюшки от ${player.name} отправлен! Звезда получит уведомление.`,
      'success'
    );
  };

  const handleDebugFriendRequests = async () => {
    console.log('🔧 Отладка запросов дружбы...');
    await debugFriendRequests();
    showCustomAlert('Отладка', 'Проверьте консоль для информации о запросах дружбы', 'info');
  };

  const handleClearAllFriendRequests = async () => {
    console.log('🔧 Очистка всех запросов дружбы...');
    await clearAllFriendRequests();
    showCustomAlert('Очистка', 'Все запросы дружбы очищены', 'info');
    // Обновляем данные после очистки
    await loadPlayerData();
  };

  const handleTestNotification = async () => {
    if (!currentUser || !player) return;
    
    console.log('🔔 Тестируем создание уведомления...');
    await createFriendRequestNotification(player.id, currentUser.id);
    showCustomAlert('Тест', 'Тестовое уведомление создано', 'info');
  };

  const handleViewAllNotifications = async () => {
    try {
      const notificationsData = await AsyncStorage.getItem('hockeystars_notifications');
      const allNotifications = notificationsData ? JSON.parse(notificationsData) : [];
      console.log('🔔 Все уведомления в системе:', allNotifications);
      showCustomAlert('Отладка', `Всего уведомлений: ${allNotifications.length}`, 'info');
    } catch (error) {
      console.error('❌ Ошибка просмотра уведомлений:', error);
    }
  };

  const handleSendFriendRequestFromPlayer = async () => {
    if (!currentUser || !player) return;
    
    console.log('🔔 Отправляем запрос дружбы от игрока к администратору...');
    try {
      await sendFriendRequest(player.id, currentUser.id);
      showCustomAlert('Успех', 'Запрос дружбы отправлен от имени игрока', 'success');
    } catch (error) {
      console.error('❌ Ошибка отправки запроса дружбы:', error);
      showCustomAlert('Ошибка', 'Не удалось отправить запрос дружбы', 'error');
    }
  };

  const handleTestMessage = async () => {
    if (!currentUser || !player) return;
    
            // Тестируем отправку сообщения
    try {
      const { sendMessageSimple } = await import('../../utils/playerStorage');
      const success = await sendMessageSimple(player.id, currentUser.id, 'Тестовое сообщение от игрока!');
      if (success) {
        showCustomAlert('Успех', 'Тестовое сообщение отправлено', 'success');
      } else {
        showCustomAlert('Ошибка', 'Не удалось отправить сообщение', 'error');
      }
    } catch (error) {
      console.error('❌ Ошибка отправки тестового сообщения:', error);
      showCustomAlert('Ошибка', 'Не удалось отправить сообщение', 'error');
    }
  };

  const handleViewAllMessages = async () => {
    try {
      const messagesData = await AsyncStorage.getItem('hockeystars_messages');
      const allMessages = messagesData ? JSON.parse(messagesData) : [];
              // Все сообщения в системе
      showCustomAlert('Отладка', `Всего сообщений: ${allMessages.length}`, 'info');
    } catch (error) {
      console.error('❌ Ошибка просмотра сообщений:', error);
    }
  };

  const handleRefreshCounters = async () => {
    if (!currentUser) return;
    
    console.log('🔄 Принудительно обновляем счетчики...');
    try {
      const { getUnreadMessageCount } = await import('../../utils/playerStorage');
      const unreadMessagesCount = await getUnreadMessageCount(currentUser.id);
              // Обновленный счетчик непрочитанных сообщений
      showCustomAlert('Обновление', `Непрочитанных сообщений: ${unreadMessagesCount}`, 'info');
    } catch (error) {
      console.error('❌ Ошибка обновления счетчиков:', error);
    }
  };

  const handleDeletePlayer = async () => {
    if (!currentUser || currentUser.status !== 'admin') {
      showCustomAlert('Ошибка', 'Только администратор может удалять пользователей', 'error');
      return;
    }

    if (!player) {
      showCustomAlert('Ошибка', 'Данные игрока не найдены', 'error');
      return;
    }

    // Запрашиваем подтверждение
    showCustomAlert(
      'Удаление пользователя',
      `Вы уверены, что хотите удалить пользователя "${player.name}"? Это действие нельзя отменить.`,
      'warning',
      async () => {
        try {
          console.log('🗑️ Удаляем пользователя:', player.id);
          
          // Удаляем пользователя из базы данных
          const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', player.id);
          
          if (error) {
            console.error('❌ Ошибка удаления пользователя:', error);
            showCustomAlert('Ошибка', 'Не удалось удалить пользователя', 'error');
          } else {
            console.log('✅ Пользователь успешно удален');
            showCustomAlert(
              'Успешно', 
              `Пользователь "${player.name}" удален`,
              'success',
              () => router.push('/')
            );
          }
        } catch (error) {
          console.error('❌ Общая ошибка удаления:', error);
          showCustomAlert('Ошибка', 'Произошла ошибка при удалении пользователя', 'error');
        }
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Загрузка профиля...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.container}>
        <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Игрок не найден</Text>
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
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            


            {/* Фото и основная информация */}
            <View style={styles.profileSection}>
              {(() => {
                const imageSource = player.avatar;
                const hasValidImage = imageSource && typeof imageSource === 'string' && (
                  imageSource.startsWith('data:image/') || 
                  imageSource.startsWith('http') || 
                  imageSource.startsWith('file://') || 
                  imageSource.startsWith('content://')
                );

                if (hasValidImage) {
                  return (
                    <Image 
                      source={{ uri: imageSource }}
                      style={styles.profileImage}
                      onError={() => console.log('Ошибка загрузки изображения')}
                    />
                  );
                } else {
                  return (
                    <View style={[styles.profileImage, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={48} color="#FFFFFF" />
                    </View>
                  );
                }
              })()}
              <View style={styles.nameRow}>
                <Text style={styles.playerName}>{player.name?.toUpperCase()}</Text>
                {player.number && (
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>#{player.number}</Text>
                  </View>
                )}
                {/* Кнопка редактирования для администратора */}
                {currentUser?.status === 'admin' && (
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => {
                      console.log('🔧 Админ редактирует игрока:', player.name);
                      router.push({ pathname: '/admin', params: { editPlayerId: player.id } });
                    }}
                  >
                    <Ionicons name="create" size={20} color="#8A2BE2" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.statusContainer}>
                <Text style={styles.playerStatus}>
                  {player.status === 'player' ? 'Игрок' : 
                   player.status === 'coach' ? 'Тренер' : 
                   player.status === 'scout' ? 'Скаут' : 
                   player.status === 'admin' ? 'Техподдержка' : 'Звезда'}
                </Text>
              </View>
              {player.team && <Text style={styles.playerTeam}>{player.team}</Text>}
              {player.hockeyStartDate && calculateHockeyExperience(player.hockeyStartDate) && (
                <Text style={styles.hockeyExperience}>
                  В хоккее {calculateHockeyExperience(player.hockeyStartDate)}
                </Text>
              )}
            </View>

            {/* Секция управления дружбой - показываем для всех статусов дружбы */}
            {currentUser && currentUser.id !== player.id && (
              <View style={styles.friendRequestSection}>
                {friendshipStatus === 'received_request' ? (
                  // Запрос дружбы получен
                  <>
                    <View style={styles.friendRequestHeader}>
                      <Ionicons name="person-add-outline" size={24} color="#FF4444" />
                      <Text style={[styles.friendRequestTitle, { color: '#FF4444' }]}>Запрос дружбы</Text>
                    </View>
                    <Text style={styles.friendRequestMessage}>
                      {player.name} хочет добавить вас в друзья
                    </Text>
                    <View style={styles.friendRequestButtons}>
                      <TouchableOpacity 
                        style={[styles.friendRequestButton, styles.acceptRequestButton]} 
                        onPress={handleAddFriend}
                        disabled={friendLoading}
                      >
                        <Ionicons name="checkmark-outline" size={20} color="#fff" />
                        <Text style={styles.friendRequestButtonText}>
                          {friendLoading ? 'Загрузка...' : 'Принять'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.friendRequestButton, styles.declineRequestButton]} 
                        onPress={handleDeclineFriend}
                        disabled={friendLoading}
                      >
                        <Ionicons name="close-outline" size={20} color="#000" />
                        <Text style={[styles.friendRequestButtonText, { color: '#000', fontFamily: 'Gilroy-Bold' }]}>
                          {friendLoading ? 'Загрузка...' : 'Отклонить'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : friendshipStatus === 'friends' ? (
                  // Уже друзья
                  <>
                    <View style={styles.friendRequestHeader}>
                      <Ionicons name="people-outline" size={24} color="#FF4444" />
                      <Text style={[styles.friendRequestTitle, { color: '#FF4444' }]}>Друзья</Text>
                    </View>
                    <Text style={styles.friendRequestMessage}>
                      Вы друзья с {player.name}
                    </Text>
                    <View style={styles.friendRequestButtons}>
                      <TouchableOpacity 
                        style={[styles.friendRequestButton, { backgroundColor: 'rgba(255, 0, 0, 0.3)', borderColor: '#FF0000' }]} 
                        onPress={handleAddFriend}
                        disabled={friendLoading}
                      >
                        <Ionicons name="person-remove-outline" size={20} color="#fff" />
                        <Text style={styles.friendRequestButtonText}>
                          {friendLoading ? 'Загрузка...' : 'Удалить из друзей'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (friendshipStatus === 'sent' || friendshipStatus === 'sent_request') ? (
                  // Запрос дружбы отправлен
                  <>
                    <View style={styles.friendRequestHeader}>
                      <Ionicons name="time-outline" size={24} color="#FF4444" />
                      <Text style={[styles.friendRequestTitle, { color: '#FF4444' }]}>Запрос отправлен</Text>
                    </View>
                    <Text style={styles.friendRequestMessage}>
                      Запрос дружбы отправлен {player.name}
                    </Text>
                    <View style={styles.friendRequestButtons}>
                      <TouchableOpacity 
                        style={[styles.friendRequestButton, { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: '#FFFFFF' }]} 
                        onPress={handleAddFriend}
                        disabled={friendLoading}
                      >
                        <Ionicons name="close-outline" size={20} color="#fff" />
                        <Text style={[styles.friendRequestButtonText, { color: '#fff' }]}>
                          {friendLoading ? 'Загрузка...' : 'Отменить запрос'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  // Нет дружбы - можно добавить
                  <>
                    <View style={styles.friendRequestHeader}>
                      <Ionicons name="person-add-outline" size={24} color="#FF4444" />
                      <Text style={[styles.friendRequestTitle, { color: '#FF4444' }]}>Добавить в друзья</Text>
                    </View>
                    <Text style={styles.friendRequestMessage}>
                      Хотите добавить {player.name} в друзья?
                    </Text>
                    <View style={styles.friendRequestButtons}>
                      <TouchableOpacity 
                        style={[styles.friendRequestButton, { backgroundColor: 'rgba(255, 68, 68, 0.3)', borderColor: '#FF4444' }]} 
                        onPress={handleAddFriend}
                        disabled={friendLoading}
                      >
                        <Ionicons name="person-add-outline" size={20} color="#fff" />
                        <Text style={styles.friendRequestButtonText}>
                          {friendLoading ? 'Загрузка...' : 'Добавить в друзья'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Кнопка отладки для администратора */}
            {currentUser && currentUser.status === 'admin' && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(0, 0, 255, 0.3)', borderColor: '#0000FF' }]} 
                  onPress={handleDebugFriendRequests}
                >
                  <Ionicons name="bug-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Отладка запросов дружбы
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(255, 0, 0, 0.3)', borderColor: '#FF0000', marginTop: 10 }]} 
                  onPress={handleClearAllFriendRequests}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Очистить все запросы дружбы
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(0, 255, 0, 0.3)', borderColor: '#00FF00', marginTop: 10 }]} 
                  onPress={handleTestNotification}
                >
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Тест уведомления
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(255, 165, 0, 0.3)', borderColor: '#FFA500', marginTop: 10 }]} 
                  onPress={handleViewAllNotifications}
                >
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Просмотр всех уведомлений
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(128, 0, 128, 0.3)', borderColor: '#800080', marginTop: 10 }]} 
                  onPress={handleSendFriendRequestFromPlayer}
                >
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Отправить запрос от игрока
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(0, 128, 128, 0.3)', borderColor: '#008080', marginTop: 10 }]} 
                  onPress={handleTestMessage}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Тест сообщения
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(128, 128, 0, 0.3)', borderColor: '#808000', marginTop: 10 }]} 
                  onPress={handleViewAllMessages}
                >
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Просмотр всех сообщений
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.friendRequestButton, { backgroundColor: 'rgba(75, 0, 130, 0.3)', borderColor: '#4B0082', marginTop: 10 }]} 
                  onPress={handleRefreshCounters}
                >
                  <Ionicons name="refresh-outline" size={20} color="#fff" />
                  <Text style={styles.friendRequestButtonText}>
                    Обновить счетчики
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Статистика - только для обычных игроков с данными */}
            {player && player.status !== 'star' && (() => {
              const goalsNum = parseInt(player.goals || '0') || 0;
              const assistsNum = parseInt(player.assists || '0') || 0;
              const gamesNum = parseInt(player.games || '0') || 0;
              const pointsNum = goalsNum + assistsNum;
              
              // Показываем статистику только если есть хотя бы одно ненулевое значение
              const hasStats = pointsNum > 0 || goalsNum > 0 || assistsNum > 0 || gamesNum > 0;
              
              return hasStats ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Статистика</Text>
                  <View style={styles.statsGrid}>
                    {pointsNum > 0 && (
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{pointsNum.toString()}</Text>
                        <Text style={styles.statLabel}>Очков</Text>
                      </View>
                    )}
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{friends.length}</Text>
                      <Text style={styles.statLabel}>Друзей</Text>
                    </View>
                    {goalsNum > 0 && (
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{goalsNum.toString()}</Text>
                        <Text style={styles.statLabel}>Голов</Text>
                      </View>
                    )}
                    {gamesNum > 0 && (
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{gamesNum.toString()}</Text>
                        <Text style={styles.statLabel}>Игр</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : null;
            })()}

            {/* Информация о команде для звезд */}
            {player.status === 'star' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Информация о команде</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Команда</Text>
                    <Text style={styles.infoValue}>{player.team || 'Не указана'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Друзей</Text>
                    <Text style={styles.infoValue}>{friends.length}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Страна</Text>
                    <Text style={styles.infoValue}>{player.country}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Позиция</Text>
                    <Text style={styles.infoValue}>{player.position || 'Не указана'}</Text>
                  </View>
                  {player.grip && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Хват</Text>
                      <Text style={styles.infoValue}>{player.grip}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}


            {/* Основная информация */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Основная информация</Text>
              <View style={styles.infoGrid}>
                {player.country && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Страна</Text>
                    <Text style={styles.infoValue}>{player.country}</Text>
                  </View>
                )}
                {player.position && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Позиция</Text>
                    <Text style={styles.infoValue}>{player.position}</Text>
                  </View>
                )}
                {player.birthDate && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Дата рождения</Text>
                    <Text style={styles.infoValue}>{player.birthDate}</Text>
                  </View>
                )}
                {player.grip && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Хват</Text>
                    <Text style={styles.infoValue}>{player.grip}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Физические данные - только для игроков */}
            {player.status === 'player' && (player.height || player.weight) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Физические данные</Text>
                <View style={styles.infoGrid}>
                  {player.height && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Рост</Text>
                      <Text style={styles.infoValue}>{player.height} см</Text>
                    </View>
                  )}
                  {player.weight && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Вес</Text>
                      <Text style={styles.infoValue}>{player.weight} кг</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Видео моментов */}
            {player.favoriteGoals && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Видео моментов</Text>
                <VideoCarousel
                  videos={player.favoriteGoals.split('\n').filter(goal => goal.trim()).map(goal => parseVideoUrl(goal.trim()))}
                  onVideoPress={(video) => setSelectedVideo(video)}
                />
              </View>
            )}

            {/* Фотографии - показываем только НЕ звездам и НЕ администраторам */}
            {player && player.status && player.status.trim() !== 'star' && player.status.trim() !== 'admin' ? (
              (currentUser && currentUser.id === player.id) || 
              friendshipStatus === 'friends' || 
              currentUser?.status === 'coach' || 
              currentUser?.status === 'scout' ||
              currentUser?.status === 'admin' ? (
                <PhotosSection photos={player.photos} />
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Фотографии</Text>
                  <View style={styles.lockedSectionContainer}>
                    <Ionicons name="lock-closed" size={48} color="#FF4444" />
                    <Text style={styles.lockedSectionTitle}>Добавьте в друзья</Text>
                    <Text style={styles.lockedSectionText}>
                      Добавьте {player.name} в друзья, чтобы увидеть фотографии
                    </Text>
                  </View>
                </View>
              )
            ) : null}

            {/* Нормативы - показываем только если есть данные и НЕ звездам и НЕ администраторам */}
            {player && player.status && player.status.trim() !== 'star' && player.status.trim() !== 'admin' ? (
              (currentUser && currentUser.id === player.id) || 
              friendshipStatus === 'friends' || 
              currentUser?.status === 'coach' || 
              currentUser?.status === 'scout' ||
              currentUser?.status === 'admin' ? (
                // Проверяем, есть ли данные нормативов
                (player.pullUps && player.pullUps !== '0') ||
                (player.pushUps && player.pushUps !== '0') ||
                (player.plankTime && player.plankTime !== '0') ||
                (player.sprint100m && player.sprint100m !== '0') ||
                (player.longJump && player.longJump !== '0') ? (
                  <NormativesSection
                    pullUps={player.pullUps}
                    pushUps={player.pushUps}
                    plankTime={player.plankTime}
                    sprint100m={player.sprint100m}
                    longJump={player.longJump}
                  />
                ) : null // Не показываем секцию, если данных нет
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Нормативы</Text>
                  <View style={styles.lockedSectionContainer}>
                    <Ionicons name="lock-closed" size={48} color="#FF4444" />
                    <Text style={styles.lockedSectionTitle}>Добавьте в друзья</Text>
                    <Text style={styles.lockedSectionText}>
                      Добавьте {player.name} в друзья, чтобы увидеть нормативы
                    </Text>
                  </View>
                </View>
              )
            ) : null}





            {/* Друзья */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Друзья</Text>
              {friends.length > 0 ? (
                <View style={styles.friendsGrid}>
                  {friends.map((friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.friendItem}
                      onPress={() => router.push(`/player/${friend.id}`)}
                    >
                      <Image 
                        source={{ uri: friend.avatar || 'https://via.placeholder.com/60/333/fff?text=Player' }} 
                        style={styles.friendAvatar}
                      />
                      <Text style={styles.friendName} numberOfLines={2}>
                        {friend.name?.toUpperCase()}
                      </Text>
                      {friend.team && (
                        <Text style={styles.friendTeam} numberOfLines={1}>
                          {friend.team}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.friendsContainer}>
                  <Text style={styles.noDataText}>У {player.name} пока нет друзей</Text>
                  <Text style={styles.noDataSubtext}>
                    Будьте первым, кто добавит {player.name} в друзья
                  </Text>
                </View>
              )}
            </View>

            {/* Кнопки действий */}
            <View style={styles.actionsSection}>
              {currentUser && currentUser.id === player.id ? (
                // Если пользователь смотрит свой профиль - показываем кнопку редактирования
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => router.push({ pathname: '/profile', params: { edit: 'true' } })}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Редактировать профиль</Text>
                </TouchableOpacity>
              ) : currentUser ? (
                // Если пользователь авторизован и смотрит чужой профиль - показываем кнопки взаимодействия
                <>
                  {/* Кнопка удаления для администратора */}
                  {currentUser.status === 'admin' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]} 
                      onPress={handleDeletePlayer}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Удалить пользователя</Text>
                    </TouchableOpacity>
                  )}
                  
                  {player.status === 'star' ? (
                    // Специальные кнопки для звезд
                    <>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.starButton]} 
                        onPress={handleRequestAutograph}
                      >
                        <Ionicons name="create-outline" size={20} color="#000" />
                        <Text style={styles.starButtonText}>Попросить автограф</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.starButton]} 
                        onPress={handleRequestStick}
                      >
                        <Ionicons name="key-outline" size={20} color="#000" />
                        <Text style={styles.starButtonText}>Попросить клюшку</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Обычные кнопки для обычных игроков
                    <>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={handleSendMessage}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Написать сообщение</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                // Если пользователь не авторизован - показываем кнопку входа
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => router.push('/login')}
                >
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Войти для взаимодействия</Text>
                </TouchableOpacity>
              )}
            </View>

          </ScrollView>
        </View>
      </ImageBackground>
      
      {/* Модальное окно для видео */}
      <Modal
        visible={selectedVideo !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModalContainer}>
            <TouchableOpacity
              style={styles.videoModalCloseButton}
              onPress={() => setSelectedVideo(null)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {selectedVideo && (
              <YouTubeVideo 
                url={selectedVideo.url}
                title="Мой момент"
                timeCode={selectedVideo.timeCode}
                onClose={() => setSelectedVideo(null)}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Модальное окно для уведомлений */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => {
          setAlert({ ...alert, visible: false });
          if (alert.onConfirm) alert.onConfirm();
        }}
        onCancel={() => setAlert({ ...alert, visible: false })}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        showCancel={alert.showCancel}
      />
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
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF4444',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  playerName: {
    fontSize: 28,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginRight: 10,
  },
  numberBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 19.5, // Увеличили на 30% с 15
    paddingHorizontal: 10.4, // Увеличили на 30% с 8
    paddingVertical: 2.6, // Увеличили на 30% с 2
  },
  numberText: {
    fontSize: 18.2, // Увеличили на 30% с 14
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 5,
    alignSelf: 'center',
  },
  playerStatus: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    fontWeight: 'bold',
  },
  playerTeam: {
    fontSize: 18,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  hockeyExperience: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#FF4444',
    marginTop: 4,
  },
  actionsSection: {
    gap: 15,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  removeFriendButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  cancelRequestButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  acceptRequestButton: {
    backgroundColor: '#FF4444',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  declineRequestButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 8,
  },
  starButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#000', // Черный текст для кнопок звезд
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginTop: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  goalsContainer: {
    gap: 10,
  },
  goalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  goalLinkText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  friendItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 12,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  friendTeam: {
    fontSize: 10,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    textAlign: 'center',
  },
  friendsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  // Стили для секции запроса дружбы
  friendRequestSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  friendRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  friendRequestTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#FFD700',
    marginLeft: 10,
  },
  friendRequestMessage: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  friendRequestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  friendRequestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  friendRequestButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  starButton: {
    backgroundColor: '#DAA520', // Темнее золотой
    borderColor: '#B8860B', // Темнее оранжевый
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalContainer: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoModalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  lockedSectionContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  lockedSectionTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginTop: 15,
    marginBottom: 8,
  },
  lockedSectionText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  editButton: {
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#FF4444', // Красный цвет для удаления
    borderColor: '#CC0000',
  },

}); 