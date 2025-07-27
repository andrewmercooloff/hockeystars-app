import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import Animated from 'react-native-reanimated';

interface PuckProps {
  avatar?: string | null;
  onPress: () => void;
  animatedStyle?: any;
  size?: number;
  points?: string;
  isStar?: boolean;
}

const Puck: React.FC<PuckProps> = React.memo(({ avatar, onPress, animatedStyle, size = 140, points, isStar }) => {
  const avatarSize = size * 0.86;
  const borderRadius = size / 2;
  const avatarBorderRadius = avatarSize / 2;

  // Получаем правильное изображение
  const getImageSource = () => {
    if (!avatar) {
      return require('../assets/images/logo.png');
    }
    
    // Если это путь к локальному файлу
    if (typeof avatar === 'string') {
      if (avatar.includes('kostitsyn')) {
        return require('../assets/images/me.jpg'); // Временно используем me.jpg
      } else if (avatar.includes('grabovsky')) {
        return require('../assets/images/me.jpg'); // Временно используем me.jpg
      } else if (avatar.includes('merkulov')) {
        return require('../assets/images/me.jpg'); // Временно используем me.jpg
      }
    }
    
    return require('../assets/images/logo.png');
  };

  return (
    <Animated.View style={[
      isStar ? styles.starPuck : styles.puck, 
      { width: size, height: size, borderRadius }, 
      animatedStyle
    ]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Image 
          source={getImageSource()} 
          style={[
            isStar ? styles.starAvatar : styles.avatar, 
            { width: avatarSize, height: avatarSize, borderRadius: avatarBorderRadius }
          ]} 
          resizeMode="cover"
        />
        
        {/* Отображение очков для обычных игроков */}
        {!isStar && points && (
          <View style={[styles.pointsContainer, { bottom: -size * 0.05 }]}>
            <Text style={[styles.pointsText, { fontSize: size * 0.12 }]}>{points}</Text>
          </View>
        )}
        
        {/* Звездочка для звездных игроков */}
        {isStar && (
          <View style={[styles.starContainer, { bottom: -size * 0.05 }]}>
            <Text style={[styles.starText, { fontSize: size * 0.15 }]}>⭐</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  puck: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  starPuck: {
    position: 'absolute',
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FF4444',
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  starAvatar: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  pointsContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  pointsText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  starContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  starText: {
    textAlign: 'center',
  },
});

export default Puck; 