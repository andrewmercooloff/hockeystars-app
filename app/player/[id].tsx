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
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AchievementsSection from '../../components/AchievementsSection';
import CustomAlert from '../../components/CustomAlert';
import NormativesSection from '../../components/NormativesSection';
import PastTeamsSection from '../../components/PastTeamsSection';
import PhotosSection from '../../components/PhotosSection';
import TeamsDisplay from '../../components/TeamsDisplay';
import VideoCarousel from '../../components/VideoCarousel';
import YouTubeVideo from '../../components/YouTubeVideo';
import { acceptFriendRequest, Achievement, calculateHockeyExperience, cancelFriendRequest, clearAllFriendRequests, createFriendRequestNotification, debugFriendRequests, declineFriendRequest, getFriends, getFriendshipStatus, getPlayerById, getPlayerTeams, loadCurrentUser, PastTeam, Player, PlayerTeam, removeFriend, sendFriendRequest, updatePlayer } from '../../utils/playerStorage';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [videoFields, setVideoFields] = useState<Array<{url: string, timeCode: string}>>([{ url: '', timeCode: '' }]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [playerTeams, setPlayerTeams] = useState<PlayerTeam[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pastTeams, setPastTeams] = useState<PastTeam[]>([]);
  
  // Массивы для селекторов
  const countries = ['Беларусь', 'Россия', 'Канада', 'США', 'Финляндия', 'Швеция', 'Литва', 'Латвия', 'Польша'];
  const positions = ['Нападающий', 'Защитник', 'Вратарь'];



  useEffect(() => {
    loadPlayerData();
  }, [id]);

  // Добавляем обновление при фокусе экрана
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Экран профиля игрока получил фокус, обновляем данные...');
      // Добавляем небольшую задержку для обновления данных из базы
      setTimeout(() => {
      loadPlayerData();
      }, 100);
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
        
        // Загружаем команды игрока
        if (playerData) {
          try {
            const teams = await getPlayerTeams(playerData.id);
            setPlayerTeams(teams);
            console.log('🏒 Команды игрока:', teams);
          } catch (error) {
            console.error('Ошибка загрузки команд игрока:', error);
          }
        }
        
        // Добавляем подробную отладочную информацию
        if (playerData) {
          console.log('🔍 Подробные данные игрока:');
          console.log('   Имя:', playerData.name);
          console.log('   Команда:', playerData.team);
          console.log('   Позиция:', playerData.position);
          console.log('   Голы:', playerData.goals);
          console.log('   Передачи:', playerData.assists);
          console.log('   Рост:', playerData.height);
          console.log('   Вес:', playerData.weight);
          console.log('   Страна:', playerData.country);
          console.log('   Город:', playerData.city);
          console.log('   Телефон:', playerData.phone);
          console.log('   Достижения:', playerData.achievements);
          
          // Добавляем отладку проблемных полей
          console.log('🏒 Хоккейные данные:');
          console.log('   Дата начала хоккея (hockeyStartDate):', playerData.hockeyStartDate);
          console.log('   hockeyStartDate существует:', !!playerData.hockeyStartDate);
          console.log('   hockeyStartDate !== "":', playerData.hockeyStartDate !== '');
          console.log('   Рассчитанный опыт:', calculateHockeyExperience(playerData.hockeyStartDate));
          
          console.log('📊 Нормативы:');
          console.log('   Подтягивания (pullUps):', playerData.pullUps);
          console.log('   Отжимания (pushUps):', playerData.pushUps);
          console.log('   Планка (plankTime):', playerData.plankTime);
          console.log('   Спринт 100м (sprint100m):', playerData.sprint100m);
          console.log('   Прыжок в длину (longJump):', playerData.longJump);
          
          console.log('🎥 Видео моментов:');
          console.log('   favoriteGoals:', playerData.favoriteGoals);
          console.log('   favoriteGoals.trim():', playerData.favoriteGoals ? playerData.favoriteGoals.trim() : 'null');
          console.log('   favoriteGoals !== "":', playerData.favoriteGoals ? playerData.favoriteGoals.trim() !== '' : false);
          if (playerData.favoriteGoals) {
            const videos = playerData.favoriteGoals.split('\n').filter(goal => goal.trim());
            console.log('   Количество видео:', videos.length);
            videos.forEach((video, i) => {
              console.log(`   Видео ${i + 1}:`, video);
            });
          }
          
          // Проверяем условия отображения
          console.log('🔍 Условия отображения:');
          console.log('   Статус игрока:', playerData.status);
          console.log('   Статус игрока === "player":', playerData.status === 'player');
          console.log('   Есть видео:', playerData.favoriteGoals && playerData.favoriteGoals.trim() !== '');
          console.log('   Есть нормативы:', 
            (playerData.pullUps && playerData.pullUps !== '0' && playerData.pullUps !== '' && playerData.pullUps !== 'null') ||
            (playerData.pushUps && playerData.pushUps !== '0' && playerData.pushUps !== '' && playerData.pushUps !== 'null') ||
            (playerData.plankTime && playerData.plankTime !== '0' && playerData.plankTime !== '' && playerData.plankTime !== 'null') ||
            (playerData.sprint100m && playerData.sprint100m !== '0' && playerData.sprint100m !== '' && playerData.sprint100m !== 'null') ||
            (playerData.longJump && playerData.longJump !== '0' && playerData.longJump !== '' && playerData.longJump !== 'null')
          );
          console.log('   Показывать нормативы для собственного профиля:', true); // Всегда true для собственного профиля
          console.log('   Показывать видео для собственного профиля:', true); // Всегда true для собственного профиля
        }
        
        // Мигрируем аватар в Storage, если он локальный
        let updatedPlayerData = playerData;
        if (playerData?.avatar && (playerData.avatar.startsWith('file://') || playerData.avatar.startsWith('content://') || playerData.avatar.startsWith('data:'))) {
          console.log('🔄 Мигрируем локальный аватар игрока в Storage:', playerData.avatar);
          const { uploadImageToStorage } = await import('../../utils/uploadImage');
          const migratedAvatarUrl = await uploadImageToStorage(playerData.avatar);
          if (migratedAvatarUrl) {
            updatedPlayerData = { ...playerData, avatar: migratedAvatarUrl };
            await updatePlayer(playerData.id, updatedPlayerData);
            console.log('✅ Аватар игрока мигрирован в Storage:', migratedAvatarUrl);
          }
        }
        
        setPlayer(updatedPlayerData);
        setCurrentUser(userData);
        
        // Инициализируем видео поля
        if (playerData?.favoriteGoals) {
          const goals = playerData.favoriteGoals.split('\n').filter(goal => goal.trim());
          const videoData = goals.map(goal => {
            const { url, timeCode } = parseVideoUrl(goal);
            return { url, timeCode: timeCode || '' };
          });
          setVideoFields(videoData.length > 0 ? videoData : [{ url: '', timeCode: '' }]);
        }
        
        // Инициализируем фотографии и мигрируем локальные в Storage
        if (updatedPlayerData?.photos && updatedPlayerData.photos.length > 0) {
          const migratedPhotos = [];
          for (const photo of updatedPlayerData.photos) {
            // Проверяем, является ли фото локальным
            if (photo.startsWith('file://') || photo.startsWith('content://') || photo.startsWith('data:')) {
              console.log('🔄 Мигрируем локальное фото игрока в Storage:', photo);
              const { uploadImageToStorage } = await import('../../utils/uploadImage');
              const migratedUrl = await uploadImageToStorage(photo);
              if (migratedUrl) {
                migratedPhotos.push(migratedUrl);
              }
            } else {
              migratedPhotos.push(photo);
            }
          }
          setGalleryPhotos(migratedPhotos);
          
          // Если были мигрированы фото, обновляем игрока
          if (migratedPhotos.length !== updatedPlayerData.photos.length) {
            const finalUpdatedPlayer = { ...updatedPlayerData, photos: migratedPhotos };
            await updatePlayer(updatedPlayerData.id, finalUpdatedPlayer);
            setPlayer(finalUpdatedPlayer);
          }
        } else {
          setGalleryPhotos([]);
        }

        // Инициализируем достижения
        if (playerData?.achievements && Array.isArray(playerData.achievements)) {
          setAchievements(playerData.achievements);
        }

        // Инициализируем прошлые команды
        if (playerData?.pastTeams && Array.isArray(playerData.pastTeams)) {
          setPastTeams(playerData.pastTeams);
        }
        
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
          setFriendshipStatus('pending');
          showCustomAlert('Запрос отправлен', `Запрос дружбы отправлен ${player.name}`, 'success');
        } else {
          showCustomAlert('Ошибка', 'Не удалось отправить запрос дружбы', 'error');
        }
      } else if (friendshipStatus === 'sent' || friendshipStatus === 'sent_request' || friendshipStatus === 'pending') {
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
    console.log('🔍 parseVideoUrl обрабатывает:', input);
    const timeMatch = input.match(/\(время:\s*(\d{1,2}:\d{2})\)/);
    const timeCode = timeMatch ? timeMatch[1] : undefined;
    const url = input.replace(/\s*\(время:\s*\d{1,2}:\d{2}\)/, '').trim();
    console.log('🔍 Результат parseVideoUrl:', { url, timeCode });
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

  const handleCurrentTeamChange = async (teamName: string, isCurrent: boolean) => {
    try {
      // Находим команду по названию
      const team = selectedTeams.find(t => t.name === teamName);
      if (!team) {
        console.log('Команда не найдена в списке доступных команд:', teamName);
        return;
      }

      if (isCurrent) {
        // Добавляем команду в текущие команды
        const success = await addPlayerTeam(player.id, team.id, true);
        if (success) {
          // Обновляем локальное состояние
          await loadPlayerTeams(player.id);
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении текущей команды:', error);
    }
  };

  const handleSave = async () => {
    if (!player || !currentUser) {
      showCustomAlert('Ошибка', 'Данные не найдены', 'error');
      return;
    }

    try {
      console.log('💾 Сохраняем изменения для игрока:', player.name);
      console.log('📝 Данные для сохранения:', editData);
      
      // Объединяем поля видео в одну строку
      const goalsText = videoFields
        .filter(video => video.url.trim())
        .map(video => {
          const timeCodePart = video.timeCode.trim() ? ` (время: ${video.timeCode})` : '';
          return video.url + timeCodePart;
        })
        .join('\n');
      
      // Объединяем текущие данные игрока с изменениями
      const updatedPlayer = { 
        ...player, 
        ...editData, 
        favoriteGoals: goalsText,
        photos: galleryPhotos,
        achievements: achievements,
        pastTeams: pastTeams
      };
      console.log('📝 Полные данные для сохранения:', updatedPlayer);
      
      await updatePlayer(player.id, updatedPlayer);
      
      // Обновляем данные игрока
      const refreshedPlayer = await getPlayerById(player.id);
      setPlayer(refreshedPlayer);
      
      setIsEditing(false);
      showCustomAlert('Успешно', 'Данные игрока обновлены', 'success');
      
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
      showCustomAlert('Ошибка', 'Не удалось сохранить изменения', 'error');
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
            
            {/* Кнопка редактирования для администратора в самом верху */}
            {currentUser?.status === 'admin' && (
              <View style={styles.editButtonContainer}>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => {
                    console.log('🔧 Админ редактирует игрока:', player.name);
                    if (isEditing) {
                      handleSave();
                    } else {
                      setEditData(player);
                      setIsEditing(true);
                    }
                  }}
                >
                  <Ionicons name={isEditing ? "checkmark" : "create"} size={20} color="#8A2BE2" />
                </TouchableOpacity>
              </View>
            )}

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
                      source={{ 
                        uri: imageSource,
                        cache: 'reload', // Принудительно перезагружаем кэш
                        headers: {
                          'Cache-Control': 'no-cache'
                        }
                      }}
                      style={styles.profileImage}
                      onError={(error) => {
                        console.log('❌ Ошибка загрузки аватара в профиле игрока:', error);
                        console.log('   URL аватара:', imageSource);
                        console.log('   Нативная ошибка:', error.nativeEvent?.error);
                      }}
                      onLoad={() => {
                        console.log('✅ Аватар в профиле игрока успешно загружен:', imageSource);
                      }}
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
                {isEditing && currentUser?.status === 'admin' ? (
                  <TextInput
                    style={[styles.editInput, { width: 60, marginLeft: 10 }]}
                    value={editData.number || player.number || ''}
                    onChangeText={(text) => setEditData({...editData, number: text})}
                    placeholder="#"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                ) : player.number ? (
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>#{player.number}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.statusContainer}>
                <Text style={styles.playerStatus}>
                  {player.status === 'player' ? 'Игрок' : 
                   player.status === 'coach' ? 'Тренер' : 
                   player.status === 'scout' ? 'Скаут' : 
                   player.status === 'admin' ? 'Техподдержка' : 'Звезда'}
                </Text>
              </View>
              {playerTeams.length > 0 && (
                <View style={styles.playerTeamsContainer}>
                  {playerTeams.map((team, index) => (
                    <Text key={team.teamId} style={styles.playerTeam}>
                      {team.teamName}{index < playerTeams.length - 1 ? ', ' : ''}
                    </Text>
                  ))}
                </View>
              )}
              {player.hockeyStartDate && player.hockeyStartDate !== '' && player.hockeyStartDate !== 'null' && (
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
                ) : (friendshipStatus === 'sent' || friendshipStatus === 'sent_request' || friendshipStatus === 'pending') ? (
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
              
              console.log('📊 Статистика игрока:', {
                name: player.name,
                goals: player.goals,
                goalsNum,
                assists: player.assists,
                assistsNum,
                games: player.games,
                gamesNum,
                pointsNum,
                hasStats: pointsNum > 0 || goalsNum > 0 || assistsNum > 0 || gamesNum > 0
              });
              
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
                    {assistsNum > 0 && (
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{assistsNum.toString()}</Text>
                        <Text style={styles.statLabel}>Передач</Text>
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
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Страна</Text>
                  {isEditing && currentUser?.status === 'admin' ? (
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {editData.country || player.country || 'Выберите страну'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.infoValue}>{player.country || 'Не указана'}</Text>
                  )}
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Команда</Text>
                  {isEditing && currentUser?.status === 'admin' ? (
                    <TextInput
                      style={styles.editInput}
                      value={editData.team || player.team || ''}
                      onChangeText={(text) => setEditData({...editData, team: text})}
                      placeholder="Команда"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{player.team || 'Не указана'}</Text>
                  )}
                </View>
                {player.status === 'player' && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Позиция</Text>
                    {isEditing && currentUser?.status === 'admin' ? (
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowPositionPicker(true)}
                      >
                        <Text style={styles.pickerButtonText}>
                          {editData.position || player.position || 'Выберите позицию'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.infoValue}>{player.position || 'Не указана'}</Text>
                    )}
                  </View>
                )}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Дата рождения</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.editInput}
                      value={editData.birthDate || player.birthDate || ''}
                      onChangeText={(text) => setEditData({...editData, birthDate: text})}
                      placeholder="ДД.ММ.ГГГГ"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{player.birthDate || 'Не указана'}</Text>
                  )}
                </View>
                {player.status === 'player' && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Хват</Text>
                    {isEditing && currentUser?.status === 'admin' ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.grip || player.grip || ''}
                        onChangeText={(text) => setEditData({...editData, grip: text})}
                        placeholder="Хват"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{player.grip || 'Не указан'}</Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Физические данные - только для игроков (не тренеры) */}
            {player.status === 'player' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Физические данные</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Рост</Text>
                    {isEditing && currentUser?.status === 'admin' ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.height || player.height || ''}
                        onChangeText={(text) => setEditData({...editData, height: text})}
                        placeholder="Рост (см)"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{player.height ? `${player.height} см` : 'Не указан'}</Text>
                    )}
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Вес</Text>
                    {isEditing && currentUser?.status === 'admin' ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.weight || player.weight || ''}
                        onChangeText={(text) => setEditData({...editData, weight: text})}
                        placeholder="Вес (кг)"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{player.weight ? `${player.weight} кг` : 'Не указан'}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Видео моментов - только для игроков (не тренеры) */}
            {player.status === 'player' && ((currentUser && currentUser.id === player.id) || (player.favoriteGoals && player.favoriteGoals.trim() !== '') || (isEditing && currentUser?.status === 'admin')) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Видео моментов</Text>
                {isEditing && currentUser?.status === 'admin' ? (
                  <View>
                    <Text style={styles.sectionSubtitle}>
                      Добавьте ссылку на YouTube видео и время начала момента (формат: минуты:секунды, например: 1:25){'\n'}
                      Поддерживаются: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/live/, m.youtube.com/
                    </Text>
                    <View>
                      {videoFields.map((video, index) => (
                        <View key={index} style={styles.videoFieldContainer}>
                          <TextInput
                            style={styles.videoUrlInput}
                            value={video.url}
                            onChangeText={(text) => {
                              const newVideoFields = [...videoFields];
                              newVideoFields[index] = { ...newVideoFields[index], url: text };
                              setVideoFields(newVideoFields);
                            }}
                            placeholder="https://youtube.com/watch?v=... или youtube.com/live/..."
                            placeholderTextColor="#888"
                          />
                          <TextInput
                            style={styles.timeCodeInput}
                            value={video.timeCode}
                            onChangeText={(text) => {
                              // Валидация формата времени (минуты:секунды)
                              const timeRegex = /^(\d{0,2}):?(\d{0,2})$/;
                              const match = text.match(timeRegex);
                              
                              if (match) {
                                let formattedText = text;
                                // Автоматически добавляем двоеточие если его нет и есть цифры
                                if (!text.includes(':') && text.length > 0) {
                                  if (text.length <= 2) {
                                    formattedText = text;
                                  } else {
                                    formattedText = text.slice(0, 2) + ':' + text.slice(2);
                                  }
                                }
                                
                                // Ограничиваем минуты до 59, секунды до 59
                                const parts = formattedText.split(':');
                                if (parts.length === 2) {
                                  const minutes = parseInt(parts[0]) || 0;
                                  const seconds = parseInt(parts[1]) || 0;
                                  if (minutes > 59) formattedText = '59:' + parts[1];
                                  if (seconds > 59) formattedText = parts[0] + ':59';
                                }
                                
                                const newVideoFields = [...videoFields];
                                newVideoFields[index] = { ...newVideoFields[index], timeCode: formattedText };
                                setVideoFields(newVideoFields);
                              } else if (text === '' || text === ':') {
                                // Разрешаем пустую строку и двоеточие
                                const newVideoFields = [...videoFields];
                                newVideoFields[index] = { ...newVideoFields[index], timeCode: text };
                                setVideoFields(newVideoFields);
                              }
                            }}
                            placeholder="мин:сек"
                            placeholderTextColor="#888"
                            keyboardType="default"
                            maxLength={5}
                          />
                          {videoFields.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeVideoButton}
                              onPress={() => {
                                const newVideoFields = videoFields.filter((_, i) => i !== index);
                                setVideoFields(newVideoFields.length > 0 ? newVideoFields : [{ url: '', timeCode: '' }]);
                              }}
                            >
                              <Ionicons name="close-circle" size={20} color="#FF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.addMoreButton}
                        onPress={() => {
                          setVideoFields([...videoFields, { url: '', timeCode: '' }]);
                        }}
                      >
                        <Ionicons name="add-circle" size={24} color="#FF4444" />
                        <Text style={styles.addMoreButtonText}>Добавить еще видео</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : player.favoriteGoals ? (
                  (() => {
                    const videoUrls = player.favoriteGoals.split('\n').filter(goal => goal.trim());
                    const parsedVideos = videoUrls.map(goal => parseVideoUrl(goal.trim()));
                    console.log('🎥 Обработка видео в профиле:');
                    console.log('   Исходные строки:', videoUrls);
                    console.log('   Обработанные видео:', parsedVideos);
                    return (
                  <VideoCarousel
                        videos={parsedVideos}
                    onVideoPress={(video) => setSelectedVideo(video)}
                  />
                    );
                  })()
                ) : null}
              </View>
            )}

            {/* Фотографии - показываем всем кроме звезд и администраторов */}
            {player && player.status && player.status.trim() !== 'star' && player.status.trim() !== 'admin' ? (
              (currentUser && currentUser.id === player.id) || 
              friendshipStatus === 'friends' || 
              currentUser?.status === 'coach' || 
              currentUser?.status === 'scout' ||
              currentUser?.status === 'admin' ? (
                isEditing && currentUser?.status === 'admin' ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Фотографии</Text>
                    <Text style={styles.sectionSubtitle}>
                      Добавьте фотографии для профиля
                    </Text>
                    <View>
                      <TouchableOpacity
                        style={styles.addPhotoButton}
                        onPress={() => {
                          // Здесь можно добавить логику для добавления фото
                          // Пока просто добавляем пустую строку
                          setGalleryPhotos([...galleryPhotos, '']);
                        }}
                      >
                        <Ionicons name="add-circle" size={24} color="#FF4444" />
                        <Text style={styles.addPhotoButtonText}>Добавить фотографию</Text>
                      </TouchableOpacity>
                      
                      {/* Показываем добавленные фотографии */}
                      {galleryPhotos.length > 0 && (
                        <View style={styles.galleryContainer}>
                          <Text style={styles.galleryTitle}>Добавленные фотографии:</Text>
                          <View style={styles.galleryGrid}>
                            {galleryPhotos.map((photo, index) => (
                              <View key={index} style={styles.galleryItem}>
                                <Image source={{ uri: photo }} style={styles.galleryImage} />
                                <TouchableOpacity
                                  style={styles.removePhotoButton}
                                  onPress={() => {
                                    const newPhotos = galleryPhotos.filter((_, i) => i !== index);
                                    setGalleryPhotos(newPhotos);
                                  }}
                                >
                                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <PhotosSection photos={player.photos} />
                )
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

            {/* Нормативы - показываем только игрокам (не тренерам) */}
            {player && player.status === 'player' ? (
              (currentUser && currentUser.id === player.id) || 
              friendshipStatus === 'friends' || 
              currentUser?.status === 'coach' || 
              currentUser?.status === 'scout' ||
              currentUser?.status === 'admin' ? (
                // Для собственного профиля показываем всегда, для других - только если есть данные
                (currentUser && currentUser.id === player.id) ||
                (player.pullUps && player.pullUps !== '0' && player.pullUps !== '' && player.pullUps !== 'null') ||
                (player.pushUps && player.pushUps !== '0' && player.pushUps !== '' && player.pushUps !== 'null') ||
                (player.plankTime && player.plankTime !== '0' && player.plankTime !== '' && player.plankTime !== 'null') ||
                (player.sprint100m && player.sprint100m !== '0' && player.sprint100m !== '' && player.sprint100m !== 'null') ||
                (player.longJump && player.longJump !== '0' && player.longJump !== '' && player.longJump !== 'null') ||
                (isEditing && currentUser?.status === 'admin') ? (
                  isEditing && currentUser?.status === 'admin' ? (
                    // Редактируемая версия нормативов
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Нормативы</Text>
                      <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Подтягивания</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editData.pullUps || player.pullUps || ''}
                            onChangeText={(text) => setEditData({...editData, pullUps: text})}
                            placeholder="Количество раз"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Отжимания</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editData.pushUps || player.pushUps || ''}
                            onChangeText={(text) => setEditData({...editData, pushUps: text})}
                            placeholder="Количество раз"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Планка</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editData.plankTime || player.plankTime || ''}
                            onChangeText={(text) => setEditData({...editData, plankTime: text})}
                            placeholder="Время в секундах"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>100 метров</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editData.sprint100m || player.sprint100m || ''}
                            onChangeText={(text) => setEditData({...editData, sprint100m: text})}
                            placeholder="Время в секундах"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Прыжок в длину</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editData.longJump || player.longJump || ''}
                            onChangeText={(text) => setEditData({...editData, longJump: text})}
                            placeholder="Длина в см"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <NormativesSection
                      pullUps={player.pullUps}
                      pushUps={player.pushUps}
                      plankTime={player.plankTime}
                      sprint100m={player.sprint100m}
                      longJump={player.longJump}
                    />
                  )
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

            {/* Текущие команды */}
            {playerTeams.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Текущие команды</Text>
                <TeamsDisplay teams={playerTeams} />
              </View>
            )}

            {/* Прошлые команды */}
            <PastTeamsSection 
              pastTeams={pastTeams}
              isEditing={isEditing && currentUser?.status === 'admin'}
              onPastTeamsChange={setPastTeams}
              onCurrentTeamChange={handleCurrentTeamChange}
            />

            {/* Достижения */}
            <AchievementsSection 
              achievements={achievements}
              isEditing={isEditing && currentUser?.status === 'admin'}
              onAchievementsChange={setAchievements}
            />

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
                  {/* Кнопки для администратора */}
                  {currentUser.status === 'admin' && (
                    <>
                      {isEditing ? (
                        <>
                          <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} 
                            onPress={handleSave}
                          >
                            <Ionicons name="checkmark-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Сохранить</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#FF9800' }]} 
                            onPress={() => {
                              setIsEditing(false);
                              setEditData({});
                            }}
                          >
                            <Ionicons name="close-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Отменить</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.editButton]} 
                            onPress={() => {
                              setEditData(player);
                              setIsEditing(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Редактировать</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]} 
                            onPress={handleDeletePlayer}
                          >
                            <Ionicons name="trash-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Удалить пользователя</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
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

      {/* Модальное окно выбора страны */}
      {showCountryPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Выберите страну</Text>
            <ScrollView style={styles.modalScroll}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={styles.modalOption}
                  onPress={() => {
                    setEditData({...editData, country: country});
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{country}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.modalCancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Модальное окно выбора позиции */}
      {showPositionPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Выберите позицию</Text>
            <ScrollView style={styles.modalScroll}>
              {positions.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={styles.modalOption}
                  onPress={() => {
                    setEditData({...editData, position: position});
                    setShowPositionPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{position}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPositionPicker(false)}
            >
              <Text style={styles.modalCancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  editButton: {
    padding: 10,
    backgroundColor: '#8A2BE2',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
  playerTeamsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 20,
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
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 40,
  },
  pickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 40,
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 40,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  dateInputIcon: {
    marginLeft: 8,
  },
  videoFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  videoUrlInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 40,
  },
  timeCodeInput: {
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 40,
    textAlign: 'center',
  },
  removeVideoButton: {
    padding: 4,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  addMoreButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#FF4444',
    marginLeft: 8,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 15,
  },
  addPhotoButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#FF4444',
    marginLeft: 8,
  },
  galleryContainer: {
    marginTop: 15,
  },
  galleryTitle: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 10,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#FF4444', // Красный цвет для удаления
    borderColor: '#CC0000',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    textAlign: 'center',
  },
  teamsSection: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  modalCancelButton: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },

}); 