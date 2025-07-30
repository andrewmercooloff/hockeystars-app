import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  getPlayerById, 
  loadCurrentUser, 
  Player, 
  Message, 
  sendMessage, 
  getConversation, 
  markMessagesAsRead 
} from '../utils/playerStorage';
import CustomAlert from '../components/CustomAlert';

const iceBg = require('../assets/images/led.jpg'); 