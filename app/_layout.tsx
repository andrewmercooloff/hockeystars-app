import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, LogBox, Text, TouchableOpacity, View } from 'react-native';
import { initializeStorage, loadCurrentUser, loadNotifications, Player } from '../utils/playerStorage';

// Отключаем все предупреждения
LogBox.ignoreAllLogs();

const logo = require('../assets/images/logo.png');



const LogoHeader = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  const loadUser = async () => {
    try {
      const user = await loadCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Ошибка загрузки текущего пользователя:', error);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Обновляем данные при возврате на экран
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  // Обновляем данные при изменении параметров
  useEffect(() => {
    if (params.refresh) {
      console.log('🔄 Обновление данных в заголовке...');
      loadUser();
    }
  }, [params.refresh]);

  return (
    <View style={{ 
      height: 128, 
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 40
    }}>
      <Image source={logo} style={{ width: 180, height: 60, resizeMode: 'contain' }} />
      
      <TouchableOpacity 
        style={{ alignItems: 'center', marginTop: -8 }}
        onPress={() => {
          if (currentUser) {
            router.push('/profile');
          } else {
            router.push('/login');
          }
        }}
      >
        <View style={{
          width: 51,
          height: 51,
          borderRadius: 25.5,
          backgroundColor: '#333',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#fff',
        }}>
          {currentUser?.avatar ? (
            <Image
              source={
                (currentUser.avatar && typeof currentUser.avatar === 'string' && (
                  currentUser.avatar.startsWith('data:image/') || 
                  currentUser.avatar.startsWith('http') || 
                  currentUser.avatar.startsWith('file://') || 
                  currentUser.avatar.startsWith('content://')
                ))
                  ? { uri: currentUser.avatar }
                  : require('../assets/images/me.jpg')
              }
              style={{
                width: 45,
                height: 45,
                borderRadius: 22.5,
                resizeMode: 'cover'
              }}
              onError={() => {}}
            />
          ) : (
            <Ionicons name="person" size={25} color="#fff" />
          )}
        </View>
        {currentUser && currentUser.name && currentUser.name.trim() !== '' && (
          <Text style={{
            color: '#fff',
            fontSize: 12,
            fontFamily: 'Gilroy-Regular',
            marginTop: 2,
          }}>
            {currentUser?.name || 'Пользователь'}
          </Text>
        )}
        <Text style={{
          color: '#fff',
          fontSize: 10,
          fontFamily: 'Gilroy-Bold',
          marginTop: 1,
        }}>
          {currentUser && currentUser.status ? (
            currentUser?.status === 'player' ? 'Игрок' : 
            currentUser?.status === 'coach' ? 'Тренер' : 
            currentUser?.status === 'scout' ? 'Скаут' : 
            currentUser?.status === 'star' ? 'Звезда' : 
            currentUser?.status === 'admin' ? 'Техподдержка' : 'Пользователь'
          ) : 'Гость'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Gilroy-Regular': require('../assets/fonts/gilroy-regular.ttf'),
    'Gilroy-Bold': require('../assets/fonts/gilroy-bold.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  const loadUser = async () => {
    try {
      const user = await loadCurrentUser();
      if (user) {
        // Загружаем непрочитанные уведомления
        const notifications = await loadNotifications(user.id);
        const unreadNotificationsCount = notifications.filter((n: any) => !n.isRead).length;
        
        // Загружаем непрочитанные сообщения
        const { getUnreadMessageCount } = await import('../utils/playerStorage');
        const unreadMessagesCount = await getUnreadMessageCount(user.id);
        
        // Обновлены счетчики уведомлений и сообщений
        
        setCurrentUser({ 
          ...user, 
          unreadNotificationsCount,
          unreadMessagesCount 
        });
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки текущего пользователя:', error);
    }
  };

  // Функция для принудительного обновления счетчиков
  const refreshCounters = async () => {
    if (currentUser) {
      await loadUser();
    }
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Инициализируем хранилище при загрузке приложения
      initializeStorage();
    }
  }, [loaded]);

  useEffect(() => {
    loadUser();
    // Уменьшаем интервал до 3 секунд для более частого обновления счетчиков
    const interval = setInterval(loadUser, 3000);
    return () => clearInterval(interval);
  }, []);

  // Обновляем счетчик уведомлений при фокусе
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        loadUser();
      }
    }, [currentUser?.id])
  );

  // Обновляем счетчики при фокусе на экране сообщений
  useFocusEffect(
    React.useCallback(() => {
              // Главный экран получил фокус
      refreshCounters();
    }, [])
  );

  if (!loaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#000', height: 128 },
        headerTitleAlign: 'center',
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0 },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
        tabBarShowLabel: false, // Убираем подписи к иконкам
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ size }) => (
            <View style={{
              backgroundColor: '#FF4444',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="home" size={size - 2} color="#fff" />
            </View>
          ),
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ size }) => {
            // Рендерим иконку сообщений
            return (
              <View style={{
                position: 'relative',
              }}>
                <Ionicons name="chatbubble-outline" size={size} color="#fff" />
                {currentUser && currentUser.unreadMessagesCount && currentUser.unreadMessagesCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#FF4444',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 12,
                      fontFamily: 'Gilroy-Bold',
                    }}>
                      {currentUser.unreadMessagesCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ size }) => {
            // Рендерим иконку уведомлений
            return (
              <View style={{
                position: 'relative',
              }}>
                <Ionicons name="notifications-outline" size={size} color="#fff" />
                {currentUser && currentUser.unreadNotificationsCount && currentUser.unreadNotificationsCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#FF4444',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 12,
                      fontFamily: 'Gilroy-Bold',
                    }}>
                      {currentUser.unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="chat/[id]"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="player/[id]"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      
      {/* <Tabs.Screen
        name="(tabs)"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      /> */}
      <Tabs.Screen
        name="+not-found"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="components/Puck"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />

    </Tabs>
  );
}
