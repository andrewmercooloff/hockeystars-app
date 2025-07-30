import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { loadCurrentUser, Player, getUnreadMessageCount, initializeStorage } from '../utils/playerStorage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router'; 