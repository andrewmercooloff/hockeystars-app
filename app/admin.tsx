import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import PlayerEditForm from '../components/PlayerEditForm';
import { Player, loadCurrentUser, loadPlayers } from '../utils/playerStorage';

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
        router.push(`/player/${currentUser.id}`);
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





  const handleEditPlayer = (player: Player) => {
    console.log('🔧 Редактируем игрока:', player.name, 'статус:', player.status);
    setSelectedPlayer(player);
    setShowPlayerModal(true);
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
              Редактирование игрока
            </Text>
          </View>

          {selectedPlayer && (
            <PlayerEditForm
              player={selectedPlayer}
              onSave={async (updatedPlayer) => {
                // Обновляем список игроков
                const updatedPlayers = await loadPlayers();
                setPlayers(updatedPlayers);
                setShowPlayerModal(false);
              }}
              onCancel={() => setShowPlayerModal(false)}
            />
          )}
        </View>
      </Modal>


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