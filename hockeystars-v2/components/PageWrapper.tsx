import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import BottomNavigation from './BottomNavigation';
import Header from './Header';

const iceBg = require('../assets/images/led.jpg');

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showProfile?: boolean;
}

export default function PageWrapper({
  children,
  title,
  showBack = false,
  onBackPress,
  showHeader = true,
  showBottomNav = true,
  showProfile = true
}: PageWrapperProps) {
  return (
    <ImageBackground source={iceBg} style={styles.container} resizeMode="cover">
      {showHeader && (
        <Header
          title={title}
          showBack={showBack}
          onBackPress={onBackPress}
          showProfile={showProfile}
        />
      )}
      
      <View style={[
        styles.content,
        showHeader && styles.contentWithHeader,
        showBottomNav && styles.contentWithBottomNav
      ]}>
        {children}
      </View>

      {showBottomNav && <BottomNavigation />}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentWithHeader: {
    paddingTop: 0, // Header уже занимает место
  },
  contentWithBottomNav: {
    paddingBottom: 0, // Bottom navigation уже занимает место
  },
}); 