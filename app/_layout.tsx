import { useFonts } from 'expo-font';
import { SplashScreen, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadCurrentUser, Player, getUnreadMessageCount, initializeStorage } from '../utils/playerStorage';

const logo = require('../assets/images/logo.png');

const MessagesIcon = ({ size }: { size: number }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const user = await loadCurrentUser();
        if (user) {
          setCurrentUser(user);
          const count = await getUnreadMessageCount(user.id);
          console.log('MessagesIcon: Пользователь:', user.name, 'Непрочитанных сообщений:', count);
          setUnreadCount(count);
        } else {
          console.log('MessagesIcon: Пользователь не найден');
          setCurrentUser(null);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Ошибка загрузки количества непрочитанных сообщений:', error);
      }
    };

    loadUnreadCount();
    
    // Обновляем каждые 5 секунд для более быстрого обновления при смене пользователя
    const interval = setInterval(loadUnreadCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name="chatbubble-outline" size={size} color="#fff" />
      {(() => {
        console.log('MessagesIcon render: unreadCount =', unreadCount);
        return unreadCount > 0 && (
          <View style={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: '#FF4444',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: '#000',
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 10,
              fontFamily: 'Gilroy-Bold',
              fontWeight: 'bold',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        );
      })()}
    </View>
  );
};

const LogoHeader = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await loadCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Ошибка загрузки текущего пользователя:', error);
      }
    };

    loadUser();
    
    // Обновляем данные каждые 5 секунд для синхронизации (увеличили интервал для оптимизации)
    const interval = setInterval(loadUser, 5000);
    
    return () => clearInterval(interval);
  }, []);

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
              source={{ uri: currentUser.avatar }}
              style={{
                width: 45,
                height: 45,
                borderRadius: 22.5,
                resizeMode: 'cover'
              }}
              onError={() => console.log('Profile image failed to load')}
            />
          ) : (
            <Ionicons name="person" size={25} color="#fff" />
          )}
        </View>
        {currentUser && (
          <Text style={{
            color: '#fff',
            fontSize: 12,
            fontFamily: 'Gilroy-Regular',
            marginTop: 2,
          }}>
            {currentUser.name}
          </Text>
        )}
        <Text style={{
          color: '#FF4444',
          fontSize: 10,
          fontFamily: 'Gilroy-Bold',
          marginTop: 1,
        }}>
          {currentUser ? (
            currentUser.status === 'player' ? 'Игрок' : 
            currentUser.status === 'coach' ? 'Тренер' : 
            currentUser.status === 'scout' ? 'Скаут' : 'Звезда'
          ) : 'Гость'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Gilroy-Regular': require('../assets/fonts/gilroy-regular.ttf'),
    'Gilroy-Bold': require('../assets/fonts/gilroy-bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Инициализируем хранилище при загрузке приложения
      initializeStorage();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
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
          tabBarIcon: ({ size }) => (
            <MessagesIcon size={size} />
          ),
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="notifications-outline" size={size} color="#fff" />
          ),
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="player/[id]"
        options={{
          href: null, // Скрываем эту вкладку
          title: 'Профиль игрока',
          headerStyle: { backgroundColor: '#000', height: 128 },
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: null, // Скрываем эту вкладку
          title: 'Регистрация',
          headerStyle: { backgroundColor: '#000', height: 128 },
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: null, // Скрываем эту вкладку
          title: 'Вход',
          headerStyle: { backgroundColor: '#000', height: 128 },
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Скрываем эту вкладку
          title: 'Личный кабинет',
          headerStyle: { backgroundColor: '#000', height: 128 },
          headerTitle: () => <LogoHeader />,
        }}
      />
      <Tabs.Screen
        name="chat/[id]"
        options={{
          href: null, // Скрываем эту вкладку
          title: 'Чат',
          headerStyle: { backgroundColor: '#000', height: 128 },
          headerTitle: () => <LogoHeader />,
        }}
      />
    </Tabs>
  );
}
