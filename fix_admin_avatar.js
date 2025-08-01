// Скрипт для исправления аватара администратора
// Запустите: node fix_admin_avatar.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvsypfwiajuwsyuzkyda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c3lwZndpYWp1d3N5dXpreWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTczNTcsImV4cCI6MjA2OTU3MzM1N30.8d8k7HK7lFgIirdHzackMYRn6gGgD5OyqgOUq2rk2RM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminAvatar() {
  try {
    console.log('🔧 Исправляем аватар администратора...\n');
    
    // Ищем администратора
    const { data: admin, error } = await supabase
      .from('players')
      .select('id, name, email, status, avatar')
      .eq('email', 'admin@hockeystars.com')
      .single();
    
    if (error) {
      console.error('❌ Ошибка поиска администратора:', error);
      return;
    }
    
    if (!admin) {
      console.log('❌ Администратор не найден');
      return;
    }
    
    console.log('✅ Администратор найден:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Имя: ${admin.name}`);
    console.log(`   Текущий аватар: ${admin.avatar || 'НЕ УСТАНОВЛЕН'}`);
    
    // Если аватар локальный (file://), удаляем его
    if (admin.avatar && admin.avatar.startsWith('file://')) {
      console.log('\n🗑️ Удаляем локальный аватар...');
      
      const { error: updateError } = await supabase
        .from('players')
        .update({ avatar: null })
        .eq('id', admin.id);
      
      if (updateError) {
        console.error('❌ Ошибка удаления аватара:', updateError);
        return;
      }
      
      console.log('✅ Локальный аватар удален');
      console.log('📝 Теперь администратор может загрузить новый аватар через приложение');
      
    } else if (!admin.avatar) {
      console.log('\n✅ Аватар уже пустой, ничего делать не нужно');
      
    } else {
      console.log('\n✅ Аватар уже корректный (не локальный)');
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

fixAdminAvatar(); 