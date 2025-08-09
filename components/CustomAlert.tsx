import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ImageBackground,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const iceBg = require('../assets/images/led.jpg');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
  onSecondary?: () => void;
  confirmText?: string;
  cancelText?: string;
  secondaryText?: string;
  showCancel?: boolean;
  showSecondary?: boolean;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  onSecondary,
  confirmText = 'OK',
  cancelText = 'Отмена',
  secondaryText = 'Дополнительно',
  showCancel = false,
  showSecondary = false
}: CustomAlertProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#4CAF50' };
      case 'error':
        return { name: 'close-circle', color: '#FF4444' };
      case 'warning':
        return { name: 'warning', color: '#FF9800' };
      case 'info':
      default:
        return { name: 'information-circle', color: '#2196F3' };
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(76, 175, 80, 0.1)';
      case 'error':
        return 'rgba(255, 68, 68, 0.1)';
      case 'warning':
        return 'rgba(255, 152, 0, 0.1)';
      case 'info':
      default:
        return 'rgba(33, 150, 243, 0.1)';
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
          <View style={styles.modalContainer}>
            {/* Иконка */}
            <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor() }]}>
              <Ionicons name={icon.name as any} size={40} color={icon.color} />
            </View>

            {/* Заголовок */}
            <Text style={styles.title}>{title}</Text>

            {/* Сообщение */}
            <Text style={styles.message}>{message}</Text>

            {/* Кнопки */}
            <View style={styles.buttonContainer}>
              {showCancel && (
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              
              {showSecondary && onSecondary && (
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={onSecondary}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>{secondaryText}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton, { backgroundColor: icon.color }]} 
                onPress={onConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  background: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 25,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#ccc',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  confirmButton: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
  },
  secondaryButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
  },
}); 