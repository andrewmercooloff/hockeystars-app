import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ImageBackground,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Puck from '../components/Puck';
import { Player, initializeStorage, loadCurrentUser, loadPlayers } from '../utils/playerStorage';
import api from '../utils/api';

const { width, height } = Dimensions.get('window');

// Система управления шайбами с коллизиями
interface PuckPosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

const usePuckCollisionSystem = (players: Player[]) => {
  const puckSize = 98;
  const [puckPositions, setPuckPositions] = useState<PuckPosition[]>([]);
  const animationRef = useRef<number | null>(null);
  const isVisible = useRef(true);
  
  // Вычисляем границы хоккейной коробки - упрощенная версия
  const leftMargin = 0;
  const topMargin = 0;
  const rightMargin = 30;
  const bottomMargin = 230;
  
  const rinkWidth = width - leftMargin - rightMargin;
  const rinkHeight = height - topMargin - bottomMargin;
  
  // Инициализация позиций шайб (только для новых игроков)
  useEffect(() => {
    setPuckPositions(prevPositions => {
      const existingIds = new Set(prevPositions.map(pos => pos.id));
      const newPlayers = players.filter(player => !existingIds.has(player.id));
      
      if (newPlayers.length === 0) {
        return prevPositions;
      }
      
      const newPositions: PuckPosition[] = newPlayers.map((player, index) => {
        let startX: number, startY: number;
        let attempts = 0;
        
        do {
          startX = leftMargin + Math.random() * (rinkWidth - puckSize);
          startY = topMargin + Math.random() * (rinkHeight - puckSize);
          attempts++;
        } while (
          attempts < 50 && 
          prevPositions.some(pos => {
            const dx = startX - pos.x;
            const dy = startY - pos.y;
            return Math.sqrt(dx * dx + dy * dy) < puckSize * 1.5;
          })
        );
        
        return {
          id: player.id,
          x: startX,
          y: startY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: puckSize
        };
      });
      
      return [...prevPositions, ...newPositions];
    });
  }, [players]);

  // Оптимизированная анимация с requestAnimationFrame
  useEffect(() => {
    if (puckPositions.length === 0) return;

    const animationFrame = () => {
      if (!isVisible.current) {
        animationRef.current = requestAnimationFrame(animationFrame);
        return;
      }

      setPuckPositions(prevPositions => {
        return prevPositions.map(puck => {
          let newX = puck.x + puck.vx;
          let newY = puck.y + puck.vy;
          let newVx = puck.vx;
          let newVy = puck.vy;

          const wallBounce = 0.95;
          const minSpeed = 0.5;
          
          // Отскок от стен
          if (newX <= leftMargin) {
            newX = leftMargin;
            newVx = Math.abs(newVx) * wallBounce;
          } else if (newX >= leftMargin + rinkWidth - puck.size) {
            newX = leftMargin + rinkWidth - puck.size;
            newVx = -Math.abs(newVx) * wallBounce;
          }
          
          if (newY <= topMargin) {
            newY = topMargin;
            newVy = Math.abs(newVy) * wallBounce;
          } else if (newY >= topMargin + rinkHeight - puck.size) {
            newY = topMargin + rinkHeight - puck.size;
            newVy = -Math.abs(newVy) * wallBounce;
          }
          
          newX = Math.max(leftMargin, Math.min(leftMargin + rinkWidth - puck.size, newX));
          newY = Math.max(topMargin, Math.min(topMargin + rinkHeight - puck.size, newY));
          
          if (Math.abs(newVx) < minSpeed && Math.abs(newVy) < minSpeed) {
            const angle = Math.random() * Math.PI * 2;
            newVx = Math.cos(angle) * minSpeed * 2;
            newVy = Math.sin(angle) * minSpeed * 2;
          }

          // Оптимизированная проверка коллизий (только с ближайшими шайбами)
          const puckBounce = 0.9;
          const collisionRadius = puck.size * 2; // Проверяем только близкие шайбы
          
          prevPositions.forEach(otherPuck => {
            if (otherPuck.id !== puck.id) {
              const dx = newX - otherPuck.x;
              const dy = newY - otherPuck.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < collisionRadius) {
                const minDistance = puck.size;

                if (distance < minDistance) {
                  const angle = Math.atan2(dy, dx);
                  const overlap = minDistance - distance;
                  
                  const separationX = Math.cos(angle) * overlap * 0.5;
                  const separationY = Math.sin(angle) * overlap * 0.5;
                  
                  newX += separationX;
                  newY += separationY;
                  
                  if (distance > 0) {
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    
                    const relativeVx = newVx - otherPuck.vx;
                    const relativeVy = newVy - otherPuck.vy;
                    
                    const dotProduct = relativeVx * normalX + relativeVy * normalY;
                    
                    if (dotProduct < 0) {
                      newVx -= dotProduct * normalX * puckBounce;
                      newVy -= dotProduct * normalY * puckBounce;
                    }
                  }
                }
              }
            }
          });

          const friction = 0.9995;
          const randomness = 0.005;
          
          newVx *= friction;
          newVy *= friction;
          
          newVx += (Math.random() - 0.5) * randomness;
          newVy += (Math.random() - 0.5) * randomness;

          return {
            ...puck,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });
      });

      animationRef.current = requestAnimationFrame(animationFrame);
    };

    animationRef.current = requestAnimationFrame(animationFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [puckPositions.length]);

  // Обработка видимости экрана - упрощенная версия
  useEffect(() => {
    // Устанавливаем видимость по умолчанию
    isVisible.current = true;
  }, []);

  return { puckPositions, puckSize };
};

const PuckAnimator: React.FC<{ 
  player: Player; 
  position: PuckPosition; 
  onNav: () => void 
}> = React.memo(({ player, position, onNav }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: position.x },
      { translateY: position.y }
    ],
  }));

  // Функция для автоматического расчета очков
  const calculatePoints = (goals: string, assists: string): string => {
    const goalsNum = parseInt(goals) || 0;
    const assistsNum = parseInt(assists) || 0;
    return (goalsNum + assistsNum).toString();
  };

  return (
    <Puck 
      avatar={player.avatar} 
      onPress={onNav} 
      animatedStyle={animatedStyle} 
      size={position.size}
      points={player.status === 'star' ? undefined : calculatePoints(player.goals || '0', player.assists || '0')}
      isStar={player.status === 'star'}
    />
  );
});

const iceBg = require('../assets/images/led.jpg');

export default function HomeScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Используем систему коллизий для шайб
  const { puckPositions, puckSize } = usePuckCollisionSystem(players);



  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Инициализируем хранилище при первом запуске
        await initializeStorage();
        
        // Загружаем всех игроков с сервера
        try {
          const serverPlayers = await api.getPlayers();
          setPlayers(serverPlayers);
          console.log('Главный экран - загружено игроков с сервера:', serverPlayers.length);
        } catch (error) {
          console.error('Ошибка загрузки игроков с сервера:', error);
          // Fallback на локальные данные
          const localPlayers = await loadPlayers();
          setPlayers(localPlayers);
          console.log('Главный экран - загружено игроков локально:', localPlayers.length);
        }
        
        // Загружаем текущего пользователя
        const user = await loadCurrentUser();
        setCurrentUser(user);
        console.log('Главный экран - текущий пользователь:', user?.name || 'не авторизован');
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить данные игроков');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Обновляем только пользователя при возвращении на экран (не трогаем игроков)
  useEffect(() => {
    const updateUserData = async () => {
      try {
        const user = await loadCurrentUser();
        setCurrentUser(user);
        console.log('Обновление данных пользователя:', user?.name || 'не авторизован');
      } catch (error) {
        console.error('Ошибка обновления данных пользователя:', error);
      }
    };

    // Обновляем данные пользователя каждые 30 секунд (увеличили интервал для оптимизации)
    const interval = setInterval(updateUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.hockeyRinkContainer}>
        <ImageBackground source={iceBg} style={styles.hockeyRink} resizeMode="cover">
            <View style={styles.innerBorder} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загрузка игроков...</Text>
          </View>
        </ImageBackground>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hockeyRinkContainer}>
      <ImageBackground source={iceBg} style={styles.hockeyRink} resizeMode="cover">
          {/* Внутренняя граница хоккейной коробки */}
          <View style={styles.innerBorder} />
          
        {players.map((player) => {
            const position = puckPositions.find(pos => pos.id === player.id);
            if (!position) return null;
            
          console.log('Rendering player:', player.name);
          return (
            <PuckAnimator
              key={player.id}
              player={player}
                position={position}
                onNav={() => {
                  if (currentUser) {
                    // Если пользователь авторизован - переходим на профиль игрока
                    router.push({ pathname: '/player/[id]', params: { id: player.id } });
                  } else {
                    // Если пользователь не авторизован - показываем кастомный диалог
                    setShowAuthModal(true);
                  }
                }}
            />
          );
        })}
        
        {/* Кнопки в зависимости от состояния авторизации */}
        <View style={styles.authButtons}>
          {!currentUser && (
            // Если пользователь не авторизован - показываем кнопки входа и регистрации
            <>
          <TouchableOpacity 
                style={styles.modalButton} 
            onPress={() => router.push('/login')}
          >
            <Ionicons name="log-in" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Вход</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]} 
            onPress={() => router.push('/register')}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Регистрация</Text>
          </TouchableOpacity>
            </>
          )}
          

        </View>
      </ImageBackground>
      </View>

      {/* Кастомное модальное окно авторизации */}
      <Modal
        visible={showAuthModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
                    <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="lock-closed" size={32} color="#FF4444" />
              <Text style={styles.modalTitle}>Требуется авторизация</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Войдите или зарегистрируйтесь, чтобы просматривать профили игроков и взаимодействовать с сообществом
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
                onPress={() => {
                  setShowAuthModal(false);
                  router.push('/register');
                }}
              >
                <Ionicons name="person-add" size={20} color="#FF4444" />
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Регистрация</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowAuthModal(false)}
            >
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
                  </BlurView>
      </Modal>
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
  authButtons: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
  },
  registerButtonText: {
    fontSize: 13,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
  },
  profileButton: {
    backgroundColor: '#FF4444',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileButtonText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 6,
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
    backgroundColor: '#000',
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
