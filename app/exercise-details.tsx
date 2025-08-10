import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Расширенные данные упражнений с подробной информацией
const exerciseDetailsData = {
  '1': {
    title: 'Интервальный бег',
    category: 'Выносливость',
    duration: '20-30 мин',
    difficulty: 'Средний',
    description: 'Чередование быстрого бега (30 сек) и медленного (30 сек) в течение 20 минут. Отлично развивает кардио-выносливость для хоккея.',
    benefits: [
      'Улучшает сердечно-сосудистую выносливость',
      'Развивает способность к быстрому восстановлению',
      'Повышает общую физическую подготовку',
      'Имитирует нагрузки хоккейного матча'
    ],
    instructions: [
      'Начните с 5-минутной разминки легким бегом',
      'Выполните 30 секунд быстрого бега (80-90% от максимальной скорости)',
      'Перейдите на 30 секунд медленного бега для восстановления',
      'Повторите цикл 20-25 раз',
      'Завершите 5-минутной заминкой'
    ],
    tips: [
      'Следите за дыханием - дышите глубоко и ритмично',
      'Не превышайте 90% от максимальной скорости',
      'При усталости можно увеличить время восстановления',
      'Выполняйте 2-3 раза в неделю'
    ],
    equipment: 'Беговая дорожка или стадион',
    calories: '250-350 ккал за тренировку'
  },
  '2': {
    title: 'Берпи с прыжком',
    category: 'Выносливость',
    duration: '15-20 мин',
    difficulty: 'Продвинутый',
    description: 'Комплексное упражнение: присед → планка → отжимание → присед → прыжок. Выполнять 3 подхода по 10-15 повторений.',
    benefits: [
      'Развивает общую выносливость',
      'Укрепляет мышцы всего тела',
      'Улучшает координацию движений',
      'Повышает взрывную силу'
    ],
    instructions: [
      'Встаньте прямо, ноги на ширине плеч',
      'Присядьте, поставив ладони на пол перед собой',
      'Оттолкнитесь ногами назад, принимая положение планки',
      'Выполните одно отжимание',
      'Подтяните ноги обратно к рукам, оставаясь в приседе',
      'Выпрыгните вверх, поднимая руки над головой',
      'Приземлитесь мягко и повторите'
    ],
    tips: [
      'Держите спину прямой на всех этапах',
      'Приземляйтесь на полусогнутые ноги',
      'Начинайте с 5-8 повторений и постепенно увеличивайте',
      'Отдыхайте 60-90 секунд между подходами'
    ],
    equipment: 'Коврик для упражнений (опционально)',
    calories: '200-300 ккал за тренировку'
  },
  '3': {
    title: 'Велосипед',
    category: 'Выносливость',
    duration: '25-30 мин',
    difficulty: 'Средний',
    description: 'Интенсивная езда на велосипеде или велотренажере с интервалами высокой нагрузки. 5 минут разминки, 20 минут интервалов.',
    benefits: [
      'Развивает кардио-выносливость',
      'Укрепляет мышцы ног',
      'Сжигает много калорий',
      'Низкая нагрузка на суставы'
    ],
    instructions: [
      '5 минут разминки на низкой интенсивности',
      '2 минуты высокой интенсивности (80-85% от максимума)',
      '1 минута восстановления на низкой интенсивности',
      'Повторите интервалы 10 раз',
      '5 минут заминки на низкой интенсивности'
    ],
    tips: [
      'Поддерживайте высокий темп педалирования (80-100 об/мин)',
      'Следите за положением тела - спина прямая',
      'Регулируйте сопротивление для изменения интенсивности',
      'Пейте воду во время тренировки'
    ],
    equipment: 'Велосипед или велотренажер',
    calories: '300-400 ккал за тренировку'
  },
  '4': {
    title: 'Плиометрические прыжки',
    category: 'Взрывная скорость',
    duration: '10-15 мин',
    difficulty: 'Средний',
    description: 'Прыжки на месте с максимальной высотой, приземление на полусогнутые ноги. 3 подхода по 15-20 прыжков.',
    benefits: [
      'Развивает взрывную силу ног',
      'Улучшает реакцию и скорость',
      'Укрепляет сухожилия и связки',
      'Повышает вертикальный прыжок'
    ],
    instructions: [
      'Встаньте прямо, ноги на ширине плеч',
      'Присядьте на 1/4, согнув колени',
      'Взрывно выпрыгните вверх, вытягивая руки',
      'Приземлитесь на полусогнутые ноги',
      'Сразу же выполняйте следующий прыжок',
      'Выполните 15-20 прыжков подряд'
    ],
    tips: [
      'Приземляйтесь мягко, сгибая колени',
      'Держите корпус прямо',
      'Не делайте паузы между прыжками',
      'Отдыхайте 2-3 минуты между подходами'
    ],
    equipment: 'Коврик для упражнений (опционально)',
    calories: '150-200 ккал за тренировку'
  },
  '5': {
    title: 'Спринты на короткие дистанции',
    category: 'Взрывная скорость',
    duration: '15-20 мин',
    difficulty: 'Начинающий',
    description: 'Бег на максимальной скорости на дистанции 20-30 метров с отдыхом 30 секунд между забегами. 8-10 забегов.',
    benefits: [
      'Развивает максимальную скорость',
      'Улучшает ускорение',
      'Укрепляет мышцы ног',
      'Повышает координацию движений'
    ],
    instructions: [
      'Разметьте дистанцию 20-30 метров',
      'Примите положение старта (полуприсед)',
      'По сигналу бегите на максимальной скорости',
      'Пересеките финишную линию',
      'Медленно вернитесь к старту',
      'Отдохните 30 секунд и повторите'
    ],
    tips: [
      'Фокусируйтесь на технике бега',
      'Держите корпус прямо',
      'Работайте руками активно',
      'Не сокращайте время отдыха'
    ],
    equipment: 'Открытое пространство или беговая дорожка',
    calories: '200-250 ккал за тренировку'
  },
  '6': {
    title: 'Броски мяча в стену',
    category: 'Взрывная скорость',
    duration: '15 мин',
    difficulty: 'Средний',
    description: 'Броски медицинского мяча в стену с максимальной силой, ловля и повторный бросок. 3 подхода по 20 бросков.',
    benefits: [
      'Развивает взрывную силу рук',
      'Улучшает координацию',
      'Укрепляет мышцы кора',
      'Повышает скорость броска'
    ],
    instructions: [
      'Встаньте в 1-2 метрах от стены',
      'Держите мяч двумя руками на уровне груди',
      'Присядьте, сгибая колени',
      'Взрывно выпрямите ноги и руки, бросая мяч',
      'Поймайте отскочивший мяч',
      'Сразу же выполняйте следующий бросок'
    ],
    tips: [
      'Используйте мяч весом 2-4 кг',
      'Бросайте с максимальной силой',
      'Держите спину прямой',
      'Работайте всем телом, а не только руками'
    ],
    equipment: 'Медицинский мяч 2-4 кг, стена',
    calories: '120-180 ккал за тренировку'
  },
  '7': {
    title: 'Динамическая растяжка ног',
    category: 'Разминка',
    duration: '10 мин',
    difficulty: 'Начинающий',
    description: 'Махи ногами вперед, назад и в стороны, круговые движения в тазобедренных суставах. 10-15 повторений каждой ногой.',
    benefits: [
      'Разогревает мышцы ног',
      'Улучшает подвижность суставов',
      'Подготавливает к тренировке',
      'Снижает риск травм'
    ],
    instructions: [
      'Встаньте прямо, держась за опору',
      'Выполните 10-15 махов вперед правой ногой',
      'Выполните 10-15 махов назад правой ногой',
      'Выполните 10-15 махов в сторону правой ногой',
      'Повторите для левой ноги',
      'Выполните круговые движения в тазобедренных суставах'
    ],
    tips: [
      'Держите спину прямо',
      'Не раскачивайтесь слишком сильно',
      'Выполняйте движения плавно',
      'Дышите глубоко и ритмично'
    ],
    equipment: 'Стена или стул для опоры',
    calories: '50-80 ккал за разминку'
  },
  '8': {
    title: 'Разминка верхней части тела',
    category: 'Разминка',
    duration: '8-10 мин',
    difficulty: 'Начинающий',
    description: 'Круговые движения руками, наклоны туловища, повороты. Разогрев плечевых суставов и спины.',
    benefits: [
      'Разогревает мышцы верхней части тела',
      'Улучшает подвижность плечевых суставов',
      'Подготавливает руки к работе',
      'Активирует мышцы кора'
    ],
    instructions: [
      'Встаньте прямо, ноги на ширине плеч',
      'Выполните 10 круговых движений руками вперед',
      'Выполните 10 круговых движений руками назад',
      'Выполните 10 наклонов туловища в стороны',
      'Выполните 10 поворотов туловища',
      'Выполните круговые движения плечами'
    ],
    tips: [
      'Двигайтесь медленно и плавно',
      'Не делайте резких движений',
      'Следите за дыханием',
      'Постепенно увеличивайте амплитуду движений'
    ],
    equipment: 'Не требуется',
    calories: '40-60 ккал за разминку'
  },
  '9': {
    title: 'Легкий бег на месте',
    category: 'Разминка',
    duration: '5-7 мин',
    difficulty: 'Начинающий',
    description: 'Бег на месте с высоким подниманием коленей, постепенное увеличение темпа. 5-7 минут.',
    benefits: [
      'Повышает частоту сердечных сокращений',
      'Разогревает мышцы ног',
      'Улучшает координацию',
      'Подготавливает к основной тренировке'
    ],
    instructions: [
      'Встаньте прямо, ноги на ширине плеч',
      'Начните с легкого бега на месте',
      'Постепенно поднимайте колени выше',
      'Работайте руками, как при обычном беге',
      'Увеличивайте темп в течение 2-3 минут',
      'Замедляйтесь в последние 2 минуты'
    ],
    tips: [
      'Держите спину прямо',
      'Приземляйтесь на носки',
      'Дышите глубоко',
      'Не делайте слишком высокие прыжки'
    ],
    equipment: 'Не требуется',
    calories: '60-80 ккал за разминку'
  },
  '10': {
    title: 'Статическая растяжка мышц ног',
    category: 'Растяжка',
    duration: '15 мин',
    difficulty: 'Начинающий',
    description: 'Удержание позиций растяжки для квадрицепсов, икроножных мышц и приводящих мышц. 30 секунд на каждую группу.',
    benefits: [
      'Улучшает гибкость мышц ног',
      'Снижает мышечное напряжение',
      'Ускоряет восстановление',
      'Предотвращает травмы'
    ],
    instructions: [
      'Растяжка квадрицепсов: встаньте на одну ногу, согните другую назад',
      'Растяжка икр: сделайте выпад вперед, держа заднюю ногу прямой',
      'Растяжка приводящих мышц: сядьте, разведите ноги в стороны',
      'Удерживайте каждую позицию 30 секунд',
      'Дышите глубоко и расслабляйте мышцы'
    ],
    tips: [
      'Не растягивайтесь до боли',
      'Дышите глубоко и медленно',
      'Расслабляйте мышцы во время растяжки',
      'Выполняйте после тренировки'
    ],
    equipment: 'Коврик для упражнений',
    calories: '80-100 ккал за растяжку'
  },
  '11': {
    title: 'Растяжка спины и плеч',
    category: 'Растяжка',
    duration: '12-15 мин',
    difficulty: 'Начинающий',
    description: 'Наклоны вперед, растяжка грудных мышц, растяжка трицепсов. Удержание каждой позиции 20-30 секунд.',
    benefits: [
      'Улучшает осанку',
      'Снимает напряжение в спине',
      'Увеличивает подвижность плеч',
      'Расслабляет мышцы после тренировки'
    ],
    instructions: [
      'Наклоны вперед: наклонитесь, пытаясь коснуться пальцев ног',
      'Растяжка грудных мышц: отведите руки назад, соединив ладони',
      'Растяжка трицепсов: поднимите руку за голову, согнув в локте',
      'Удерживайте каждую позицию 20-30 секунд',
      'Дышите глубоко и расслабляйтесь'
    ],
    tips: [
      'Не делайте резких движений',
      'Растягивайтесь до легкого дискомфорта',
      'Дышите глубоко и медленно',
      'Выполняйте плавно и контролированно'
    ],
    equipment: 'Коврик для упражнений',
    calories: '70-90 ккал за растяжку'
  },
  '12': {
    title: 'Йога для хоккеистов',
    category: 'Растяжка',
    duration: '20 мин',
    difficulty: 'Средний',
    description: 'Комплекс асан для развития гибкости и баланса: поза воина, поза дерева, поза собаки мордой вниз.',
    benefits: [
      'Улучшает гибкость и баланс',
      'Укрепляет мышцы кора',
      'Снимает стресс и напряжение',
      'Повышает концентрацию'
    ],
    instructions: [
      'Поза воина: сделайте выпад, подняв руки вверх',
      'Поза дерева: встаньте на одну ногу, подняв другую к бедру',
      'Поза собаки мордой вниз: наклонитесь, образуя треугольник',
      'Удерживайте каждую позу 30-60 секунд',
      'Переходите между позами плавно'
    ],
    tips: [
      'Дышите глубоко и медленно',
      'Не перенапрягайтесь',
      'Следите за техникой выполнения',
      'Выполняйте регулярно для лучших результатов'
    ],
    equipment: 'Коврик для йоги',
    calories: '150-200 ккал за тренировку'
  },
  '13': {
    title: 'Лестница координации',
    category: 'Ловкость',
    duration: '15 мин',
    difficulty: 'Средний',
    description: 'Быстрые движения ногами через лестницу: боковые шаги, скрестные шаги, прыжки. 3 прохода каждого типа.',
    benefits: [
      'Улучшает координацию движений',
      'Развивает быстроту ног',
      'Повышает ловкость',
      'Укрепляет мышцы-стабилизаторы'
    ],
    instructions: [
      'Разложите лестницу на ровной поверхности',
      'Боковые шаги: двигайтесь боком через каждую ячейку',
      'Скрестные шаги: перекрещивайте ноги при движении',
      'Прыжки: прыгайте через каждую ячейку на двух ногах',
      'Выполните 3 прохода каждого типа',
      'Отдыхайте 30 секунд между типами'
    ],
    tips: [
      'Держите корпус прямо',
      'Смотрите вперед, а не вниз',
      'Начинайте медленно, постепенно ускоряясь',
      'Фокусируйтесь на технике, а не на скорости'
    ],
    equipment: 'Лестница координации',
    calories: '180-250 ккал за тренировку'
  },
  '14': {
    title: 'Жонглирование мячами',
    category: 'Ловкость',
    duration: '10-15 мин',
    difficulty: 'Средний',
    description: 'Жонглирование 2-3 теннисными мячами для развития координации рук и глаз. Начинать с 1 мяча.',
    benefits: [
      'Улучшает координацию рук и глаз',
      'Развивает ловкость рук',
      'Повышает концентрацию внимания',
      'Улучшает реакцию'
    ],
    instructions: [
      'Начните с одного мяча: подбрасывайте и ловите одной рукой',
      'Переходите к двум мячам: подбрасывайте поочередно',
      'Попробуйте три мяча: классическое жонглирование',
      'Практикуйтесь по 5-10 минут каждый день',
      'Начинайте с простых движений'
    ],
    tips: [
      'Начинайте медленно и постепенно ускоряйтесь',
      'Фокусируйтесь на мячах, а не на руках',
      'Практикуйтесь регулярно',
      'Не расстраивайтесь, если не получается сразу'
    ],
    equipment: '2-3 теннисных мяча',
    calories: '100-150 ккал за тренировку'
  },
  '15': {
    title: 'Быстрые касания конусов',
    category: 'Ловкость',
    duration: '12 мин',
    difficulty: 'Продвинутый',
    description: 'Расставить 5-6 конусов и быстро касаться их рукой в случайном порядке. 3 подхода по 30 секунд.',
    benefits: [
      'Развивает реакцию и скорость',
      'Улучшает координацию движений',
      'Повышает ловкость',
      'Укрепляет мышцы-стабилизаторы'
    ],
    instructions: [
      'Расставьте 5-6 конусов в случайном порядке',
      'Встаньте в центре между конусами',
      'По сигналу быстро касайтесь конусов в указанном порядке',
      'Выполните 3 подхода по 30 секунд',
      'Отдыхайте 60 секунд между подходами'
    ],
    tips: [
      'Фокусируйтесь на скорости и точности',
      'Держите корпус прямо',
      'Работайте ногами активно',
      'Постепенно увеличивайте количество конусов'
    ],
    equipment: '5-6 конусов или маркеров',
    calories: '120-180 ккал за тренировку'
  }
};

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams();
  const exercise = exerciseDetailsData[exerciseId as keyof typeof exerciseDetailsData];

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Упражнение не найдено</Text>
      </View>
    );
  }

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
          {/* Заголовок с кнопкой назад */}
          <View style={styles.pageHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/exercises')}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>{exercise.title}</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Основная информация */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="fitness-outline" size={20} color="#FF4444" />
                  <Text style={styles.infoLabel}>Категория</Text>
                  <Text style={styles.infoValue}>{exercise.category}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={20} color="#FF4444" />
                  <Text style={styles.infoLabel}>Длительность</Text>
                  <Text style={styles.infoValue}>{exercise.duration}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="trending-up-outline" size={20} color="#FF4444" />
                  <Text style={styles.infoLabel}>Сложность</Text>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(exercise.difficulty) }
                  ]}>
                    <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Описание */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Описание</Text>
              <Text style={styles.description}>{exercise.description}</Text>
            </View>

            {/* Польза */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Польза упражнения</Text>
              {exercise.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Инструкции */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Пошаговые инструкции</Text>
              {exercise.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>

            {/* Советы */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Полезные советы</Text>
              {exercise.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={20} color="#FFD700" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Оборудование и калории */}
            <View style={styles.bottomInfo}>
              <View style={styles.bottomInfoItem}>
                <Ionicons name="construct-outline" size={20} color="#FF4444" />
                <Text style={styles.bottomInfoLabel}>Оборудование</Text>
                <Text style={styles.bottomInfoValue}>{exercise.equipment}</Text>
              </View>
              
              <View style={styles.bottomInfoItem}>
                <Ionicons name="flame-outline" size={20} color="#FF4444" />
                <Text style={styles.bottomInfoLabel}>Калории</Text>
                <Text style={styles.bottomInfoValue}>{exercise.calories}</Text>
              </View>
            </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Gilroy-Bold',
  },
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    marginBottom: 15,
  },
  description: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    lineHeight: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    flex: 1,
    lineHeight: 22,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  bottomInfo: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  bottomInfoItem: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  bottomInfoLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    marginTop: 8,
    marginBottom: 4,
  },
  bottomInfoValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
