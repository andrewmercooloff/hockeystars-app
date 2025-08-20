
import { Ionicons } from '@expo/vector-icons';
import '../utils/logSilencer';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle
} from 'react-native-reanimated';
import CountryFilter from '../components/CountryFilter';
import YearFilter from '../components/YearFilter';
import { useCountryFilter } from '../utils/CountryFilterContext';
import { useYearFilter } from '../utils/YearFilterContext';
import { countryCodeToCountryName, detectCountryFromIP } from '../utils/countryUtils';
import { Player, checkDatabaseStatus, fixCorruptedData, initializeStorage, loadCurrentUser, loadPlayers } from '../utils/playerStorage';
// Lazy load Puck component to improve initial render performance
const Puck = React.lazy(() => import('../components/Puck'));

const { width, height } = Dimensions.get('window');

interface PuckPosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

const usePuckCollisionSystem = (players: Player[]) => {
  const puckSize = 70; // Размер шайбы
  const [puckPositions, setPuckPositions] = useState<PuckPosition[]>([]);

  // Платформо-зависимые границы
  const getBoundaries = () => {
    if (Platform.OS === 'ios') {
      // Для iPhone используем границы от самых краев экрана (льда)
      return {
        leftOffset: 5,
        topOffset: 5,
        rightOffset: 5,
        bottomOffset: 235
      };
    } else {
      // Для Android и Web используем уменьшенные границы + 5px отступы
      return {
        leftOffset: 10,
        topOffset: 10,
        rightOffset: 250, // Увеличиваем с 160 до 250
        bottomOffset: 425
      };
    }
  };

  const boundaries = getBoundaries();

  useEffect(() => {
    if (players.length === 0) return;

    setPuckPositions(currentPositions => {
      const positionsMap = new Map(currentPositions.map(p => [p.id, p]));
      const nextPositions: PuckPosition[] = [];

      players.forEach(player => {
        if (positionsMap.has(player.id)) {
          nextPositions.push(positionsMap.get(player.id)!);
        } else {
          // Генерация позиции с проверкой на наложение с существующими шайбами
          let attempts = 0;
          let newX: number, newY: number;
          const maxAttempts = 50;
          const minDistance = puckSize * 1.05; // Минимальное расстояние при инициализации
          
          do {
            newX = boundaries.leftOffset + Math.random() * (width - boundaries.rightOffset - puckSize);
            newY = boundaries.topOffset + Math.random() * (height - boundaries.bottomOffset - puckSize);
            attempts++;
            
            // Проверяем расстояние до всех существующих шайб
            let tooClose = false;
            nextPositions.forEach(existingPos => {
              const dx = newX - existingPos.x;
              const dy = newY - existingPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < minDistance) {
                tooClose = true;
              }
            });
            
            if (!tooClose) break;
          } while (attempts < maxAttempts);
          
          // Если не удалось найти подходящую позицию, используем случайную
          if (attempts >= maxAttempts) {
            newX = boundaries.leftOffset + Math.random() * (width - boundaries.rightOffset - puckSize);
            newY = boundaries.topOffset + Math.random() * (height - boundaries.bottomOffset - puckSize);
          }
          
          // Платформо-зависимая скорость
          const speedMultiplier = Platform.OS === 'ios' ? 0.39 : 0.32; // Увеличена скорость для Android/Web
          nextPositions.push({
            id: player.id,
            x: newX,
            y: newY,
            vx: (Math.random() - 0.5) * speedMultiplier,
            vy: (Math.random() - 0.5) * speedMultiplier,
            size: puckSize,
          });
        }
      });

      return nextPositions;
    });
  }, [players]);

  useEffect(() => {
    if (puckPositions.length === 0) return;

    const interval = setInterval(() => {
      setPuckPositions(currentPositions => {
        return currentPositions.map(pos => {
          let newX = pos.x + pos.vx;
          let newY = pos.y + pos.vy;
          let newVx = pos.vx;
          let newVy = pos.vy;

          // Обработка коллизий со стенами (платформо-зависимые границы)
          if (newX <= boundaries.leftOffset || newX >= width - boundaries.rightOffset - puckSize) {
            newVx = -newVx * 0.8;
            newX = Math.max(boundaries.leftOffset, Math.min(width - boundaries.rightOffset - puckSize, newX));
          }
          if (newY <= boundaries.topOffset || newY >= height - (boundaries.bottomOffset - 10) - puckSize) {
            newVy = -newVy * 0.8;
            newY = Math.max(boundaries.topOffset, Math.min(height - (boundaries.bottomOffset - 10) - puckSize, newY));
          }

          // Улучшенная система коллизий между шайбами
          currentPositions.forEach(otherPos => {
            if (otherPos.id === pos.id) return;
            
            const dx = newX - otherPos.x;
            const dy = newY - otherPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Платформо-зависимое отталкивание шайб
            const collisionDistance = Platform.OS === 'ios' ? puckSize * 1.02 : puckSize * 0.5;
            
            if (distance < collisionDistance && distance > 0) {
              const angle = Math.atan2(dy, dx);
              const overlap = collisionDistance - distance;
              
              // Отталкивание при столкновении
              const pushForce = overlap * 0.1; // Уменьшаем с 0.2 до 0.1
              newVx += Math.cos(angle) * pushForce;
              newVy += Math.sin(angle) * pushForce;
              
              // Принудительное разделение только при сильном наложении
              const separationThreshold = Platform.OS === 'ios' ? puckSize * 0.6 : puckSize * 0.3;
              if (distance < separationThreshold) {
                const separationForce = (puckSize - distance) * 0.05; // Уменьшаем с 0.1 до 0.05
                newX += Math.cos(angle) * separationForce;
                newY += Math.sin(angle) * separationForce;
              }
            }
          });
          
          // Платформо-зависимые ограничения скорости
          const maxSpeed = Platform.OS === 'ios' ? 5.2 : 4.2; // Увеличена максимальная скорость для Android/Web
          const minSpeed = Platform.OS === 'ios' ? 0.208 : 0.17; // Увеличена минимальная скорость для Android/Web
          const currentSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
          if (currentSpeed > maxSpeed) {
            newVx = (newVx / currentSpeed) * maxSpeed;
            newVy = (newVy / currentSpeed) * maxSpeed;
          }
          
          // Минимальная скорость для предотвращения остановки
          if (currentSpeed < minSpeed) {
            const angle = Math.random() * 2 * Math.PI;
            newVx = Math.cos(angle) * minSpeed;
            newVy = Math.sin(angle) * minSpeed;
          }
          
          return {
            ...pos,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });
      });
    }, 16);

    return () => clearInterval(interval);
  }, [puckPositions.length]);

  return { puckPositions, puckSize };
};

const PuckAnimator = ({ player, position, onNav }: { 
  player: Player; 
  position: PuckPosition; 
  onNav: () => void; 
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: position.x },
        { translateY: position.y }
      ]
    };
  }, [position.x, position.y]);

  return (
    <Animated.View style={[styles.puckContainer, animatedStyle]}>
      <Suspense fallback={null}>
        <Puck
                        avatar={player.avatar}
        onPress={onNav}
        animatedStyle={animatedStyle}
        size={position.size}
        points={player.goals && player.assists ? 
          (() => {
            try {
              const goals = parseInt(player.goals) || 0;
              const assists = parseInt(player.assists) || 0;
              const total = goals + assists;
              return total > 0 && !isNaN(total) ? total.toString() : undefined;
            } catch (error) {
              return undefined;
            }
          })() : undefined}
        isStar={player.status === 'star'}
        status={player.status}
        />
      </Suspense>
    </Animated.View>
  );
};

const iceBg = require('../assets/images/led.jpg');

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedCountry, setSelectedCountry, showCountryFilter, setShowCountryFilter } = useCountryFilter();
  const { selectedYear, setSelectedYear, showYearFilter, setShowYearFilter } = useYearFilter();

  // Состояние для управления годами рождения
  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const birthYears = useMemo(() => {
    const years = [];
    for (let year = 2019; year >= 2008; year--) {
      years.push(year);
    }
    return years;
  }, []);

  // Группировка игроков по годам рождения
  const playersByYear = useMemo(() => {
    const grouped: Record<number, Player[]> = {};
    
    // Инициализируем все годы
    birthYears.forEach((year: number) => {
      grouped[year] = [];
    });
    
    // Группируем игроков по годам рождения
    players.forEach(player => {
      if (player.birthDate) {
        try {
          // Парсим дату рождения (формат: YYYY-MM-DD из базы данных)
          if (/^\d{4}-\d{2}-\d{2}$/.test(player.birthDate)) {
            const birthYear = parseInt(player.birthDate.split('-')[0]);
            if (birthYear >= 2008 && birthYear <= 2019) {
              if (!grouped[birthYear]) {
                grouped[birthYear] = [];
              }
              grouped[birthYear].push(player);
              console.log(`📅 Игрок ${player.name} добавлен в группу ${birthYear} года (${player.birthDate})`);
            }
          }
          // Также поддерживаем старый формат DD.MM.YYYY для обратной совместимости
          else if (player.birthDate.includes('.')) {
            const parts = player.birthDate.split('.');
            if (parts.length === 3) {
              const birthYear = parseInt(parts[2]);
              if (birthYear >= 2008 && birthYear <= 2019) {
                if (!grouped[birthYear]) {
                  grouped[birthYear] = [];
                }
                grouped[birthYear].push(player);
                console.log(`📅 Игрок ${player.name} добавлен в группу ${birthYear} года (${player.birthDate})`);
              }
            }
          }
        } catch (error) {
          console.error('Ошибка парсинга даты рождения:', error);
        }
      } else {
        console.log(`⚠️ Игрок ${player.name} без даты рождения`);
      }
    });
    
    // Выводим статистику по группам
    Object.keys(grouped).forEach(year => {
      const yearNum = parseInt(year);
      if (grouped[yearNum].length > 0) {
        console.log(`📊 Группа ${year} года: ${grouped[yearNum].length} игроков`);
      }
    });
    
    return grouped;
  }, [players, birthYears]);



  // Фильтрация игроков
  const filteredPlayers = useMemo(() => {
    const filtered = players.filter(player => {
      // Администратор всегда виден
      if (player.status === 'admin') return true;

      // Фильтр по стране
      const matchesCountry = !selectedCountry || player.country === selectedCountry;
      
      // Фильтр по году
      const matchesYear = !selectedYear || 
        (player.birthDate && player.birthDate.startsWith(selectedYear));
      
      return matchesCountry && matchesYear;
    });

    return filtered;
  }, [players, selectedCountry, selectedYear]);

  // Объединяем отфильтрованных игроков с тренерами и звездами
  const allVisiblePlayers = useMemo(() => {
    const filtered = [...filteredPlayers];
    
    // Добавляем тренеров и звезд только если их страна совпадает с выбранной
    const coachesAndStarsList = players.filter(player => 
      (player.status === 'coach' || player.status === 'star') &&
      (!selectedCountry || player.country === selectedCountry)
    );
    
    console.log(`👥 Объединяем игроков: отфильтровано ${filtered.length}, тренеров и звезд ${coachesAndStarsList.length}`);
    
    coachesAndStarsList.forEach(player => {
      if (!filtered.find(p => p.id === player.id)) {
        filtered.push(player);
      }
    });
    
    console.log(`🎯 Итого видимых игроков: ${filtered.length}`);
    return filtered;
  }, [filteredPlayers, players, selectedCountry]);

  // Автоматически сбрасываем фильтр по годам, если в выбранной стране нет игроков указанного года
  useEffect(() => {
    if (selectedCountry && selectedYear && players.length > 0) {
      const hasPlayersInYear = players.some(player => {
        if (player.country === selectedCountry && player.birthDate) {
          try {
            // Парсим дату рождения (формат: YYYY-MM-DD из базы данных)
            if (/^\d{4}-\d{2}-\d{2}$/.test(player.birthDate)) {
              const birthYear = parseInt(player.birthDate.split('-')[0]);
              return birthYear === selectedYear;
            }
            // Также поддерживаем старый формат DD.MM.YYYY для обратной совместимости
            else if (player.birthDate.includes('.')) {
              const parts = player.birthDate.split('.');
              if (parts.length === 3) {
                const birthYear = parseInt(parts[2]);
                return birthYear === selectedYear;
              }
            }
          } catch (error) {
            console.error('Ошибка парсинга даты рождения:', error);
          }
        }
        return false;
      });
      
      if (!hasPlayersInYear) {
        console.log(`⚠️ В стране ${selectedCountry} нет игроков ${selectedYear} года, сбрасываем фильтр по году`);
        setSelectedYear(null);
      }
    }
  }, [selectedCountry, selectedYear, players.length]); // Зависим только от длины массива игроков, а не от самого массива

  // Auto-detect country on first load if not already selected
  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (selectedCountry) return;
        const code = await detectCountryFromIP();
        if (code && mounted) {
          const countryName = countryCodeToCountryName(code) ?? code;
          if (countryName) {
            setSelectedCountry(countryName);
          }
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [selectedCountry, setSelectedCountry]);



  const { puckPositions = [] } = usePuckCollisionSystem(allVisiblePlayers);



  const refreshPlayers = useCallback(async () => {
    try {
      // console.log('🔄 Загрузка игроков...');
      const loadedPlayers = await loadPlayers();
      // console.log(`✅ Загружено игроков: ${loadedPlayers.length}`);
      
      // Добавляем отладочную информацию для каждого игрока
      loadedPlayers.forEach(player => {
        if (player.birthDate) {
          console.log(`👤 Игрок: ${player.name}, Дата рождения: ${player.birthDate}, Страна: ${player.country}`);
        } else {
          console.log(`👤 Игрок: ${player.name}, Без даты рождения, Страна: ${player.country}`);
        }
      });
      
      setPlayers(loadedPlayers);
    } catch (error) {
      console.error('❌ Ошибка обновления игроков:', error);
    }
  }, []);

  const checkForNewUser = useCallback(async () => {
    try {
      const user = await loadCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('❌ Ошибка загрузки пользователя:', error);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        await initializeStorage();
        await fixCorruptedData();
        
        // Добавляем диагностику базы данных
        await checkDatabaseStatus();
        
        const [loadedPlayers, user] = await Promise.all([
          loadPlayers(),
          loadCurrentUser()
        ]);
        
        setPlayers(loadedPlayers);
        setCurrentUser(user);
        
        console.log(`🚀 Инициализация завершена: ${loadedPlayers.length} игроков, пользователь: ${user?.name || 'не авторизован'}`);
        
        // Устанавливаем значения по умолчанию только если они не установлены
        if (!selectedCountry) {
          if (user?.country) {
            setSelectedCountry(user.country);
          } else {
            setSelectedCountry('Беларусь');
          }
        }
        
        if (!selectedYear) {
          if (user?.birthDate) {
            try {
              if (/^\d{4}-\d{2}-\d{2}$/.test(user.birthDate)) {
                const birthYear = parseInt(user.birthDate.split('-')[0]);
                if (birthYear >= 2008 && birthYear <= 2019) {
                  setSelectedYear(birthYear);
                } else {
                  setSelectedYear(2012);
                }
              } else if (user.birthDate.includes('.')) {
                const parts = user.birthDate.split('.');
                if (parts.length === 3) {
                  const birthYear = parseInt(parts[2]);
                  if (birthYear >= 2008 && birthYear <= 2019) {
                    setSelectedYear(birthYear);
                  } else {
                    setSelectedYear(2012);
                  }
                }
              }
            } catch (error) {
              console.error('Ошибка парсинга даты рождения пользователя:', error);
              setSelectedYear(2012);
            }
          } else {
            setSelectedYear(2012);
          }
        }
        
        // Убираем сложную логику проверки фильтров - она может вызывать бесконечные циклы
        // Вместо этого просто устанавливаем значения по умолчанию
      } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []); // Пустой массив зависимостей - выполняется только один раз при монтировании

  useFocusEffect(
    useCallback(() => {
      refreshPlayers();
      checkForNewUser();
    }, [refreshPlayers, checkForNewUser])
  );

  // Обработка параметра refresh для принудительного обновления
  useEffect(() => {
    if (params.refresh) {
      refreshPlayers();
      checkForNewUser();
      // Очищаем параметр refresh после использования
      setTimeout(() => {
        router.setParams({ refresh: undefined });
      }, 1000);
    }
  }, [params.refresh, refreshPlayers, checkForNewUser, router]);

  // Убираем частую проверку обновлений данных - только при необходимости
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     refreshPlayers();
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, [refreshPlayers]);

  // Проверяем пользователя реже
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewUser();
    }, 300000); // 5 минут

    return () => clearInterval(interval);
  }, [checkForNewUser]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground 
          source={iceBg} 
          style={styles.hockeyRink} 
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
        >
          {imageLoaded && <View style={styles.innerBorder} />}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загрузка игроков...</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={iceBg} 
        style={styles.hockeyRink} 
        resizeMode="cover"
        onLoad={() => setImageLoaded(true)}
      >
        {/* Внутренняя граница */}
        <View style={styles.innerBorder} />

        {/* Фильтры */}
        <View style={styles.filtersWrapper}>
          <View style={styles.filtersContainer}>
            <CountryFilter players={players} />
            <YearFilter players={players} />
          </View>
        </View>

        {/* Показываем сообщение, если нет игроков по выбранным фильтрам */}
        {filteredPlayers.length === 0 && (selectedCountry || selectedYear) && (
          <View style={styles.noPlayersContainer}>
            <Text style={styles.noPlayersText}>
              {selectedCountry && selectedYear 
                ? `Нет игроков из ${selectedCountry} в ${selectedYear} году`
                : selectedCountry 
                  ? `Нет игроков из ${selectedCountry}`
                  : `Нет игроков ${selectedYear} года рождения`
              }
            </Text>
            <Text style={styles.noPlayersSubtext}>
              Лед пуст. Выберите другую страну или год, или сбросьте фильтры.
            </Text>
          </View>
        )}

        {puckPositions.map((position) => {
          const player = allVisiblePlayers.find(p => p.id === position.id);
          if (!player) return null;
          
          return (
            <PuckAnimator
              key={player.id}
              player={player}
              position={position}
              onNav={() => {
                if (currentUser) {
                  router.push({ pathname: '/player/[id]', params: { id: player.id } });
                } else {
                  setShowAuthModal(true);
                }
              }}
            />
          );
        })}

        <Modal
          visible={showAuthModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAuthModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Требуется авторизация</Text>
              <Text style={styles.modalMessage}>
                Для просмотра профиля игрока необходимо войти в систему
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => {
                    setShowAuthModal(false);
                    router.push('/login');
                  }}
                >
                  <Ionicons name="log-in" size={20} color="#fff" />
                  <Text style={styles.modalButtonText}>Войти</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSecondary]} 
                  onPress={() => setShowAuthModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden', // Добавляем overflow: hidden
  },
  hockeyRink: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 50,
    overflow: 'hidden',
    // Убираем border
    // borderWidth: 6,
    // borderColor: 'rgba(102, 102, 102, 0.5)',
  },
  innerBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 42,
    borderWidth: 1, // Толщина 1 пиксель
    borderColor: 'rgba(255, 255, 255, 1)', // Полностью белый, без прозрачности
    pointerEvents: 'none',
  },
  logoPuckContainer: {
    position: 'absolute',
    top: 0,
    left: width / 2 - 100,
    zIndex: 1000,
  },
  logoPuck: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FF4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  logoImageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminPuckContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    marginLeft: 8,
  },
  modalButtonTextSecondary: {
    color: '#FF4444',
  },


  noPlayersContainer: {
    position: 'absolute',
    top: '60%', // Позиционируем ниже фильтров
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 20,
    alignItems: 'center',
    zIndex: 10,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  noPlayersText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  noPlayersSubtext: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  puckContainer: {
    position: 'absolute',
  },

  filtersWrapper: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8, // Уменьшаем отступ между фильтрами
  },
  filterButton: {
    // Удалено
  },
  filterButtonText: {
    // Удалено
  },
  filterButtonIcon: {
    // Удалено
  },
  filtersHint: {
    // Удалено
  },
  filtersHintText: {
    // Удалено
  },
  filtersHintSubtext: {
    // Удалено
  },



});
