import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import Animated from 'react-native-reanimated';

interface PuckProps {
  avatar: string | null;
  onPress: () => void;
  animatedStyle: any;
  size?: number;
  points?: string;
  isStar?: boolean;
}

const Puck: React.FC<PuckProps> = React.memo(({ avatar, onPress, animatedStyle, size = 140, points, isStar }) => {
  const avatarSize = size * 0.86;
  const borderRadius = size / 2;
  const avatarBorderRadius = avatarSize / 2;

  return (
    <Animated.View style={[
      isStar ? styles.starPuck : styles.puck, 
      { width: size, height: size, borderRadius }, 
      animatedStyle
    ]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Image 
          source={avatar ? { uri: avatar } : require('../assets/images/logo.png')} 
          style={[
            isStar ? styles.starAvatar : styles.avatar, 
            { width: avatarSize, height: avatarSize, borderRadius: avatarBorderRadius }
          ]} 
        />
        {!isStar && points !== undefined && parseInt(points) > 0 && (
          <View style={[styles.pointsBadge, { top: size * 0.1, right: size * 0.1 }]}>
            <Text style={styles.pointsText}>{points}</Text>
          </View>
        )}

      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  puck: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  avatar: {
    borderWidth: 4,
    borderColor: '#fff',
  },
  pointsBadge: {
    position: 'absolute',
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pointsText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Gilroy-Bold',
    fontWeight: 'bold',
  },
  starPuck: {
    backgroundColor: '#FFD700',
    borderWidth: 6,
    borderColor: '#FF8C00',
  },
  starAvatar: {
    borderWidth: 8,
    borderColor: '#FFD700',
  },

});

export default Puck; 