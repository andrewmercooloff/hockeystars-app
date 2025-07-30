import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { uploadLocalPlayersToFirebase } from '../utils/playerStorage';
import { Colors, Spacing, BorderRadius, Typography, CommonStyles } from '../constants/Colors';
import CustomAlert from '../components/CustomAlert';

export default function SyncScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      await uploadLocalPlayersToFirebase();
      setError(null);
      CustomAlert({
        title: 'Sync Successful',
        message: 'Your local players have been synced to Firebase.',
        onClose: () => router.back(),
      });
    } catch (err) {
      setError(err.message);
      CustomAlert({
        title: 'Sync Failed',
        message: err.message,
        onClose: () => router.back(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <View style={CommonStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={Typography.h1}>Sync Players</Text>
      </View>

      <View style={CommonStyles.content}>
        <Text style={Typography.h2}>Sync Your Local Players</Text>
        <Text style={Typography.body}>
          Click the button below to sync your local players with the Firebase database.
          This will ensure that all your player data is available across devices.
        </Text>

        <TouchableOpacity
          style={[CommonStyles.button, CommonStyles.primaryButton]}
          onPress={handleSync}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={Typography.buttonText}>Sync Players</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={CommonStyles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={Colors.red} />
            <Text style={Typography.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );
} 