const { createClient } = require('@supabase/supabase-js');

// Конфигурация Supabase - замените на ваши данные
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPetrData() {
  try {
    console.log('🔍 Исследуем данные Petr Merkulov...');
    
    // Получаем всех игроков
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*');
    
    if (playersError) {
      console.error('❌ Ошибка загрузки игроков:', playersError);
      return;
    }
    
    console.log(`✅ Найдено игроков: ${players.length}`);
    
    // Ищем Petr Merkulov
    const petr = players.find(p => p.name && p.name.toLowerCase().includes('petr'));
    const ivan = players.find(p => p.name && p.name.toLowerCase().includes('иван'));
    
    if (petr) {
      console.log('\n🎯 Petr Merkulov данные:');
      console.log('- ID:', petr.id);
      console.log('- Имя:', petr.name);
      console.log('- Email:', petr.email);
      console.log('- Статус:', petr.status);
      console.log('- Команда:', petr.team);
      console.log('- Позиция:', petr.position);
      console.log('- Голы:', petr.goals);
      console.log('- Передачи:', petr.assists);
      console.log('- Рост:', petr.height);
      console.log('- Вес:', petr.weight);
      console.log('- Страна:', petr.country);
      console.log('- Город:', petr.city);
      console.log('- Телефон:', petr.phone);
      console.log('- Достижения:', petr.achievements);
      console.log('- Дата создания:', petr.created_at);
      console.log('- Дата обновления:', petr.updated_at);
    } else {
      console.log('❌ Petr Merkulov не найден');
    }
    
    if (ivan) {
      console.log('\n🎯 Иван Меркулов данные (для сравнения):');
      console.log('- ID:', ivan.id);
      console.log('- Имя:', ivan.name);
      console.log('- Email:', ivan.email);
      console.log('- Статус:', ivan.status);
      console.log('- Команда:', ivan.team);
      console.log('- Позиция:', ivan.position);
      console.log('- Голы:', ivan.goals);
      console.log('- Передачи:', ivan.assists);
      console.log('- Рост:', ivan.height);
      console.log('- Вес:', ivan.weight);
      console.log('- Страна:', ivan.country);
      console.log('- Город:', ivan.city);
      console.log('- Телефон:', ivan.phone);
      console.log('- Достижения:', ivan.achievements);
      console.log('- Дата создания:', ivan.created_at);
      console.log('- Дата обновления:', ivan.updated_at);
    }
    
    // Проверяем на потенциальные проблемы
    console.log('\n🔍 Проверка на проблемы:');
    
    if (petr) {
      console.log('Petr Merkulov:');
      console.log('- ID null/undefined:', !petr.id);
      console.log('- Имя null/undefined:', !petr.name);
      console.log('- Email null/undefined:', !petr.email);
      console.log('- Статус null/undefined:', !petr.status);
      console.log('- Команда null/undefined:', !petr.team);
      console.log('- Позиция null/undefined:', !petr.position);
      console.log('- Голы null/undefined:', petr.goals === null || petr.goals === undefined);
      console.log('- Передачи null/undefined:', petr.assists === null || petr.assists === undefined);
    }
    
    if (ivan) {
      console.log('Иван Меркулов:');
      console.log('- ID null/undefined:', !ivan.id);
      console.log('- Имя null/undefined:', !ivan.name);
      console.log('- Email null/undefined:', !ivan.email);
      console.log('- Статус null/undefined:', !ivan.status);
      console.log('- Команда null/undefined:', !ivan.team);
      console.log('- Позиция null/undefined:', !ivan.position);
      console.log('- Голы null/undefined:', ivan.goals === null || ivan.goals === undefined);
      console.log('- Передачи null/undefined:', ivan.assists === null || ivan.assists === undefined);
    }
    
  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
  }
}

debugPetrData(); 