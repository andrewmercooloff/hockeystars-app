import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { supabase } from '../utils/supabase';

interface MuseumItem {
  id: string;
  item_id: string;
  item: {
    id: string;
    name: string;
    image_url: string;
    item_type: 'autograph' | 'stick' | 'puck' | 'jersey';
    created_at: string;
  };
  received_from: {
    id: string;
    name: string;
  };
  received_at: string;
}

interface PlayerMuseumProps {
  playerId: string;
}

const { width } = Dimensions.get('window');

const PlayerMuseum: React.FC<PlayerMuseumProps> = ({ playerId }) => {
  const [museumItems, setMuseumItems] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMuseumItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('player_museum')
        .select(`
          id,
          item_id,
          received_at,
          item:items (
            id,
            name,
            image_url,
            item_type,
            created_at
          ),
          received_from:players!player_museum_received_from_fkey (
            id,
            name
          )
        `)
        .eq('player_id', playerId)
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error loading museum items:', error);
        return;
      }

      console.log('Museum items loaded:', data);
      if (data && data.length > 0) {
        console.log('First item image_url:', data[0].item?.image_url);
        // Проверяем доступность первого изображения
        if (data[0].item?.image_url) {
          await checkImageAvailability(data[0].item.image_url);
        }
      }

      setMuseumItems(data || []);
    } catch (error) {
      console.error('Error loading museum items:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkImageAvailability = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      console.log('Image availability check:', {
        url: imageUrl,
        status: response.status,
        ok: response.ok
      });
      return response.ok;
    } catch (error) {
      console.error('Image availability check error:', error);
      return false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMuseumItems();
    setRefreshing(false);
  };

  useEffect(() => {
    if (playerId) {
      loadMuseumItems();
    }
  }, [playerId]);

  // Проверяем, что playerId передан
  if (!playerId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ошибка: ID игрока не указан</Text>
      </View>
    );
  }

  if (loading) return <Text style={styles.loadingText}>Загрузка...</Text>;
  if (museumItems.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Музей</Text>
      
      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {museumItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {item.item.image_url ? (
              <Image source={{ uri: item.item.image_url }} style={styles.itemImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>?</Text>
              </View>
            )}
            
            <Text style={styles.itemSource}>
              {item.item.name} от {item.received_from.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginBottom: 15,
    textAlign: 'left',
  },
  scrollView: { 
    flex: 1 
  },
  itemCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  itemImage: {
    width: width * 0.3, // 30% от ширины экрана
    height: width * 0.3,
    borderRadius: 12,
    marginBottom: 8,
  },
  placeholderImage: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 48,
    color: '#666',
  },
  itemSource: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#fff',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PlayerMuseum;
