import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { loadCurrentUser, Player } from '../utils/playerStorage';

const iceBg = require('../assets/images/led.jpg');

interface ExerciseComplex {
  id: string;
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  description: string;
  exercises: string[];
  author: string;
  authorAvatar?: string;
}

const defaultExercises: ExerciseComplex[] = [
  {
    id: 'explosive_speed',
    name: 'Взрывная скорость',
    category: 'Скорость',
    difficulty: 'intermediate',
    duration: '30-45 мин',
    description: 'Комплекс упражнений для развития взрывной скорости и реакции. Включает плиометрику, спринты и упражнения на координацию.',
    exercises: [
      'Прыжки на месте с максимальной высотой',
      'Берпи с отжиманиями',
      'Спринты на 20-30 метров',
      'Прыжки через препятствия',
      'Быстрые отжимания'
    ],
    author: 'Hockeystars',
    authorAvatar: '🏒'
  },
  {
    id: 'endurance',
    name: 'Выносливость',
    category: 'Кардио',
    difficulty: 'beginner',
    duration: '45-60 мин',
    description: 'Тренировка сердечно-сосудистой системы и общей выносливости. Подходит для всех уровней подготовки.',
    exercises: [
      'Бег на месте',
      'Прыжки со скакалкой',
      'Приседания с собственным весом',
      'Отжимания от пола',
      'Планка'
    ],
    author: 'Hockeystars',
    authorAvatar: '🏒'
  },
  {
    id: 'coordination',
    name: 'Координация',
    category: 'Баланс',
    difficulty: 'beginner',
    duration: '25-35 мин',
    description: 'Упражнения для улучшения координации движений, баланса и контроля тела.',
    exercises: [
      'Стойка на одной ноге',
      'Ходьба по прямой линии',
      'Упражнения на балансировочной доске',
      'Перекрестные движения',
      'Йога-позы для баланса'
    ],
    author: 'Hockeystars',
    authorAvatar: '🏒'
  },
  {
    id: 'warmup',
    name: 'Разминка',
    category: 'Разминка',
    difficulty: 'beginner',
    duration: '15-20 мин',
    description: 'Комплекс упражнений для подготовки мышц и суставов к тренировке. Обязательно выполнять перед любой физической нагрузкой.',
    exercises: [
      'Круговые движения головой',
      'Вращения плечами',
      'Наклоны туловища',
      'Круговые движения коленями',
      'Легкая растяжка'
    ],
    author: 'Hockeystars',
    authorAvatar: '🏒'
  },
  {
    id: 'stretching',
    name: 'Растяжка',
    category: 'Гибкость',
    difficulty: 'beginner',
    duration: '20-30 мин',
    description: 'Упражнения на развитие гибкости и эластичности мышц. Помогает предотвратить травмы и улучшить подвижность.',
    exercises: [
      'Растяжка мышц бедра',
      'Наклоны к ногам',
      'Растяжка спины',
      'Растяжка плеч',
      'Растяжка икроножных мышц'
    ],
    author: 'Hockeystars',
    authorAvatar: '🏒'
  },
  {
    id: 'speed',
    name: 'Скорость',
    category: 'Скорость',
    difficulty: 'intermediate',
    duration: '35-45 мин',
    description: 'Специальные упражнения для развития скорости и быстроты реакции. Фокус на технике выполнения.',
    exercises: [
      'Быстрые приседания',
      'Альпинист',
      'Быстрые отжимания',
      'Прыжки с разведением ног',
      'Быстрая ходьба на месте'
    ],
    author: 'Hockeystars',
    authorAvatar: '🏒'
  },
  {
    id: 'puck_control',
    name: 'Владение шайбой',
    category: 'Техника',
    difficulty: 'advanced',
    duration: '40-50 мин',
    description: 'Упражнения для улучшения контроля над предметами и развития мелкой моторики. Можно использовать теннисный мяч или специальные тренажеры.',
    exercises: [
      'Жонглирование мячом',
      'Упражнения с теннисным мячом',
      'Балансировка на неустойчивых поверхностях',
      'Упражнения на реакцию',
      'Координационные упражнения'
    ],
    author: 'Hockeystars',
    authorAvatar: '🏒'
  }
];

export default function ExercisesScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [exercises, setExercises] = useState<ExerciseComplex[]>(defaultExercises);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => { loadUserData(); }, []);
  useFocusEffect(useCallback(() => { loadUserData(); }, []));

  const loadUserData = async () => {
    try {
      const user = await loadCurrentUser();
      if (user) { setCurrentUser(user); }
    } catch (error) { console.error('Ошибка загрузки пользователя:', error); }
  };

  const handleExercisePress = (exercise: ExerciseComplex) => {
    // Здесь будет переход на страницу с подробным описанием упражнения
    console.log(`Выбрано упражнение: ${exercise.name}`);
    // TODO: Добавить навигацию на страницу упражнения
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Начинающий';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#FF6B6B';
      case 'intermediate': return '#FF8E53';
      case 'advanced': return '#FF4757';
      default: return '#FF6B6B';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Скорость': return 'flash';
      case 'Кардио': return 'heart';
      case 'Баланс': return 'walk';
      case 'Разминка': return 'sunny';
      case 'Гибкость': return 'body';
      case 'Техника': return 'construct';
      default: return 'fitness';
    }
  };

  const filteredExercises = selectedCategory === 'all' ? exercises : exercises.filter(ex => ex.category === selectedCategory);
  const categories = ['all', ...Array.from(new Set(exercises.map(ex => ex.category)))];

  return (
    <View style={styles.container}>
      <ImageBackground source={iceBg} style={styles.background} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Комплексы упражнений</Text>
            <Text style={styles.subtitle}>Выберите комплекс для ознакомления</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesFilter} 
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}>
                  {category === 'all' ? 'Все' : category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseItem}
                onPress={() => handleExercisePress(exercise)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseIcon}>
                    <Ionicons 
                      name={getCategoryIcon(exercise.category) as any} 
                      size={24} 
                      color="#FF4757" 
                    />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                  </View>
                  <View style={styles.exerciseMeta}>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(exercise.difficulty) }
                    ]}>
                      <Text style={styles.difficultyText}>
                        {getDifficultyText(exercise.difficulty)}
                      </Text>
                    </View>
                    <Text style={styles.durationText}>{exercise.duration}</Text>
                  </View>
                </View>
                
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                
                <View style={styles.exerciseFooter}>
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorAvatar}>{exercise.authorAvatar}</Text>
                    <Text style={styles.authorName}>{exercise.author}</Text>
                  </View>
                  <View style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>Подробнее</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  categoriesFilter: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedCategory: {
    backgroundColor: '#FF4757',
    borderColor: '#FF4757',
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exercisesList: {
    flex: 1,
  },
  exerciseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#FF4757',
    fontWeight: '500',
  },
  exerciseMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  exerciseDescription: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
    opacity: 0.9,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    fontSize: 20,
    marginRight: 8,
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  viewButton: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
  },
});
