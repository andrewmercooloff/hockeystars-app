import React from 'react';
import {
    StyleSheet,
    View
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Team } from '../utils/playerStorage';
import DraggableTeamItem from './DraggableTeamItem';

interface TeamSelectorProps {
  selectedTeams: Team[];
  onTeamsChange: (teams: Team[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const TeamSelector = React.memo(({ selectedTeams, onTeamsChange, placeholder = "Выберите команды", readOnly = false }: TeamSelectorProps) => {

  // Удаление команды
  const removeTeam = (teamId: string) => {
    console.log('🗑️ removeTeam вызвана с teamId:', teamId);
    const newTeams = selectedTeams.filter(t => t.id !== teamId);
    console.log('Новый список команд после удаления:', newTeams);
    onTeamsChange(newTeams);
  };

  // Обработка изменения порядка команд
  const handleDragEnd = ({ data }: { data: Team[] }) => {
    console.log('🔄 Порядок команд изменен:', data);
    onTeamsChange(data);
  };

  // Рендер элемента команды
  const renderItem = ({ item, drag, isActive }: RenderItemParams<Team>) => {
    return (
      <DraggableTeamItem
        team={item}
        onRemove={readOnly ? undefined : removeTeam}
        drag={readOnly ? undefined : drag}
        isActive={isActive}
        readOnly={readOnly}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Выбранные команды с drag-and-drop */}
      <View style={styles.selectedTeamsContainer}>
        <DraggableFlatList
          data={selectedTeams}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onDragEnd={readOnly ? undefined : handleDragEnd}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    </View>
  );
});

export default TeamSelector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    zIndex: 999999,
    elevation: 100,
  },
  selectedTeamsContainer: {
    marginBottom: 15,
  },
  flatListContent: {
    paddingBottom: 10,
  },
}); 