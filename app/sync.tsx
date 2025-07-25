import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Share,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  exportPlayerData, 
  importPlayerData, 
  createSyncQRCode,
  syncFromQRCode,
  forceInitializeStorage 
} from '../utils/playerStorage';
import { Colors, CommonStyles, Typography, Spacing, BorderRadius } from '../constants/Colors';
import CustomAlert from '../components/CustomAlert';

export default function SyncScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: () => {},
    onCancel: () => {},
    onSecondary: () => {},
    showCancel: false,
    showSecondary: false,
    confirmText: 'OK',
    cancelText: 'Отмена',
    secondaryText: 'Дополнительно'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlert(prev => ({ ...prev, visible: false }))),
      onCancel: () => setAlert(prev => ({ ...prev, visible: false })),
      onSecondary: () => setAlert(prev => ({ ...prev, visible: false })),
      showCancel: false,
      showSecondary: false,
      confirmText: 'OK',
      cancelText: 'Отмена',
      secondaryText: 'Дополнительно'
    });
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const data = await exportPlayerData();
      
      if (Platform.OS === 'web') {
        // Для веб-версии создаем файл для скачивания
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hockeystars-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showAlert('Успешно', 'Данные экспортированы в файл', 'success');
      } else {
        // Для мобильных устройств используем Share API
        await Share.share({
          message: `HockeyStars Backup Data:\n\n${data}`,
          title: 'HockeyStars Backup'
        });
        showAlert('Успешно', 'Данные готовы для отправки', 'success');
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      showAlert('Ошибка', 'Не удалось экспортировать данные', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    Alert.prompt(
      'Импорт данных',
      'Вставьте данные для импорта:',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Импорт',
          onPress: async (dataString) => {
            if (!dataString) {
              showAlert('Ошибка', 'Данные не введены', 'error');
              return;
            }
            
            setLoading(true);
            try {
              const success = await importPlayerData(dataString);
              if (success) {
                showAlert('Успешно', 'Данные импортированы', 'success', () => {
                  router.back();
                });
              } else {
                showAlert('Ошибка', 'Не удалось импортировать данные', 'error');
              }
            } catch (error) {
              console.error('Ошибка импорта:', error);
              showAlert('Ошибка', 'Неверный формат данных', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleCreateQRCode = async () => {
    setLoading(true);
    try {
      const qrData = await createSyncQRCode();
      showAlert(
        'QR-код создан', 
        `Скопируйте этот код для синхронизации:\n\n${qrData}`, 
        'info'
      );
    } catch (error) {
      console.error('Ошибка создания QR-кода:', error);
      showAlert('Ошибка', 'Не удалось создать QR-код', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromQR = async () => {
    Alert.prompt(
      'Синхронизация из QR-кода',
      'Введите QR-код для синхронизации:',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Синхронизировать',
          onPress: async (qrData) => {
            if (!qrData) {
              showAlert('Ошибка', 'QR-код не введен', 'error');
              return;
            }
            
            setLoading(true);
            try {
              const success = await syncFromQRCode(qrData);
              if (success) {
                showAlert('Успешно', 'Данные синхронизированы', 'success', () => {
                  router.back();
                });
              } else {
                showAlert('Ошибка', 'Не удалось синхронизировать данные', 'error');
              }
            } catch (error) {
              console.error('Ошибка синхронизации:', error);
              showAlert('Ошибка', 'Неверный QR-код', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleResetData = () => {
    showAlert(
      'Сброс данных',
      'Это действие удалит все данные и восстановит начальные настройки. Продолжить?',
      'warning',
      async () => {
        setLoading(true);
        try {
          await forceInitializeStorage();
          showAlert('Успешно', 'Данные сброшены', 'success', () => {
            router.back();
          });
        } catch (error) {
          console.error('Ошибка сброса:', error);
          showAlert('Ошибка', 'Не удалось сбросить данные', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Синхронизация</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Экспорт данных</Text>
          <Text style={styles.sectionDescription}>
            Сохраните данные с текущего устройства для переноса на другое
          </Text>
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleExportData}
            disabled={loading}
          >
            <Ionicons name="download-outline" size={20} color={Colors.text} />
            <Text style={styles.buttonText}>Экспортировать данные</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Импорт данных</Text>
          <Text style={styles.sectionDescription}>
            Загрузите данные с другого устройства
          </Text>
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleImportData}
            disabled={loading}
          >
            <Ionicons name="upload-outline" size={20} color={Colors.text} />
            <Text style={styles.buttonText}>Импортировать данные</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR-код синхронизации</Text>
          <Text style={styles.sectionDescription}>
            Быстрая синхронизация через QR-код
          </Text>
          
          <View style={styles.qrButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.halfButton, loading && styles.buttonDisabled]} 
              onPress={handleCreateQRCode}
              disabled={loading}
            >
              <Ionicons name="qr-code-outline" size={20} color={Colors.text} />
              <Text style={styles.buttonText}>Создать QR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.halfButton, loading && styles.buttonDisabled]} 
              onPress={handleSyncFromQR}
              disabled={loading}
            >
              <Ionicons name="scan-outline" size={20} color={Colors.text} />
              <Text style={styles.buttonText}>Сканировать</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сброс данных</Text>
          <Text style={styles.sectionDescription}>
            Удалить все данные и восстановить начальные настройки
          </Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton, loading && styles.buttonDisabled]} 
            onPress={handleResetData}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.text} />
            <Text style={styles.buttonText}>Сбросить данные</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert {...alert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
            paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    fontSize: 16,
    fontWeight: 'normal',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  halfButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  qrButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
}); 