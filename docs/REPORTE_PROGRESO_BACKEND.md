# 🚀 Reporte de Progreso Backend - QuestEval

Este documento detalla la implementación técnica del backend de QuestEval, organizada por los hitos alcanzados en las primeras tres semanas de desarrollo.

---

## 📅 Semana 1: Fundamentos y Estructura Base
**Objetivo**: Establecer los cimientos del proyecto y el modelo de datos.

### ✅ Logros Alcanzados:
- **Configuración Inicial**: Proyecto creado en **ASP.NET Core 8 Web API**.
- **Modelo de Datos Definido**: Implementación de clases base en `Backend/Models/MongoModels.cs`:
    - `Project`: Clase principal para proyectos, incluyendo soporte para videos (`VideoUrl`) y documentos.
    - `User`: Gestión de perfiles con roles (Alumno, Profesor, Admin).
    - `Evaluation` y `Feedback`: Modelos para reseñas y retroalimentación técnica.
- **Estructura de Carpetas**: Organización siguiendo el patrón de capas:
    - `Controllers/`: Endpoints de la API.
    - `Services/`: Lógica de negocio.
    - `DTOs/`: Modelado de entrada/salida.
    - `Models/`: Persistencia de datos.
- **Repositorio Git**: Establecido con una estructura limpia y archivos de configuración (.gitignore, README).

---

## 📅 Semana 2: Funcionalidad Core
**Objetivo**: Implementar la comunicación con servicios externos y funcionalidad REST básica.

### ✅ Logros Alcanzados:
- **API REST Funcional**: Implementación de endpoints CRUD básicos para Proyectos, Grupos y Usuarios.
- **Integración MongoDB**: Conexión establecida y funcional. Se utiliza para el almacenamiento de datos transaccionales.
- **Migraciones y Seeding**:
    - Sistema de inicialización de datos en `Program.cs`.
    - Lógica de migración de IDs (`ProjectId`, `UserId`) para mantener consistencia con datos previos.
- **Almacenamiento de Archivos (Supabase)**:
    - Integración con **Supabase Storage** mediante `StorageService.cs`.
    - Soporte para subida de videos y thumbnails, devolviendo URLs públicas para su visualización en el frontend.

---

## 📅 Semana 3: Pulido y Features Completas
**Objetivo**: Robustecer el sistema con búsqueda avanzada y manejo de errores.

### ✅ Logros Alcanzados:
- **Sistema de Búsqueda y Filtrado**:
    - Implementación de `SearchAsync` en `ProjectsService`.
    - Soporte para búsqueda por texto (nombre/descripción), filtrado por categoría y estado mediante `Builders<Project>.Filter` de MongoDB.
    - **Paginación**: Implementada en el endpoint `/api/Projects/search` para optimizar el rendimiento.
- **Validaciones Robustas**:
    - Uso de `System.ComponentModel.DataAnnotations` en los DTOs para validar entradas (longitud, campos requeridos, formatos).
    - Validación automática de `ModelState` en los controladores.
- **Manejo de Errores Global**:
    - Implementación de `GlobalExceptionHandler.cs`.
    - Captura centralizada de excepciones que devuelve respuestas estandarizadas bajo el estándar **RFC 7807 (Problem Details)**.
- **Optimización de Consultas**:
    - Uso de métodos asíncronos en todo el pipeline (Async/Await).
    - Implementación de contadores de base de datos para IDs incrementales eficientes.

---

## 🛠️ Tecnologías Utilizadas
- **Lenguaje**: C# (.NET 8)
- **Base de Datos NoSQL**: MongoDB (Datos persistentes)
- **Storage**: Supabase Storage (Archivos multimedia)
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación**: Swagger UI
