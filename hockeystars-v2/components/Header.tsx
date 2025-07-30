import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loadCurrentUser, Player } from '../utils/playerStorage';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showProfile?: boolean;
}

export default function Header({ 
  title, 
  showBack = false, 
  onBackPress,
  showProfile = true 
}: HeaderProps) {
  const router = useRouter();
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

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleProfilePress = () => {
    if (currentUser) {
      router.push('/profile');
    } else {
      router.push('/login');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoSection}>
            <Ionicons name="hockey-puck" size={32} color="#FF4444" />
            <Text style={styles.logoText}>HockeyStars</Text>
          </View>
        )}
      </View>

      {title && (
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}

      <View style={styles.rightSection}>
        {showProfile && (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            {currentUser?.avatar ? (
              <Image 
                source={{ uri: currentUser.avatar }} 
                style={styles.profileAvatar}
              />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    marginLeft: 8,
  },
  titleSection: {
    flex: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  profileButton: {
    padding: 8,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  profileAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
}); 