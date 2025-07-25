import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { findPlayerByCredentials, saveCurrentUser } from '../utils/playerStorage';
import CustomAlert from '../components/CustomAlert';

const iceBg = require('../assets/images/led.jpg');

export default function LoginScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: () => {}
  });

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      setAlert({
        visible: true,
        title: 'Ошибка',
        message: 'Пожалуйста, заполните все поля',
        type: 'error',
        onConfirm: () => setAlert({ ...alert, visible: false })
      });
      return;
    }

    try {
      const player = await findPlayerByCredentials(formData.username, formData.password);
      
      if (player) {
        // Сохраняем текущего пользователя
        await saveCurrentUser(player);
        
        setAlert({
          visible: true,
          title: 'Успешно!',
          message: `Добро пожаловать, ${player.name}!`,
          type: 'success',
          onConfirm: () => {
            setAlert({ ...alert, visible: false });
            router.push('/');
          }
        });
      } else {
        setAlert({
          visible: true,
          title: 'Ошибка',
          message: 'Неверный логин или пароль',
          type: 'error',
          onConfirm: () => setAlert({ ...alert, visible: false })
        });
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      setAlert({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось войти в систему',
        type: 'error',
        onConfirm: () => setAlert({ ...alert, visible: false })
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hockeyRinkContainer}>
        <ImageBackground source={iceBg} style={styles.hockeyRink} resizeMode="cover">
          {/* Внутренняя граница хоккейной коробки */}
          <View style={styles.innerBorder} />
          
          <BlurView intensity={20} style={styles.modalOverlay}>
            <View style={styles.modalContainer}>

              
              {/* Заголовок формы */}
              <View style={styles.modalHeader}>
                <Ionicons name="log-in" size={40} color="#FF4444" />
                <Text style={styles.modalTitle}>Вход в систему</Text>
              </View>
              
              {/* Сообщение */}
              <Text style={styles.modalMessage}>
                Войдите в свой аккаунт, чтобы получить доступ к полному функционалу приложения
              </Text>
              
              {/* Логин */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Логин</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData({...formData, username: text})}
                  placeholder="Введите логин"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                />
              </View>

              {/* Пароль */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Пароль</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  placeholder="Введите пароль"
                  placeholderTextColor="#888"
                  secureTextEntry={true}
                />
              </View>

              {/* Кнопки */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={handleLogin}>
                  <Ionicons name="log-in" size={20} color="#fff" />
                  <Text style={styles.modalButtonText}>Войти</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSecondary]} 
                  onPress={() => router.push('/register')}
                >
                  <Ionicons name="person-add" size={20} color="#FF4444" />
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Регистрация</Text>
                </TouchableOpacity>
              </View>

              {/* Кнопка отмены */}
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => router.back()}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ImageBackground>
      </View>

      {/* Кастомный алерт */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm}
        confirmText="OK"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hockeyRinkContainer: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  hockeyRink: {
    flex: 1,
    borderRadius: 50, // Увеличили радиус для более округлых краев
    borderWidth: 4, // Увеличили толщину границы
    borderColor: 'rgba(255, 255, 255, 0.8)', // Сделали границу более заметной
    overflow: 'hidden', // Обрезаем содержимое по границам
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  innerBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    pointerEvents: 'none',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  modalButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 8,
  },
  modalButtonTextSecondary: {
    color: '#FF4444',
  },
  modalCancelButton: {
    alignItems: 'center',
    padding: 10,
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
  },

}); 