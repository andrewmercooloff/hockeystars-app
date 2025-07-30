import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Player, getPlayerById, calculateHockeyExperience } from '../../utils/playerStorage';
import { Colors, Spacing, BorderRadius, Typography, CommonStyles } from '../../constants/Colors';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        if (typeof id === 'string') {
          const playerData = await getPlayerById(id);
          setPlayer(playerData);
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля игрока:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPlayer();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Игрок не найден</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профиль игрока</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          {player.avatar ? (
            <Image source={{ uri: player.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Ionicons name="person" size={48} color={Colors.textSecondary} />
            </View>
          )}
        </View>

        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.status}>{player.status}</Text>

        <View style={styles.infoContainer}>
          {player.team && (
            <View style={styles.infoRow}>
              <Ionicons name="shield" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{player.team}</Text>
            </View>
          )}

          {player.position && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{player.position}</Text>
            </View>
          )}

          {player.country && (
            <View style={styles.infoRow}>
              <Ionicons name="flag" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{player.country}</Text>
            </View>
          )}

          {player.hockeyStartDate && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Опыт: {calculateHockeyExperience(player.hockeyStartDate)}
              </Text>
            </View>
          )}
        </View>

        {player.status === 'player' && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{player.games || '0'}</Text>
              <Text style={styles.statLabel}>Игр</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{player.goals || '0'}</Text>
              <Text style={styles.statLabel}>Голов</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{player.assists || '0'}</Text>
              <Text style={styles.statLabel}>Передач</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{player.points || '0'}</Text>
              <Text style={styles.statLabel}>Очков</Text>
            </View>
          </View>
        )}

        {(player.pullUps || player.pushUps || player.plankTime || player.sprint100m || player.longJump) && (
          <View style={styles.physicalContainer}>
            <Text style={styles.sectionTitle}>Физическая подготовка</Text>
            {player.pullUps && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Подтягивания:</Text>
                <Text style={styles.infoValue}>{player.pullUps}</Text>
              </View>
            )}
            {player.pushUps && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Отжимания:</Text>
                <Text style={styles.infoValue}>{player.pushUps}</Text>
              </View>
            )}
            {player.plankTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Планка:</Text>
                <Text style={styles.infoValue}>{player.plankTime}</Text>
              </View>
            )}
            {player.sprint100m && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Бег 100м:</Text>
                <Text style={styles.infoValue}>{player.sprint100m}</Text>
              </View>
            )}
            {player.longJump && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Прыжок в длину:</Text>
                <Text style={styles.infoValue}>{player.longJump}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    ...Typography.h3,
    color: Colors.text,
  },
  content: {
    padding: Spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderAvatar: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  status: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    textTransform: 'capitalize',
  },
  infoContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  physicalContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: 'bold',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  backButton: {
    padding: Spacing.xs,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
  },
}); 