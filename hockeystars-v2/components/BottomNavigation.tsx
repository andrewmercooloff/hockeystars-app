import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loadCurrentUser, Player } from '../utils/playerStorage';

interface TabItem {
  name: string;
  icon: string;
  route: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const tabs: TabItem[] = [
  {
    name: 'home',
    icon: 'home',
    route: '/',
    label: 'Главная'
  },
  {
    name: 'messages',
    icon: 'chatbubbles',
    route: '/messages',
    label: 'Сообщения',
    requiresAuth: true
  },
  {
    name: 'profile',
    icon: 'person',
    route: '/profile',
    label: 'Профиль',
    requiresAuth: true
  },
  {
    name: 'admin',
    icon: 'settings',
    route: '/admin',
    label: 'Админ',
    requiresAuth: true,
    adminOnly: true
  }
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await loadCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.log('Пользователь не авторизован');
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  const isActiveTab = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  const handleTabPress = (tab: TabItem) => {
    if (tab.requiresAuth && !currentUser) {
      router.push('/login');
      return;
    }

    if (tab.adminOnly && currentUser?.status !== 'admin') {
      return; // Не показываем админскую вкладку для обычных пользователей
    }

    router.push(tab.route);
  };

  const visibleTabs = tabs.filter(tab => {
    if (tab.adminOnly && currentUser?.status !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {visibleTabs.map((tab) => {
        const isActive = isActiveTab(tab.route);
        const isDisabled = tab.requiresAuth && !currentUser;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              isDisabled && styles.disabledTab
            ]}
            onPress={() => handleTabPress(tab)}
            disabled={isDisabled}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={24} 
              color={isActive ? '#FF4444' : isDisabled ? '#666' : '#fff'} 
            />
            <Text style={[
              styles.tabLabel,
              isActive && styles.activeTabLabel,
              isDisabled && styles.disabledTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Активная вкладка выделяется цветом иконки и текста
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#FF4444',
    fontFamily: 'Gilroy-Bold',
  },
  disabledTabLabel: {
    color: '#666',
  },
}); 