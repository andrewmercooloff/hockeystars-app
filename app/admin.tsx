import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Player, loadCurrentUser, loadPlayers, updatePlayer } from '../utils/playerStorage';
import { uploadImageToStorage } from '../utils/uploadImage';

const logo = require('../assets/images/logo.png');

const AdminHeader = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  const loadUser = async () => {
    try {
      const user = await loadCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Ошибка загрузки текущего пользователя:', error);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleProfilePress = () => {
    try {
      if (currentUser) {
        router.push('/profile');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка навигации к профилю:', error);
      Alert.alert('Ошибка', 'Не удалось перейти к профилю');
    }
  };

  return (
    <View style={styles.adminHeader}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <Image source={logo} style={styles.logo} />
      
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={handleProfilePress}
      >
        <View style={styles.profileIcon}>
          {currentUser?.avatar ? (
            <Image
              source={
                (currentUser.avatar && typeof currentUser.avatar === 'string' && (
                  currentUser.avatar.startsWith('data:image/') || 
                  currentUser.avatar.startsWith('http') || 
                  currentUser.avatar.startsWith('file://') || 
                  currentUser.avatar.startsWith('content://')
                ))
                  ? { 
                      uri: currentUser.avatar,
                      cache: 'reload',
                      headers: {
                        'Cache-Control': 'no-cache'
                      }
                    }
                  : require('../assets/images/me.jpg')
              }
              style={styles.profileImage}
              onError={(error) => {
                console.log('❌ Ошибка загрузки аватара в AdminHeader:', error);
                console.log('   URL аватара:', currentUser.avatar);
              }}
              onLoad={() => {
                console.log('✅ Аватар в AdminHeader успешно загружен:', currentUser.avatar);
              }}
            />
          ) : (
            <Ionicons name="person" size={25} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function AdminScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [refreshKey, setRefreshKey] = useState(0); // Для принудительного обновления FlatList
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null); // ID игрока для редактирования
  
  // Состояния для календарей
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState<'birthDate'>('birthDate');

  useEffect(() => {
    loadData();
    console.log('🔧 Экран администратора загружен');
  }, []);

  // Обработка параметров для редактирования конкретного игрока
  useEffect(() => {
    const params = router.params as any;
    if (params?.editPlayer) {
      console.log('🔧 Получен параметр editPlayer:', params.editPlayer);
      setEditPlayerId(params.editPlayer);
      // Найдем игрока и откроем модальное окно редактирования
      const playerToEdit = players.find(p => p.id === params.editPlayer);
      if (playerToEdit) {
        console.log('🔧 Найден игрок для редактирования:', playerToEdit.name);
        setSelectedPlayer(playerToEdit);
        setEditData(playerToEdit);
        setIsEditing(true);
        setShowPlayerModal(true);
      }
    }
  }, [router.params, players]);

  const loadData = async () => {
    try {
      console.log('🔧 Загружаем данные для панели администратора...');
      const [loadedPlayers, user] = await Promise.all([
        loadPlayers(),
        loadCurrentUser()
      ]);
      console.log('🔧 Загружено игроков:', loadedPlayers.length);
      console.log('🔧 Текущий пользователь:', user?.name, 'статус:', user?.status);
      console.log('📸 Аватар текущего пользователя:', user?.avatar);
      console.log('📸 Тип аватара текущего пользователя:', typeof user?.avatar);
      
      setPlayers(loadedPlayers);
      setCurrentUser(user);
      
      // Проверяем, является ли пользователь администратором
      if (user?.status !== 'admin') {
        console.log('❌ Пользователь не является администратором:', user?.status);
        Alert.alert('Доступ запрещен', 'Только администраторы могут использовать эту функцию');
        router.back();
      } else {
        console.log('✅ Пользователь является администратором');
        
        // Дополнительная отладочная информация для admin
        if (user.avatar && typeof user.avatar === 'string') {
          if (user.avatar.startsWith('http')) {
            console.log('✅ Аватар admin - это HTTP URL');
          } else if (user.avatar.startsWith('data:')) {
            console.log('✅ Аватар admin - это base64 строка');
          } else if (user.avatar.startsWith('file://') || user.avatar.startsWith('content://')) {
            console.log('✅ Аватар admin - это локальный файл');
          } else {
            console.log('⚠️ Аватар admin - неизвестный формат:', user.avatar);
          }
        } else {
          console.log('⚠️ Аватар admin отсутствует или имеет неверный тип');
        }
      }
      
      // Находим всех admin пользователей и выводим информацию о их аватарах
      const adminUsers = loadedPlayers.filter(p => p.status === 'admin');
      console.log('👑 Найдено admin пользователей:', adminUsers.length);
      adminUsers.forEach((adminUser, index) => {
        console.log(`👑 Admin ${index + 1}:`, adminUser.name);
        console.log(`📸 Аватар admin ${index + 1}:`, adminUser.avatar);
        console.log(`📸 Тип аватара admin ${index + 1}:`, typeof adminUser.avatar);
      });
      
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
    }
  };

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.team?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Функции для работы с календарями
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const showDatePicker = (mode: 'birthDate') => {
    console.log('📅 showDatePicker вызван с режимом:', mode);
    console.log('📅 Текущая дата рождения:', editData.birthDate);
    const currentDate = parseDate(editData.birthDate || '');
    console.log('📅 Парсированная дата:', currentDate);
    setSelectedDate(currentDate);
    setShowBirthDatePicker(true);
    console.log('📅 showBirthDatePicker установлен в true');
  };

  const handleDateChange = (event: any, date?: Date) => {
    console.log('📅 handleDateChange вызван:', { event: event.type, date });
    
    if (Platform.OS === 'ios') {
      // На iOS календарь не закрывается автоматически
      if (date) {
        console.log('📅 iOS: обновляем selectedDate');
        setSelectedDate(date);
      }
    } else {
      // На Android календарь закрывается только при полном выборе
      if (event.type === 'set' && date) {
        console.log('📅 Android: устанавливаем дату и закрываем календарь');
        setShowBirthDatePicker(false);
        setSelectedDate(date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        const formattedDate = `${day}.${month}.${year}`;
        console.log('📅 Android: форматированная дата:', formattedDate);
        setEditData(prev => ({ ...prev, birthDate: formattedDate }));
      } else if (event.type === 'dismissed') {
        console.log('📅 Android: календарь отменен');
        setShowBirthDatePicker(false);
      }
    }
  };

  const handleEditPlayer = (player: Player) => {
    console.log('🔧 Редактируем игрока:', player.name, 'статус:', player.status);
    setSelectedPlayer(player);
    setEditData({
      name: player.name || '',
      position: player.position || '',
      team: player.team || '',
      age: player.age || 0,
      height: player.height || '',
      weight: player.weight || '',
      city: player.city || '',
      birthDate: player.birthDate || '',
      hockeyStartDate: player.hockeyStartDate || '',
      phone: player.phone || '',
      experience: player.experience || '',
      achievements: player.achievements || '',
      goals: player.goals || '',
      assists: player.assists || '',
      games: player.games || '',
      pullUps: player.pullUps || '',
      pushUps: player.pushUps || '',
      plankTime: player.plankTime || '',
      sprint100m: player.sprint100m || '',
      longJump: player.longJump || '',
      status: player.status || 'player',
      avatar: player.avatar || ''
    });
    setIsEditing(true);
    setShowPlayerModal(true);
  };

  const pickImage = async () => {
    console.log('📸 Вызывается pickImage()');
    
    // Показываем системное окно выбора источника фото
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
    try {
      if (Platform.OS === 'web') {
        console.log('🌐 Веб-версия: создаем input для загрузки файла');
        // Для веб-версии создаем input для загрузки файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            try {
              // Конвертируем файл в base64 для сохранения
              const reader = new FileReader();
              reader.onload = async (e) => {
                const base64String = e.target?.result as string;
                console.log('📸 Веб: конвертировано в base64, длина:', base64String.length);
                
                // Загружаем изображение в Supabase Storage
                const uploadedUrl = await uploadImageToStorage(base64String);
                if (uploadedUrl) {
                  console.log('✅ Веб: изображение загружено в Storage:', uploadedUrl);
                  
                  const newEditData = {
                    ...editData,
                    photo: uploadedUrl,
                    avatar: uploadedUrl
                  };
                  
                  console.log('📸 Веб: обновляем editData с URL из Storage');
                  setEditData(newEditData);
                  
                  // Автоматически сохраняем фото сразу после загрузки
                  if (selectedPlayer) {
                    try {
                      console.log('🔄 Автоматическое сохранение фото для:', selectedPlayer.name);
                      await updatePlayer(selectedPlayer.id, newEditData);
                      console.log('✅ Фото автоматически сохранено');
                      
                      // Обновляем список игроков
                      const updatedPlayers = await loadPlayers();
                      setPlayers(updatedPlayers);
                      
                      // Обновляем selectedPlayer с новыми данными
                      const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
                      if (updatedPlayer) {
                        setSelectedPlayer(updatedPlayer);
                        setEditData(updatedPlayer);
                      }
                      
                      // Принудительно обновляем FlatList
                      setRefreshKey(prev => prev + 1);
                      
                      Alert.alert('Успешно', 'Фото загружено и сохранено');
                    } catch (error) {
                      console.error('❌ Ошибка автоматического сохранения:', error);
                      Alert.alert('Ошибка', 'Фото загружено, но не удалось сохранить');
                    }
                  }
                } else {
                  console.log('⚠️ Веб: не удалось загрузить в Storage, используем base64');
                  
                  const newEditData = {
                    ...editData,
                    photo: base64String,
                    avatar: base64String
                  };
                  
                  console.log('📸 Веб: обновляем editData с base64');
                  setEditData(newEditData);
                  
                  // Автоматически сохраняем фото сразу после загрузки
                  if (selectedPlayer) {
                    try {
                      console.log('🔄 Автоматическое сохранение фото для:', selectedPlayer.name);
                      await updatePlayer(selectedPlayer.id, newEditData);
                      console.log('✅ Фото автоматически сохранено');
                      
                      // Обновляем список игроков
                      const updatedPlayers = await loadPlayers();
                      setPlayers(updatedPlayers);
                      
                      // Обновляем selectedPlayer с новыми данными
                      const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
                      if (updatedPlayer) {
                        setSelectedPlayer(updatedPlayer);
                        setEditData(updatedPlayer);
                      }
                      
                      // Принудительно обновляем FlatList
                      setRefreshKey(prev => prev + 1);
                      
                      Alert.alert('Успешно', 'Фото загружено и сохранено');
                    } catch (error) {
                      console.error('❌ Ошибка автоматического сохранения:', error);
                      Alert.alert('Ошибка', 'Фото загружено, но не удалось сохранить');
                    }
                  }
                }
              };
              reader.readAsDataURL(file);
            } catch (error) {
              console.error('❌ Ошибка конвертации файла:', error);
              Alert.alert('Ошибка', 'Не удалось обработать файл');
            }
          }
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📸 Результат выбора из галереи:', JSON.stringify(result));

      if (result.canceled) {
        console.log('📸 Выбор фото отменен пользователем');
        return;
      }
      if (!result.assets || !result.assets[0] || !result.assets[0].uri) {
        console.error('❌ Нет uri в результате выбора из галереи:', result.assets);
        Alert.alert('Ошибка', 'Не удалось получить фото из галереи.');
        return;
      }

      const photoUri = result.assets[0].uri;
      console.log('📸 Админ загрузил фото из галереи:', photoUri);
      console.log('📸 Текущий editData до обновления:', editData);

      // Загружаем изображение в Supabase Storage
      const uploadedUrl = await uploadImageToStorage(photoUri);
      if (uploadedUrl) {
        console.log('✅ Изображение загружено в Storage:', uploadedUrl);
        
        const newEditData = {
          ...editData,
          photo: uploadedUrl,
          avatar: uploadedUrl
        };

        setEditData(newEditData);

        // Автоматически сохраняем фото сразу после загрузки
        if (selectedPlayer) {
          try {
            await updatePlayer(selectedPlayer.id, newEditData);
            const updatedPlayers = await loadPlayers();
            setPlayers(updatedPlayers);
            const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
            if (updatedPlayer) {
              setSelectedPlayer(updatedPlayer);
              setEditData(updatedPlayer);
            }
            setRefreshKey(prev => prev + 1);
            Alert.alert('Успешно', 'Фото загружено и сохранено');
          } catch (error) {
            console.error('❌ Ошибка автоматического сохранения:', error);
            Alert.alert('Ошибка', 'Фото загружено, но не удалось сохранить');
          }
        }
      } else {
        console.log('⚠️ Не удалось загрузить в Storage, используем локальный путь');
        
        const newEditData = {
          ...editData,
          photo: photoUri,
          avatar: photoUri
        };

        setEditData(newEditData);

        // Автоматически сохраняем фото сразу после загрузки
        if (selectedPlayer) {
          try {
            await updatePlayer(selectedPlayer.id, newEditData);
            const updatedPlayers = await loadPlayers();
            setPlayers(updatedPlayers);
            const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
            if (updatedPlayer) {
              setSelectedPlayer(updatedPlayer);
              setEditData(updatedPlayer);
            }
            setRefreshKey(prev => prev + 1);
            Alert.alert('Успешно', 'Фото загружено и сохранено');
          } catch (error) {
            console.error('❌ Ошибка автоматического сохранения:', error);
            Alert.alert('Ошибка', 'Фото загружено, но не удалось сохранить');
          }
        }
      }
    } catch (error) {
      console.error('❌ Ошибка выбора фото из галереи:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото из галереи.');
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        console.log('🌐 Веб-версия: камера не поддерживается');
        Alert.alert('Информация', 'Съемка фото не поддерживается в веб-версии. Используйте галерею.');
        return;
      }

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
        const photoUri = result.assets[0].uri;
        console.log('📸 Админ загрузил фото с камеры:', photoUri);
        console.log('📸 Текущий editData до обновления:', editData);
        
        // Загружаем изображение в Supabase Storage
        const uploadedUrl = await uploadImageToStorage(photoUri);
        if (uploadedUrl) {
          console.log('✅ Изображение загружено в Storage:', uploadedUrl);
          
          const newEditData = {
            ...editData,
            photo: uploadedUrl,
            avatar: uploadedUrl
          };
          
          console.log('📸 Новый editData после обновления:', newEditData);
          setEditData(newEditData);
          
          // Автоматически сохраняем фото сразу после загрузки
          if (selectedPlayer) {
            try {
              console.log('🔄 Автоматическое сохранение фото для:', selectedPlayer.name);
              await updatePlayer(selectedPlayer.id, newEditData);
              console.log('✅ Фото автоматически сохранено');
              
              // Обновляем список игроков
              const updatedPlayers = await loadPlayers();
              setPlayers(updatedPlayers);
              
              // Обновляем selectedPlayer с новыми данными
              const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
              if (updatedPlayer) {
                setSelectedPlayer(updatedPlayer);
                setEditData(updatedPlayer);
              }
              
              // Принудительно обновляем FlatList
              setRefreshKey(prev => prev + 1);
              
              Alert.alert('Успешно', 'Фото загружено и сохранено');
            } catch (error) {
              console.error('❌ Ошибка автоматического сохранения:', error);
              Alert.alert('Ошибка', 'Фото загружено, но не удалось сохранить');
            }
          }
        } else {
          console.log('⚠️ Не удалось загрузить в Storage, используем локальный путь');
          
          const newEditData = {
            ...editData,
            photo: photoUri,
            avatar: photoUri
          };
          
          console.log('📸 Новый editData после обновления:', newEditData);
          setEditData(newEditData);
          
          // Автоматически сохраняем фото сразу после загрузки
          if (selectedPlayer) {
            try {
              console.log('🔄 Автоматическое сохранение фото для:', selectedPlayer.name);
              await updatePlayer(selectedPlayer.id, newEditData);
              console.log('✅ Фото автоматически сохранено');
              
              // Обновляем список игроков
              const updatedPlayers = await loadPlayers();
              setPlayers(updatedPlayers);
              
              // Обновляем selectedPlayer с новыми данными
              const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
              if (updatedPlayer) {
                setSelectedPlayer(updatedPlayer);
                setEditData(updatedPlayer);
              }
              
              // Принудительно обновляем FlatList
              setRefreshKey(prev => prev + 1);
              
              Alert.alert('Успешно', 'Фото загружено и сохранено');
            } catch (error) {
              console.error('❌ Ошибка автоматического сохранения:', error);
              Alert.alert('Ошибка', 'Фото загружено, но не удалось сохранить');
            }
          }
        }
        
        // Принудительно обновляем состояние
        setTimeout(() => {
          console.log('📸 Проверяем editData после setTimeout:', editData);
        }, 100);
      } else {
        console.log('📸 Загрузка фото с камеры отменена');
      }
    } catch (error) {
      console.error('❌ Ошибка при съемке фото:', error);
      Alert.alert('Ошибка', 'Не удалось снять фото');
    }
  };

  const handleSave = async () => {
    if (!selectedPlayer) return;

    try {
      console.log('🔄 Админ обновляет игрока:', selectedPlayer.name);
      console.log('📸 Данные для сохранения:', editData);
      console.log('📸 ID игрока:', selectedPlayer.id);
      console.log('📸 Тип аватара:', typeof editData.avatar);
      console.log('📸 Длина аватара:', editData.avatar?.length || 0);
      
      if (Platform.OS === 'web') {
        console.log('🌐 Веб-версия: сохраняем данные');
      }
      
      // Если это admin пользователь, обновляем также currentUser
      if (selectedPlayer.status === 'admin' && currentUser && selectedPlayer.id === currentUser.id) {
        console.log('👑 Обновляем currentUser для admin');
        const updatedCurrentUser = { ...currentUser, ...editData };
        setCurrentUser(updatedCurrentUser);
        // Здесь можно также сохранить обновленного пользователя в AsyncStorage
      }
      
      await updatePlayer(selectedPlayer.id, editData);
      console.log('✅ Игрок успешно обновлен в базе данных');
      
      // Обновляем список игроков
      const updatedPlayers = await loadPlayers();
      console.log('🔄 Обновленный список игроков:', updatedPlayers.length);
      
      // Проверяем, сохранилось ли фото
      const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
      if (updatedPlayer) {
        console.log('📸 Проверяем сохраненный аватар:', {
          hasAvatar: !!updatedPlayer.avatar,
          avatarLength: updatedPlayer.avatar?.length || 0
        });
      }
      
      setPlayers(updatedPlayers);
      
      // Принудительно обновляем FlatList
      setRefreshKey(prev => prev + 1);
      
      // Принудительно обновляем главный экран
      setTimeout(() => {
        router.push({ pathname: '/', params: { refresh: Date.now().toString() } });
      }, 100);
      
      setIsEditing(false);
      setShowPlayerModal(false);
      setSelectedPlayer(null);
      
      // Показываем уведомление только после закрытия модального окна
      setTimeout(() => {
        Alert.alert('Успешно', 'Данные игрока обновлены');
      }, 100);
      
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'star': return '#FFD700';
      case 'coach': return '#FF4444';
      case 'scout': return '#888888';
      case 'admin': return '#8A2BE2';
      default: return '#FFFFFF';
    }
  };

  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case 'star': return 'Звезда';
      case 'coach': return 'Тренер';
      case 'scout': return 'Скаут';
      case 'admin': return 'Админ';
      case 'player': return 'Игрок';
      default: return 'Игрок';
    }
  };

  const renderPlayerItem = ({ item }: { item: Player }) => {
    // Функция для получения правильного источника изображения
    const getImageSource = () => {
      if (!item.avatar) {
        return require('../assets/images/me.jpg');
      }
      
      if (typeof item.avatar === 'string') {
        // Проверяем, это ли base64 строка (загруженное фото)
        if (item.avatar.startsWith('data:image/')) {
          return { 
            uri: item.avatar,
            cache: 'reload',
            headers: {
              'Cache-Control': 'no-cache'
            }
          };
        }
        
        // Проверяем, это ли URI (фото загруженное пользователем)
        if (item.avatar.startsWith('http') || item.avatar.startsWith('file://') || item.avatar.startsWith('content://')) {
          return { 
            uri: item.avatar,
            cache: 'reload',
            headers: {
              'Cache-Control': 'no-cache'
            }
          };
        }
        
        // Проверяем идентификаторы тестовых игроков
        if (item.avatar.includes('kostitsyn1') || item.avatar.includes('kostitsyn2')) {
          return require('../assets/images/me.jpg');
        } else if (item.avatar.includes('grabovsky')) {
          return require('../assets/images/me.jpg');
        } else if (item.avatar.includes('sharangovich')) {
          return require('../assets/images/me.jpg');
        } else if (item.avatar.includes('merkulov1') || item.avatar.includes('merkulov2')) {
          return require('../assets/images/me.jpg');
        } else if (item.avatar.includes('admin')) {
          return require('../assets/images/me.jpg');
        } else if (item.avatar === 'new_player') {
          return require('../assets/images/me.jpg');
        }
      }
      
      return require('../assets/images/me.jpg');
    };

    return (
      <TouchableOpacity 
        style={styles.playerItem} 
        onPress={() => handleEditPlayer(item)}
      >
        <Image 
          source={getImageSource()}
          style={[
            styles.playerAvatar,
            { borderColor: getStatusColor(item.status) }
          ]}
          onError={(error) => {
            console.log('❌ Ошибка загрузки аватара в списке игроков:', error);
            console.log('   Игрок:', item.name);
            console.log('   URL аватара:', item.avatar);
          }}
          onLoad={() => {
            console.log('✅ Аватар в списке игроков успешно загружен:', item.name, item.avatar);
          }}
        />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.name || 'Без имени'}</Text>
          <Text style={styles.playerDetails}>
            {item.position || 'Не указана'} • {item.team || 'Не указана'} • {item.age || 0} лет
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Ionicons name="create" size={24} color="#666" />
      </TouchableOpacity>
    );
  };

  if (currentUser?.status !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Доступ запрещен</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск игроков..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      {/* Кнопки диагностики, очистки и миграции */}
      <View style={styles.imageButtonsContainer}>
        <TouchableOpacity 
          style={[styles.imageButton, styles.fixAllButton]}
          onPress={async () => {
            try {
              Alert.alert(
                'Полное исправление',
                'Выполнить полное исправление всех проблем с изображениями?',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { 
                    text: 'Исправить', 
                    onPress: async () => {
                      const { fixAllImageIssues } = await import('../utils/playerStorage');
                      await fixAllImageIssues();
                      Alert.alert('Готово', 'Полное исправление завершено');
                      // Обновляем список игроков
                      loadData();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Ошибка исправления:', error);
              Alert.alert('Ошибка', 'Не удалось выполнить исправление');
            }
          }}
        >
          <Ionicons name="build" size={16} color="#fff" />
          <Text style={styles.imageButtonText}>Исправить все</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageButtonsContainer}>
        <TouchableOpacity 
          style={[styles.imageButton, styles.diagnoseButton]}
          onPress={async () => {
            try {
              const { diagnoseImages } = await import('../utils/playerStorage');
              await diagnoseImages();
              Alert.alert('Диагностика', 'Проверьте консоль для результатов диагностики');
            } catch (error) {
              console.error('Ошибка диагностики:', error);
              Alert.alert('Ошибка', 'Не удалось выполнить диагностику');
            }
          }}
        >
          <Ionicons name="search" size={16} color="#fff" />
          <Text style={styles.imageButtonText}>Диагностика</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.imageButton, styles.cleanupButton]}
          onPress={async () => {
            try {
              Alert.alert(
                'Очистка данных',
                'Очистить некорректные данные в базе?',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { 
                    text: 'Очистить', 
                    onPress: async () => {
                      const { cleanupDatabaseData } = await import('../utils/playerStorage');
                      await cleanupDatabaseData();
                      Alert.alert('Готово', 'Очистка данных завершена');
                      // Обновляем список игроков
                      loadData();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Ошибка очистки:', error);
              Alert.alert('Ошибка', 'Не удалось выполнить очистку');
            }
          }}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.imageButtonText}>Очистка</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.imageButton, styles.migrateButton]}
          onPress={async () => {
            try {
              Alert.alert(
                'Миграция изображений',
                'Начать миграцию всех локальных изображений в Storage?',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { 
                    text: 'Начать', 
                    onPress: async () => {
                      const { migrateAllImagesToStorage } = await import('../utils/playerStorage');
                      await migrateAllImagesToStorage();
                      Alert.alert('Готово', 'Миграция изображений завершена');
                      // Обновляем список игроков
                      loadData();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Ошибка миграции:', error);
              Alert.alert('Ошибка', 'Не удалось выполнить миграцию');
            }
          }}
        >
          <Ionicons name="cloud-upload" size={16} color="#fff" />
          <Text style={styles.imageButtonText}>Миграция</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.imageButton, styles.fixUrlsButton]}
          onPress={async () => {
            try {
              Alert.alert(
                'Исправление URL',
                'Проверить и исправить URL изображений?',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { 
                    text: 'Исправить', 
                    onPress: async () => {
                      const { fixImageUrls } = await import('../utils/playerStorage');
                      await fixImageUrls();
                      Alert.alert('Готово', 'Проверка URL изображений завершена');
                      // Обновляем список игроков
                      loadData();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Ошибка исправления URL:', error);
              Alert.alert('Ошибка', 'Не удалось исправить URL');
            }
          }}
        >
          <Ionicons name="link" size={16} color="#fff" />
          <Text style={styles.imageButtonText}>Исправить URL</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.imageButton, styles.publicUrlsButton]}
          onPress={async () => {
            try {
              Alert.alert(
                'Публичные URL',
                'Обновить URL изображений на публичные ссылки?',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { 
                    text: 'Обновить', 
                    onPress: async () => {
                      const { updateImageUrlsToPublic } = await import('../utils/playerStorage');
                      await updateImageUrlsToPublic();
                      Alert.alert('Готово', 'Обновление публичных URL завершено');
                      // Обновляем список игроков
                      loadData();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Ошибка обновления публичных URL:', error);
              Alert.alert('Ошибка', 'Не удалось обновить публичные URL');
            }
          }}
        >
          <Ionicons name="globe" size={16} color="#fff" />
          <Text style={styles.imageButtonText}>Публичные URL</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPlayers}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id}
        style={styles.playerList}
        showsVerticalScrollIndicator={false}
        key={refreshKey} // Принудительное обновление при изменении
      />

      {/* Модальное окно редактирования игрока */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPlayerModal(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Редактирование' : 'Просмотр'} игрока
            </Text>
            <TouchableOpacity 
              style={styles.saveButtonContainer}
              onPress={handleSave} 
              disabled={!isEditing}
            >
              <Text style={[styles.saveButton, !isEditing && styles.saveButtonDisabled]}>
                Сохранить
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalContentContainer}
          >
            <View style={styles.photoSection}>
              <TouchableOpacity 
                style={styles.photoContainer}
                onPress={() => {
                  console.log('📸 Нажата кнопка загрузки фото, isEditing:', isEditing);
                  console.log('📸 showImagePickerModal до вызова pickImage:', showPlayerModal);
                  if (isEditing) {
                    console.log('📸 Вызываем pickImage()...');
                    pickImage();
                    console.log('📸 pickImage() вызван');
                  } else {
                    console.log('❌ Режим редактирования не активен');
                  }
                }}
              >
                <Image 
                  source={
                    editData.avatar && typeof editData.avatar === 'string' && (
                      editData.avatar.startsWith('data:image/') || 
                      editData.avatar.startsWith('http') || 
                      editData.avatar.startsWith('file://') || 
                      editData.avatar.startsWith('content://')
                    )
                      ? { 
                          uri: editData.avatar,
                          cache: 'reload',
                          headers: {
                            'Cache-Control': 'no-cache'
                          }
                        }
                      : require('../assets/images/me.jpg')
                  }
                  style={[
                    styles.editPhoto,
                    { borderColor: getStatusColor(editData.status) }
                  ]}
                  onError={(error) => {
                    console.log('❌ Ошибка загрузки аватара в модальном окне:', error);
                    console.log('   URL аватара:', editData.avatar);
                  }}
                  onLoad={() => {
                    console.log('✅ Аватар в модальном окне успешно загружен:', editData.avatar);
                  }}
                />
                {isEditing && (
                  <View style={styles.editOverlay}>
                    <Ionicons name="camera" size={24} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Основная информация</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Имя</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={editData.name}
                  onChangeText={(text) => setEditData({...editData, name: text})}
                  editable={isEditing}
                  placeholder="Имя игрока"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Позиция</Text>
                <View style={styles.selectorContainer}>
                  {['Нападающий', 'Защитник', 'Вратарь', 'Тренер', 'Скаут', 'Администратор'].map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      style={[
                        styles.selectorOption,
                        editData.position === pos && styles.selectorOptionSelected
                      ]}
                      onPress={() => isEditing && setEditData({...editData, position: pos})}
                      disabled={!isEditing}
                    >
                      <Text style={[
                        styles.selectorOptionText,
                        editData.position === pos && styles.selectorOptionTextSelected
                      ]}>
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Команда</Text>
                <View style={styles.selectorContainer}>
                  {['Динамо Минск', 'Динамо Могилев', 'Неман', 'Юность', 'Шахтер', 'Брест', 'Витебск', 'Гомель', 'Гродно', 'Могилев', 'Бобруйск', 'Барановичи', 'Орша', 'Полоцк', 'Солигорск', 'Жлобин', 'Слуцк', 'Молодечно', 'Лида', 'Борисов', 'Слоним', 'Кобрин', 'Пинск', 'Лунинец', 'Калинковичи', 'Речица', 'Жодино', 'Смолевичи', 'Дзержинск', 'Фаниполь', 'Узда', 'Клецк', 'Несвиж', 'Столбцы', 'Копыль', 'Любань', 'Старые Дороги', 'Марьина Горка', 'Червень', 'Березино', 'Смолевичи', 'Дзержинск', 'Фаниполь', 'Узда', 'Клецк', 'Несвиж', 'Столбцы', 'Копыль', 'Любань', 'Старые Дороги', 'Марьина Горка', 'Червень', 'Березино'].map((team) => (
                    <TouchableOpacity
                      key={team}
                      style={[
                        styles.selectorOption,
                        editData.team === team && styles.selectorOptionSelected
                      ]}
                      onPress={() => isEditing && setEditData({...editData, team: team})}
                      disabled={!isEditing}
                    >
                      <Text style={[
                        styles.selectorOptionText,
                        editData.team === team && styles.selectorOptionTextSelected
                      ]}>
                        {team}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Хоккейный номер</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={editData.number}
                  onChangeText={(text) => setEditData({...editData, number: text})}
                  editable={isEditing}
                  placeholder="Номер"
                  keyboardType="numeric"
                />
              </View>

              {/* Дополнительные поля только для не-звезд */}
              {editData.status !== 'star' && (
                <>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Возраст</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.age?.toString()}
                        onChangeText={(text) => setEditData({...editData, age: parseInt(text) || 0})}
                        editable={isEditing}
                        keyboardType="numeric"
                        placeholder="Возраст"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Город</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.city}
                        onChangeText={(text) => setEditData({...editData, city: text})}
                        editable={isEditing}
                        placeholder="Город"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Дата рождения</Text>
                      <TouchableOpacity
                        style={[styles.dateButton, !isEditing && styles.inputDisabled]}
                        onPress={() => isEditing && showDatePicker('birthDate')}
                        disabled={!isEditing}
                      >
                        <Text style={[styles.dateButtonText, !editData.birthDate && styles.placeholderText]}>
                          {editData.birthDate || 'ДД.ММ.ГГГГ'}
                        </Text>
                        <Ionicons name="calendar" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Начал заниматься</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.hockeyStartDate}
                        onChangeText={(text) => setEditData({...editData, hockeyStartDate: text})}
                        editable={isEditing}
                        placeholder="ММ.ГГГГ"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Опыт</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={editData.experience}
                      onChangeText={(text) => setEditData({...editData, experience: text})}
                      editable={isEditing}
                      placeholder="Опыт в хоккее"
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Достижения</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={editData.achievements}
                      onChangeText={(text) => setEditData({...editData, achievements: text})}
                      editable={isEditing}
                      placeholder="Достижения"
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Любимые голы</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={editData.favoriteGoals}
                      onChangeText={(text) => setEditData({...editData, favoriteGoals: text})}
                      editable={isEditing}
                      placeholder="Ссылки на YouTube видео любимых голов"
                      multiline
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Рост</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.height}
                        onChangeText={(text) => setEditData({...editData, height: text})}
                        editable={isEditing}
                        placeholder="Рост"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Вес</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.weight}
                        onChangeText={(text) => setEditData({...editData, weight: text})}
                        editable={isEditing}
                        placeholder="Вес"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Статистика - только для не-звезд */}
              {editData.status !== 'star' && (
                <>
                  <Text style={styles.sectionTitle}>Статистика</Text>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Голы</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.goals}
                        onChangeText={(text) => setEditData({...editData, goals: text})}
                        editable={isEditing}
                        keyboardType="numeric"
                        placeholder="Голы"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Передачи</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.assists}
                        onChangeText={(text) => setEditData({...editData, assists: text})}
                        editable={isEditing}
                        keyboardType="numeric"
                        placeholder="Передачи"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Игры</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={editData.games}
                      onChangeText={(text) => setEditData({...editData, games: text})}
                      editable={isEditing}
                      keyboardType="numeric"
                      placeholder="Количество игр"
                    />
                  </View>
                </>
              )}

              {/* Нормативы - только для не-звезд */}
              {editData.status !== 'star' && (
                <>
                  <Text style={styles.sectionTitle}>Нормативы</Text>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Подтягивания</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.pullUps}
                        onChangeText={(text) => setEditData({...editData, pullUps: text})}
                        editable={isEditing}
                        keyboardType="numeric"
                        placeholder="Количество"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Отжимания</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.pushUps}
                        onChangeText={(text) => setEditData({...editData, pushUps: text})}
                        editable={isEditing}
                        keyboardType="numeric"
                        placeholder="Количество"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Планка (сек)</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.plankTime}
                        onChangeText={(text) => setEditData({...editData, plankTime: text})}
                        editable={isEditing}
                        keyboardType="numeric"
                        placeholder="Время"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>100м (сек)</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={editData.sprint100m}
                        onChangeText={(text) => setEditData({...editData, sprint100m: text})}
                        editable={isEditing}
                        keyboardType="numeric"
                        placeholder="Время"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Прыжок в длину (см)</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={editData.longJump}
                      onChangeText={(text) => setEditData({...editData, longJump: text})}
                      editable={isEditing}
                      keyboardType="numeric"
                      placeholder="Длина прыжка"
                    />
                  </View>
                </>
              )}

              {/* Фотографии - только для не-звезд */}
              {editData.status !== 'star' && (
                <>
                  <Text style={styles.sectionTitle}>Фотографии</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Фотогалерея</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={editData.photos}
                      onChangeText={(text) => setEditData({...editData, photos: text})}
                      editable={isEditing}
                      placeholder="JSON массив ссылок на фотографии"
                      multiline
                    />
                    <Text style={styles.inputHint}>
                      Формат: ["url1", "url2", "url3"]
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Статус</Text>
                <View style={styles.statusSelector}>
                  {['player', 'star', 'coach', 'scout', 'admin'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        editData.status === status && styles.statusOptionSelected,
                        { borderColor: getStatusColor(status) }
                      ]}
                      onPress={() => isEditing && setEditData({...editData, status})}
                      disabled={!isEditing}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        editData.status === status && styles.statusOptionTextSelected
                      ]}>
                        {getStatusText(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.footerButton, styles.editButton]} 
              onPress={() => {
                console.log('🔧 Нажата кнопка редактирования, текущий isEditing:', isEditing);
                setIsEditing(!isEditing);
                console.log('🔧 Новый isEditing будет:', !isEditing);
              }}
            >
              <Ionicons name={isEditing ? "eye" : "create"} size={20} color="#fff" />
              <Text style={styles.footerButtonText}>
                {isEditing ? 'Просмотр' : 'Редактировать'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Календарь даты рождения - прямой рендер */}
      {showBirthDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1990, 0, 1)}
              textColor="#fff"
              themeVariant="dark"
            />
            {Platform.OS === 'ios' && (
              <View style={styles.datePickerButtons}>
                <TouchableOpacity 
                  style={styles.datePickerButton} 
                  onPress={() => setShowBirthDatePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.datePickerButton, styles.confirmButton]} 
                  onPress={() => {
                    const day = selectedDate.getDate().toString().padStart(2, '0');
                    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                    const year = selectedDate.getFullYear().toString();
                    const formattedDate = `${day}.${month}.${year}`;
                    setEditData(prev => ({ ...prev, birthDate: formattedDate }));
                    setShowBirthDatePicker(false);
                  }}
                >
                  <Text style={styles.datePickerButtonText}>Подтвердить</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: '#fff',
    fontSize: 16,
  },
  playerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 14,
    color: '#ccc',
  },
  playerStatus: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  closeButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonContainer: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    color: '#666',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  photoContainer: {
    borderRadius: 60,
    overflow: 'hidden',
  },
  editPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    minHeight: 48,
  },
  inputDisabled: {
    backgroundColor: '#2a2a2a',
    color: '#999',
  },
  row: {
    flexDirection: 'row',
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  statusOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    minHeight: 50,
  },
  editButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalButtons: {
    width: '100%',
    gap: 15,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 50,
  },
  modalButtonSecondary: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalButtonTextSecondary: {
    color: '#FFD700',
  },
  techSupportText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },
  saveButtonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FFD700',
  },
  closeButton: {
    padding: 8,
  },
  imagePickerModalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    flex: 1,
    justifyContent: 'center',
  },
  imagePickerModalHeader: {
    marginBottom: 20,
  },
  imagePickerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  adminHeader: {
    height: 128,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
  },
  profileButton: {
    alignItems: 'center',
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  profileIcon: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    resizeMode: 'cover',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 48,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  placeholderText: {
    color: '#666',
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectorOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#333',
    marginBottom: 8,
  },
  selectorOptionSelected: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  selectorOptionText: {
    fontSize: 14,
    color: '#ccc',
  },
  selectorOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  datePickerModal: {
    backgroundColor: '#000',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 300,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  datePickerButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  datePickerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  diagnoseButton: {
    backgroundColor: '#4CAF50',
  },
  cleanupButton: {
    backgroundColor: '#FF9800',
  },
  migrateButton: {
    backgroundColor: '#FF4444',
  },
  fixUrlsButton: {
    backgroundColor: '#2196F3',
  },
  publicUrlsButton: {
    backgroundColor: '#00BCD4',
  },
  fixAllButton: {
    backgroundColor: '#9C27B0',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 