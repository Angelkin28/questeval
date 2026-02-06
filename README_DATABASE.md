# 📊 Documentación de la Base de Datos - QuestEval

## Descripción General

QuestEval utiliza **Supabase** (PostgreSQL) como base de datos para gestionar un sistema de evaluación de proyectos. La estructura está diseñada para:

- 👥 Gestionar usuarios, roles y permisos
- 👨‍🎓 Organizar grupos/clases de estudiantes
- 📋 Registrar proyectos a evaluar
- ⭐ Almacenar evaluaciones basadas en rúbricas de criterios
- 💬 Guardar retroalimentación y comentarios

## 📍 Ubicación de Archivos

- **Configuración de conexión**: [infrastructure/database/supabase.config.ts](infrastructure/database/supabase.config.ts)
- **Script de creación de esquema**: [infrastructure/database/schema.sql](infrastructure/database/schema.sql)

## 🗂️ Estructura de Tablas

### 1. **roles**
Control de acceso y permisos en el sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | Identificador único |
| `nombre` | VARCHAR(50) | Nombre del rol (Administrador, Profesor, Alumno) |
| `descripcion` | TEXT | Descripción del rol |

**Roles disponibles por defecto:**
- ✅ Administrador - Control total del sistema
- ✅ Profesor - Crear grupos y evaluar proyectos
- ✅ Alumno - Unirse a grupos y enviar proyectos

---

### 2. **usuarios**
Información de usuarios del sistema, vinculada con `auth.users` de Supabase.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK, FK) | ID de auth.users (sincronización automática) |
| `nombre_completo` | VARCHAR(100) | Nombre del usuario |
| `email` | VARCHAR(100) | Correo electrónico |
| `rol_id` | BIGINT (FK) | Referencia a tabla `roles` |
| `avatar_url` | TEXT | URL de la foto de perfil |
| `creado_en` | TIMESTAMP | Fecha de creación (UTC) |
| `actualizado_en` | TIMESTAMP | Fecha de última actualización |

**Funcionalidad especial:** Se crea automáticamente cuando un usuario se registra (trigger `on_auth_user_created`).

---

### 3. **grupos**
Clases o equipos donde se organizan los estudiantes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | Identificador único |
| `nombre` | VARCHAR(50) | Nombre del grupo (Ej: "4A Desarrollo") |
| `codigo_acceso` | VARCHAR(20) | Código único para que alumnos se unan |
| `creado_en` | TIMESTAMP | Fecha de creación |

---

### 4. **miembros_grupo**
Tabla intermedia (M-a-N) que vincula usuarios y grupos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | Identificador único |
| `usuario_id` | UUID (FK) | Referencia a `usuarios` |
| `grupo_id` | BIGINT (FK) | Referencia a `grupos` |
| `fecha_union` | TIMESTAMP | Cuándo se unió al grupo |

**Restricción:** Un usuario no puede unirse dos veces al mismo grupo (UNIQUE).

---

### 5. **proyectos**
Proyectos que van a ser evaluados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `nombre` | VARCHAR(100) | Nombre del proyecto |
| `descripcion` | TEXT | Descripción del proyecto |
| `grupo_id` | BIGINT (FK) | Grupo propietario |
| `estado` | VARCHAR(20) | Estado (Activo, Finalizado, Archivado) |
| `creado_en` | TIMESTAMP | Fecha de creación |
| `actualizado_en` | TIMESTAMP | Fecha de última actualización |

---

### 6. **criterios**
Define los criterios de evaluación (rúbrica).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | Identificador único |
| `nombre` | VARCHAR(50) | Nombre del criterio (Ej: "Funcionalidad") |
| `descripcion` | TEXT | Descripción del criterio |
| `puntuacion_maxima` | INT | Puntuación máxima para este criterio |

**Criterios por defecto:**
- ✅ Funcionalidad (10 puntos)
- ✅ Diseño UI/UX (10 puntos)
- ✅ Calidad de Código (10 puntos)
- ✅ Innovación (5 puntos)

---

### 7. **evaluaciones**
Cabecera de cada evaluación realizada a un proyecto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `proyecto_id` | UUID (FK) | Proyecto siendo evaluado |
| `evaluador_id` | UUID (FK) | Usuario que evalúa (profesor) |
| `calificacion_final` | DECIMAL(5,2) | Puntuación total (calculada automáticamente) |
| `fecha_evaluacion` | TIMESTAMP | Cuándo se realizó la evaluación |
| `actualizado_en` | TIMESTAMP | Última actualización |

**Nota:** La `calificacion_final` se actualiza automáticamente mediante un trigger.

---

### 8. **detalle_evaluaciones**
Desglose de la evaluación por cada criterio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | Identificador único |
| `evaluacion_id` | UUID (FK) | Referencia a `evaluaciones` |
| `criterio_id` | BIGINT (FK) | Referencia a `criterios` |
| `puntuacion_obtenida` | INT | Puntos obtenidos en este criterio |

**Restricción:** Un criterio solo se evalúa una vez por evaluación (UNIQUE).

---

### 9. **retroalimentacion**
Comentarios y feedback sobre las evaluaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | Identificador único |
| `evaluacion_id` | UUID (FK) | Referencia a `evaluaciones` |
| `comentario` | TEXT | Texto del comentario |
| `es_publico` | BOOLEAN | Si es visible para estudiantes |
| `creado_en` | TIMESTAMP | Fecha de creación |

---

## 🔗 Diagrama de Relaciones

```
auth.users (Supabase Auth)
    ↓ (1:1)
  usuarios ←→ roles
    ↓ (M:N)
miembros_grupo ←→ grupos
                    ↓ (1:N)
                  proyectos → evaluaciones
                                ↓ (1:N)
                         detalle_evaluaciones → criterios
                            
                         retroalimentacion
                                ↓ (1:N)
                            evaluaciones
```

---

## ⚙️ Funcionalidades Especiales

### 1. **Timestamps Automáticos**
- `handle_updated_at()`: Actualiza automáticamente `actualizado_en` en cambios
- Aplicado a: `usuarios`, `proyectos`, `evaluaciones`

### 2. **Cálculo de Calificación Automática**
- `calcular_calificacion_total()`: Suma los puntos de `detalle_evaluaciones`
- Actualiza automáticamente `calificacion_final` en `evaluaciones`
- Se dispara al insertar/actualizar/eliminar detalles

### 3. **Creación Automática de Usuario**
- `handle_new_user()`: Crea un registro en `usuarios` cuando alguien se registra
- Copia email y nombre completo desde `auth.users`

### 4. **Row Level Security (RLS)**
- Habilitado en todas las tablas
- Políticas básicas:
  - Roles y Criterios son públicos (lectura)
  - Usuarios pueden ver perfiles y editar el propio
  - Proyectos: solo acceso autenticado

---

## 🚀 Cómo Ejecutar el Script

### Opción 1: Supabase Dashboard
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. SQL Editor → New Query
3. Copia y pega el contenido de `infrastructure/database/schema.sql`
4. Click en "Run"

### Opción 2: CLI de Supabase
```bash
supabase db push
```

---

## 🔒 Seguridad

- Todas las tablas tienen **Row Level Security (RLS)** habilitado
- Los triggers garantizan integridad referencial
- Los usuarios solo pueden editar su propio perfil (política de RLS)
- El repositorio debe mantenerse como **privado** para proteger credenciales
- Las evaluaciones están protegidas por FK restrictas

---

## 📝 Notas Importantes

- **UUID para IDs principales:** Se usan para `usuarios` (vinculado a auth) y `proyectos`
- **BIGINT para referencias:** Se usan para `roles`, `grupos`, `criterios` (dados de referencia)
- **Timezone UTC:** Todos los timestamps están configurados en UTC
- **Borrado en cascada:** Si eliminas un grupo, se eliminan sus proyectos y evaluaciones
- La base de datos está alojada completamente en la nube de Supabase

---

**Última actualización:** 5 de febrero de 2026
