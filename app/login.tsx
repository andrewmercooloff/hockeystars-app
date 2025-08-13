import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { findPlayerByCredentials, saveCurrentUser } from '../utils/playerStorage';

const iceBg = require('../assets/images/led.jpg');

export default function LoginScreen() {
  const router = useRouter();
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });

  const closeAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const closeAlertAndGoHome = () => {
    setAlert({ ...alert, visible: false });
    setTimeout(() => {
      // Переходим на главный экран с параметром refresh для обновления данных
      router.push('/?refresh=true');
    }, 100);
  };

  // Обработчик для улучшения работы с автозаполнением на iOS
  const handleUsernameChange = (text: string) => {
    setFormData({...formData, username: text});
    // Небольшая задержка для стабилизации автозаполнения
    setTimeout(() => {
      if (usernameRef.current) {
        usernameRef.current.setNativeProps({ text: text });
      }
    }, 100);
  };

  // Дополнительная обработка для автозаполнения
  const handleUsernameChangeText = (text: string) => {
    setFormData({...formData, username: text});
    // Синхронизируем состояние с полем
    setTimeout(() => {
      if (usernameRef.current) {
        try {
          const currentText = usernameRef.current.props?.value || text;
          if (currentText !== text) {
            setFormData(prev => ({...prev, username: currentText}));
          }
        } catch (error) {
          console.log('Ошибка синхронизации логина:', error);
        }
      }
    }, 50);
  };

  const handlePasswordChange = (text: string) => {
    setFormData({...formData, password: text});
    // Небольшая задержка для стабилизации автозаполнения
    setTimeout(() => {
      if (passwordRef.current) {
        passwordRef.current.setNativeProps({ text: text });
      }
    }, 100);
  };

  // Дополнительная обработка для автозаполнения пароля
  const handlePasswordChangeText = (text: string) => {
    setFormData({...formData, password: text});
    // Синхронизируем состояние с полем
    setTimeout(() => {
      if (passwordRef.current) {
        try {
          const currentText = passwordRef.current.props?.value || text;
          if (currentText !== text) {
            setFormData(prev => ({...prev, password: currentText}));
          }
        } catch (error) {
          console.log('Ошибка синхронизации пароля:', error);
        }
      }
    }, 50);
  };

  // Дополнительная стабилизация для iOS автозаполнения
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && usernameRef.current) {
        usernameRef.current.setNativeProps({ text: formData.username });
      }
      if (formData.password && passwordRef.current) {
        passwordRef.current.setNativeProps({ text: formData.password });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [formData.username, formData.password]);

  // Обработчик для синхронизации состояния с автозаполнением
  const syncFormDataFromRefs = () => {
    if (usernameRef.current && passwordRef.current) {
      try {
        // Получаем текущие значения из полей более безопасным способом
        const currentUsername = usernameRef.current.props?.value || formData.username || '';
        const currentPassword = passwordRef.current.props?.value || formData.password || '';
        
        // Обновляем состояние, если значения изменились
        if (currentUsername !== formData.username || currentPassword !== formData.password) {
          setFormData({
            username: currentUsername,
            password: currentPassword
          });
        }
      } catch (error) {
        console.log('Ошибка синхронизации состояния:', error);
      }
    }
  };

  // Синхронизируем состояние при фокусе на полях
  const handleUsernameFocus = () => {
    setTimeout(syncFormDataFromRefs, 100);
  };

  const handlePasswordFocus = () => {
    setTimeout(syncFormDataFromRefs, 100);
  };

  const handleLogin = async () => {
    // Получаем актуальные значения из полей, если состояние не синхронизировано
    let username = formData.username;
    let password = formData.password;
    
    if (usernameRef.current && passwordRef.current) {
      try {
        const currentUsername = usernameRef.current.props?.value || '';
        const currentPassword = passwordRef.current.props?.value || '';
        
        if (currentUsername && !username) username = currentUsername;
        if (currentPassword && !password) password = currentPassword;
      } catch (error) {
        console.log('Ошибка получения значений из полей:', error);
      }
    }
    
    if (!username || !password) {
      setAlert({
        visible: true,
        title: 'Ошибка',
        message: 'Пожалуйста, заполните все поля',
        type: 'error'
      });
      return;
    }

    try {
      const player = await findPlayerByCredentials(username, password);
      
      if (player) {
        // Сохраняем текущего пользователя
        await saveCurrentUser(player);
        
        setAlert({
          visible: true,
          title: 'Успешно!',
          message: `Добро пожаловать, ${player.name}!`,
          type: 'success'
        });
      } else {
        setAlert({
          visible: true,
          title: 'Ошибка',
          message: 'Неверный логин или пароль',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      setAlert({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось войти в систему',
        type: 'error'
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hockeyRinkContainer}>
        <ImageBackground source={iceBg} style={styles.hockeyRink} resizeMode="cover">
          {/* Внутренняя граница хоккейной коробки */}
          <View style={styles.innerBorder} />
          
          <View style={styles.modalOverlay}>
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
                  ref={usernameRef}
                  style={styles.input}
                  value={formData.username}
                  onChangeText={handleUsernameChangeText}
                  onFocus={handleUsernameFocus}
                  placeholder="Введите логин"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  autoComplete="username"
                  textContentType="username"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically={true}
                  clearButtonMode="while-editing"
                  onSubmitEditing={() => passwordRef.current?.focus()}

                />
              </View>

              {/* Пароль */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Пароль</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  value={formData.password}
                  onChangeText={handlePasswordChangeText}
                  onFocus={handlePasswordFocus}
                  placeholder="Введите пароль"
                  placeholderTextColor="#888"
                  secureTextEntry={true}
                  autoComplete="password"
                  textContentType="password"
                  autoCorrect={false}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  enablesReturnKeyAutomatically={true}
                  clearButtonMode="while-editing"
                  onSubmitEditing={handleLogin}

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
          </View>
        </ImageBackground>
      </View>

      {/* Кастомный алерт */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.type === 'success' ? closeAlertAndGoHome : closeAlert}
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