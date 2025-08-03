-- Исправление политик доступа к Storage
-- Выполните этот скрипт в SQL Editor в Supabase Dashboard

-- Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Создаем новые политики для публичного доступа к bucket avatars

-- Политика для чтения (публичный доступ)
CREATE POLICY "Public Access to Avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Политика для загрузки (любой аутентифицированный пользователь)
CREATE POLICY "Anyone can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Политика для обновления (любой аутентифицированный пользователь)
CREATE POLICY "Anyone can update avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');

-- Политика для удаления (любой аутентифицированный пользователь)
CREATE POLICY "Anyone can delete avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars');

-- Проверяем bucket
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Проверяем политики
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'; 