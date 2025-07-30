import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
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
import PageWrapper from '../components/PageWrapper';
import { Player, initializeStorage, loadCurrentUser, loadPlayers } from '../utils/playerStorage';

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
  const puckSize = 98;
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
          nextPositions.push({
            id: player.id,
            x: 10 + Math.random() * (width - 20 - puckSize),
            y: 10 + Math.random() * (height - 230 - puckSize),
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
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

          // Обработка коллизий со стенами
          if (newX <= 10 || newX >= width - 20 - puckSize) {
            newVx = -newVx * 0.8;
            newX = Math.max(10, Math.min(width - 20 - puckSize, newX));
          }
          if (newY <= 10 || newY >= height - 230 - puckSize) {
            newVy = -newVy * 0.8;
            newY = Math.max(10, Math.min(height - 230 - puckSize, newY));
          }

          // Коллизии между шайбами
          currentPositions.forEach(otherPos => {
            if (otherPos.id === pos.id) return;
            
            const dx = newX - otherPos.x;
            const dy = newY - otherPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < puckSize && distance > 0) {
              const angle = Math.atan2(dy, dx);
              const force = (puckSize - distance) / puckSize;
              
              newVx += Math.cos(angle) * force * 0.5;
              newVy += Math.sin(angle) * force * 0.5;
            }
          });
          
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
        avatar={player.avatar || player.photo}
        onPress={onNav}
        animatedStyle={animatedStyle}
        size={position.size}
        points={player.goals && player.assists ? 
          `${parseInt(player.goals) + parseInt(player.assists)}` : undefined}
        isStar={player.status === 'star'}
        status={player.status}
      />
    </Animated.View>
  );
};



export default function HomeScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { puckPositions = [] } = usePuckCollisionSystem(players);

  const refreshPlayers = useCallback(async () => {
    try {
      const loadedPlayers = await loadPlayers();
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
      console.log('Пользователь не авторизован');
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        await initializeStorage();
        
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
      refreshPlayers();
      checkForNewUser();
    }, [refreshPlayers, checkForNewUser])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkForNewUser]);

  if (loading) {
    return (
      <PageWrapper showHeader={false} showBottomNav={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка игроков...</Text>
        </View>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showHeader={false} showBottomNav={false}>
      <View style={styles.innerBorder} />
      
      {/* Анимированные шайбы игроков */}
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

      {/* Кнопки управления */}
      <View style={styles.authButtons}>
        <TouchableOpacity 
          style={styles.authButton} 
          onPress={() => router.push('/login')}
        >
          <Ionicons name="log-in" size={24} color="#fff" />
          <Text style={styles.authButtonText}>Войти</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.authButton} 
          onPress={() => router.push('/register')}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.authButtonText}>Регистрация</Text>
        </TouchableOpacity>

        {currentUser && (
          <>
            <TouchableOpacity 
              style={styles.authButton} 
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person" size={24} color="#fff" />
              <Text style={styles.authButtonText}>Профиль</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.authButton} 
              onPress={() => router.push('/messages')}
            >
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.authButtonText}>Сообщения</Text>
            </TouchableOpacity>

            {(currentUser.status as string) === 'admin' && (
              <TouchableOpacity 
                style={[styles.authButton, styles.adminButton]} 
                onPress={() => router.push('/admin')}
              >
                <Ionicons name="people" size={24} color="#fff" />
                <Text style={styles.authButtonText}>Админ</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

        {/* Модальное окно авторизации */}
        <Modal
          visible={showAuthModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAuthModal(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={20} style={styles.modalContent}>
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
            </BlurView>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  innerBorder: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 240,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  puckContainer: {
    position: 'absolute',
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
  authButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  authButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center',
  },
  adminButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    marginLeft: 8,
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