import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import PageWrapper from '../components/PageWrapper';
import { addPlayer, Player } from '../utils/playerStorage';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: '',
    team: '',
    age: '',
    country: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const countries = ['Беларусь', 'Россия', 'Украина', 'Казахстан', 'Латвия', 'Литва', 'Эстония', 'Польша', 'Чехия', 'Словакия', 'Финляндия', 'Швеция', 'Норвегия', 'Дания', 'Германия', 'Австрия', 'Швейцария', 'Франция', 'Италия', 'Испания', 'Великобритания', 'США', 'Канада'];
  const positions = ['Центральный нападающий', 'Крайний нападающий', 'Защитник', 'Вратарь'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setAlertMessage('Пожалуйста, заполните все обязательные поля');
      setAlertVisible(true);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlertMessage('Пароли не совпадают');
      setAlertVisible(true);
      return false;
    }

    if (formData.password.length < 6) {
      setAlertMessage('Пароль должен содержать минимум 6 символов');
      setAlertVisible(true);
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const newPlayer: Omit<Player, 'id'> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        position: formData.position || 'Не указана',
        team: formData.team || 'Не указана',
        age: parseInt(formData.age) || 0,
        country: formData.country || 'Не указана',
        status: 'player',
        avatar: null,
        height: '',
        weight: '',
        goals: '0',
        assists: '0',
        games: '0',
        hockeyStartDate: new Date().toISOString().split('T')[0],
      };

      const createdPlayer = await addPlayer(newPlayer);
      
      if (createdPlayer) {
        setAlertMessage('Регистрация успешна! Теперь вы можете войти в систему.');
        setAlertVisible(true);
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } else {
        setAlertMessage('Ошибка при создании аккаунта');
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertMessage('Ошибка регистрации');
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper showHeader={false} showBottomNav={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Ionicons name="hockey-puck" size={60} color="#FF4444" />
              <Text style={styles.title}>HockeyStars</Text>
              <Text style={styles.subtitle}>Регистрация</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color="#ccc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Имя *"
                  placeholderTextColor="#ccc"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#ccc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email *"
                  placeholderTextColor="#ccc"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#ccc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Пароль *"
                  placeholderTextColor="#ccc"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#ccc" 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#ccc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Подтвердите пароль *"
                  placeholderTextColor="#ccc"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#ccc" 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="shirt" size={20} color="#ccc" style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.positionButton}
                  onPress={() => setShowPositionPicker(true)}
                >
                  <Text style={[styles.positionButtonText, !formData.position && styles.placeholderText]}>
                    {formData.position || 'Выберите позицию'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#ccc" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="people" size={20} color="#ccc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Команда"
                  placeholderTextColor="#ccc"
                  value={formData.team}
                  onChangeText={(value) => handleInputChange('team', value)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="calendar" size={20} color="#ccc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Возраст"
                  placeholderTextColor="#ccc"
                  value={formData.age}
                  onChangeText={(value) => handleInputChange('age', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="flag" size={20} color="#ccc" style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.positionButton}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={[styles.positionButtonText, !formData.country && styles.placeholderText]}>
                    {formData.country || 'Выберите страну'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#ccc" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.registerButtonText}>Регистрация...</Text>
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="#fff" />
                    <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginLink}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.loginText}>
                  Уже есть аккаунт? <Text style={styles.loginTextBold}>Войти</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Модальное окно выбора позиции */}
      {showPositionPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите позицию</Text>
            {positions.map((position) => (
              <TouchableOpacity
                key={position}
                style={styles.modalItem}
                onPress={() => {
                  handleInputChange('position', position);
                  setShowPositionPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{position}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPositionPicker(false)}
            >
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Модальное окно выбора страны */}
      {showCountryPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите страну</Text>
            {countries.map((country) => (
              <TouchableOpacity
                key={country}
                style={styles.modalItem}
                onPress={() => {
                  handleInputChange('country', country);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{country}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        title="Уведомление"
        message={alertMessage}
        onConfirm={() => setAlertVisible(false)}
        confirmText="OK"
        showCancel={false}
      />
    </PageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    marginTop: 5,
  },
  form: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
  },
  eyeIcon: {
    padding: 5,
  },
  registerButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    marginLeft: 8,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
  },
  loginTextBold: {
    color: '#FF4444',
    fontFamily: 'Gilroy-Bold',
  },
  positionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  positionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
  },
  placeholderText: {
    color: '#ccc',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    marginBottom: 15,
    color: '#333',
  },
  modalItem: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#333',
  },
  modalCancelButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FF4444',
    borderRadius: 10,
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
  },
}); 