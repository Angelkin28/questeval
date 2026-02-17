# Cambios 16/02/26 Angel

Este documento detalla todas las modificaciones y mejoras realizadas en el sistema QuestEval durante la jornada del 16 de febrero de 2026, cubriendo Backend, Frontend, Base de Datos y la integración con Supabase.

## 🚀 Resumen de Avances Clave

Durante esta sesión, hemos logrado hitos críticos para la funcionalidad del sistema:

1.  **Cierre del Ciclo de Autenticación**: Se transformó el sistema de entrada de "Magic Link" a un sistema de **Código de 6 dígitos** real, alineando el backend con el diseño premium del frontend.
2.  **Control Total Administrativo**: El panel de administración pasó de ser una maqueta a una herramienta funcional que permite listar maestros y supervisar su estado de aprobación.
3.  **Gestión de Proyectos del Maestro**: Se implementó en el Dashboard del Profesor la sección **"Por Calificar"**, la cual filtra automáticamente los proyectos completados de sus grupos que aún no tienen una evaluación.
4.  **Estabilización de Sesiones**: Se resolvió el bug crítico de redirección que impedía a los administradores entrar a su panel tras el login inicial.
5.  **Infraestructura de Medios**: Se dejó listo el flujo de carga de archivos (imágenes) hacia Supabase Storage, garantizando nombres únicos y URLs permanentes para los proyectos.

---
### 👥 Roles y Permisos del Sistema
Se ha definido y estabilizado el comportamiento de los tres roles principales:

1.  **Administrador**:
    *   **Acceso**: Total al sistema.
    *   **Responsabilidades**: Gestión de usuarios, configuración global de rúbricas y, crucialmente, la **aprobación manual de Maestros**.
    *   **Seguridad**: El administrador principal cuenta con una rutina de recuperación automática en el backend.

2.  **Profesor (Maestro)**:
    *   **Flujo de Registro**: Debe registrarse, verificar su email (OTP) y queda en estado `pending` (pendiente).
    *   **Acceso**: No puede entrar a su Dashboard hasta que un **Administrador lo apruebe** manualmente en el panel de gestión.
    *   **Funciones**: Una vez aprobado, puede crear grupos, gestionar alumnos y realizar evaluaciones.

3.  **Alumno**:
    *   **Flujo de Registro**: Se registra y verifica su email. Una vez verificado, su acceso es inmediato (`approved` por defecto).
    *   **Funciones**: Puede unirse a grupos mediante códigos de acceso, participar en proyectos y ver sus resultados.

---

## 1. Backend (C# / .NET)

### 🔐 Gestión de Administrador
- **Reseteo Forzado**: Se modificó `Program.cs` para que, en cada inicio del servidor, se asegure la existencia del usuario administrador (`won.dorado.mid@gmail.com`) con la contraseña `admin123` y el rol `Admin`. Si el usuario ya existe, se elimina y recrea para garantizar credenciales correctas.

### 📧 Servicio de OTP (Confirmación de Email)
- **Cambio de Flujo**: Se cambió el método de `SignInWithOtp` (Magic Link) a `SignUp` (Registro). 
- **Objetivo**: Disparar la plantilla de correo **"Confirm sign up"** de Supabase en lugar del enlace de inicio de sesión genérico. Esto permite que el usuario reciba el código de 6 dígitos que pide la interfaz.
- **Robustez**: Se añadió manejo de errores específico para el código **429 (Rate Limit)** de Supabase, informando al usuario cuando se ha excedido el límite de correos permitidos.

### 👥 Controlador de Usuarios
- **Exposición de Estado**: Se actualizaron los métodos `GetAll` y `GetById` en `UsersController.cs` para incluir los campos `VerificationStatus` y `EmailVerified` en la respuesta. Esto es crítico para que el panel de administración pueda mostrar si un maestro está aprobado o pendiente.

---

## 2. Frontend (Next.js / TypeScript)

### 🔑 Corrección en el Login
- **Persistencia de Sesión**: Se corrigió un error donde el sistema redirigía al panel de control antes de guardar el Token en el `localStorage`. Ahora, la sesión se guarda inmediatamente después de recibir la respuesta del servidor, evitando bloqueos en la redirección.

### 🛡️ Panel de Administración (Dashboard)
- **Lista de Profesores**: Se implementó la sección **"Profesores Registrados"**.
- **Funcionalidad**: 
    - Filtra automáticamente a los usuarios por el rol `Profesor`.
    - Muestra una tabla con Nombre, Email, Estado (Aprobado/Pendiente/Rechazado) y Fecha de Registro.
    - Utiliza etiquetas de colores (badges) para representar visualmente el estado del docente.
- **API Client**: Se extendió `api.ts` para incluir el método `users.getAll()`.

---

## 3. Base de Datos (MongoDB)

### 🧪 Mantenimiento de Datos
- **Limpieza de Usuarios de Prueba**: Se realizaron limpiezas manuales de registros (como `angel.rosado.kin@gmail.com` y `andresciau01@gmail.com`) tanto en MongoDB como en Supabase Auth para permitir pruebas de flujo de registro desde cero.
- **Consistencia**: Se aseguró que los campos de auditoría (`CreatedAt`, `UpdatedAt`) y de estado se guarden correctamente en cada creación.

---

## 🔧 Detalles Técnicos y Correcciones (Bug Fixes)

Además de las nuevas funcionalidades, se realizó un trabajo profundo de estabilización del código:

### 1. Corrección de Errores de Compilación (Syntax Fixes)
- **Problema**: Atributos de ruta (`[Route]`, `[HttpGet]`) mal formados en `ProjectsController.cs`, `EvaluationsController.cs` y `UsersController.cs`.
- **Solución**: Se corrigieron las cadenas de texto y comillas que impedían que el servidor de .NET compilara correctamente. 
- **Resultado**: Estabilización total del Backend y despliegue exitoso de la API Swagger.

### 2. Lógica Inteligente de Filtrado ("Por Calificar")
- **Implementación**: Se desarrolló un filtro en el Dashboard del Profesor que cruza datos de tres colecciones:
    1. Busca todos los grupos del maestro actual.
    2. Filtra proyectos que pertenecen a esos grupos.
    3. Selecciona únicamente proyectos con `Status: "Completed"` que NO han sido evaluados.
- **Beneficio**: El maestro solo ve el trabajo pendiente real, eliminando el ruido visual.

### 3. Ingeniería del Flujo OTP (6 Dígitos)
- **Análisis**: Se detectó que el método `SignInWithOtp` enviaba por defecto un "Magic Link" (enlace directo), ignorando la plantilla personalizada de 6 dígitos.
- **Cambio Técnico**: Se migró a `SignUp` con contraseñas aleatorias temporales. Esto obliga a Supabase Auth a disparar el flujo de **Confirmación de Registro**, que permite el uso de tokens numéricos.
- **Manejo de Rate Limit**: Se implementó una captura del error `429` (Too Many Requests) para informar cuando el proveedor de correo ha pausado el servicio temporalmente.

---

## 4. Flujo del Bucket de Imágenes (Supabase Storage)

El sistema de gestión de archivos utiliza los Buckets de Supabase como una CDN privada de alto rendimiento:

1.  **Arquitectura del Bucket**: 
    - **Nombre**: `images`.
    - **Nivel de Acceso**: Configurado como **Public** para permitir la visualización instantánea en la web pero restringiendo la escritura mediante el uso de la `ServiceKey` del Backend.
2.  **Pipeline de Subida**:
    - **Frontend**: Utiliza `multipart/form-data` para enviar archivos binarios.
    - **Validación del Servidor**: El `StorageController` verifica que el archivo no esté vacío y que el tipo MIME sea estrictamente `image/`.
    - **Sanitización de Nombres**: Se aplica un `Guid.NewGuid()` a cada archivo. Esto previene que si dos alumnos suben una foto llamada `proyecto.jpg`, una no borre a la otra.
    - **Ubicación**: Organización lógica en la carpeta `uploads/`.
3.  **Entrega Dinámica**: El sistema no guarda la imagen "física" en el servidor local, sino que genera una URL pública permanente mediante el motor de Storage de Supabase, lo que garantiza velocidad y escalabilidad.

---

## ⚠️ Notas de Seguridad y Configuración
- **Identificación en Login**: Se ajustaron las etiquetas de la UI para que el campo de entrada pueda usarse indistintamente como **Matrícula** o **Correo electrónico**, mejorando la experiencia de usuario (UX).
- **Consistencia de Roles**: Se validó que al crear el usuario en MongoDB, la propiedad `Role` coincida exactamente con la requerida en el `ClaimTypes.Role` del JWT para evitar errores de autorización 403.

---

## 📈 Logros y Avances Significativos

Hoy hemos superado obstáculos técnicos que habían detenido el progreso del proyecto, logrando un avance equivalente a varias jornadas de trabajo:

1.  **Refactorización del Core de Seguridad**:
    - Se sanearon los controladores principales (`Users`, `Projects`, `Evaluations`), eliminando errores de sintaxis heredados que impedían la compilación.
    - Se estandarizó el uso de **JWT (JSON Web Tokens)** para que incluyan el `verificationStatus`, permitiendo al frontend tomar decisiones de navegación en tiempo real.

2.  **Dashboard del Profesor (Funcionalidad Real)**:
    - Se dejó de usar datos estáticos. El profesor ahora ve una lista dinámica de **proyectos pendientes de calificar**, calculada en tiempo real mediante el cruce de sus grupos y el estado de entrega de los alumnos.

3.  **Sistema de Verificación Blindado**:
    - Se implementó un flujo de **OTP (One Time Password)** que no solo envía el código, sino que maneja inteligentemente si el usuario ya existe o si el servicio de correo está saturado (Rate Limiting).

4.  **Panel de Administración Operativo**:
    - El administrador ahora tiene visibilidad total de la planta docente. Puede ver quién se ha registrado, quién ha verificado su cuenta y quién está esperando aprobación manual para comenzar a impartir clases.

---

## 🗺️ Hoja de Ruta (Próximos Pasos)

Con la base del sistema ya estabilizada y funcional, los siguientes pasos son:

*   **[ ] Pantalla de Éxito de Evaluación**: Crear la interfaz `/rubric/success` que proporcione retroalimentación inmediata al maestro tras calificar un proyecto.
*   **[ ] Loop de Calificación Continuo**: Implementar el botón "Evaluar Siguiente" para que el maestro pueda calificar a todo un grupo sin tener que volver manualmente al dashboard cada vez.
*   **[ ] Módulo de Reportes**: Generación de PDFs o resúmenes de calificaciones por grupo para el Administrador y los Maestros.
*   **[ ] Galería de Proyectos Publicados**: Activar la visualización de las imágenes alojadas en el Bucket de Supabase para que los mejores proyectos sean visibles en el muro principal de alumnos.

---

## 🛠️ Stack Tecnológico Utilizado (Update 16/02)

*   **Backend**: .NET 10.0 (C#) con inyección de dependencias avanzada y JWT Authentication.
*   **Base de Datos**: MongoDB (NoSQL) para alta flexibilidad en la estructura de proyectos y usuarios.
*   **Servicios Cloud**: Supabase Auth (Gestión de identidad) y Supabase Storage (Bucket de imágenes).
*   **Frontend**: Next.js 16 (React) con TypeScript para un tipado estricto y componentes UI basados en Radix/Tailwind.

---
**Documentación técnica validada y actualizada el 16/02/2026.**
