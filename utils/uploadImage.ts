import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

// Функция для проверки bucket avatars
const ensureAvatarsBucket = async () => {
  try {
    // Пытаемся загрузить тестовый файл для проверки доступа к bucket
    const testFileName = `test_access_${Date.now()}.txt`;
    const testContent = 'test';
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (error) {
      console.error('🚨🚨🚨 BUCKET_DEBUG: Ошибка доступа к bucket avatars:', error);
      console.log('🚨🚨🚨 BUCKET_DEBUG: Убедитесь, что bucket avatars существует и доступен');
      return false;
    }
    
    // Удаляем тестовый файл
    await supabase.storage
      .from('avatars')
      .remove([testFileName]);
    
    console.log('🚨🚨🚨 BUCKET_DEBUG: Bucket avatars доступен');
    return true;
  } catch (error) {
    console.error('❌ Ошибка проверки bucket:', error);
    return false;
  }
};

// Функция для загрузки изображения в Supabase Storage
export const uploadImageToStorage = async (imageUri: string, fileName?: string): Promise<string | null> => {
  try {
    console.log('🚨🚨🚨 UPLOAD_DEBUG: Начинаем загрузку изображения в Supabase Storage...');
    
    // Проверяем и создаем bucket если нужно
    const bucketReady = await ensureAvatarsBucket();
    if (!bucketReady) {
      console.error('🚨🚨🚨 UPLOAD_DEBUG: Не удалось подготовить bucket avatars');
      return null;
    }
    
    // Создаем уникальное имя файла
    const timestamp = Date.now();
    const fileExtension = imageUri.split('.').pop() || 'jpg';
    let finalFileName = fileName || `avatar_${timestamp}.${fileExtension}`;
    
    // Очищаем имя файла от лишних слешей
    finalFileName = finalFileName.replace(/^\/+/, '').replace(/\/+$/, '');
    
    console.log('🚨🚨🚨 UPLOAD_DEBUG: Имя файла:', finalFileName);
    
    // Если это локальный файл, сначала сжимаем его
    let processedImageUri = imageUri;
    if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
      console.log('🔄 Обрабатываем локальное изображение...');
      
      try {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        processedImageUri = result.uri;
        console.log('✅ Изображение обработано:', processedImageUri);
      } catch (manipulatorError) {
        console.error('❌ Ошибка обработки изображения:', manipulatorError);
        console.log('⚠️ Используем оригинальный URI');
        processedImageUri = imageUri;
      }
    }
    
    // Конвертируем изображение в blob
    console.log('📤 Конвертируем в blob:', processedImageUri);
    let blob;
    
    if (processedImageUri.startsWith('file://')) {
      // Для локальных файлов используем expo-file-system
      console.log('🚨🚨🚨 UPLOAD_DEBUG: Используем expo-file-system для локального файла');
      try {
        const base64 = await FileSystem.readAsStringAsync(processedImageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('🚨🚨🚨 UPLOAD_DEBUG: Base64 получен, длина:', base64.length);
        
        // Создаем FormData с base64
        const formData = new FormData();
        formData.append('file', {
          uri: processedImageUri,
          type: 'image/jpeg',
          name: finalFileName,
        } as any);
        
        // Используем FormData для загрузки
        console.log('🚨🚨🚨 UPLOAD_DEBUG: FormData создан, используем для загрузки');
        
        // Загружаем напрямую через FormData
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(finalFileName, formData, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (error) {
          console.error('🚨🚨🚨 UPLOAD_DEBUG: Ошибка загрузки через FormData:', error);
          return null;
        }
        
        console.log('🚨🚨🚨 UPLOAD_DEBUG: Файл загружен через FormData:', data.path);
        
        // Получаем публичный URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.path);
        
        const publicUrl = urlData.publicUrl;
        console.log('🚨🚨🚨 UPLOAD_DEBUG: Публичный URL получен:', publicUrl);
        
        // Проверяем, нет ли двойных слешей в URL
        if (publicUrl.includes('avatars//')) {
          console.error('❌ ОБНАРУЖЕН ДВОЙНОЙ СЛЕШ В URL!');
          console.error('URL:', publicUrl);
          return null;
        }
        
        console.log('🚨🚨🚨 UPLOAD_DEBUG: Возвращаем URL:', publicUrl);
        return publicUrl;
        
      } catch (fileSystemError) {
        console.error('🚨🚨🚨 UPLOAD_DEBUG: Ошибка FileSystem:', fileSystemError);
        return null;
      }
    } else {
      // Для других URI используем fetch
      try {
        const response = await fetch(processedImageUri);
        if (!response.ok) {
          console.error('❌ Ошибка fetch:', response.status, response.statusText);
          return null;
        }
        blob = await response.blob();
        console.log('🚨🚨🚨 UPLOAD_DEBUG: Blob создан через fetch, размер:', blob.size, 'байт');
        
        if (blob.size === 0) {
          console.error('🚨🚨🚨 UPLOAD_DEBUG: Blob пустой!');
          return null;
        }
        
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
        
        console.log('✅ Файл загружен в Storage:', data.path);
        
        // Получаем публичный URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(finalFileName);
        
        if (!urlData || !urlData.publicUrl) {
          console.error('❌ Не удалось получить публичный URL');
          return null;
        }
        
        const publicUrl = urlData.publicUrl;
        console.log('🚨🚨🚨 UPLOAD_DEBUG: Изображение загружено:', publicUrl);
        
        // Проверяем, нет ли двойных слешей в URL
        if (publicUrl.includes('avatars//')) {
          console.error('❌ ОБНАРУЖЕН ДВОЙНОЙ СЛЕШ В URL!');
          console.error('URL:', publicUrl);
          return null;
        }
        
        console.log('🚨🚨🚨 UPLOAD_DEBUG: Возвращаем URL:', publicUrl);
        return publicUrl;
        
      } catch (fetchError) {
        console.error('❌ Ошибка fetch:', fetchError);
        return null;
      }
    }
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