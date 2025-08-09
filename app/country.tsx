import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { loadCurrentUser, Player } from '../utils/playerStorage';

const iceBg = require('../assets/images/led.jpg');

interface Country {
  id: string;
  name: string;
  flag: string;
  iceType: string;
  description: string;
}

const countries: Country[] = [
  { id: 'russia', name: 'Россия', flag: '🇷🇺', iceType: 'Русский лед', description: 'Классический российский хоккейный лед с традиционной разметкой' },
  { id: 'usa', name: 'США', flag: '🇺🇸', iceType: 'Американский лед', description: 'Лед в стиле NHL с американской разметкой и размерами' },
  { id: 'canada', name: 'Канада', flag: '🇨🇦', iceType: 'Канадский лед', description: 'Аутентичный канадский хоккейный лед - родина хоккея' },
  { id: 'sweden', name: 'Швеция', flag: '🇸🇪', iceType: 'Шведский лед', description: 'Европейский лед со шведскими стандартами качества' },
  { id: 'finland', name: 'Финляндия', flag: '🇫🇮', iceType: 'Финский лед', description: 'Скандинавский лед с финскими традициями' },
  { id: 'czech', name: 'Чехия', flag: '🇨🇿', iceType: 'Чешский лед', description: 'Центральноевропейский лед с чешской школой хоккея' },
  { id: 'belarus', name: 'Беларусь', flag: '🇧🇾', iceType: 'Белорусский лед', description: 'Лед в стиле белорусского хоккея' },
  { id: 'ukraine', name: 'Украина', flag: '🇺🇦', iceType: 'Украинский лед', description: 'Лед украинской хоккейной школы' }
];

export default function CountryScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { loadUserData(); }, []);
  useFocusEffect(useCallback(() => { loadUserData(); }, []));

  const loadUserData = async () => {
    try {
      const user = await loadCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (user.country) {
          const userCountry = countries.find(c => c.name.toLowerCase() === user.country?.toLowerCase());
          if (userCountry) { setSelectedCountry(userCountry.id); }
        }
      }
    } catch (error) { console.error('Ошибка загрузки пользователя:', error); }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country.id);
    setShowDropdown(false);
    // Здесь будет логика фильтрации игроков на льду
    console.log(`Выбрана страна: ${country.name}`);
  };

  const getCurrentCountry = () => { return countries.find(c => c.id === selectedCountry); };

  return (
    <View style={styles.container}>
      <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Выбор страны</Text>
            <Text style={styles.subtitle}>
              {selectedCountry ? `Текущий лед: ${getCurrentCountry()?.iceType}` : 'Выберите страну для изменения льда'}
            </Text>
          </View>

          {/* Выпадающее меню с флажками */}
          <View style={styles.countrySelector}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowDropdown(!showDropdown)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectorText}>
                {selectedCountry ? getCurrentCountry()?.flag : '🏒'}
              </Text>
              <Ionicons 
                name={showDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>

            <Modal
              visible={showDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDropdown(false)}
              >
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                    {countries.map((country) => (
                      <TouchableOpacity
                        key={country.id}
                        style={styles.flagItem}
                        onPress={() => handleCountrySelect(country)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.flagText}>{country.flag}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          {/* Информация о выбранной стране */}
          {selectedCountry && (
            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>{getCurrentCountry()?.name}</Text>
              <Text style={styles.iceType}>{getCurrentCountry()?.iceType}</Text>
              <Text style={styles.description}>{getCurrentCountry()?.description}</Text>
            </View>
          )}

          {/* Заглушка для будущего отображения игроков */}
          <View style={styles.playersPlaceholder}>
            <Text style={styles.placeholderText}>
              {selectedCountry 
                ? `Здесь будут показаны игроки из ${getCurrentCountry()?.name}` 
                : 'Выберите страну, чтобы увидеть игроков на льду'
              }
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  countrySelector: {
    alignItems: 'center',
    marginBottom: 30,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectorText: {
    fontSize: 32,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 15,
    padding: 20,
    maxHeight: 400,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  flagItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  flagText: {
    fontSize: 40,
    textAlign: 'center',
  },
  countryInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    alignItems: 'center',
  },
  countryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  iceType: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    opacity: 0.9,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  playersPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
});
