import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { SplashScreen, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { LogBox, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LogoHeader from '../components/LogoHeader';
import { CountryFilterProvider, useCountryFilter } from '../utils/CountryFilterContext';
import { initializeStorage, loadCurrentUser, loadNotifications, markNotificationAsRead, Player } from '../utils/playerStorage';

// Отключаем все предупреждения
LogBox.ignoreAllLogs();









export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Gilroy-Regular': require('../assets/fonts/gilroy-regular.ttf'),
    'Gilroy-Bold': require('../assets/fonts/gilroy-bold.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Компонент для фильтра стран (должен быть внутри CountryFilterProvider)
  const CountryFilterToggle = ({ size }: { size: number }) => {
    const { showCountryFilter, setShowCountryFilter } = useCountryFilter();
    
    return (
      <TouchableOpacity 
        onPress={() => setShowCountryFilter(!showCountryFilter)}
        style={{ 
          marginLeft: 8,
          justifyContent: 'center',
          alignItems: 'center',
          width: size + 4,
          height: size + 4,
          backgroundColor: '#000',
          borderRadius: 20,
          padding: 2,
        }}
      >
        <Ionicons 
          name="globe-outline" 
          size={size - 2} 
          color="#FF4444" 
        />
      </TouchableOpacity>
    );
  };



  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  const loadUser = async () => {
    try {
      const user = await loadCurrentUser();
      if (user) {
        // Загружаем непрочитанные уведомления (без логов)
        const notifications = await loadNotifications(user.id);
        
        // Помечаем все уведомления о сообщениях как прочитанные
        const messageNotifications = notifications.filter((n: any) => n.type === 'message' && !n.is_read);
        if (messageNotifications.length > 0) {
          for (const notification of messageNotifications) {
            try {
              await markNotificationAsRead(notification.id);
            } catch (error) {
              console.error('Ошибка отметки уведомления:', error);
            }
          }
        }
        
        // Фильтруем уведомления, исключая сообщения
        const filteredNotifications = notifications.filter((n: any) => {
          // Исключаем уведомления о сообщениях
          if (n.type === 'message') {
            return false;
          }
          // Включаем только нужные типы уведомлений
          return n.type === 'friend_request' || 
                 n.type === 'autograph_request' || 
                 n.type === 'stick_request' || 
                 n.type === 'achievement' || 
                 n.type === 'team_invite' || 
                 n.type === 'system';
        });
        
        const unreadNotificationsCount = filteredNotifications.filter((n: any) => !n.is_read).length;
        
        // Загружаем непрочитанные сообщения (без логов)
        const { getUnreadMessageCount } = await import('../utils/playerStorage');
        const unreadMessagesCount = await getUnreadMessageCount(user.id);
        
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
  useEffect(() => {
    if (currentUser) {
      loadUser();
    }
  }, [currentUser?.id]);

  // Обновляем счетчики при фокусе на экране сообщений
  useEffect(() => {
    // Главный экран получил фокус
    refreshCounters();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <CountryFilterProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
          headerTitle: () => <LogoHeader />,
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
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          headerTitle: () => <LogoHeader />,
          tabBarIcon: ({ size, focused }) => {
            // Рендерим иконку сообщений
            return (
              <View style={{
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
                width: size + 4,
                height: size + 4,
              }}>
                <Ionicons name="chatbubble-outline" size={size - 2} color={focused ? '#eee' : '#aaa'} />
                {currentUser && currentUser.unreadMessagesCount && currentUser.unreadMessagesCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
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
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          headerTitle: () => <LogoHeader />,
          tabBarIcon: ({ size, focused }) => {
            // Рендерим только иконку уведомлений
            return (
              <View style={{
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
                width: size + 4,
                height: size + 4,
              }}>
                <Ionicons name="notifications-outline" size={size - 2} color={focused ? '#eee' : '#aaa'} />
                {currentUser && currentUser.unreadNotificationsCount && currentUser.unreadNotificationsCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
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
        }}
      />

      <Tabs.Screen
        name="exercises"
        options={{
          headerTitle: () => <LogoHeader />,
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name="barbell-outline" size={size - 2} color={focused ? '#eee' : '#aaa'} />
          ),
        }}
      />

      <Tabs.Screen
        name="exercise-details"
        options={{
          href: null,
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
      </GestureHandlerRootView>
    </CountryFilterProvider>
  );
}
