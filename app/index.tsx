
import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    ImageBackground,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    useAnimatedStyle
} from 'react-native-reanimated';
import Puck from '../components/Puck';
import { Player, fixCorruptedData, initializeStorage, loadCurrentUser, loadPlayers } from '../utils/playerStorage';

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
            newX = 5 + Math.random() * (width - 15 - puckSize);
            newY = 5 + Math.random() * (height - 235 - puckSize);
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
            newX = 5 + Math.random() * (width - 15 - puckSize);
            newY = 5 + Math.random() * (height - 235 - puckSize);
          }
          
          nextPositions.push({
            id: player.id,
            x: newX,
            y: newY,
            vx: (Math.random() - 0.5) * 0.39, // Увеличено в 2.6 раза с 0.15 до 0.39
            vy: (Math.random() - 0.5) * 0.39, // Увеличено в 2.6 раза с 0.15 до 0.39
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

          // Обработка коллизий со стенами (еще больше уменьшены отступы для использования всего пространства)
          if (newX <= 5 || newX >= width - 15 - puckSize) {
            newVx = -newVx * 0.8;
            newX = Math.max(5, Math.min(width - 15 - puckSize, newX));
          }
          if (newY <= 5 || newY >= height - 225 - puckSize) {
            newVy = -newVy * 0.8;
            newY = Math.max(5, Math.min(height - 225 - puckSize, newY));
          }

          // Улучшенная система коллизий между шайбами
          currentPositions.forEach(otherPos => {
            if (otherPos.id === pos.id) return;
            
            const dx = newX - otherPos.x;
            const dy = newY - otherPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Минимальное расстояние между центрами шайб (еще больше уменьшено для более близкого расположения)
            const minDistance = puckSize * 1.02;
            
            if (distance < minDistance && distance > 0) {
              const angle = Math.atan2(dy, dx);
              const overlap = minDistance - distance;
              
              // Умеренное отталкивание при наложении
              const pushForce = overlap * 0.2;
              newVx += Math.cos(angle) * pushForce;
              newVy += Math.sin(angle) * pushForce;
              
              // Принудительное разделение только при сильном наложении
              if (distance < puckSize * 0.6) {
                const separationForce = (puckSize - distance) * 0.1;
                newX += Math.cos(angle) * separationForce;
                newY += Math.sin(angle) * separationForce;
              }
              
              // Слабое отталкивание для предотвращения "залипания"
              if (distance < minDistance * 0.8) {
                const repulsionForce = 0.05;
                newVx += Math.cos(angle) * repulsionForce;
                newVy += Math.sin(angle) * repulsionForce;
              }
            }
          });
          
          // Ограничение максимальной скорости для стабильности
          const maxSpeed = 5.2; // Увеличено в 2.6 раза с 2.0 до 5.2
          const currentSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
          if (currentSpeed > maxSpeed) {
            newVx = (newVx / currentSpeed) * maxSpeed;
            newVy = (newVy / currentSpeed) * maxSpeed;
          }
          
          // Минимальная скорость для предотвращения остановки
          const minSpeed = 0.208; // Увеличено в 2.6 раза с 0.08 до 0.208
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

  const { puckPositions = [] } = usePuckCollisionSystem(players);



  const refreshPlayers = useCallback(async () => {
    try {
      console.log('🔄 Загрузка игроков...');
      const loadedPlayers = await loadPlayers();
      console.log(`✅ Загружено игроков: ${loadedPlayers.length}`);
      
      // Добавляем отладочную информацию для каждого игрока
      loadedPlayers.forEach(player => {
        console.log(`👤 Игрок: ${player.name}, Голы: ${player.goals}, Передачи: ${player.assists}, Команда: ${player.team}`);
      });
      
      setPlayers(loadedPlayers);
    } catch (error) {
      console.error('❌ Ошибка обновления игроков:', error);
    }
  }, []);

  const checkForNewUser = useCallback(async () => {
    try {
      const user = await loadCurrentUser();
      if (user) {
        console.log(`👤 Текущий пользователь: ${user.name} (${user.status})`);
      } else {
        console.log('👤 Пользователь не авторизован');
      }
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
        
        const [loadedPlayers, user] = await Promise.all([
          loadPlayers(),
          loadCurrentUser()
        ]);
        
        setPlayers(loadedPlayers);
        setCurrentUser(user);
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
      console.log('🔄 Обновление данных при фокусе на экране...');
      refreshPlayers();
      checkForNewUser();
    }, [refreshPlayers, checkForNewUser])
  );

  // Обработка параметра refresh для принудительного обновления
  useEffect(() => {
    if (params.refresh) {
      console.log('🔄 Принудительное обновление данных после входа...');
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
      checkForNewUser();
    }, 5000); // Проверяем каждые 5 секунд

    return () => clearInterval(interval);
  }, [refreshPlayers, checkForNewUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewUser();
    }, 60000); // Увеличиваем интервал до 1 минуты

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
        {imageLoaded && <View style={styles.innerBorder} />}
        

        {puckPositions.map((position) => {
          const player = players.find(p => p.id === position.id);
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
  },
  hockeyRink: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
    // Убираем внешнюю границу, чтобы избежать дублирования
    // borderWidth: 4,
    // borderColor: '#666',
  },
  innerBorder: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 235,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 50,
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
});
