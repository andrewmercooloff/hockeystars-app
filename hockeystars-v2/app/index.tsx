import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Puck from '../components/Puck';
import { Player, initializeStorage, loadCurrentUser, loadPlayers } from '../utils/playerStorage';
import api from '../utils/api';

const { width, height } = Dimensions.get('window'); 