# Resumen de Cambios: Panel de Administración, Auditoría y Correcciones

Este documento resume las nuevas funcionalidades y correcciones implementadas recientemente en el sistema QuestEval.

## 1. Mejoras en el Backend

### 1.1 Nuevos Modelos y Campos en MongoDB
* **`ActivityLog`**: Se creó un nuevo modelo para registrar la auditoría del sistema de manera persistente en la colección `activitylogs`. Guarda información clave como la acción, actor, categoría, objetivo y timestamp.
* **`Group.TeacherId`**: Se añadió el campo `TeacherId` para rastrear qué profesor es el dueño/creador original de un grupo.
* **Tolerancia en `Membership`**: Se reconstruyó la función `GetByGroupIdAsync` para consultar la colección a nivel de `BsonDocument`, normalizando tipos mixtos (`ObjectId` vs `string`) sin corromper la respuesta.

### 1.2 Registro de Actividades (Logging)
* **`ActivityLogService`**: Nuevo servicio inyectado a nivel global.
* **Eventos automáticos**: El sistema ahora registra silenciosamente en MongoDB cuando un usuario se registra (`user_registered`), cuando el administrador elimina cuentas (`user_deleted`), cuando se crea un grupo (`group_created`), y cuando se reasigna a un maestro.

### 1.3 Endpoints Administrativos (`AdminController`)
Se implementó un controlador exclusivo protegido con `[Authorize(Roles = "Admin")]`:
* `GET /api/Admin/groups`: Obtiene un listado enriquecido de todos los grupos (conteo de alumnos, información del maestro asignado).
* `PUT /api/Admin/groups/{groupId}/teacher`: Reasigna dinámicamente el maestro a cargo de cualquier grupo (registrando la acción en el log).
* `GET /api/Admin/logs`: Recupera los registros de actividad para su visualización.

### 1.4 Mejora en Usuarios
* El modelo de respuesta `UserResponse` ahora expone públicamente el campo `UserId` (el ID corto y secuencial/incremental) para mostrarlo en el front-end.

---

## 2. Mejoras en el Frontend (Panel de Administración)

Reescritura completa del módulo **`/admin/dashboard`**, organizándolo en un sistema de tres pestañas (Tabs):

### 2.1 Pestaña "Usuarios"
* Mejoras en la tabla principal: ahora incluye una columna destacada **`#ID`** que muestra el identificador incremental del usuario.
* Manejo mejorado del modal de confirmación para eliminar cuentas y feedback enriquecido con los errores del backend.

### 2.2 Pestaña "Grupos" (NUEVO)
* Visualización centralizada de todos los grupos registrados en la plataforma.
* Indicadores visuales y badges para el recuento de alumnos por grupo.
* **Reasignación de Maestros:** Un nuevo modal interactivo que permite al administrador seleccionar a cualquier profesor registrado para tomar control de un grupo existente.

### 2.3 Pestaña "Actividad" (NUEVO)
* Integración con la colección de Base de Datos para mostrar el registro de auditoría.
* Clasificación de logs mediante colores y tags visuales (Auth, Info, Warning, Delete) según el evento.

---

## 3. Infraestructura y Corrección de Correos

### 3.1 Integración de Google SMTP con Supabase
Se solucionó el problema de *rate limits* (límite de envíos por hora) al utilizar el servicio por defecto de Supabase.
* Se generó una **Contraseña de Aplicación** (App Password) vinculada al Gmail institucional del proyecto.
* Se configuró el proveedor de Supabase => Authentication => Email utilizando el endpoint `smtp.gmail.com` en el puerto seguro `587`.
* Esto incrementa significativamente la cuota y la confiabilidad en la entrega de códigos OTP para el inicio de sesión y validación de correos.
