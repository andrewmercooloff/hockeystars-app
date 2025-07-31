import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

interface PuckProps {
  avatar?: string | null;
  onPress: () => void;
  animatedStyle?: any;
  size?: number;
  points?: string;
  isStar?: boolean;
  status?: string;
}

const Puck: React.FC<PuckProps> = ({ 
  avatar, 
  onPress, 
  animatedStyle, 
  size = 140, 
  points, 
  isStar, 
  status 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const avatarSize = size * 0.86;
  const borderRadius = size / 2;
  const avatarBorderRadius = avatarSize / 2;
  const iconSize = avatarSize * 0.5;

  const avatarBorderColor = (() => {
    switch (status) {
      case 'star': return '#FFD700';
      case 'coach': return '#FF4444';
      case 'scout': return '#888888';
      case 'admin': return '#8A2BE2';
      default: return '#FFFFFF';
    }
  })();

  const getImageSource = () => {
    if (!avatar || imageError) {
      return null;
    }
    
    if (typeof avatar === 'string') {
      // Проверяем корректные URI
      if (avatar.startsWith('data:image/') || 
          avatar.startsWith('http') || 
          avatar.startsWith('file://') || 
          avatar.startsWith('content://')) {
        return { uri: avatar };
      }
      
      // Проверяем старые пути к файлам
      if (avatar.includes('me.jpg')) {
        return require('../assets/images/me.jpg');
      }
    }
    
    // Для всех остальных случаев показываем силуэт
    return null;
  };

  const imageSource = getImageSource();

  return (
    <Animated.View style={[
      isStar ? styles.starPuck : styles.puck,
      { 
        width: size, 
        height: size, 
        borderRadius: borderRadius 
      },
      animatedStyle
    ]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {imageSource ? (
          <Image 
            source={imageSource} 
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarBorderRadius,
                borderWidth: 2,
                borderColor: avatarBorderColor
              }
            ]}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[
            styles.avatarPlaceholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarBorderRadius,
              borderWidth: 2,
              borderColor: avatarBorderColor,
              backgroundColor: '#2C3E50'
            }
          ]}>
            <Ionicons 
              name="person" 
              size={iconSize} 
              color="#FFFFFF" 
            />
          </View>
        )}
        
        {points && status === 'player' && (
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{points}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  puck: {
    position: 'absolute',
    backgroundColor: '#000000',
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
    borderWidth: 2,
    borderColor: '#333333',
  },
  starPuck: {
    position: 'absolute',
    backgroundColor: '#000000',
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
    borderWidth: 2,
    borderColor: '#333333',
  },
  avatar: {
    // Базовый стиль для аватара
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FF4444',
    bottom: -4,
    right: 10,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 12,
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