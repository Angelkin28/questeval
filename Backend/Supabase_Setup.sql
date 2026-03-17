-- ==============================================================================
-- 🗄️ SETUP DE SUPABASE STORAGE (Para guardar imágenes)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (https://supabase.com)

-- 1. Crear Buckets (si no existen)
insert into storage.buckets (id, name, public)
values ('images', 'images', true), ('videos', 'videos', true)
on conflict (id) do nothing;

-- 2. Configurar Políticas de Seguridad (RLS)

-- A) Permitir acceso PÚBLICO para VER (SELECT)
create policy "Public Access"
on storage.objects for select
using ( bucket_id in ('images', 'videos') );

-- B) Permitir acceso para SUBIR (INSERT)
create policy "Allow Uploads"
on storage.objects for insert
with check ( bucket_id in ('images', 'videos') );

-- C) Permitir acceso para ACTUALIZAR (UPDATE)
create policy "Allow Updates"
on storage.objects for update
using ( bucket_id in ('images', 'videos') );

-- D) Permitir acceso para BORRAR (DELETE)
create policy "Allow Deletes"
on storage.objects for delete
using ( bucket_id in ('images', 'videos') );


-- ==============================================================================
-- 📋 INSTRUCCIONES ADICIONALES
-- ==============================================================================
-- 1. Ve a 'Project Settings' -> 'API' en Supabase.
-- 2. Copia la 'URL' y la 'anon public key'.
-- 3. Pégalos en tu archivo backend/appsettings.json:
--    "Supabase": {
--      "Url": "TU_URL_AQUI",
--      "Key": "TU_KEY_AQUI"
--    }
