import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { initializeStorage, loadCurrentUser, Player } from '../utils/playerStorage';

const logo = require('../assets/images/logo.png');



const LogoHeader = () => {
  const router = useRouter();
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
    
    // Обновляем данные каждые 5 секунд для синхронизации (увеличили интервал для оптимизации)
    const interval = setInterval(loadUser, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Обновляем данные при возврате на экран
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

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
          {currentUser?.photo || currentUser?.avatar ? (
            <Image
              source={
                (currentUser.photo && typeof currentUser.photo === 'string' && (
                  currentUser.photo.startsWith('data:image/') || 
                  currentUser.photo.startsWith('http') || 
                  currentUser.photo.startsWith('file://') || 
                  currentUser.photo.startsWith('content://')
                )) || (currentUser.avatar && typeof currentUser.avatar === 'string' && (
                  currentUser.avatar.startsWith('data:image/') || 
                  currentUser.avatar.startsWith('http') || 
                  currentUser.avatar.startsWith('file://') || 
                  currentUser.avatar.startsWith('content://')
                ))
                  ? { uri: currentUser.photo || currentUser.avatar }
                  : require('../assets/images/me.jpg')
              }
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
        {currentUser && currentUser.name && (
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
          color: '#fff',
          fontSize: 10,
          fontFamily: 'Gilroy-Bold',
          marginTop: 1,
        }}>
          {currentUser ? (
            currentUser.status === 'player' ? 'Игрок' : 
            currentUser.status === 'coach' ? 'Тренер' : 
            currentUser.status === 'scout' ? 'Скаут' : 
            currentUser.status === 'star' ? 'Звезда' : ''
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
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Инициализируем хранилище при загрузке приложения
      initializeStorage();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await loadCurrentUser();
        console.log('🔍 Layout: currentUser =', user?.name, 'status =', user?.status);
        setCurrentUser(user);
      } catch (error) {
        console.error('Ошибка загрузки текущего пользователя:', error);
      }
    };

    loadUser();
    const interval = setInterval(loadUser, 3000);
    return () => clearInterval(interval);
  }, []);

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
            <Ionicons name="chatbubble-outline" size={size} color="#fff" />
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
      <Tabs.Screen
        name="(tabs)"
        options={{
          href: null,
          headerTitle: () => <LogoHeader />,
        }}
      />
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
