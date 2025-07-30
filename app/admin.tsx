import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Player, loadPlayers, updatePlayer, loadCurrentUser } from '../utils/playerStorage';

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
          {currentUser?.photo || currentUser?.avatar ? (
            <Image
              source={
                (currentUser.photo && typeof currentUser.photo === 'string' && (
                  currentUser.photo.startsWith('data:image/') || 
                  currentUser.photo.startsWith('http') || 
                  currentUser.photo.startsWith('file://') || 
                  currentUser.photo.startsWith('content://')
                )) || (currentUser.avatar && typeof currentUser.avatar === 'string' && (
                  currentUser.avatar.startsWith('data:image/') || 
                  currentUser.avatar.startsWith('http') || 
                  currentUser.avatar.startsWith('file://') || 
                  currentUser.avatar.startsWith('content://')
                ))
                  ? { uri: currentUser.photo || currentUser.avatar }
                  : require('../assets/images/me.jpg')
              }
              style={styles.profileImage}
              onError={() => console.log('Profile image failed to load')}
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
  
  // Состояния для календарей
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState<'birthDate'>('birthDate');

  useEffect(() => {
    loadData();
    console.log('🔧 Экран администратора загружен');
  }, []);

  const loadData = async () => {
    try {
      console.log('🔧 Загружаем данные для панели администратора...');
      const [loadedPlayers, user] = await Promise.all([
        loadPlayers(),
        loadCurrentUser()
      ]);
      console.log('🔧 Загружено игроков:', loadedPlayers.length);
      console.log('🔧 Текущий пользователь:', user?.name, 'статус:', user?.status);
      
      setPlayers(loadedPlayers);
      setCurrentUser(user);
      
      // Проверяем, является ли пользователь администратором
      if (user?.status !== 'admin') {
        console.log('❌ Пользователь не является администратором:', user?.status);
        Alert.alert('Доступ запрещен', 'Только администраторы могут использовать эту функцию');
        router.back();
      } else {
        console.log('✅ Пользователь является администратором');
      }
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
      photo: player.photo || '',
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('📸 Админ загрузил фото с камеры:', photoUri);
        console.log('📸 Текущий editData до обновления:', editData);
        
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
      console.log('📸 Тип фото:', typeof editData.photo);
      console.log('📸 Длина фото:', editData.photo?.length || 0);
      
      if (Platform.OS === 'web') {
        console.log('🌐 Веб-версия: сохраняем данные');
      }
      
      await updatePlayer(selectedPlayer.id, editData);
      console.log('✅ Игрок успешно обновлен в базе данных');
      
      // Обновляем список игроков
      const updatedPlayers = await loadPlayers();
      console.log('🔄 Обновленный список игроков:', updatedPlayers.length);
      
      // Проверяем, сохранилось ли фото
      const updatedPlayer = updatedPlayers.find(p => p.id === selectedPlayer.id);
      if (updatedPlayer) {
        console.log('📸 Проверяем сохраненное фото:', {
          hasPhoto: !!updatedPlayer.photo,
          photoLength: updatedPlayer.photo?.length || 0,
          hasAvatar: !!updatedPlayer.avatar,
          avatarLength: updatedPlayer.avatar?.length || 0
        });
      }
      
      setPlayers(updatedPlayers);
      
      // Принудительно обновляем FlatList
      setRefreshKey(prev => prev + 1);
      
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
      if (!item.photo) {
        return require('../assets/images/me.jpg');
      }
      
      if (typeof item.photo === 'string') {
        // Проверяем, это ли base64 строка (загруженное фото)
        if (item.photo.startsWith('data:image/')) {
          return { uri: item.photo };
        }
        
        // Проверяем, это ли URI (фото загруженное пользователем)
        if (item.photo.startsWith('http') || item.photo.startsWith('file://') || item.photo.startsWith('content://')) {
          return { uri: item.photo };
        }
        
        // Проверяем идентификаторы тестовых игроков
        if (item.photo.includes('kostitsyn1') || item.photo.includes('kostitsyn2')) {
          return require('../assets/images/me.jpg');
        } else if (item.photo.includes('grabovsky')) {
          return require('../assets/images/me.jpg');
        } else if (item.photo.includes('sharangovich')) {
          return require('../assets/images/me.jpg');
        } else if (item.photo.includes('merkulov1') || item.photo.includes('merkulov2')) {
          return require('../assets/images/me.jpg');
        } else if (item.photo.includes('admin')) {
          return require('../assets/images/me.jpg');
        } else if (item.photo === 'new_player') {
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
              <TouchableOpacity onPress={() => {
                console.log('📸 Нажата кнопка загрузки фото, isEditing:', isEditing);
                console.log('📸 showImagePickerModal до вызова pickImage:', showPlayerModal);
                if (isEditing) {
                  console.log('📸 Вызываем pickImage()...');
                  pickImage();
                  console.log('📸 pickImage() вызван');
                } else {
                  console.log('❌ Режим редактирования не активен');
                }
              }}>
                <Image 
                  source={
                    editData.photo && typeof editData.photo === 'string' && (
                      editData.photo.startsWith('data:image/') || 
                      editData.photo.startsWith('http') || 
                      editData.photo.startsWith('file://') || 
                      editData.photo.startsWith('content://')
                    )
                      ? { uri: editData.photo }
                      : require('../assets/images/me.jpg')
                  }
                  style={[
                    styles.editPhoto,
                    { borderColor: getStatusColor(editData.status) }
                  ]}
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
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={editData.position}
                  onChangeText={(text) => setEditData({...editData, position: text})}
                  editable={isEditing}
                  placeholder="Позиция"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Команда</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={editData.team}
                  onChangeText={(text) => setEditData({...editData, team: text})}
                  editable={isEditing}
                  placeholder="Команда"
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
}); 