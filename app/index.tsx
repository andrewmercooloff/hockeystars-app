
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
import { useCountryFilter } from '../utils/CountryFilterContext';
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
        rightOffset: 160,
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
              const pushForce = overlap * 0.2;
              newVx += Math.cos(angle) * pushForce;
              newVy += Math.sin(angle) * pushForce;
              
              // Принудительное разделение только при сильном наложении
              const separationThreshold = Platform.OS === 'ios' ? puckSize * 0.6 : puckSize * 0.3;
              if (distance < separationThreshold) {
                const separationForce = (puckSize - distance) * 0.1;
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

  // Фильтруем игроков по выбранной стране
  const filteredPlayers = useMemo(() => {
    if (!selectedCountry) return players;
    const byCountry = players.filter(player => player.country === selectedCountry);
    // fallback: если для выбранной страны нет игроков, показываем всех
    return byCountry.length > 0 ? byCountry : players;
  }, [players, selectedCountry]);

  const { puckPositions = [] } = usePuckCollisionSystem(filteredPlayers);



  const refreshPlayers = useCallback(async () => {
    try {
      // console.log('🔄 Загрузка игроков...');
      const loadedPlayers = await loadPlayers();
      // console.log(`✅ Загружено игроков: ${loadedPlayers.length}`);
      
      // Добавляем отладочную информацию для каждого игрока
      // loadedPlayers.forEach(player => {
      //   console.log(`👤 Игрок: ${player.name}, Голы: ${player.goals}, Передачи: ${player.assists}, Команда: ${player.team}`);
      // });
      
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
        // Если пользователь авторизован и страна фильтра ещё не выбрана, устанавливаем страну пользователя как дефолтную
        if (!selectedCountry && user?.country) {
          setSelectedCountry(user.country);
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // console.log('🔄 Обновление данных при фокусе на экране...');
      refreshPlayers();
      checkForNewUser();
    }, [refreshPlayers, checkForNewUser])
  );

  // Обработка параметра refresh для принудительного обновления
  useEffect(() => {
    if (params.refresh) {
      // console.log('🔄 Принудительное обновление данных после входа...');
      refreshPlayers();
      checkForNewUser();
      // Очищаем параметр refresh после использования
      setTimeout(() => {
        router.setParams({ refresh: undefined });
      }, 1000);
    }
  }, [params.refresh, refreshPlayers, checkForNewUser, router]);

  // Добавляем более частую проверку обновлений данных
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPlayers();
      // Убираем частую проверку пользователя - только при необходимости
      // checkForNewUser();
    }, 10000); // Увеличиваем до 10 секунд

    return () => clearInterval(interval);
  }, [refreshPlayers]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewUser();
    }, 300000); // Увеличиваем до 5 минут (300 секунд)

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
        {/* Иконка глобуса для фильтра стран в правом верхнем углу */}
        <TouchableOpacity
          style={styles.globeButton}
          onPress={() => setShowCountryFilter(!showCountryFilter)}
          activeOpacity={0.7}
        >
          <Ionicons name="earth" size={28} color="#fff" />
        </TouchableOpacity>



        {/* Показываем сообщение, если нет игроков из выбранной страны */}
        {selectedCountry && filteredPlayers.length === 0 && (
          <View style={styles.noPlayersContainer}>
            <Text style={styles.noPlayersText}>
              Нет игроков из {selectedCountry}
            </Text>
            <Text style={styles.noPlayersSubtext}>
              Лед пуст. Выберите другую страну или сбросьте фильтр.
            </Text>
          </View>
        )}

        {puckPositions.map((position) => {
          const player = filteredPlayers.find(p => p.id === position.id);
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

        {/* Компонент фильтра стран */}
        <CountryFilter players={players} />

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
  },
  hockeyRink: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: '#666',
  },

  puckContainer: {
    position: 'absolute',
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
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  noPlayersText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    marginBottom: 10,
  },
  noPlayersSubtext: {
    color: '#ccc',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    textAlign: 'center',
  },
  globeButton: {
    position: 'absolute',
    top: 20,
    left: 40,
    backgroundColor: '#FF4444',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
});
