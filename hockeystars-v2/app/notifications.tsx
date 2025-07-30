import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadCurrentUser, Player, Message, getReceivedFriendRequests, acceptFriendRequest, declineFriendRequest, deleteNotification, markNotificationAsRead, loadNotifications } from '../utils/playerStorage';
import CustomAlert from '../components/CustomAlert';

const iceBg = require('../assets/images/led.jpg'); 