# 🏛️ Arquitectura y Procesos Generales - QuestEval

El sistema **QuestEval** es una plataforma integral orientada a la evaluación de proyectos estudiantiles. Cuenta con dos ecosistemas claramente separados: un Backend (API REST en .NET 10) y un Frontend (aplicación React con Next.js). A continuación se documenta en detalle la arquitectura del proyecto y los flujos de procesos clave.

---

## 🏗️ 1. Arquitectura del Sistema

### 1.1 Backend (.NET 10 Web API + MongoDB + Supabase)
El backend está diseñado siguiendo un patrón estricto de **Responsabilidad Única (SOLID)** y **Arquitectura de N Capas (Repository + Service Layer)**, separando completamente los controladores HTTP de la lógica de negocio y base de datos.

#### Capas de la Arquitectura Backend
1. **API / Controllers (`/Controllers`)**: Exponen los endpoints HTTP (ej: `POST /api/Evaluations`). Su única función es recibir los *Requests*, validar los *DTOs* de entrada usando `ModelState`, invocar a los *Servicios* y devolver respuestas HTTP estandarizadas (200 OK, 201 Created, 400 Bad Request, etc.).
2. **Business / Services (`/Services` e `/Interfaces`)**: Contienen toda la lógica de negocio. Por requerimiento de diseño, se utiliza inyección de dependencias a través de interfaces (`IGroupsService`, `IUsersService`, `IProjectsService`), permitiendo pruebas unitarias limpias. Los servicios manejan el acceso seguro a los datos en MongoDB.
3. **Data Access / Models (`/Models`)**: Define las 7 entidades principales para la persistencia en MongoDB (`User`, `Group`, `Project`, `Criterion`, `Membership`, `Evaluation`, `Feedback`). Usa ObjectIDs nativos de Mongo (relaciones referenciales).
4. **Data Transfer Objects (`/DTOs`)**: Toda comunicación hacia y desde los Controllers usa DTOs (ej. `RegisterDTO`, `ProjectDTO`). Esto evita la exposición de información sensible y facilita las validaciones (con atributos como `[Required]`, `[StringLength]`).
5. **Middlewares / Excepciones (`/Middlewares`)**: Un manejador global (`GlobalExceptionHandler`) intercepta todas las excepciones y las devuelve bajo el formato RFC 7807 (Problem Details), ocultando stack traces al cliente y estandarizando las respuestas de error 500.

#### Bases de Datos y Almacenamiento
* **MongoDB (Transaccional)**: Se utiliza para almacenar todas las entidades, relaciones (ej. un `Project` tiene campos de relaciones con `GroupId`) y datos críticos.
* **Supabase Storage (Objetos)**: Se encarga de manejar recursos multimedia, específicamente imágenes (thumbnails) y videos de los proyectos, proveyendo URLs de distribución pública optimizadas.

### 1.2 Frontend (Next.js + TypeScript + Tailwind CSS)
La aplicación cliente está desarrollada en React bajo el framework **Next.js** (App Router), enfocada en alto rendimiento y una interfaz de usuario interactiva y estilizada.

#### Estructura Frontend
1. **Páginas / Rutas (`src/app/`)**: El enrutamiento se maneja directamente usando la convención del App Router. Existen carpetas dedicadas por tipo de perfil: `/dashboard` (alumnos), `/admin/dashboard` (administración), `/guest-dashboard` (comunidad externa).
2. **Wrapper de Componentes / Protecciones (`src/presentation/components`)**: Componentes reutilizables como botones, modales y el componente crítico `<ProtectedRoute />` que encierra vistas y valida el token y rol de la sesión.
3. **Módulo API Centralizado (`src/lib/api.ts`)**: Todo proceso de comunicación HTTP con el backend (fetch) se realiza desde este módulo central. Exporta métodos para la autenticación, carga de proyectos, usuarios, criterios y evaluaciones. Maneja dinámicamente el `Authorization: Bearer Token`.

---

## ⚙️ 2. Flujos y Procesos Clave

A nivel de experiencia, el servidor cuenta con los siguientes procesos estandarizados:

### 2.1 Autenticación y Autorización (JWT)
1. El usuario envía credenciales al endpoint `/api/Users/login` vía el frontend (`api.auth.login`).
2. El servicio backend valida la información y comprueba un Hash Criptográfico usando **BCrypt**. Si son válidas, verifica que el usuario cuente con un `VerificationStatus` aprobado.
3. El servicio genera un token **JWT (JSON Web Token)** firmado de larga/moderada duración.
4. El frontend guarda los datos del usuario y este token en el `localStorage` del navegador. Todas las peticiones posteriores inyectarán este token en sus cabeceras como `Bearer <token>`.

### 2.2 Proceso Central: Evaluación de Proyectos
El núcleo de la aplicación.
1. La plataforma consulta los criterios base aprobados (`/api/Criteria`).
2. Un usuario de perfil Evaluador o Invitado accede a los detalles de un proyecto (`/api/Projects/{id}`).
3. El evaluador asigna calificaciones parciales a cada criterio mediante un Request (`CreateEvaluationRequest` -> `/api/Evaluations`).
4. El Backend procesa las sumas, la integridad y genera una calificación final. Guarda la relación entre `Project`, `User`, y las `Evaluation Detail`.
5. Si lo desea, el evaluador puede llamar al endpoint `/api/Feedback` para extender la evaluación con comentarios cualitativos.

### 2.3 Modo Invitado (Guest Access)
Debido a la necesidad de permitir perfiles evaluadores externos que no requieran la fricción de un registro complejo:
1. El usuario navega a la página de Acceso a Invitado (`/guest-access`).
2. Solamente introduce su nombre público mediante un formulario.
3. El frontend consume `/api/Users/guest-access`. 
4. El backend genera una "Sesión Transitoria" de invitado con token temporal y un rol restringido `Rol: Invitado`.
5. El sistema lo redirige al `/guest-dashboard` donde el usuario solo puede ver proyectos (modo lectura general) y generar su evaluación, bloqueando la creación de proyectos o administración del sistema de forma estricta por roles de backend y mediante el componente frontend de `<ProtectedRoute allowedRoles={['Invitado']}>`.

### 2.4 Almacenamiento Multimedia (Supabase Storage)
Cuando se crea o edita un proyecto:
1. El Frontend captura un archivo (imagen miniatura o video) mediante un `<input type="file" />`.
2. Se consume `api.storage.upload()`, la cual manda un `FormData` al backend.
3. El Controller `StorageController` recibe el IFormFile, lo procesa, y el `StorageService` se conecta directamente con el SDK Oficial de Supabase.
4. Supabase almacena el archivo en sus buckets seguros y contesta con una URL Pública (URI).
5. Esta URL es enviada de vuelta al frontend para ser asociada al ProjectDTO previo a la creación/actualización del proyecto en la base de datos de MongoDB.

### 2.5 Excepciones y Manejo de Errores Globales
Antes de llegar al Frontend, la integridad y limpieza de errores es obligatoria.
* Cualquier fallo interno de lógica (código en `Services`) arroja excepciones controladas (`ArgumentException`, `InvalidOperationException`).
* El middleware delegado en la tubería HTTP de .NET (`GlobalExceptionHandler`) captura esta anomalía por detrás antes de que el servidor "caiga".
* Responde un código 500, o 400 pero siempre formateado como un objeto seguro:
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "An error occurred",
  "status": 500,
  "detail": "El mensaje de la excepción sin el stacktrace malicioso"
}
```
* El Frontend intercepta esta respuesta JSON en un bloque *try-catch* y muestra un Toast/Alerta amistosa en pantalla, mejorando radicalmente la Experiencia de Usuario (UX) y evitando la fuga de información sensible.

---

> ✨ **Nota para Developers:** Para conocer detalles del setup de ambiente, variables en `.env` o configuraciones nativas de compilación, consultar los manuales específicos `Backend/README.md` o el documento interno de cambios de cada área.
