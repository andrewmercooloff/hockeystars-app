import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { loadCurrentUser } from '../utils/playerStorage';
import { supabase } from '../utils/supabase';

interface Item {
  id: string;
  item_type: 'autograph' | 'stick' | 'puck' | 'jersey';
  name: string;
  description?: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

interface StarItemManagerProps {
  playerId: string;
  onItemsUpdated?: () => void;
}

export default function StarItemManager({ playerId, onItemsUpdated }: StarItemManagerProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadItems();
  }, [playerId]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', playerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить предметы');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const pickImage = async (itemType: 'autograph' | 'stick' | 'puck' | 'jersey') => {
    try {
      // Проверяем авторизацию перед выбором изображения
      const currentUser = await loadCurrentUser();
      console.log('Auth check before image pick:', { 
        hasUser: !!currentUser, 
        userId: currentUser?.id,
        playerId 
      });
      
      if (!currentUser) {
        Alert.alert('Ошибка авторизации', 'Пожалуйста, войдите в систему');
        return;
      }
      
      // Проверяем, что текущий пользователь совпадает с playerId
      if (currentUser.id !== playerId) {
        Alert.alert('Ошибка прав доступа', 'Нет прав для загрузки предметов за другого пользователя');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('ImagePicker result:', {
          canceled: result.canceled,
          assetsCount: result.assets?.length,
          firstAsset: result.assets[0],
          uri: result.assets[0]?.uri,
          width: result.assets[0]?.width,
          height: result.assets[0]?.height,
          type: result.assets[0]?.type
        });
        
        if (result.assets[0].uri) {
          await uploadItem(result.assets[0].uri, itemType);
        } else {
          Alert.alert('Ошибка', 'Не удалось получить URI изображения');
        }
      } else {
        console.log('ImagePicker canceled or no assets');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const uploadItem = async (imageUri: string, itemType: 'autograph' | 'stick' | 'puck' | 'jersey') => {
    try {
      setLoading(true);

      // Проверяем авторизацию через playerStorage
      const currentUser = await loadCurrentUser();
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }
      
      console.log('Current user ID:', currentUser.id);
      console.log('Player ID:', playerId);
      
      // Проверяем, что текущий пользователь совпадает с playerId
      if (currentUser.id !== playerId) {
        throw new Error('Нет прав для загрузки предметов за другого пользователя');
      }

      // Загружаем изображение в Supabase Storage
      const fileName = `${Date.now()}_${itemType}.jpg`;
      
      console.log('Image URI:', imageUri);
      console.log('URI type:', typeof imageUri);
      
      // Проверяем, что URI не пустой
      if (!imageUri || imageUri.trim() === '') {
        throw new Error('URI изображения пустой');
      }
      
      // Пробуем загрузить файл напрямую
      let uploadData;
      
      if (imageUri.startsWith('file://')) {
        // Для локальных файлов используем FormData (как в аватарах!)
        console.log('Using FormData for local file (like avatars)');
        
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: fileName,
        } as any);
        
        console.log('FormData created, attempting upload...');
        
        const { data, error } = await supabase.storage
          .from('items')
          .upload(fileName, formData, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (error) {
          console.error('FormData upload error:', error);
          throw new Error('Ошибка загрузки через FormData');
        }
        
        uploadData = data;
        console.log('FormData upload successful:', uploadData);
        
      } else {
        // Для других URI используем fetch + blob
        console.log('Using fetch + blob for remote file');
        
        try {
          const response = await fetch(imageUri);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log('Blob created, size:', blob.size, 'bytes, type:', blob.type);
          
          if (blob.size === 0) {
            throw new Error('Изображение пустое (0 байт)');
          }
          
          console.log('Attempting to upload to storage bucket "items"');
          const { data, error: uploadError } = await supabase.storage
            .from('items')
            .upload(fileName, blob, {
              contentType: blob.type || 'image/jpeg',
              cacheControl: '3600'
            });
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Ошибка загрузки изображения');
          }
          
          uploadData = data;
          console.log('File uploaded successfully:', uploadData);
          
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          throw new Error(`Ошибка загрузки изображения: ${fetchError.message}`);
        }
      }

      // Получаем публичный URL используя uploadData
      const { data: urlData } = supabase.storage
        .from('items')
        .getPublicUrl(uploadData.path);
      
      console.log('Public URL generated:', urlData.publicUrl);

             // Создаем запись в базе данных
       const itemData = {
         owner_id: playerId,
         item_type: itemType,
         name: getItemTypeName(itemType), // Добавляем название
         description: `${getItemTypeName(itemType)} от игрока`, // Добавляем описание
         image_url: urlData.publicUrl,
         is_available: true,
       };
       
       console.log('Attempting to insert into items table with:', itemData);
       
       const { error: insertError } = await supabase
         .from('items')
         .insert(itemData);

      // Проверяем, что файл действительно доступен по URL
      console.log('Verifying file accessibility...');
      try {
        const checkResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log('File accessibility check:', {
          url: urlData.publicUrl,
          status: checkResponse.status,
          contentLength: checkResponse.headers.get('content-length'),
          contentType: checkResponse.headers.get('content-type')
        });
        
        if (checkResponse.status !== 200) {
          console.warn('Warning: File may not be accessible yet');
        }
        
        // Дополнительная проверка - попробуем загрузить файл полностью
        console.log('Trying to download file completely...');
        const downloadResponse = await fetch(urlData.publicUrl);
        const downloadBlob = await downloadResponse.blob();
        console.log('Download check:', {
          status: downloadResponse.status,
          blobSize: downloadBlob.size,
          blobType: downloadBlob.type
        });
        
      } catch (checkError) {
        console.warn('Warning: Could not verify file accessibility:', checkError);
      }

      Alert.alert('Успех', `${getItemTypeName(itemType)} успешно загружен!`);
      loadItems();
      onItemsUpdated?.();
    } catch (error) {
      console.error('Error uploading item:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить предмет');
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeName = (type: string) => {
    const names = {
      autograph: 'Автограф',
      stick: 'Клюшка',
      puck: 'Шайба',
      jersey: 'Джерси',
    };
    return names[type as keyof typeof names] || type;
  };

  const toggleItemAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_available: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item =>
        item.id === itemId ? { ...item, is_available: !currentStatus } : item
      ));
      onItemsUpdated?.();
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Ошибка', 'Не удалось изменить статус');
    }
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить этот предмет?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              setItems(items.filter(item => item.id !== itemId));
              onItemsUpdated?.();
              Alert.alert('Успех', 'Предмет удален');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Ошибка', 'Не удалось удалить предмет');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Управление предметами</Text>
      
      {/* Простые кнопки для загрузки */}
      <View style={styles.uploadButtons}>
        <TouchableOpacity
          style={[styles.uploadButton, styles.autographButton]}
          onPress={() => pickImage('autograph')}
          disabled={loading}
        >
          <Ionicons name="create-outline" size={24} color="white" />
          <Text style={styles.uploadButtonText}>Загрузить автограф</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, styles.stickButton]}
          onPress={() => pickImage('stick')}
          disabled={loading}
        >
          <Ionicons name="fitness-outline" size={24} color="white" />
          <Text style={styles.uploadButtonText}>Загрузить клюшку</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, styles.puckButton]}
          onPress={() => pickImage('puck')}
          disabled={loading}
        >
          <Ionicons name="ellipse-outline" size={24} color="white" />
          <Text style={styles.uploadButtonText}>Загрузить шайбу</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, styles.jerseyButton]}
          onPress={() => pickImage('jersey')}
          disabled={loading}
        >
          <Ionicons name="shirt-outline" size={24} color="white" />
          <Text style={styles.uploadButtonText}>Загрузить джерси</Text>
        </TouchableOpacity>
      </View>

      {/* Список загруженных предметов */}
      <Text style={styles.subtitle}>Загруженные предметы</Text>
      
      <ScrollView
        style={styles.itemsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {items.length === 0 ? (
          <Text style={styles.noItems}>Пока нет загруженных предметов</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                             <View style={styles.itemInfo}>
                 <Text style={styles.itemType}>{item.name}</Text>
                 <Text style={styles.itemStatus}>
                   {item.is_available ? 'Доступен' : 'Недоступен'}
                 </Text>
               </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    item.is_available ? styles.availableButton : styles.unavailableButton
                  ]}
                  onPress={() => toggleItemAvailability(item.id, item.is_available)}
                >
                  <Ionicons
                    name={item.is_available ? 'eye-off' : 'eye'}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Ionicons name="trash" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  uploadButtons: {
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  autographButton: {
    backgroundColor: '#FF6B6B',
  },
  stickButton: {
    backgroundColor: '#4ECDC4',
  },
  puckButton: {
    backgroundColor: '#45B7D1',
  },
  jerseyButton: {
    backgroundColor: '#96CEB4',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  itemsList: {
    flex: 1,
  },
  noItems: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  availableButton: {
    backgroundColor: '#4CAF50',
  },
  unavailableButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 6,
  },
});
