import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import PageWrapper from '../components/PageWrapper';
import {
    Player,
    calculateHockeyExperience,
    loadCurrentUser,
    saveCurrentUser,
    updatePlayer
} from '../utils/playerStorage';

export default function ProfileScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const loadUserData = useCallback(async () => {
    try {
      const user = await loadCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('❌ Ошибка загрузки пользователя:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (currentUser) {
          const updatedUser = { ...currentUser, avatar: imageUri };
          setCurrentUser(updatedUser);
          await updatePlayer(updatedUser);
          await saveCurrentUser(updatedUser);
          setAlertMessage('Фото профиля обновлено!');
          setAlertVisible(true);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка выбора изображения:', error);
      setAlertMessage('Ошибка при выборе изображения');
      setAlertVisible(true);
    }
  };

  const handleLogout = async () => {
    try {
      // Просто очищаем текущего пользователя
      setCurrentUser(null);
      setShowLogoutModal(false);
      router.replace('/');
    } catch (error) {
      console.error('❌ Ошибка выхода из системы:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'star': return '#FFD700';
      case 'coach': return '#FF4444';
      case 'scout': return '#888888';
      case 'admin': return '#8A2BE2';
      default: return '#FFFFFF';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'star': return 'Звезда';
      case 'coach': return 'Тренер';
      case 'scout': return 'Скаут';
      case 'admin': return 'Администратор';
      default: return 'Игрок';
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Профиль" showBottomNav={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка профиля...</Text>
        </View>
      </PageWrapper>
    );
  }

  if (!currentUser) {
    return (
      <PageWrapper title="Профиль" showBottomNav={false}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#FF4444" />
          <Text style={styles.errorTitle}>Требуется авторизация</Text>
          <Text style={styles.errorMessage}>
            Для просмотра профиля необходимо войти в систему
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
    <PageWrapper title="Профиль" showBottomNav={false}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Основная информация */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {currentUser.avatar ? (
              <Image 
                source={{ uri: currentUser.avatar }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={handleImagePick}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUser.name || 'Пользователь'}</Text>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(currentUser.status || 'player') }
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(currentUser.status || 'player')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Статистика */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.goals || '0'}</Text>
              <Text style={styles.statLabel}>Голы</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.assists || '0'}</Text>
              <Text style={styles.statLabel}>Передачи</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.games || '0'}</Text>
              <Text style={styles.statLabel}>Игры</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentUser.goals && currentUser.assists ? 
                  parseInt(currentUser.goals) + parseInt(currentUser.assists) : '0'}
              </Text>
              <Text style={styles.statLabel}>Очки</Text>
            </View>
          </View>
        </View>

        {/* Детальная информация */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Информация</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="mail" size={20} color="#FF4444" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{currentUser.email || 'Не указан'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="shirt" size={20} color="#FF4444" />
            <Text style={styles.infoLabel}>Позиция:</Text>
            <Text style={styles.infoValue}>{currentUser.position || 'Не указана'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color="#FF4444" />
            <Text style={styles.infoLabel}>Команда:</Text>
            <Text style={styles.infoValue}>{currentUser.team || 'Не указана'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color="#FF4444" />
            <Text style={styles.infoLabel}>Возраст:</Text>
            <Text style={styles.infoValue}>
              {currentUser.age ? `${currentUser.age} лет` : 'Не указан'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="flag" size={20} color="#FF4444" />
            <Text style={styles.infoLabel}>Страна:</Text>
            <Text style={styles.infoValue}>{currentUser.country || 'Не указана'}</Text>
          </View>

          {currentUser.hockeyStartDate && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#FF4444" />
              <Text style={styles.infoLabel}>Опыт:</Text>
              <Text style={styles.infoValue}>
                {calculateHockeyExperience(currentUser.hockeyStartDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Действия */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/messages')}
          >
            <Ionicons name="chatbubbles" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Сообщения</Text>
          </TouchableOpacity>

          {(currentUser.status as string) === 'admin' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin')}
            >
              <Ionicons name="settings" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Админ панель</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Модальное окно выхода */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out-outline" size={50} color="#FF4444" />
            <Text style={styles.modalTitle}>Выйти из системы?</Text>
            <Text style={styles.modalMessage}>
              Вы уверены, что хотите выйти из аккаунта?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Выйти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title="Уведомление"
        message={alertMessage}
        onConfirm={() => setAlertVisible(false)}
        confirmText="OK"
        showCancel={false}
      />
      </ScrollView>
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    margin: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF4444',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FF4444',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4444',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 10,
  },
  statusContainer: {
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
  },
  statsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
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
    color: '#FF4444',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    marginTop: 5,
  },
  detailsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 10,
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    flex: 1,
    marginLeft: 10,
  },
  actionsSection: {
    margin: 20,
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    borderRadius: 10,
    paddingHorizontal: 25,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  logoutButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
  },
}); 