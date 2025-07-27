import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { uploadLocalPlayersToFirebase } from '../utils/playerStorage';
import { Colors, Spacing, BorderRadius, Typography, CommonStyles } from '../constants/Colors';
import CustomAlert from '../components/CustomAlert';

export default function SyncScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const handleUpload = async () => {
    setLoading(true);
    showAlert('Выгрузка...', 'Начинаем выгрузку игроков в облачную базу данных...');
    const result = await uploadLocalPlayersToFirebase();
    showAlert(result.success ? 'Успех!' : 'Ошибка', result.message, result.success ? 'success' : 'error');
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Синхронизация с облаком</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} style={{ alignSelf: 'center' }} />
          <Text style={styles.sectionTitle}>Единоразовая выгрузка</Text>
          <Text style={styles.sectionDescription}>
            Эта кнопка перенесет всех игроков, созданных на вашем телефоне, в общую облачную базу данных. После этого они станут доступны на всех ваших устройствах.
            Эту операцию нужно выполнить только один раз.
          </Text>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleUpload}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Выгрузка...' : 'Выгрузить игроков в облако'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert 
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => setAlert({ ...alert, visible: false })}
      />
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...(Typography.h3 as object),
    color: Colors.text,
  },
  backButton: {},
  content: {
    padding: Spacing.md,
  },
  card: {
    ...(CommonStyles.card as object),
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...(Typography.h2 as object),
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    ...(Typography.body as object),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  button: {
    ...(CommonStyles.button as object),
    backgroundColor: Colors.success,
  },
  buttonText: {
    ...(CommonStyles.buttonText as object),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
}); 