import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlayerTeam } from '../utils/playerStorage';

interface TeamsDisplayProps {
  teams: PlayerTeam[];
  onTeamPress?: (team: PlayerTeam) => void;
  compact?: boolean;
}

export default function TeamsDisplay({ teams, onTeamPress, compact = false }: TeamsDisplayProps) {
  if (!teams || teams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={24} color="#666" />
        <Text style={styles.emptyText}>Команды не указаны</Text>
      </View>
    );
  }

  // Группируем команды по типу
  const groupedTeams = teams.reduce((acc, team) => {
    const type = team.teamType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(team);
    return acc;
  }, {} as Record<string, PlayerTeam[]>);

  const getTeamTypeLabel = (type: string) => {
    switch (type) {
      case 'club': return 'Клубы';
      case 'national': return 'Сборные';
      case 'regional': return 'Региональные';
      case 'school': return 'Школы';
      default: return type;
    }
  };

  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'club': return 'shirt-outline';
      case 'national': return 'flag-outline';
      case 'regional': return 'location-outline';
      case 'school': return 'school-outline';
      default: return 'people-outline';
    }
  };

  if (compact) {
    // Компактный режим - показываем только основные команды
    const primaryTeams = teams.filter(team => team.isPrimary);
    const otherTeams = teams.filter(team => !team.isPrimary);
    
    return (
      <View style={styles.compactContainer}>
        {/* Основные команды */}
        {primaryTeams.map((team) => (
          <View key={team.teamId} style={styles.compactPrimaryTeam}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.compactPrimaryTeamName}>{team.teamName}</Text>
          </View>
        ))}
        
        {/* Остальные команды */}
        {otherTeams.length > 0 && (
          <View style={styles.compactOtherTeams}>
            <Text style={styles.compactOtherTeamsText}>
              +{otherTeams.length} еще
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Object.entries(groupedTeams).map(([type, typeTeams]) => (
        <View key={type} style={styles.typeGroup}>
          <View style={styles.typeHeader}>
            <Ionicons name={getTeamTypeIcon(type)} size={20} color="#FF4444" />
            <Text style={styles.typeLabel}>{getTeamTypeLabel(type)}</Text>
          </View>
          
          <View style={styles.teamsList}>
            {typeTeams.map((team) => (
              <TouchableOpacity
                key={team.teamId}
                style={[
                  styles.teamItem,
                  team.isPrimary && styles.primaryTeamItem
                ]}
                onPress={() => onTeamPress?.(team)}
                disabled={!onTeamPress}
              >
                <View style={styles.teamInfo}>
                  <View style={styles.teamHeader}>
                    <Text style={[
                      styles.teamName,
                      team.isPrimary && styles.primaryTeamName
                    ]}>
                      {team.teamName}
                    </Text>
                    {team.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.primaryBadgeText}>Основная</Text>
                      </View>
                    )}
                  </View>
                  
                  {team.teamCity && (
                    <Text style={styles.teamCity}>{team.teamCity}</Text>
                  )}
                  
                  {team.joinedDate && (
                    <Text style={styles.teamDate}>
                      С {new Date(team.joinedDate).getFullYear()}
                    </Text>
                  )}
                </View>
                
                {onTeamPress && (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    marginTop: 8,
  },
  typeGroup: {
    marginBottom: 20,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginLeft: 8,
  },
  teamsList: {
    gap: 8,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryTeamItem: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  teamInfo: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
  },
  primaryTeamName: {
    color: '#FF4444',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontFamily: 'Gilroy-Bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  teamCity: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    marginBottom: 2,
  },
  teamDate: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#888',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactPrimaryTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.4)',
  },
  compactPrimaryTeamName: {
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    color: '#FF4444',
    marginLeft: 4,
  },
  compactOtherTeams: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compactOtherTeamsText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
  },
}); 