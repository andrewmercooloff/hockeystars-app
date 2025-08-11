import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../utils/supabase';

interface ItemRequest {
  id: string;
  requester_id: string;
  owner_id: string;
  item_type: 'autograph' | 'stick' | 'puck' | 'jersey';
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester?: {
    name: string;
  };
}

interface ItemRequestsManagerProps {
  starId: string;
  onRequestUpdated?: () => void;
}

const ItemRequestsManager: React.FC<ItemRequestsManagerProps> = ({ starId, onRequestUpdated }) => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [starId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('item_requests')
        .select(`
          *,
          requester:players!item_requests_requester_id_fkey(
            name
          )
        `)
        .eq('owner_id', starId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки запросов:', error);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
    if (onRequestUpdated) {
      onRequestUpdated();
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterId: string, itemType: string) => {
    try {
      // Проверяем, есть ли у звезды доступный предмет данного типа
      const { data: availableItems, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', starId)
        .eq('item_type', itemType)
        .eq('is_available', true)
        .limit(1);

      if (itemsError) {
        console.error('Ошибка проверки доступности предмета:', itemsError);
        Alert.alert('Ошибка', 'Не удалось проверить доступность предмета');
        return;
      }

      if (!availableItems || availableItems.length === 0) {
        Alert.alert(
          'Предмет недоступен', 
          `У вас нет доступных ${getItemTypeName(itemType)} для отправки. Сначала добавьте предмет в свой инвентарь.`
        );
        return;
      }

      const selectedItem = availableItems[0];

      // Обновляем статус запроса
      const { error: updateError } = await supabase
        .from('item_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Ошибка обновления статуса запроса:', updateError);
        Alert.alert('Ошибка', 'Не удалось принять запрос');
        return;
      }

      // Делаем предмет недоступным
      const { error: itemUpdateError } = await supabase
        .from('items')
        .update({ is_available: false })
        .eq('id', selectedItem.id);

      if (itemUpdateError) {
        console.error('Ошибка обновления статуса предмета:', itemUpdateError);
      }

      // Добавляем предмет в музей игрока
      const { error: museumError } = await supabase
        .from('player_museum')
        .insert([{
          player_id: requesterId,
          item_id: selectedItem.id,
          received_from: starId,
          received_at: new Date().toISOString()
        }]);

      if (museumError) {
        console.error('Ошибка добавления в музей:', museumError);
        Alert.alert('Предупреждение', 'Запрос принят, но не удалось добавить предмет в музей игрока');
        return;
      }

      // Обновляем список запросов
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' } : req
      ));

      if (onRequestUpdated) {
        onRequestUpdated();
      }
      Alert.alert(
        'Запрос принят!', 
        `Предмет ${getItemTypeName(itemType)} отправлен игроку и добавлен в его музей.`
      );
    } catch (error) {
      console.error('Ошибка принятия запроса:', error);
      Alert.alert('Ошибка', 'Не удалось принять запрос');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Отклонить запрос',
      'Вы уверены, что хотите отклонить этот запрос?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('item_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

              if (error) {
                console.error('Ошибка отклонения запроса:', error);
                Alert.alert('Ошибка', 'Не удалось отклонить запрос');
                return;
              }

              setRequests(prev => prev.map(req => 
                req.id === requestId ? { ...req, status: 'rejected' } : req
              ));

              if (onRequestUpdated) {
                onRequestUpdated();
              }
              Alert.alert('Запрос отклонен', 'Игрок получит уведомление об отклонении запроса');
            } catch (error) {
              console.error('Ошибка отклонения запроса:', error);
              Alert.alert('Ошибка', 'Не удалось отклонить запрос');
            }
          }
        }
      ]
    );
  };

  const getItemTypeName = (type: string) => {
    switch (type) {
      case 'autograph': return 'автографов';
      case 'stick': return 'клюшек';
      case 'puck': return 'шайб';
      case 'jersey': return 'джерси';
      default: return type;
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'autograph': return 'create';
      case 'stick': return 'fitness';
      case 'puck': return 'radio-button-on';
      case 'jersey': return 'shirt';
      default: return 'cube';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'accepted': return '#34C759';
      case 'rejected': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает ответа';
      case 'accepted': return 'Принят';
      case 'rejected': return 'Отклонен';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const otherRequests = requests.filter(req => req.status !== 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Запросы на предметы</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.requestsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Ожидающие запросы */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ожидают ответа ({pendingRequests.length})</Text>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requesterInfo}>
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#8E8E93" />
                    </View>
                    <View style={styles.requesterDetails}>
                      <Text style={styles.requesterName}>
                        {request.requester?.name || 'Неизвестный игрок'}
                      </Text>
                      <Text style={styles.requestDate}>
                        {formatDate(request.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemTypeContainer}>
                    <Ionicons 
                      name={getItemTypeIcon(request.item_type) as any} 
                      size={20} 
                      color="#007AFF" 
                    />
                    <Text style={styles.itemType}>
                      {getItemTypeName(request.item_type).replace(/[а-я]+$/, '')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.requestMessage}>{request.message}</Text>

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptRequest(
                      request.id, 
                      request.requester_id, 
                      request.item_type
                    )}
                  >
                    <Ionicons name="checkmark" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Принять</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectRequest(request.id)}
                  >
                    <Ionicons name="close" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Отклонить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Обработанные запросы */}
        {otherRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Обработанные запросы</Text>
            {otherRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requesterInfo}>
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#8E8E93" />
                    </View>
                    <View style={styles.requesterDetails}>
                      <Text style={styles.requesterName}>
                        {request.requester?.name || 'Неизвестный игрок'}
                      </Text>
                      <Text style={styles.requestDate}>
                        {formatDate(request.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(request.status) }
                    ]} />
                    <Text style={[
                      styles.statusText, 
                      { color: getStatusColor(request.status) }
                    ]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemTypeContainer}>
                  <Ionicons 
                    name={getItemTypeIcon(request.item_type) as any} 
                    size={16} 
                    color="#8E8E93" 
                  />
                  <Text style={styles.itemTypeSmall}>
                    {getItemTypeName(request.item_type).replace(/[а-я]+$/, '')}
                  </Text>
                </View>

                <Text style={styles.requestMessage}>{request.message}</Text>
              </View>
            ))}
          </View>
        )}

        {requests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>У вас пока нет запросов</Text>
            <Text style={styles.emptyStateSubtext}>
              Когда игроки будут запрашивать у вас предметы, они появятся здесь
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  refreshButton: {
    padding: 8,
  },
  requestsList: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemType: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  itemTypeSmall: {
    marginLeft: 6,
    fontSize: 11,
    color: '#8E8E93',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestMessage: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 16,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ItemRequestsManager;
