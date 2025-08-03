const { createClient } = require('@supabase/supabase-js');

// Создаем клиент Supabase
const supabaseUrl = 'https://jvsypfwiajuwsyuzkyda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3lwZndpYWp1d3N5dXpreWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTczNTcsImV4cCI6MjA2OTU3MzM1N30.8d8k7HK7lFgIirdHzackMYRn6gGgD5OyqgOUq2rk2RM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  try {
    console.log('🧪 Тестируем загрузку изображений в Supabase Storage...');
    
    // Проверяем bucket
    console.log('\n📦 Проверяем bucket avatars...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Ошибка получения buckets:', bucketsError);
      return;
    }
    
    console.log('📋 Доступные buckets:', buckets.map(b => b.name));
    
    const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
    if (!avatarsBucket) {
      console.log('📦 Создаем bucket avatars...');
      const { data, error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880
      });
      
      if (createError) {
        console.error('❌ Ошибка создания bucket:', createError);
        return;
      }
      
      console.log('✅ Bucket avatars создан');
    } else {
      console.log('✅ Bucket avatars уже существует');
    }
    
    // Проверяем содержимое bucket
    console.log('\n📋 Проверяем содержимое bucket avatars...');
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list();
    
    if (filesError) {
      console.error('❌ Ошибка получения файлов:', filesError);
      return;
    }
    
    console.log(`📁 Файлов в bucket: ${files.length}`);
    files.forEach(file => {
      console.log(`   - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
    });
    
    // Проверяем данные игроков
    console.log('\n👥 Проверяем данные игроков...');
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name, avatar, photos');
    
    if (playersError) {
      console.error('❌ Ошибка получения игроков:', playersError);
      return;
    }
    
    console.log(`👤 Найдено игроков: ${players.length}`);
    
    let localAvatars = 0;
    let storageAvatars = 0;
    let nullAvatars = 0;
    
    players.forEach(player => {
      if (player.avatar) {
        if (player.avatar.startsWith('file://') || player.avatar.startsWith('content://') || player.avatar.startsWith('data:')) {
          localAvatars++;
          console.log(`⚠️ Локальный аватар: ${player.name} - ${player.avatar}`);
        } else if (player.avatar.startsWith('http')) {
          storageAvatars++;
          console.log(`✅ Storage аватар: ${player.name} - ${player.avatar}`);
        }
      } else {
        nullAvatars++;
        console.log(`❌ Нет аватара: ${player.name}`);
      }
    });
    
    console.log('\n📊 Статистика аватаров:');
    console.log(`   Локальные: ${localAvatars}`);
    console.log(`   В Storage: ${storageAvatars}`);
    console.log(`   Отсутствуют: ${nullAvatars}`);
    
    if (localAvatars > 0) {
      console.log('\n⚠️ Обнаружены локальные аватары, требующие миграции!');
    } else {
      console.log('\n✅ Все аватары находятся в Storage');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

// Запускаем тест
testImageUpload(); 