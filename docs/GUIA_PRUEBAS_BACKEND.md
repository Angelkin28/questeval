# 🛠️ Guía de Pruebas Manuales y Estructura del Backend - QuestEval

Esta guía proporciona las instrucciones necesarias para realizar pruebas manuales en el backend de QuestEval, así como una visión detallada de su arquitectura y estado actual.

---

## 🏗️ Estructura del Backend

El backend está desarrollado en **.NET 8** utilizando una arquitectura de capas limpia. A continuación se detalla la estructura de carpetas principal:

- **`Controllers/`**: Define los puntos de entrada de la API (REST Endpoints). Gestionan las solicitudes HTTP y las delegan a los servicios.
- **`Services/`**: Contiene la lógica de negocio y la interacción directa con la base de datos (MongoDB).
- **`Models/`**: Define las entidades persistentes en MongoDB (`MongoModels.cs`).
- **`DTOs/`**: Objetos de Transferencia de Datos utilizados para la entrada/salida de la API, desacoplando los modelos internos de la respuesta al cliente.
- **`Helpers/`**: Utilidades generales (Cifrado, JWT, validaciones).
- **`Middlewares/`**: Lógica de intercepción de solicitudes (Manejo de errores globales, Auth).

---

## 📜 Estado Actual y Restructuración de IDs

Recientemente, el backend ha pasado por un proceso de **Estandarización de IDs**. Anteriormente se utilizaban campos genéricos como `Id` o `IncrementalId`. Ahora se utilizan nombres específicos por entidad:

- **Proyectos**: `ProjectId`
- **Grupos**: `GroupId`
- **Usuarios**: `UserId` (Matrícula/ID secundario)
- **Evaluaciones**: `EvaluationId`
- **Criterios**: `CriteriaId`
- **Feedback**: `FeedbackId`

> [!IMPORTANT]
> Todos estos IDs se manejan como **Strings** en la API para facilitar la compatibilidad y permitir IDs secuenciales/personalizados.

---

## 🧪 Instrucciones para Pruebas Manuales (Swagger)

La forma más sencilla de probar el backend es a través de **Swagger UI**.

### 1. Acceso a Swagger
Inicia el backend y navega a:
`http://localhost:5122/swagger`

### 2. Flujo de Autenticación
La mayoría de los endpoints están protegidos por JWT.
1. Ve al endpoint `POST /api/Users/login`.
2. Introduce credenciales válidas (Ej: `profesor@questeval.com` / `123456`).
3. Copia el valor del campo `token` de la respuesta.
4. Haz clic en el botón **"Authorize"** (icono de candado) arriba a la derecha.
5. Escribe `Bearer ` seguido del token pegado (Ej: `Bearer eyJhbG...`).
6. Clic en **Authorize** y luego **Close**.

### 3. Realizar Pruebas
- **Listar Proyectos**: `GET /api/Projects`. Verifica que los IDs devueltos sean `projectId`.
- **Crear Evaluación**: `POST /api/Evaluations`. Asegúrate de usar el `projectId` obtenido anteriormente y el `userId` del evaluador.
- **Consultar Feedback**: `GET /api/Feedback`. Verifica que los comentarios estén vinculados al `evaluationId` correcto.

---

## 💾 Base de Datos (MongoDB)

El sistema utiliza **MongoDB** para el almacenamiento de datos.
- **Seeding**: Al iniciar la aplicación, se ejecuta un proceso de *Seeding* automático que inicializa los IDs secuenciales para datos existentes y crea usuarios de prueba por defecto.
- **Resiliencia**: Los IDs de relación en los modelos de C# se han marcado como opcionales (`?`) para permitir la migración suave de datos huérfanos o antiguos.

---

## 🛠️ Comandos Útiles

- **Ejecutar Backend**: `dotnet run --project .`
- **Modo Observación**: `dotnet watch run --project .`
- **Limpiar Base de Datos**: Actualmente no hay un endpoint de limpieza, se recomienda usar el comando de seeding al inicio o herramientas como *MongoDB Compass*.
