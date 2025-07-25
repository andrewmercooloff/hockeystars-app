import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ImageBackground,
  Image,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
  Alert,
  Platform
} from 'react-native';

import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadCurrentUser, updatePlayer, saveCurrentUser, Player, getFriends, getReceivedFriendRequests, acceptFriendRequest, declineFriendRequest, calculateHockeyExperience, forceInitializeStorage } from '../utils/playerStorage';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../components/CustomAlert';
import YouTubeVideo from '../components/YouTubeVideo';
import VideoCarousel from '../components/VideoCarousel';

const iceBg = require('../assets/images/led.jpg');

export default function PersonalCabinetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [loading, setLoading] = useState(true);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const [videoFields, setVideoFields] = useState<Array<{ url: string; timeCode: string }>>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; timeCode?: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [receivedFriendRequests, setReceivedFriendRequests] = useState<Player[]>([]);
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

  const positions = ['Нападающий', 'Защитник', 'Вратарь'];
  const countries = ['Беларусь', 'Россия', 'Канада', 'США', 'Финляндия', 'Швеция', 'Литва', 'Латвия', 'Польша'];

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
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

  // Функция для автоматического расчета очков
  const calculatePoints = (goals: string, assists: string): string => {
    const goalsNum = parseInt(goals) || 0;
    const assistsNum = parseInt(assists) || 0;
    return (goalsNum + assistsNum).toString();
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Автоматически включаем режим редактирования если передан параметр edit
  useEffect(() => {
    if (params.edit === 'true' && !isEditing) {
      console.log('Автоматически включаем режим редактирования');
      setIsEditing(true);
    }
  }, [params.edit, isEditing]);

  // Обновляем данные при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      console.log('Экран профиля получил фокус, обновляем данные...');
      loadUserData();
    }, [])
  );

  // Функция для принудительного обновления данных (для отладки)
  const forceRefresh = async () => {
    console.log('Принудительное обновление данных...');
    setLoading(true);
    await loadUserData();
  };



  const loadUserData = async () => {
    try {
      const user = await loadCurrentUser();
      if (user) {
        setCurrentUser(user);
        setEditData(user);
        // Инициализируем поля видео
        if (user.favoriteGoals) {
          const goals = user.favoriteGoals.split('\n').filter(goal => goal.trim());
          const videoData = goals.map(goal => {
            const { url, timeCode } = parseVideoUrl(goal);
            return { url, timeCode: timeCode || '' };
          });
          setVideoFields(videoData.length > 0 ? videoData : [{ url: '', timeCode: '' }]);
        } else {
          setVideoFields([{ url: '', timeCode: '' }]);
        }
        
        // Инициализируем фотографии
        setGalleryPhotos(user.photos || []);
        
        // Загружаем список друзей
        const friendsList = await getFriends(user.id);
        setFriends(friendsList);
        
        // Загружаем запросы дружбы
        await loadFriendRequests();
      } else {
        Alert.alert('Ошибка', 'Пользователь не найден');
        router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const refreshFriends = async () => {
    if (currentUser) {
      try {
        const friendsList = await getFriends(currentUser.id);
        setFriends(friendsList);
      } catch (error) {
        console.error('Ошибка обновления друзей:', error);
      }
    }
  };

  const loadFriendRequests = async () => {
    if (currentUser) {
      try {
        const requestsList = await getReceivedFriendRequests(currentUser.id);
        setReceivedFriendRequests(requestsList);
      } catch (error) {
        console.error('Ошибка загрузки запросов дружбы:', error);
      }
    }
  };

  const handleAcceptFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await acceptFriendRequest(currentUser.id, requesterId);
      if (success) {
        showAlert('Дружба принята', 'Запрос дружбы принят', 'success');
        await refreshFriends();
        await loadFriendRequests();
      } else {
        showAlert('Ошибка', 'Не удалось принять запрос', 'error');
      }
    } catch (error) {
      console.error('Ошибка принятия запроса дружбы:', error);
      showAlert('Ошибка', 'Произошла ошибка при принятии запроса', 'error');
    }
  };

  const handleDeclineFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await declineFriendRequest(currentUser.id, requesterId);
      if (success) {
        showAlert('Запрос отклонен', 'Запрос дружбы отклонен', 'info');
        await loadFriendRequests();
      } else {
        showAlert('Ошибка', 'Не удалось отклонить запрос', 'error');
      }
    } catch (error) {
      console.error('Ошибка отклонения запроса дружбы:', error);
      showAlert('Ошибка', 'Произошла ошибка при отклонении запроса', 'error');
    }
  };

  const handleSave = async () => {
    console.log('handleSave() вызвана');
    if (!currentUser) {
      console.log('currentUser отсутствует');
      return;
    }

    try {
      console.log('Начинаем сохранение...');
      // Объединяем поля видео в одну строку
      const goalsText = videoFields
        .filter(video => video.url.trim())
        .map(video => {
          const timeCodePart = video.timeCode.trim() ? ` (время: ${video.timeCode})` : '';
          return video.url + timeCodePart;
        })
        .join('\n');
      console.log('Объединенные видео:', goalsText);
      const updatedUser = { ...currentUser, ...editData, favoriteGoals: goalsText };
      console.log('Обновленный пользователь:', updatedUser);
      await updatePlayer(updatedUser);
      console.log('Пользователь обновлен в хранилище');
      
      // Обновляем текущего пользователя в хранилище
      await saveCurrentUser(updatedUser);
      console.log('Текущий пользователь обновлен в хранилище');
      
      setCurrentUser(updatedUser);
      setIsEditing(false);
      console.log('Режим редактирования выключен');
      
      // Принудительно обновляем заголовок
      setTimeout(() => {
        // Это заставит заголовок перезагрузить данные
        router.setParams({ refresh: Date.now().toString() });
      }, 100);
      
      showAlert('Успешно', 'Данные обновлены', 'success');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Выберите источник фото',
      'Откуда хотите загрузить фото?',
      [
        {
          text: 'Галерея',
          onPress: () => pickFromGallery()
        },
        {
          text: 'Камера',
          onPress: () => takePhoto()
        },
        {
          text: 'Отмена',
          style: 'cancel'
        }
      ]
    );
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужно разрешение для доступа к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditData({...editData, avatar: result.assets[0].uri});
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужно разрешение для доступа к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditData({...editData, avatar: result.assets[0].uri});
    }
  };

  // Функции для работы с фотографиями галереи
  const addPhotoToGallery = async () => {
    Alert.alert(
      'Добавить фотографию',
      'Откуда хотите добавить фото?',
      [
        {
          text: 'Галерея',
          onPress: () => pickPhotoFromGallery()
        },
        {
          text: 'Камера',
          onPress: () => takePhotoForGallery()
        },
        {
          text: 'Отмена',
          style: 'cancel'
        }
      ]
    );
  };

  const pickPhotoFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert('Ошибка', 'Нужно разрешение для доступа к галерее', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...galleryPhotos, result.assets[0].uri];
      setGalleryPhotos(newPhotos);
      setEditData({...editData, photos: newPhotos});
    }
  };

  const takePhotoForGallery = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert('Ошибка', 'Нужно разрешение для доступа к камере', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...galleryPhotos, result.assets[0].uri];
      setGalleryPhotos(newPhotos);
      setEditData({...editData, photos: newPhotos});
    }
  };

  const removePhotoFromGallery = (index: number) => {
    const newPhotos = galleryPhotos.filter((_, i) => i !== index);
    setGalleryPhotos(newPhotos);
    setEditData({...editData, photos: newPhotos});
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

  const handleLogout = async () => {
    setAlert({
      visible: true,
      title: 'Выход из профиля',
      message: 'Вы уверены, что хотите выйти из профиля?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await saveCurrentUser(null);
          // Очищаем состояние компонента
          setCurrentUser(null);
          setEditData({
            name: '',
            birthDate: '',
            country: '',
            team: '',
            position: '',
            number: '',
            grip: '',
            height: '',
            weight: '',
            favoriteGoals: '',
            avatar: '',
            games: '',
            goals: '',
            assists: '',
            points: ''
          });
          setFriends([]);
          setAlert({ ...alert, visible: false });
          router.push('/');
        } catch (error) {
          console.error('Ошибка при выходе:', error);
          setAlert({
            visible: true,
            title: 'Ошибка',
            message: 'Не удалось выйти из профиля',
            type: 'error',
            onConfirm: () => setAlert({ ...alert, visible: false }),
            onCancel: () => {},
            onSecondary: () => {},
            showCancel: false,
            showSecondary: false,
            confirmText: 'OK',
            cancelText: 'Отмена',
            secondaryText: 'Дополнительно'
          });
        }
      },
      onCancel: () => setAlert({ ...alert, visible: false }),
      onSecondary: () => {},
      showCancel: true,
      showSecondary: false,
      confirmText: 'Выйти',
      cancelText: 'Отмена',
      secondaryText: 'Дополнительно'
    });
  };

  const handleResetData = async () => {
    setAlert({
      visible: true,
      title: 'Сброс данных',
      message: 'Это действие перезагрузит все данные приложения (звезды, сообщения, уведомления). Ваши личные данные сохранятся. Продолжить?',
      type: 'warning',
      onConfirm: async () => {
        try {
          const success = await forceInitializeStorage();
          if (success) {
            showAlert('Успешно', 'Данные приложения перезагружены', 'success');
            // Перезагружаем данные пользователя
            await loadUserData();
          } else {
            showAlert('Ошибка', 'Не удалось перезагрузить данные', 'error');
          }
        } catch (error) {
          console.error('Ошибка при сбросе данных:', error);
          showAlert('Ошибка', 'Не удалось перезагрузить данные', 'error');
        }
      },
      onCancel: () => setAlert({ ...alert, visible: false }),
      onSecondary: () => {},
      showCancel: true,
      showSecondary: false,
      confirmText: 'Сбросить',
      cancelText: 'Отмена',
      secondaryText: 'Дополнительно'
    });
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

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            


            {/* Фото и основная информация */}
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={isEditing ? pickImage : undefined}>
                <Image 
                  source={{ uri: editData.avatar || currentUser.avatar || 'https://via.placeholder.com/150/333/fff?text=Player' }} 
                  style={styles.profileImage}
                  onError={() => console.log('Ошибка загрузки изображения')}
                />
                {isEditing && (
                  <View style={styles.editOverlay}>
                    <Ionicons name="camera" size={24} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.nameRow}>
                <Text style={styles.playerName}>{currentUser.name?.toUpperCase()}</Text>
                {currentUser.status === 'player' && (
                  isEditing ? (
                    <TextInput
                      style={styles.numberInput}
                      value={editData.number || ''}
                      onChangeText={(text) => setEditData({...editData, number: text})}
                      placeholder="#"
                      placeholderTextColor="#888"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  ) : currentUser.number ? (
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberText}>#{currentUser.number}</Text>
                    </View>
                  ) : null
                )}
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => {
                    console.log('Кнопка редактирования нажата, isEditing:', isEditing);
                    if (isEditing) {
                      // Если в режиме редактирования, сохраняем изменения
                      console.log('Вызываем handleSave()');
                      handleSave();
                    } else {
                      // Если не в режиме редактирования, входим в него
                      console.log('Входим в режим редактирования');
                      setIsEditing(true);
                    }
                  }}
                >
                  <Ionicons name={isEditing ? "checkmark" : "create"} size={25} color="#fff" />
                </TouchableOpacity>
                
                {/* Кнопка синхронизации */}
                <TouchableOpacity 
                  style={[styles.editButton, { marginLeft: 10 }]} 
                  onPress={() => router.push('/sync')}
                >
                  <Ionicons name="sync" size={25} color="#FF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.playerStatus}>
                {currentUser.status === 'player' ? 'Игрок' : 
                 currentUser.status === 'coach' ? 'Тренер' : 
                 currentUser.status === 'scout' ? 'Скаут' : 'Звезда'}
              </Text>
              {currentUser.team && <Text style={styles.playerTeam}>{currentUser.team}</Text>}
            </View>

            {/* Статистика - только для обычных игроков */}
            {currentUser.status !== 'star' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Статистика</Text>
                {isEditing ? (
                  <View style={styles.statsEditGrid}>
                    <View style={styles.statEditItem}>
                      <Text style={styles.statEditLabel}>Игр</Text>
                      <TextInput
                        style={styles.statEditInput}
                        value={editData.games || ''}
                        onChangeText={(text) => setEditData({...editData, games: text})}
                        placeholder="0"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.statEditItem}>
                      <Text style={styles.statEditLabel}>Голов</Text>
                      <TextInput
                        style={styles.statEditInput}
                        value={editData.goals || ''}
                        onChangeText={(text) => {
                          const newGoals = text;
                          const newPoints = calculatePoints(newGoals, editData.assists || '');
                          setEditData({
                            ...editData, 
                            goals: newGoals, 
                            points: newPoints
                          });
                        }}
                        placeholder="0"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.statEditItem}>
                      <Text style={styles.statEditLabel}>Передач</Text>
                      <TextInput
                        style={styles.statEditInput}
                        value={editData.assists || ''}
                        onChangeText={(text) => {
                          const newAssists = text;
                          const newPoints = calculatePoints(editData.goals || '', newAssists);
                          setEditData({
                            ...editData, 
                            assists: newAssists, 
                            points: newPoints
                          });
                        }}
                        placeholder="0"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.statEditItem}>
                      <Text style={styles.statEditLabel}>Очков</Text>
                      <TextInput
                        style={[styles.statEditInput, styles.readOnlyInput]}
                        value={editData.points || '0'}
                        editable={false}
                        placeholder="0"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                ) : (() => {
                  const goalsNum = parseInt(currentUser.goals || '0') || 0;
                  const assistsNum = parseInt(currentUser.assists || '0') || 0;
                  const gamesNum = parseInt(currentUser.games || '0') || 0;
                  const pointsNum = goalsNum + assistsNum;
                  
                  // Показываем статистику только если есть хотя бы одно ненулевое значение
                  const hasStats = pointsNum > 0 || goalsNum > 0 || assistsNum > 0 || gamesNum > 0;
                  
                  return hasStats ? (
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
                  ) : (
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{friends.length}</Text>
                        <Text style={styles.statLabel}>Друзей</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Информация о команде для звезд */}
            {currentUser.status === 'star' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Информация о команде</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Команда</Text>
                    <Text style={styles.infoValue}>{currentUser.team || 'Не указана'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Друзей</Text>
                    <Text style={styles.infoValue}>{friends.length}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Страна</Text>
                    <Text style={styles.infoValue}>{currentUser.country}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Позиция</Text>
                    <Text style={styles.infoValue}>{currentUser.position || 'Не указана'}</Text>
                  </View>
                  {currentUser.grip && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Хват</Text>
                      <Text style={styles.infoValue}>{currentUser.grip}</Text>
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
                  {isEditing ? (
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {editData.country || 'Выберите страну'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.infoValue}>{currentUser.country}</Text>
                  )}
                </View>
                {currentUser.status === 'player' && (
                  <>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Позиция</Text>
                      {isEditing ? (
                        <TouchableOpacity
                          style={styles.pickerButton}
                          onPress={() => setShowPositionPicker(true)}
                        >
                          <Text style={styles.pickerButtonText}>
                            {editData.position || 'Выберите позицию'}
                          </Text>
                          <Ionicons name="chevron-down" size={16} color="#fff" />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.infoValue}>{currentUser.position || 'Не указана'}</Text>
                      )}
                    </View>

                    {currentUser.birthDate && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Дата рождения</Text>
                        <Text style={styles.infoValue}>{currentUser.birthDate}</Text>
                      </View>
                    )}
                    {currentUser.grip && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Хват</Text>
                        <Text style={styles.infoValue}>{currentUser.grip}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Физические данные - только для игроков */}
            {currentUser.status === 'player' && (currentUser.height || currentUser.weight) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Физические данные</Text>
                <View style={styles.infoGrid}>
                  {currentUser.height && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Рост</Text>
                      {isEditing ? (
                        <TextInput
                          style={styles.editInput}
                          value={editData.height || ''}
                          onChangeText={(text) => setEditData({...editData, height: text})}
                          placeholder="Рост (см)"
                          placeholderTextColor="#888"
                          keyboardType="numeric"
                        />
                      ) : (
                        <Text style={styles.infoValue}>{currentUser.height} см</Text>
                      )}
                    </View>
                  )}
                  {currentUser.weight && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Вес</Text>
                      {isEditing ? (
                        <TextInput
                          style={styles.editInput}
                          value={editData.weight || ''}
                          onChangeText={(text) => setEditData({...editData, weight: text})}
                          placeholder="Вес (кг)"
                          placeholderTextColor="#888"
                          keyboardType="numeric"
                        />
                      ) : (
                        <Text style={styles.infoValue}>{currentUser.weight} кг</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Дата начала занятий хоккеем - только для игроков (не звезд) */}
            {currentUser.status === 'player' && (currentUser.hockeyStartDate || isEditing) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Дата начала занятий хоккеем</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Начал заниматься</Text>
                    {isEditing ? (
                      <View style={styles.dateInputContainer}>
                        <TextInput
                          style={styles.dateInput}
                          value={editData.hockeyStartDate || ''}
                          onChangeText={(text) => {
                            // Валидация формата MM.YYYY
                            const dateRegex = /^(\d{0,2})\.?(\d{0,4})$/;
                            const match = text.match(dateRegex);
                            
                            if (match) {
                              let formattedText = text;
                              // Автоматически добавляем точку если её нет и есть цифры
                              if (!text.includes('.') && text.length > 0) {
                                if (text.length <= 2) {
                                  formattedText = text;
                                } else {
                                  formattedText = text.slice(0, 2) + '.' + text.slice(2);
                                }
                              }
                              
                              // Ограничиваем месяц до 12, год до 4 цифр
                              const parts = formattedText.split('.');
                              if (parts.length === 2) {
                                const month = parseInt(parts[0]) || 0;
                                const year = parts[1];
                                if (month > 12) formattedText = '12.' + parts[1];
                                if (year.length > 4) formattedText = parts[0] + '.' + year.slice(0, 4);
                              }
                              
                              setEditData({...editData, hockeyStartDate: formattedText});
                            } else if (text === '' || text === '.') {
                              setEditData({...editData, hockeyStartDate: text});
                            }
                          }}
                          placeholder="MM.YYYY"
                          placeholderTextColor="#888"
                          keyboardType="numeric"
                          maxLength={7}
                        />
                        <Ionicons name="calendar-outline" size={20} color="#FF4444" style={styles.dateInputIcon} />
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>
                        {currentUser.hockeyStartDate ? 
                          `${currentUser.hockeyStartDate} (${calculateHockeyExperience(currentUser.hockeyStartDate)})` : 
                          'Не указана'
                        }
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Видео моих моментов */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Видео моих моментов</Text>
              {isEditing && (
                <Text style={styles.sectionSubtitle}>
                  Добавьте ссылку на YouTube видео и время начала момента (формат: минуты:секунды, например: 1:25)
                </Text>
              )}
                {isEditing ? (
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
                          placeholder="https://youtube.com/watch?v=..."
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
                      <Ionicons name="add-circle" size={20} color="#FF4444" />
                      <Text style={styles.addMoreButtonText}>Добавить еще</Text>
                    </TouchableOpacity>
                  </View>
                ) : currentUser.favoriteGoals ? (
                  <VideoCarousel
                    videos={currentUser.favoriteGoals.split('\n').filter(goal => goal.trim()).map(goal => parseVideoUrl(goal.trim()))}
                    onVideoPress={(video) => setSelectedVideo(video)}
                  />
                ) : (
                  <Text style={styles.noDataText}>Нет добавленных видео</Text>
                )}
              </View>
            )}

            {/* Нормативы - только для игроков (не звезд) */}
            {currentUser.status === 'player' && (
              (currentUser.pullUps || currentUser.pushUps || currentUser.plankTime || currentUser.sprint100m || currentUser.longJump || isEditing) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Нормативы</Text>
                  <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Подтягивания</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.pullUps || ''}
                        onChangeText={(text) => setEditData({...editData, pullUps: text})}
                        placeholder="Количество раз"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {currentUser.pullUps ? `${currentUser.pullUps} раз` : 'Не указано'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Отжимания</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.pushUps || ''}
                        onChangeText={(text) => setEditData({...editData, pushUps: text})}
                        placeholder="Количество раз"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {currentUser.pushUps ? `${currentUser.pushUps} раз` : 'Не указано'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Планка</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.plankTime || ''}
                        onChangeText={(text) => setEditData({...editData, plankTime: text})}
                        placeholder="Время в секундах"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {currentUser.plankTime ? `${currentUser.plankTime} сек` : 'Не указано'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>100 метров</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.sprint100m || ''}
                        onChangeText={(text) => setEditData({...editData, sprint100m: text})}
                        placeholder="Время в секундах"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {currentUser.sprint100m ? `${currentUser.sprint100m} сек` : 'Не указано'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Прыжок в длину</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editData.longJump || ''}
                        onChangeText={(text) => setEditData({...editData, longJump: text})}
                        placeholder="Длина в см"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {currentUser.longJump ? `${currentUser.longJump} см` : 'Не указано'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {/* Фотографии - только для игроков (не звезд) */}
            {currentUser.status === 'player' && (
              (currentUser.photos && currentUser.photos.length > 0) || isEditing ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Фотографии</Text>
                  {isEditing && (
                    <Text style={styles.sectionSubtitle}>
                      Добавьте фотографии для вашего профиля
                    </Text>
                  )}
                  {isEditing ? (
                    <View>
                      <TouchableOpacity
                        style={styles.addPhotoButton}
                        onPress={addPhotoToGallery}
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
                                  onPress={() => removePhotoFromGallery(index)}
                                >
                                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  ) : currentUser.photos && currentUser.photos.length > 0 ? (
                    <View style={styles.galleryContainer}>
                      <View style={styles.galleryGrid}>
                        {currentUser.photos.map((photo, index) => (
                        <TouchableOpacity
                          key={index}
                            style={styles.galleryItem}
                            onPress={() => setSelectedPhoto(photo)}
                          >
                            <Image source={{ uri: photo }} style={styles.galleryImage} />
                        </TouchableOpacity>
                        ))}
                      </View>
                  </View>
                ) : (
                    <Text style={styles.noDataText}>Нет добавленных фотографий</Text>
                )}
              </View>
              ) : null
            )}

            {/* Друзья - показываем только когда НЕ в режиме редактирования */}
            {!isEditing && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Друзья</Text>
                <TouchableOpacity onPress={refreshFriends} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
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
                  <Text style={styles.noDataText}>У вас пока нет друзей</Text>
                  <Text style={styles.noDataSubtext}>
                    Найдите других игроков и добавьте их в друзья
                  </Text>
                </View>
              )}
            </View>
            )}

            {/* Запросы дружбы - показываем всегда, если есть */}
            {receivedFriendRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Запросы дружбы</Text>
                  <TouchableOpacity onPress={loadFriendRequests} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color="#FF4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.friendsGrid}>
                  {receivedFriendRequests.map((requester) => (
                    <View key={requester.id} style={styles.friendRequestItem}>
                      <TouchableOpacity
                        style={styles.friendRequestContent}
                        onPress={() => router.push(`/player/${requester.id}`)}
                      >
                        <Image 
                          source={{ uri: requester.avatar || 'https://via.placeholder.com/60/333/fff?text=Player' }} 
                          style={styles.friendAvatar}
                        />
                        <Text style={styles.friendName} numberOfLines={2}>
                          {requester.name?.toUpperCase()}
                        </Text>
                        {requester.team && (
                          <Text style={styles.friendTeam} numberOfLines={1}>
                            {requester.team}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <View style={styles.friendRequestActionsBottom}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptFriendRequest(requester.id)}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.declineButton]}
                          onPress={() => handleDeclineFriendRequest(requester.id)}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Кнопки действий */}
            {isEditing && (
              <View style={styles.actionsSection}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Ionicons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Сохранить изменения</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setEditData(currentUser);
                    setIsEditing(false);
                  }}
                >
                  <Ionicons name="close" size={20} color="#000" />
                  <Text style={styles.cancelButtonText}>Отменить</Text>
                </TouchableOpacity>
              </View>
            )}

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
            
            {/* Кнопки управления */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity 
                style={[styles.logoutButton, styles.resetButton]} 
                onPress={handleResetData}
              >
                <Ionicons name="refresh-outline" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Сбросить данные</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Выйти из профиля</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
      


      {/* Модальное окно для просмотра фотографий */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.videoModalOverlay}>
          <TouchableOpacity 
            style={styles.videoModalOverlay} 
            activeOpacity={1}
            onPress={() => setSelectedPhoto(null)}
          >
            {selectedPhoto && (
              <Image 
                source={{ uri: selectedPhoto }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
      
      {/* Модальное окно для видео */}
      <Modal
        visible={!!selectedVideo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModalContainer}>
            {selectedVideo && (
              <YouTubeVideo
                url={selectedVideo.url}
                title="Мой момент"
                timeCode={selectedVideo.timeCode || undefined}
                onClose={() => setSelectedVideo(null)}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Кастомный алерт */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        onSecondary={alert.onSecondary}
        showCancel={alert.showCancel}
        showSecondary={alert.showSecondary}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        secondaryText={alert.secondaryText}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 10,
    marginTop: -12,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF4444',
    marginBottom: 15,
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 28,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 5,
    lineHeight: 28,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  numberBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  numberText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  numberInput: {
    backgroundColor: '#FF4444',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 30,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    borderWidth: 0,
  },
  playerStatus: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 2,
  },
  playerTeam: {
    fontSize: 18,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    marginBottom: 15,
    fontStyle: 'italic',
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
  editInput: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    paddingVertical: 10,
  },
  dateInputIcon: {
    marginLeft: 10,
  },
  galleryContainer: {
    marginTop: 20,
  },
  galleryTitle: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 15,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryItem: {
    position: 'relative',
    width: 100,
    height: 75,
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
    backgroundColor: '#000',
    borderRadius: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  friendsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
    textAlign: 'center',
  },
  actionsSection: {
    gap: 15,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#000',
    marginLeft: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 300,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalScroll: {
    maxHeight: 250,
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    textAlign: 'center',
  },
  modalCancelButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  addMoreButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginLeft: 8,
  },
  videoFieldContainer: {
    marginBottom: 15,
  },
  videoUrlInput: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  timeCodeInput: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '30%',
    textAlign: 'center',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
  },
  logoutContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 10,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: 'rgba(255, 193, 7, 0.5)',
    marginBottom: 10,
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  friendItem: {
    width: '45%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 13,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  friendTeam: {
    fontSize: 11,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  noDataSubtext: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 5,
  },
  statsEditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statEditItem: {
    flex: 1,
    minWidth: '45%',
  },
  statEditLabel: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginBottom: 5,
  },
  statEditInput: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  readOnlyInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    color: '#ccc',
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FF4444',
    justifyContent: 'center',
  },
  addPhotoButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginLeft: 8,
  },
  photosContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  videoModalContainer: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  friendRequestItem: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 140,
    width: '45%',
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  friendRequestActionsBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  friendRequestContent: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },

}); 