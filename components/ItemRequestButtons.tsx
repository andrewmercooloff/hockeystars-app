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
      <Text style={styles.title}>Запросить предмет у звезды</Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => openRequestModal('autograph')}
        >
          <Ionicons name="create" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Автограф</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => openRequestModal('stick')}
        >
          <Ionicons name="fitness" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Клюшка</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => openRequestModal('puck')}
        >
          <Ionicons name="radio-button-on" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Шайба</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => openRequestModal('jersey')}
        >
          <Ionicons name="shirt" size={24} color="#007AFF" />
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
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.itemTypeDisplay}>
              <Ionicons 
                name={getItemTypeIcon(selectedItemType) as any} 
                size={32} 
                color="#007AFF" 
              />
              <Text style={styles.itemTypeText}>
                {getItemTypeName(selectedItemType).charAt(0).toUpperCase() + 
                 getItemTypeName(selectedItemType).slice(1)}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Сообщение к запросу *</Text>
              <Text style={styles.helperText}>
                Напишите вежливое сообщение, объясняющее, почему вы хотите получить этот предмет
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={requestMessage}
                onChangeText={setRequestMessage}
                placeholder="Например: Здравствуйте! Я большой поклонник вашей игры и хотел бы получить автограф для своей коллекции..."
                placeholderTextColor="#8E8E93"
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
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                После отправки запроса звезда получит уведомление и сможет принять или отклонить ваш запрос. 
                Если запрос будет принят, предмет появится в вашем Музее.
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  requestButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  itemTypeDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  itemTypeText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#0277BD',
    lineHeight: 20,
  },
});

export default ItemRequestButtons;
