import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { findPlayerByCredentials, saveCurrentUser } from '../utils/playerStorage';
import CustomAlert from '../components/CustomAlert';

const iceBg = require('../assets/images/led.jpg'); 