# Configuración de Base de Datos - Supabase

## 📍 Ubicación de la Cadena de Conexión

La cadena de conexión a Supabase se encuentra en el archivo:

```
src/infrastructure/database/supabase.config.ts
```

## 🔗 Detalles de Conexión

- **URL de Supabase**: `https://dpsjpzcsvwakanehzojl.supabase.co`
- **Tipo de Base de Datos**: PostgreSQL (alojado en Supabase)
- **Ubicación en la Nube**: Supabase Cloud

## 📤 Cómo Usar la Configuración

Para utilizar la configuración de Supabase en cualquier módulo de la aplicación, importa la configuración de la siguiente manera:

```typescript
import { supabaseConfig } from 'src/infrastructure/database/supabase.config';
```

Luego puedes acceder a la URL:

```typescript
const dbUrl = supabaseConfig.url;
```

## ⚠️ Seguridad

- Esta configuración contiene la URL de conexión a la base de datos.
- El repositorio debe mantenerse como **privado** para proteger estas credenciales.
- No compartir públicamente en repositorios abiertos (GitHub, GitLab, etc.).

## 📌 Notas

- La base de datos está alojada completamente en la nube de Supabase.
- No se requiere configuración local de PostgreSQL.
- La aplicación se conecta directamente a través de la URL proporcionada.
