-- ==============================================================================
-- 🗄️ SETUP DE SUPABASE STORAGE (Para guardar imágenes)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (https://supabase.com)

-- 1. Crear un Bucket llamado 'images' (si no existe)
--    Este bucket será público para que cualquiera pueda ver las imágenes subidas.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Configurar Políticas de Seguridad (RLS) para el Bucket 'images'

-- A) Permitir acceso PÚBLICO para VER (SELECT) imágenes
--    Cualquier persona con el link puede ver la imagen.
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- B) Permitir acceso para SUBIR (INSERT) imágenes
--    Aquí permitimos que cualquiera suba imágenes (útil para desarrollo/pruebas).
--    ⚠️ En producción, deberías restringir esto a usuarios autenticados (auth.uid() = owner).
create policy "Allow Uploads"
on storage.objects for insert
with check ( bucket_id = 'images' );

-- C) Permitir acceso para ACTUALIZAR (UPDATE) imágenes
create policy "Allow Updates"
on storage.objects for update
using ( bucket_id = 'images' );

-- D) Permitir acceso para BORRAR (DELETE) imágenes
create policy "Allow Deletes"
on storage.objects for delete
using ( bucket_id = 'images' );


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
