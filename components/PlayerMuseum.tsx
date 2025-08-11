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

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'autograph':
        return 'Автограф';
      case 'stick':
        return 'Клюшка';
      case 'puck':
        return 'Шайба';
      case 'jersey':
        return 'Джерси';
      default:
        return type;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'autograph':
        return '#FFD700';
      case 'stick':
        return '#8B4513';
      case 'puck':
        return '#000000';
      case 'jersey':
        return '#FF4500';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка музея...</Text>
      </View>
    );
  }

  if (museumItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Музей пуст</Text>
        <Text style={styles.emptySubtext}>
          Здесь будут отображаться предметы, полученные от хоккейных звезд
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Музей</Text>
      <Text style={styles.subtitle}>
        Коллекция предметов от хоккейных звезд
      </Text>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemsGrid}>
          {museumItems.map((item) => {
          console.log('Rendering museum item:', {
            id: item.id,
            itemId: item.item_id,
            itemName: item.item?.name,
            imageUrl: item.item?.image_url,
            itemType: item.item?.item_type
          });
          
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImageContainer}>
                                 {item.item.image_url ? (
                   <Image
                     source={{ 
                       uri: item.item.image_url,
                       headers: {
                         'Accept': 'image/*',
                       },
                       cache: 'force-cache'
                     }}
                     style={styles.itemImage}
                     resizeMode="contain"
                     onError={(error) => console.error('Image load error for URL:', item.item.image_url, error)}
                     onLoad={() => console.log('Image loaded successfully:', item.item.image_url)}
                   />
                 ) : (
                  <View style={[styles.itemImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>
                      {getItemTypeLabel(item.item.item_type)[0]}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.itemTypeBadge,
                    { backgroundColor: getItemTypeColor(item.item.item_type) }
                  ]}
                >
                  <Text style={styles.itemTypeText}>
                    {getItemTypeLabel(item.item.item_type)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.item.name}
                </Text>
                <Text style={styles.itemSource}>
                  От: {item.received_from.name}
                </Text>
                <Text style={styles.itemDate}>
                  Получен: {new Date(item.received_at).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            </View>
          );
        })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (width - 80) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.22,
    elevation: 3,
  },
  itemImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  itemTypeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 60,
  },
  itemTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  itemInfo: {
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 16,
  },
  itemSource: {
    fontSize: 10,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 3,
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PlayerMuseum;
