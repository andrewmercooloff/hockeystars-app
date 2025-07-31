import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { addPlayer, saveCurrentUser } from '../utils/playerStorage';

const iceBg = require('../assets/images/led.jpg');

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    status: '' as 'player' | 'coach' | 'scout' | '',
    birthDate: '',
    country: 'Беларусь', // По умолчанию
    team: '',
    position: '',
    number: '',
    grip: '', // хват
    height: '', // рост
    weight: '', // вес
    avatar: null as string | null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2008, 0, 1)); // 1 января 2008
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

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlert(prev => ({ ...prev, visible: false }))),
      onCancel: () => {},
      onSecondary: () => {},
      showCancel: false,
      showSecondary: false,
      confirmText: 'OK',
      cancelText: 'Отмена',
      secondaryText: 'Дополнительно'
    });
  };

  const pickImage = async () => {
    console.log('📸 pickImage вызван');
    // Показываем системное окно выбора источника фото
    Alert.alert(
      'Выберите источник фото',
      'Откуда хотите загрузить фото?',
      [
        {
          text: 'Галерея',
          onPress: () => {
            console.log('📸 Выбрана галерея');
            pickFromGallery();
          }
        },
        {
          text: 'Камера',
          onPress: () => {
            console.log('📸 Выбрана камера');
            takePhoto();
          }
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
      console.log('📸 pickFromGallery вызван');
      // Запрашиваем разрешение на доступ к галерее
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Разрешение галереи:', status);
      
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для доступа к галерее');
        return;
      }

      // Открываем галерею для выбора фото
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📸 Результат выбора из галереи:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Фото выбрано:', result.assets[0].uri);
        setFormData({...formData, avatar: result.assets[0].uri});
      }
    } catch (error) {
      console.error('❌ Ошибка выбора фото из галереи:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото из галереи.');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📸 takePhoto вызван');
      // Запрашиваем разрешение на доступ к камере
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Разрешение камеры:', status);
      
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для доступа к камере');
        return;
      }

      // Открываем камеру для съемки фото
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📸 Результат съемки:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Фото снято:', result.assets[0].uri);
        setFormData({...formData, avatar: result.assets[0].uri});
      }
    } catch (error) {
      console.error('❌ Ошибка при съемке фото:', error);
      Alert.alert('Ошибка', 'Не удалось снять фото');
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'ios') {
      // На iOS календарь не закрывается автоматически
      if (date) {
        setSelectedDate(date);
      }
    } else {
      // На Android календарь закрывается только при полном выборе
      if (event.type === 'set' && date) {
        setShowDatePicker(false);
        setSelectedDate(date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        const formattedDate = `${day}.${month}.${year}`;
        setFormData({...formData, birthDate: formattedDate});
      } else if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    }
  };

  const handleRegister = async () => {
    // Проверяем, что все обязательные поля заполнены
    if (!formData.username || !formData.password || !formData.name || !formData.status || !formData.country) {
      showAlert('Ошибка', 'Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }

    // Дополнительные проверки в зависимости от статуса
    if (formData.status === 'player' && (!formData.birthDate || !formData.team || !formData.position)) {
      showAlert('Ошибка', 'Для игрока заполните дату рождения, команду и позицию', 'error');
      return;
    }
    if (formData.status === 'coach' && !formData.team) {
      showAlert('Ошибка', 'Для тренера заполните команду', 'error');
      return;
    }

    try {
      // Добавляем игрока в хранилище
      const newPlayer = await addPlayer({
        email: formData.username, // Используем username как email для входа
        password: formData.password,
        name: formData.name,
        status: formData.status,
        birthDate: formData.birthDate,
        country: formData.country,
        team: formData.team,
        position: formData.position,
        grip: formData.grip,
        height: formData.height,
        weight: formData.weight,
        avatar: formData.avatar || 'new_player', // Используем avatar для профиля
        age: 0, // Добавляем возраст по умолчанию
      });
      
      console.log('Регистрация игрока:', newPlayer);
      
      // Автоматически входим в систему
      await saveCurrentUser(newPlayer);
      console.log('✅ Пользователь автоматически вошел в систему:', newPlayer.name);
      
      // Показываем успешное сообщение
      showAlert(
        'Успешно!', 
        'Игрок зарегистрирован! Теперь вы появитесь на главном экране.',
        'success',
        () => {
          setAlert(prev => ({ ...prev, visible: false }));
          setTimeout(() => {
            router.push('/');
          }, 100);
        }
      );
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      showAlert('Ошибка', 'Не удалось зарегистрировать игрока', 'error');
    }
  };

  const positions = ['Нападающий', 'Защитник', 'Вратарь'];
  const countries = ['Беларусь', 'Россия', 'Канада', 'США', 'Финляндия', 'Швеция', 'Литва', 'Латвия', 'Польша'];
  
  // Команды по странам
  const teamsByCountry = {
    'Беларусь': ['Пираньи', 'Юность', 'Динамо', 'ШРС', 'Динамо-Молодечно'],
    'Россия': ['ЦСКА', 'Динамо Москва', 'Спартак', 'Локомотив'],
    'Канада': ['Toronto Maple Leafs', 'Montreal Canadiens', 'Vancouver Canucks'],
    'США': ['New York Rangers', 'Boston Bruins', 'Chicago Blackhawks'],
    'Финляндия': ['HIFK', 'Tappara', 'Kärpät'],
    'Швеция': ['Färjestad BK', 'HV71', 'Frölunda HC'],
    'Литва': ['Kaunas', 'Vilnius', 'Klaipeda'],
    'Латвия': ['Riga', 'Daugavpils', 'Liepaja'],
    'Польша': ['Cracovia', 'GKS Tychy', 'Podhale'],
  };

  return (
    <ImageBackground source={iceBg} style={styles.container} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        

        
        <View style={styles.formContainer}>

          
          <Text style={styles.title}>Регистрация</Text>
          
          {/* Статус */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Статус</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  formData.status === 'player' && styles.pickerOptionSelected
                ]}
                onPress={() => setFormData({...formData, status: 'player'})}
              >
                <Text style={[
                  styles.pickerOptionText,
                  formData.status === 'player' && styles.pickerOptionTextSelected
                ]}>
                  Игрок
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  formData.status === 'coach' && styles.pickerOptionSelected
                ]}
                onPress={() => setFormData({...formData, status: 'coach'})}
              >
                <Text style={[
                  styles.pickerOptionText,
                  formData.status === 'coach' && styles.pickerOptionTextSelected
                ]}>
                  Тренер
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  formData.status === 'scout' && styles.pickerOptionSelected
                ]}
                onPress={() => setFormData({...formData, status: 'scout'})}
              >
                <Text style={[
                  styles.pickerOptionText,
                  formData.status === 'scout' && styles.pickerOptionTextSelected
                ]}>
                  Скаут
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Логин */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Логин</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => setFormData({...formData, username: text})}
              placeholder="Придумайте логин"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              autoCorrect={false}
            />
          </View>

          {/* Пароль */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Пароль</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              placeholder="Придумайте пароль"
              placeholderTextColor="#888"
              secureTextEntry={true}
              autoComplete="password"
              textContentType="password"
              autoCorrect={false}
            />
          </View>

          {/* Имя */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Имя и фамилия</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text.toUpperCase()})}
              placeholder="ВВЕДИТЕ ВАШЕ ИМЯ"
              placeholderTextColor="#888"
              autoCapitalize="characters"
            />
          </View>

          {/* Дата рождения - только для игроков */}
          {formData.status === 'player' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Дата рождения</Text>
              <TouchableOpacity style={styles.dateInput} onPress={showDatePickerModal}>
                <Text style={styles.dateInputText}>
                  {formData.birthDate || 'Выберите дату рождения'}
                </Text>
                <Ionicons name="calendar" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Страна */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Страна</Text>
            <View style={styles.pickerContainer}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.pickerOption,
                    formData.country === country && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({...formData, country: country, team: ''}); // Сбрасываем команду при смене страны
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.country === country && styles.pickerOptionTextSelected
                  ]}>
                    {country}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Команда - только для игроков и тренеров */}
          {(formData.status === 'player' || formData.status === 'coach') && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Команда</Text>
              <View style={styles.pickerContainer}>
                {teamsByCountry[formData.country as keyof typeof teamsByCountry]?.map((team) => (
                  <TouchableOpacity
                    key={team}
                    style={[
                      styles.pickerOption,
                      formData.team === team && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, team: team})}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.team === team && styles.pickerOptionTextSelected
                    ]}>
                      {team}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Позиция - только для игроков */}
          {formData.status === 'player' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Позиция</Text>
              <View style={styles.pickerContainer}>
                {positions.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.pickerOption,
                      formData.position === pos && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, position: pos})}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.position === pos && styles.pickerOptionTextSelected
                    ]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Номер - только для игроков */}
          {formData.status === 'player' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Номер</Text>
              <TextInput
                style={styles.input}
                value={formData.number}
                onChangeText={(text) => setFormData({...formData, number: text})}
                placeholder="Введите номер"
                placeholderTextColor="#888"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          )}

          {/* Хват - только для игроков */}
          {formData.status === 'player' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Хват</Text>
              <View style={styles.pickerContainer}>
                {['Левый', 'Правый'].map((grip) => (
                  <TouchableOpacity
                    key={grip}
                    style={[
                      styles.pickerOption,
                      formData.grip === grip && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, grip: grip})}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.grip === grip && styles.pickerOptionTextSelected
                    ]}>
                      {grip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Рост - только для игроков */}
          {formData.status === 'player' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Рост (см)</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => setFormData({...formData, height: text})}
                placeholder="Введите рост"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Вес - только для игроков */}
          {formData.status === 'player' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Вес (кг)</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) => setFormData({...formData, weight: text})}
                placeholder="Введите вес"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
            </View>
          )}



          {/* Фото профиля */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Фото профиля</Text>
            <View style={styles.photoContainer}>
              {formData.avatar ? (
                <Image source={{ uri: formData.avatar }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={30} color="#888" />
                  <Text style={styles.photoPlaceholderText}>Добавить фото</Text>
                </View>
              )}
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Text style={styles.photoButtonText}>Выбрать фото</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Кнопка регистрации */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
          </TouchableOpacity>


        </View>
      </ScrollView>
      
      {/* DateTimePicker */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1990, 0, 1)}
              textColor="#fff"
              themeVariant="dark"
            />
            {Platform.OS === 'ios' && (
              <View style={styles.datePickerButtons}>
                <TouchableOpacity 
                  style={styles.datePickerButton} 
                  onPress={() => setShowDatePicker(false)}
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
                    setFormData({...formData, birthDate: formattedDate});
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.datePickerButtonText}>Подтвердить</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
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
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pickerOptionSelected: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  pickerOptionText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontFamily: 'Gilroy-Bold',
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateInputText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    zIndex: 1000,
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
  confirmButton: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  datePickerButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },

  photoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF4444',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  photoButton: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  photoButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  registerButton: {
    backgroundColor: '#FF4444',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 8,
  },

}); 