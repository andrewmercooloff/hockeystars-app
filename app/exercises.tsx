import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { loadCurrentUser } from '../utils/playerStorage';

const { width } = Dimensions.get('window');

// Типы для упражнений
interface Exercise {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'Начинающий' | 'Средний' | 'Продвинутый';
  image?: string;
}

// Данные упражнений
const exercisesData: Exercise[] = [
  // Выносливость
  {
    id: '1',
    title: 'Интервальный бег',
    description: 'Чередование быстрого бега (30 сек) и медленного (30 сек) в течение 20 минут. Отлично развивает кардио-выносливость для хоккея.',
    category: 'Выносливость',
    duration: '20-30 мин',
    difficulty: 'Средний',
  },
  {
    id: '2',
    title: 'Берпи с прыжком',
    description: 'Комплексное упражнение: присед → планка → отжимание → присед → прыжок. Выполнять 3 подхода по 10-15 повторений.',
    category: 'Выносливость',
    duration: '15-20 мин',
    difficulty: 'Продвинутый',
  },
  {
    id: '3',
    title: 'Велосипед',
    description: 'Интенсивная езда на велосипеде или велотренажере с интервалами высокой нагрузки. 5 минут разминки, 20 минут интервалов.',
    category: 'Выносливость',
    duration: '25-30 мин',
    difficulty: 'Средний',
  },

  // Взрывная скорость
  {
    id: '4',
    title: 'Плиометрические прыжки',
    description: 'Прыжки на месте с максимальной высотой, приземление на полусогнутые ноги. 3 подхода по 15-20 прыжков.',
    category: 'Взрывная скорость',
    duration: '10-15 мин',
    difficulty: 'Средний',
  },
  {
    id: '5',
    title: 'Спринты на короткие дистанции',
    description: 'Бег на максимальной скорости на дистанции 20-30 метров с отдыхом 30 секунд между забегами. 8-10 забегов.',
    category: 'Взрывная скорость',
    duration: '15-20 мин',
    difficulty: 'Начинающий',
  },
  {
    id: '6',
    title: 'Броски мяча в стену',
    description: 'Броски медицинского мяча в стену с максимальной силой, ловля и повторный бросок. 3 подхода по 20 бросков.',
    category: 'Взрывная скорость',
    duration: '15 мин',
    difficulty: 'Средний',
  },

  // Разминка
  {
    id: '7',
    title: 'Динамическая растяжка ног',
    description: 'Махи ногами вперед, назад и в стороны, круговые движения в тазобедренных суставах. 10-15 повторений каждой ногой.',
    category: 'Разминка',
    duration: '10 мин',
    difficulty: 'Начинающий',
  },
  {
    id: '8',
    title: 'Разминка верхней части тела',
    description: 'Круговые движения руками, наклоны туловища, повороты. Разогрев плечевых суставов и спины.',
    category: 'Разминка',
    duration: '8-10 мин',
    difficulty: 'Начинающий',
  },
  {
    id: '9',
    title: 'Легкий бег на месте',
    description: 'Бег на месте с высоким подниманием коленей, постепенное увеличение темпа. 5-7 минут.',
    category: 'Разминка',
    duration: '5-7 мин',
    difficulty: 'Начинающий',
  },

  // Растяжка
  {
    id: '10',
    title: 'Статическая растяжка мышц ног',
    description: 'Удержание позиций растяжки для квадрицепсов, икроножных мышц и приводящих мышц. 30 секунд на каждую группу.',
    category: 'Растяжка',
    duration: '15 мин',
    difficulty: 'Начинающий',
  },
  {
    id: '11',
    title: 'Растяжка спины и плеч',
    description: 'Наклоны вперед, растяжка грудных мышц, растяжка трицепсов. Удержание каждой позиции 20-30 секунд.',
    category: 'Растяжка',
    duration: '12-15 мин',
    difficulty: 'Начинающий',
  },
  {
    id: '12',
    title: 'Йога для хоккеистов',
    description: 'Комплекс асан для развития гибкости и баланса: поза воина, поза дерева, поза собаки мордой вниз.',
    category: 'Растяжка',
    duration: '20 мин',
    difficulty: 'Средний',
  },

  // Ловкость
  {
    id: '13',
    title: 'Лестница координации',
    description: 'Быстрые движения ногами через лестницу: боковые шаги, скрестные шаги, прыжки. 3 прохода каждого типа.',
    category: 'Ловкость',
    duration: '15 мин',
    difficulty: 'Средний',
  },
  {
    id: '14',
    title: 'Жонглирование мячами',
    description: 'Жонглирование 2-3 теннисными мячами для развития координации рук и глаз. Начинать с 1 мяча.',
    category: 'Ловкость',
    duration: '10-15 мин',
    difficulty: 'Средний',
  },
  {
    id: '15',
    title: 'Быстрые касания конусов',
    description: 'Расставить 5-6 конусов и быстро касаться их рукой в случайном порядке. 3 подхода по 30 секунд.',
    category: 'Ловкость',
    duration: '12 мин',
    difficulty: 'Продвинутый',
  },
];

const categories = ['Выносливость', 'Взрывная скорость', 'Разминка', 'Растяжка', 'Ловкость'];

export default function ExercisesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await loadCurrentUser();
        if (user) {
          setCurrentUser(user);
        } else {
          // Убираем дублирующееся сообщение об ошибке - пользователь и так попадает на вход
          router.replace('/login');
          return;
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        router.replace('/login');
        return;
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Дополнительная проверка при фокусе на экран
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const verifyAuthOnFocus = async () => {
        try {
          const user = await loadCurrentUser();
          if (!user) {
            if (isActive) {
              setCurrentUser(null);
              router.replace('/login');
            }
            return;
          }
          if (isActive) {
            setCurrentUser(user);
          }
        } catch (e) {
          if (isActive) {
            setCurrentUser(null);
            router.replace('/login');
          }
        }
      };
      verifyAuthOnFocus();
      return () => { isActive = false; };
    }, [router])
  );

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../assets/images/led.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.pageHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Упражнения</Text>
            </View>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Проверка авторизации...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // Если пользователь не авторизован, не показываем контент
  if (!currentUser) {
    return null;
  }

  const filteredExercises = selectedCategory
    ? exercisesData.filter(exercise => exercise.category === selectedCategory)
    : exercisesData;

  const handleExercisePress = (exercise: Exercise) => {
    // Переходим на страницу с подробным описанием упражнения
    router.push({
      pathname: '/exercise-details',
      params: { exerciseId: exercise.id }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Начинающий': return '#4CAF50';
      case 'Средний': return '#FF9800';
      case 'Продвинутый': return '#F44336';
      default: return '#888';
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/led.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Заголовок страницы */}
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Упражнения</Text>
          </View>
          
          {/* Фильтры по категориям */}
          <View style={styles.categoriesContainer}>
            <View style={styles.categoriesContent}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Список упражнений */}
          <ScrollView style={styles.exercisesContainer}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseCard}
                onPress={() => handleExercisePress(exercise)}
              >
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(exercise.difficulty) }
                  ]}>
                    <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
                  </View>
                </View>
                
                <Text style={styles.exerciseDescription} numberOfLines={2}>
                  {exercise.description}
                </Text>
                
                <View style={styles.exerciseFooter}>
                  <View style={styles.exerciseInfo}>
                    <Ionicons name="time-outline" size={16} color="#888" />
                    <Text style={styles.exerciseInfoText}>{exercise.duration}</Text>
                  </View>
                  
                  <View style={styles.exerciseInfo}>
                    <Ionicons name="fitness-outline" size={16} color="#888" />
                    <Text style={styles.exerciseInfoText}>{exercise.category}</Text>
                  </View>
                </View>
                
                {/* Убираем красную стрелочку */}
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
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    marginBottom: 4,
  },
  pageHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    flex: 1,
  },
  categoriesContainer: {
    marginTop: 20, // Добавляем отступ сверху от заголовка
    marginBottom: 15, // Увеличиваем отступ снизу для лучшего разделения
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingBottom: 8, // Увеличиваем отступ снизу
    flexDirection: 'row', // Горизонтальное расположение
    flexWrap: 'wrap', // Перенос на новую строку если не помещается
    gap: 8, // Добавляем отступы между кнопками
  },
  categoryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Полупрозрачный черный фон
    paddingHorizontal: 16, // Увеличиваем горизонтальные отступы
    paddingVertical: 6, // Увеличиваем вертикальный отступ еще больше
    height: 36, // Увеличиваем высоту для размещения больших отступов
    borderRadius: 8, // Увеличиваем радиус скругления
    marginRight: 0, // Убираем marginRight так как используем gap
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Более заметная граница
    justifyContent: 'center', // Центрируем текст по вертикали
    alignItems: 'center', // Центрируем текст по горизонтали
  },
  categoryButtonActive: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  categoryText: {
    color: '#fff',
    fontSize: 18, // Увеличиваем размер шрифта
    fontFamily: 'Gilroy-Regular',
  },
  categoryTextActive: {
    color: '#fff',
    fontFamily: 'Gilroy-Bold',
  },
  exercisesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Полупрозрачный черный фон для лучшей читаемости
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Gilroy-Bold',
  },
  exerciseDescription: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInfoText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
  },
  // Убираем неиспользуемые стили для стрелочки
});
