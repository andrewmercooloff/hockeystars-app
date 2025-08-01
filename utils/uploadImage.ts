import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';

// Функция для загрузки изображения в Supabase Storage
export const uploadImageToStorage = async (imageUri: string, fileName?: string): Promise<string | null> => {
  try {
    console.log('📤 Начинаем загрузку изображения в Supabase Storage...');
    
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
    
    const publicUrl = urlData.publicUrl;
    console.log('✅ Изображение загружено:', publicUrl);
    
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