/**
 * Централизованные цвета и стили для приложения HockeyStars
 * Используется во всех компонентах для единообразия дизайна
 */

// Основные цвета приложения
export const Colors = {
  // Основные цвета
  primary: '#FF4444',        // Красный - основной цвет
  secondary: '#FFD700',      // Золотой - для звезд
  accent: '#FF8C00',         // Оранжевый - акцент
  
  // Фоны
  background: '#000',        // Черный фон
  surface: 'rgba(0, 0, 0, 0.8)', // Полупрозрачный черный
  overlay: 'rgba(0, 0, 0, 0.5)', // Наложение
  
  // Текст
  text: '#fff',              // Белый текст
  textSecondary: '#ccc',     // Вторичный текст
  textMuted: '#888',         // Приглушенный текст
  
  // Границы
  border: 'rgba(255, 255, 255, 0.2)', // Белая граница
  borderPrimary: 'rgba(255, 68, 68, 0.3)', // Красная граница
  borderSecondary: 'rgba(255, 215, 0, 0.3)', // Золотая граница
  
  // Состояния
  success: '#4CAF50',        // Зеленый - успех
  warning: '#FF9800',        // Оранжевый - предупреждение
  error: '#F44336',          // Красный - ошибка
  info: '#2196F3',           // Синий - информация
  
  // Прозрачности
  transparent: 'transparent',
  semiTransparent: 'rgba(255, 255, 255, 0.1)',
  darkTransparent: 'rgba(0, 0, 0, 0.7)',
};

// Размеры и отступы
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Радиусы скругления
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 15,
  xl: 20,
  xxl: 25,
  round: 50,
};

// Тени
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
};

// Типографика
export const Typography = {
  fontFamily: {
    regular: 'Gilroy-Regular',
    bold: 'Gilroy-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Общие стили для компонентов
export const CommonStyles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.small,
  },
  buttonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.semiTransparent,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modal: {
    backgroundColor: Colors.darkTransparent,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    margin: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    ...Shadows.large,
  },
}; 