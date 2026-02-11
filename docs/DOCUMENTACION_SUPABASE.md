# 🗂️ Documentación: Integración de Supabase Storage

> **Estado:** 🟢 Implementado
> **Tecnología:** Supabase Storage (S3-compatible) & PostgreSQL RLS
> **Propósito:** Gestión eficiente y escalable de archivos multimedia (imágenes de perfil, evidencias, portadas de proyectos).

---

## 🧐 ¿Por qué usar Supabase Storage?

Hemos decidido separar la gestión de datos estructurados (MongoDB) de la gestión de archivos binarios (Supabase). Aquí explicamos el razonamiento técnico:

### 1. ❌ Limitaciones de MongoDB para Archivos
- **Rendimiento:** MongoDB no está diseñado para servir archivos binarios grandes de manera eficiente. Guardar imágenes en Base64 dentro de los documentos JSON aumenta drásticamente el tamaño de la base de datos y ralentiza las consultas.
- **GridFS:** Aunque MongoDB tiene GridFS para archivos, su implementación es compleja y consume recursos del mismo servidor de base de datos, lo que puede afectar el rendimiento general de la API.

### 2. ✅ Ventajas de Supabase Storage
- **CDN Global:** Supabase utiliza una red de entrega de contenido (CDN) global, lo que significa que las imágenes cargan rapidísimo desde cualquier parte del mundo.
- **Escalabilidad:** Al ser un servicio gestionado (basado en S3), no tenemos que preocuparnos por el espacio en disco de nuestro servidor.
- **Seguridad (RLS):** Podemos usar las políticas de seguridad de PostgreSQL (Row Level Security) para decidir quién puede subir, ver o borrar archivos sin escribir lógica compleja en el backend.
- **Transformaciones:** Permite redimensionar y optimizar imágenes al vuelo (ej. convertir a WebP automáticamente).

---

## 🏗️ Arquitectura de la Solución

### Flujo de Datos
1. **Frontend:** El usuario selecciona una imagen (ej. avatar).
2. **Backend (.NET):** Recibe el archivo vía `multipart/form-data`.
3. **Storage Service:** El backend valida el archivo y lo sube a Supabase.
4. **Respuesta:** Supabase devuelve una **URL Pública** (ej. `https://xyz.supabase.co/storage/v1/object/public/images/avatar-123.jpg`).
5. **MongoDB:** Guardamos **SOLO la URL** en la colección de usuarios.

### Estructura de Buckets
Usaremos un bucket público llamado `images` con la siguiente organización de carpetas sugerida:

```text
/images
  ├── /avatars       (Fotos de perfil de usuarios)
  ├── /projects      (Portadas y evidencias de proyectos)
  └── /temp          (Archivos temporales)
```

---

## 💻 Implementación Técnica

### 1. Configuración (`appsettings.json`)
El backend necesita las credenciales para comunicarse con Supabase:
```json
"Supabase": {
  "Url": "https://TU_PROYECTO.supabase.co",
  "Key": "TU_ANON_KEY_PUBLICA"
}
```

### 2. Servicio: `StorageService.cs`
Se ha creado un servicio dedicado que encapsula la lógica de subida:
- **Interfaz:** `IStorageService`
- **Método:** `UploadFileAsync(IFormFile file, string bucketName)`
- **Validación:** Se asegura de generar nombres únicos usando GUIDs para evitar colisiones.

### 3. Endpoint: `POST /api/Storage/upload`
Un controlador simple para subir archivos desde cualquier cliente.

**Ejemplo de Uso (cURL):**
```bash
curl -X POST "http://localhost:5122/api/Storage/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@mi_imagen.jpg"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "url": "https://xyz.supabase.co/storage/v1/object/public/images/guid-aleatorio.jpg"
}
```

---

## 🔒 Seguridad y Permisos (SQL)

La seguridad se maneja directamente en Supabase mediante políticas SQL.

**Script de Configuración (`BBDD_Supabase.sql`):**
```sql
-- Crear bucket público
insert into storage.buckets (id, name, public) values ('images', 'images', true);

-- Permitir acceso público de lectura
create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );

-- Permitir subidas (Autenticadas en producción)
create policy "Allow Uploads" on storage.objects for insert with check ( bucket_id = 'images' );
```

---

## 🚀 Siguientes Pasos
1. Obtener `URL` y `Key` desde el dashboard de Supabase.
2. Ejecutar el script SQL de configuración en Supabase.
3. Actualizar el Frontend para enviar las imágenes a este nuevo endpoint.
