import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

// Функция для проверки и создания bucket avatars
const ensureAvatarsBucket = async () => {
  try {
    // Проверяем, существует ли bucket
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Ошибка получения списка buckets:', error);
      return false;
    }
    
    const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucket) {
      console.log('📦 Bucket avatars не найден, создаем...');
      
      const { data, error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Ошибка создания bucket avatars:', createError);
        return false;
      }
      
      console.log('✅ Bucket avatars создан');
    } else {
      console.log('✅ Bucket avatars уже существует');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка проверки bucket:', error);
    return false;
  }
};

// Функция для загрузки изображения в Supabase Storage
export const uploadImageToStorage = async (imageUri: string, fileName?: string): Promise<string | null> => {
  try {
    console.log('📤 Начинаем загрузку изображения в Supabase Storage...');
    
    // Проверяем и создаем bucket если нужно
    const bucketReady = await ensureAvatarsBucket();
    if (!bucketReady) {
      console.error('❌ Не удалось подготовить bucket avatars');
      return null;
    }
    
    // Создаем уникальное имя файла
    const timestamp = Date.now();
    const fileExtension = imageUri.split('.').pop() || 'jpg';
    const finalFileName = fileName || `avatar_${timestamp}.${fileExtension}`;
    
    console.log('📁 Имя файла:', finalFileName);
    
    // Если это локальный файл, сначала сжимаем его
    let processedImageUri = imageUri;
    if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
      console.log('🔄 Обрабатываем локальное изображение...');
      
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      processedImageUri = result.uri;
      console.log('✅ Изображение обработано');
    }
    
    // Конвертируем изображение в blob
    const response = await fetch(processedImageUri);
    const blob = await response.blob();
    
    console.log('📤 Загружаем в Supabase Storage...');
    
    // Загружаем в Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(finalFileName, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Ошибка загрузки в Storage:', error);
      return null;
    }
    
    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(finalFileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('❌ Не удалось получить публичный URL');
      return null;
    }
    
    const publicUrl = urlData.publicUrl;
    console.log('✅ Изображение загружено:', publicUrl);
    
    // Проверяем доступность URL
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn('⚠️ Публичный URL недоступен, код ответа:', testResponse.status);
        // Возвращаем URL все равно, возможно это временная проблема
      }
    } catch (testError) {
      console.warn('⚠️ Не удалось проверить доступность URL:', testError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Ошибка загрузки изображения:', error);
    return null;
  }
};

// Функция для удаления изображения из Storage
export const deleteImageFromStorage = async (imageUrl: string): Promise<boolean> => {
  try {
    if (!imageUrl || !imageUrl.includes('avatars/')) {
      return true; // Не удаляем, если это не наш Storage
    }
    
    // Извлекаем имя файла из URL
    const fileName = imageUrl.split('avatars/').pop()?.split('?')[0];
    if (!fileName) {
      return false;
    }
    
    console.log('🗑️ Удаляем изображение:', fileName);
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);
    
    if (error) {
      console.error('❌ Ошибка удаления изображения:', error);
      return false;
    }
    
    console.log('✅ Изображение удалено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления изображения:', error);
    return false;
  }
};

// Функция для проверки, является ли URL локальным
export const isLocalImage = (imageUrl: string): boolean => {
  return imageUrl.startsWith('file://') || 
         imageUrl.startsWith('content://') || 
         imageUrl.startsWith('data:');
};

// Функция для миграции локальных изображений в Storage
export const migrateLocalImageToStorage = async (imageUrl: string): Promise<string | null> => {
  if (!isLocalImage(imageUrl)) {
    return imageUrl; // Уже в Storage
  }
  
  console.log('🔄 Мигрируем локальное изображение в Storage...');
  return await uploadImageToStorage(imageUrl);
};

// Функция для проверки доступности изображения
export const checkImageAvailability = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.log('❌ Изображение недоступно:', imageUrl, error);
    return false;
  }
};

// Функция для получения рабочего URL изображения с fallback
export const getWorkingImageUrl = async (imageUrl: string, fallbackUrl?: string): Promise<string> => {
  if (!imageUrl) {
    return fallbackUrl || '';
  }
  
  // Если это локальное изображение, возвращаем как есть
  if (isLocalImage(imageUrl)) {
    return imageUrl;
  }
  
  // Проверяем доступность изображения
  const isAvailable = await checkImageAvailability(imageUrl);
  
  if (isAvailable) {
    return imageUrl;
  } else {
    console.log('⚠️ Изображение недоступно, используем fallback:', imageUrl);
    return fallbackUrl || imageUrl; // Возвращаем fallback или оригинальный URL
  }
}; 