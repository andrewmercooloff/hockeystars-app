import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../utils/supabase';

interface ItemRequestButtonsProps {
  starId: string;
  playerId: string;
  onRequestSent?: () => void;
}

const ItemRequestButtons: React.FC<ItemRequestButtonsProps> = ({ 
  starId, 
  playerId, 
  onRequestSent 
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'autograph' | 'stick' | 'puck' | 'jersey'>('autograph');
  const [requestMessage, setRequestMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestItem = async () => {
    if (!requestMessage.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, напишите сообщение к запросу');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('item_requests')
        .insert([{
          requester_id: playerId,
          owner_id: starId,
          item_type: selectedItemType,
          message: requestMessage.trim(),
          status: 'pending'
        }]);

      if (error) {
        console.error('Ошибка создания запроса:', error);
        Alert.alert('Ошибка', 'Не удалось отправить запрос');
        return;
      }

      setShowRequestModal(false);
      setRequestMessage('');
      if (onRequestSent) {
        onRequestSent();
      }
      Alert.alert(
        'Запрос отправлен!', 
        `Ваш запрос на ${getItemTypeName(selectedItemType)} отправлен. Ожидайте ответа.`
      );
    } catch (error) {
      console.error('Ошибка создания запроса:', error);
      Alert.alert('Ошибка', 'Не удалось отправить запрос');
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeName = (type: string) => {
    switch (type) {
      case 'autograph': return 'автограф';
      case 'stick': return 'клюшку';
      case 'puck': return 'шайбу';
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

  const openRequestModal = (itemType: 'autograph' | 'stick' | 'puck' | 'jersey') => {
    setSelectedItemType(itemType);
    setShowRequestModal(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Запросить подарок</Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.requestButton} onPress={() => openRequestModal('autograph')}>
          <Ionicons name="create" size={20} color="#ff4444" />
          <Text style={styles.buttonText}>Автограф</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestButton} onPress={() => openRequestModal('stick')}>
          <Ionicons name="fitness" size={20} color="#ff6666" />
          <Text style={styles.buttonText}>Клюшка</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestButton} onPress={() => openRequestModal('puck')}>
          <Ionicons name="radio-button-on" size={20} color="#ff8888" />
          <Text style={styles.buttonText}>Шайба</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestButton} onPress={() => openRequestModal('jersey')}>
          <Ionicons name="shirt" size={20} color="#ffaaaa" />
          <Text style={styles.buttonText}>Джерси</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно запроса */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Запросить {getItemTypeName(selectedItemType)}
            </Text>
            <TouchableOpacity
              onPress={() => setShowRequestModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.itemTypeDisplay}>
                             <Ionicons 
                 name={getItemTypeIcon(selectedItemType) as any} 
                 size={28} 
                 color="#ff4444" 
               />
              <Text style={styles.itemTypeText}>
                {getItemTypeName(selectedItemType).charAt(0).toUpperCase() + 
                 getItemTypeName(selectedItemType).slice(1)}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Сообщение к запросу *</Text>
              <Text style={styles.helperText}>
                                 Напишите вежливое сообщение, объясняющее, почему вы хотите получить этот подарок
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={requestMessage}
                onChangeText={setRequestMessage}
                placeholder="Например: Здравствуйте! Я большой поклонник вашей игры и хотел бы получить автограф для своей коллекции..."
                                 placeholderTextColor="#666"
                multiline
                numberOfLines={6}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {requestMessage.length}/500 символов
              </Text>
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleRequestItem}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Отправка...' : 'Отправить запрос'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                             <Ionicons name="information-circle" size={18} color="#87ceeb" />
              <Text style={styles.infoText}>
                                 После отправки запроса звезда получит уведомление и сможет принять или отклонить ваш запрос. 
                 Если запрос будет принят, подарок появится в вашем Музее подарков.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  requestButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 6,
  },
  modalContent: {
    flex: 1,
    padding: 12,
  },
  itemTypeDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 16,
  },
  itemTypeText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    lineHeight: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#ff4444',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1a3a5a',
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#87ceeb',
    lineHeight: 16,
  },
});

export default ItemRequestButtons;
