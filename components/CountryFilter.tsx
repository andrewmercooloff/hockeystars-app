import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useCountryFilter } from '../utils/CountryFilterContext';
import { Player } from '../utils/playerStorage';

const { width, height } = Dimensions.get('window');

interface CountryFilterProps {
  players: Player[];
}

export default function CountryFilter({ players }: CountryFilterProps) {
  const { selectedCountry, setSelectedCountry, showCountryFilter, setShowCountryFilter } = useCountryFilter();
  const [countries, setCountries] = useState<string[]>([]);
  const dropdownRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Получаем уникальные страны из игроков
  useEffect(() => {
    const uniqueCountries = Array.from(new Set(players.map(player => player.country).filter(Boolean)));
    setCountries(uniqueCountries.sort());
  }, [players]);

  // Анимация появления/исчезновения фильтра
  useEffect(() => {
    if (showCountryFilter) {
      // Анимация появления
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Анимация исчезновения
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showCountryFilter, fadeAnim, scaleAnim]);

  const handleCountrySelect = (country: string | null) => {
    setSelectedCountry(country);
    
    // Сначала запускаем анимацию исчезновения
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // После завершения анимации скрываем фильтр
      setShowCountryFilter(false);
    });
  };

  const getCountryFlag = (country: string) => {
    // URL флагов стран с flagcdn.com
    const flagMap: Record<string, { url: string, name: string }> = {
      'Беларусь': { url: 'https://flagcdn.com/w40/by.png', name: 'BY' },
      'Россия': { url: 'https://flagcdn.com/w40/ru.png', name: 'RU' },
      'Канада': { url: 'https://flagcdn.com/w40/ca.png', name: 'CA' },
      'США': { url: 'https://flagcdn.com/w40/us.png', name: 'US' },
      'Финляндия': { url: 'https://flagcdn.com/w40/fi.png', name: 'FI' },
      'Швеция': { url: 'https://flagcdn.com/w40/se.png', name: 'SE' },
      'Словакия': { url: 'https://flagcdn.com/w40/sk.png', name: 'SK' },
      'Чехия': { url: 'https://flagcdn.com/w40/cz.png', name: 'CZ' },
      'Латвия': { url: 'https://flagcdn.com/w40/lv.png', name: 'LV' },
      'Литва': { url: 'https://flagcdn.com/w40/lt.png', name: 'LT' },
      'Польша': { url: 'https://flagcdn.com/w40/pl.png', name: 'PL' },
      'Украина': { url: 'https://flagcdn.com/w40/ua.png', name: 'UA' },
      'Казахстан': { url: 'https://flagcdn.com/w40/kz.png', name: 'KZ' },
      'Кыргызстан': { url: 'https://flagcdn.com/w40/kg.png', name: 'KG' },
      'Узбекистан': { url: 'https://flagcdn.com/w40/uz.png', name: 'UZ' },
      'Таджикистан': { url: 'https://flagcdn.com/w40/tj.png', name: 'TJ' },
      'Туркменистан': { url: 'https://flagcdn.com/w40/tm.png', name: 'TM' },
      'Азербайджан': { url: 'https://flagcdn.com/w40/az.png', name: 'AZ' },
      'Армения': { url: 'https://flagcdn.com/w40/am.png', name: 'AM' },
      'Грузия': { url: 'https://flagcdn.com/w40/ge.png', name: 'GE' },
      'Молдова': { url: 'https://flagcdn.com/w40/md.png', name: 'MD' },
      'Эстония': { url: 'https://flagcdn.com/w40/ee.png', name: 'EE' },
    };
    
    return flagMap[country] || { url: 'https://flagcdn.com/w40/xx.png', name: '??' };
  };

  if (!showCountryFilter) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {/* Меню стран */}
      <View style={styles.dropdownMenu} ref={dropdownRef}>
        {/* Список стран только с флагами */}
        {countries.map((country) => {
          const flag = getCountryFlag(country);
          return (
            <TouchableOpacity
              key={country}
              style={[styles.countryItem, selectedCountry === country && styles.countryItemSelected]}
              onPress={() => handleCountrySelect(country)}
            >
              <Image 
                source={{ uri: flag.url }}
                style={styles.flagImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 72,
    right: 40,
    zIndex: 15,
    alignItems: 'flex-end',
  },
  dropdownMenu: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 8,
    width: 50,
    alignItems: 'center',
  },
  countryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginBottom: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    minHeight: 35,
  },
  countryItemSelected: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderColor: '#FF4444',
  },
  flagImage: {
    width: 24,
    height: 16,
    borderRadius: 2,
  },

});
