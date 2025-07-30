import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadCurrentUser, Player, Message, getUserConversations, getPlayerById } from '../utils/playerStorage';
import CustomAlert from '../components/CustomAlert';

const iceBg = require('../assets/images/led.jpg'); 