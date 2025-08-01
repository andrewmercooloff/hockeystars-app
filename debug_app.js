// Отладочный скрипт для проверки работы приложения
// Запустите: node debug_app.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvsypfwiajuwsyuzkyda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3lwZndpYWp1d3N5dXpreWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTczNTcsImV4cCI6MjA2OTU3MzM1N30.8d8k7HK7lFgIirdHzackMYRn6gGgD5OyqgOUq2rk2RM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugApp() {
  try {
    console.log('🔍 Отладка приложения...\n');
    
    // 1. Проверяем всех игроков
    console.log('1️⃣ Проверяем всех игроков в базе данных...');
    const { data: allPlayers, error: allError } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Ошибка загрузки игроков:', allError);
      return;
    }
    
    console.log(`✅ Найдено игроков: ${allPlayers.length}`);
    
    allPlayers.forEach((player, index) => {
      console.log(`\n👤 Игрок ${index + 1}: ${player.name}`);
      console.log(`   ID: ${player.id}`);
      console.log(`   Аватар: ${player.avatar || 'не установлен'}`);
      console.log(`   Номер: ${player.number || 'не установлен'}`);
      console.log(`   Любимые голы: ${player.favorite_goals || 'не установлены'}`);
      console.log(`   Фотографии: ${player.photos || 'не установлены'}`);
      console.log(`   Рост: ${player.height || 'не установлен'}`);
      console.log(`   Вес: ${player.weight || 'не установлен'}`);
    });
    
    // 2. Проверяем игрока с обновленными данными
    console.log('\n2️⃣ Проверяем игрока с обновленными данными...');
    const updatedPlayer = allPlayers.find(p => p.number === '99');
    
    if (updatedPlayer) {
      console.log('✅ Найден игрок с номером 99:');
      console.log(`   Имя: ${updatedPlayer.name}`);
      console.log(`   Аватар: ${updatedPlayer.avatar}`);
      console.log(`   Номер: ${updatedPlayer.number}`);
      console.log(`   Любимые голы: ${updatedPlayer.favorite_goals}`);
      console.log(`   Фотографии: ${updatedPlayer.photos}`);
      
      // 3. Проверяем, что аватар доступен
      if (updatedPlayer.avatar) {
        console.log('\n3️⃣ Проверяем доступность аватара...');
        console.log(`   URI аватара: ${updatedPlayer.avatar}`);
        
        // Проверяем тип URI
        if (updatedPlayer.avatar.startsWith('file://')) {
          console.log('⚠️ Аватар использует локальный путь (file://)');
          console.log('   Это может быть проблемой для отображения на главном экране');
        } else if (updatedPlayer.avatar.startsWith('http')) {
          console.log('✅ Аватар использует HTTP URL - это хорошо');
        } else if (updatedPlayer.avatar.startsWith('data:')) {
          console.log('✅ Аватар использует data URL - это хорошо');
        } else {
          console.log('❓ Неизвестный тип URI аватара');
        }
      }
    } else {
      console.log('❌ Игрок с номером 99 не найден');
    }
    
    // 4. Проверяем проблемы с отображением
    console.log('\n4️⃣ Анализ проблем с отображением...');
    
    const playersWithIssues = allPlayers.filter(player => {
      const hasAvatar = player.avatar && player.avatar.trim() !== '';
      const hasNumber = player.number && player.number.trim() !== '';
      const hasPhotos = player.photos && player.photos !== '[]';
      const hasFavoriteGoals = player.favorite_goals && player.favorite_goals.trim() !== '';
      
      return !hasAvatar || !hasNumber || !hasPhotos || !hasFavoriteGoals;
    });
    
    if (playersWithIssues.length > 0) {
      console.log(`⚠️ Найдено игроков с проблемами: ${playersWithIssues.length}`);
      playersWithIssues.forEach((player, index) => {
        console.log(`\n   Игрок ${index + 1}: ${player.name}`);
        console.log(`     Аватар: ${player.avatar ? '✅' : '❌'}`);
        console.log(`     Номер: ${player.number ? '✅' : '❌'}`);
        console.log(`     Фотографии: ${player.photos && player.photos !== '[]' ? '✅' : '❌'}`);
        console.log(`     Любимые голы: ${player.favorite_goals ? '✅' : '❌'}`);
      });
    } else {
      console.log('✅ Все игроки имеют полные данные');
    }
    
    // 5. Рекомендации
    console.log('\n5️⃣ Рекомендации:');
    console.log('   - Убедитесь, что приложение перезапущено после обновления кода');
    console.log('   - Проверьте консоль приложения на наличие ошибок');
    console.log('   - Попробуйте очистить кэш приложения');
    console.log('   - Проверьте, что данные сохраняются в профиле');
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

debugApp(); 