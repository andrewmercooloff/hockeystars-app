import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadCurrentUser, updatePlayer, saveCurrentUser, Player, getFriends, getReceivedFriendRequests, acceptFriendRequest, declineFriendRequest, calculateHockeyExperience, forceInitializeStorage } from '../utils/playerStorage';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../components/CustomAlert'; 