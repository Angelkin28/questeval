# Integración Backend y Estructura de Datos (QuestEval Mobile)

Este documento detalla los endpoints, las estructuras de los objetos de transferencia (DTOs), el funcionamiento y contenido de los Códigos QR de acceso, el ciclo de sesiones temporales y finalmente, cómo se resguarda una evaluación de invitado en la base de datos (MongoDB).

## 1. Lista de Endpoints Actuales
La aplicación móvil consume los siguientes endpoints del Backend:

*   **`GET /api/Projects`**: Utilizado por la pantalla de inicio (`index.tsx`) para listar todos los proyectos registrados públicamente sin necesidad de escaneo previo.
*   **`POST /api/Mobile/sessions/verify`**: Recibe el token extraído del QR y el identificador de hardware (`DeviceId`). Retorna la información del proyecto a evaluar, sus criterios (rúbrica) y un token de sesión efervescente (15 mins) para permitir el último paso.
*   **`POST /api/Mobile/evaluations`**: Envía la calificación final del visitante al servidor. Requiere enviar en la cabecera el token de 15 mins obtenido de `verify`.

---

## 2. Estructura de Datos Retornada (DTOs)

Cuando la aplicación móvil escanea un código QR exitosamente invocando `/api/Mobile/sessions/verify`, el servidor responde estructurando la data de la siguiente forma:

### Respuesta del Endpoint de Verificación (`/mobile/sessions/verify`)
```json
{
  "sessionToken": "eyJh... (JSON Web Token de 15 minutos)",
  "project": {
    "id": "64abcdef...",
    "name": "Sistema de Riego IoT",
    "description": "Automatización hídrica sustentable...",
    "teamMembers": ["Juan Pérez", "Ana Silva"],
    "thumbnailUrl": "https://url-imagen-opcional.com"
  },
  "criteria": [
    {
      "id": "64bcdef0...",
      "name": "Innovación",
      "description": "Originalidad y novedad de la propuesta.",
      "maxScore": 25
    },
    ...
  ]
}
```

### Estructura Inferida: `ProjectDTO`
Un objeto anónimo y simplificado derivado del modelo original de Proyecto para aliviar la carga móvil:
- `id` (string): Object ID del Proyecto.
- `name` (string): Título o nombre del Proyecto.
- `description` (string): Resumen rápido sobre el proyecto.
- `teamMembers` (string[]): Nombres de los participantes.
- `thumbnailUrl` (string): Enlace a miniatura o logo del equipo.

### Estructura Inferida: `CriterionDTO`
- `id` (string): Object ID de la Rúbrica.
- `name` (string): Título del criterio a calificar (Ej. *Impacto Social*).
- `description` (string): Detalles de qué se está evaluando aquí.
- `maxScore` (int): Puntaje máximo deslizable para este parámetro.

---

## 3. Composición del Código QR
Un organizador genera el código QR para imprimirlo en el cartel físico de un stand. El texto crudo que lee la cámara **no es una URL**, es un **JSON Web Token (JWT)**, configurado (por defecto) con 120 minutos de caducidad.

**¿Qué contiene el Payload del JWT en el QR?**
```json
{
  "projectId": "65bfa2cfd...", // El ID del proyecto atado al código
  "intent": "mobile_evaluation", // Candado de seguridad (evita que se use para login)
  "exp": 1709420000,             // Fecha de expiración (Timestamp Unix)
  "iss": "QuestEvalBackend",
  "aud": "QuestEvalFrontend"
}
```

---

## 4. Almacenamiento en MongoDB

Una vez que el invitado presiona enviar en la aplicación móvil, el endpoint de inserción (`/api/Mobile/evaluations`) se activa. La información se guarda a través de **2 operaciones clave sobre MongoDB**:

1.  **Inserción del Documento Maestro (`Evaluations` collection):**
    El Backend crea un modelo `Evaluation` donde asigna:
    - **Rol y Nombre:** `EvaluatorRole` = `"Invitado Móvil"`, `EvaluatorName` = Nombre Opcional o `"Anónimo (App)"`.
    - **Puntaje Global:** `FinalScore` es calculado automáticamente.
    - **Documentos Embebidos (Detalles):** Se inyecta una lista de objetos `EvaluationDetail` que clona los nombres históricos del Criterio (`CriterionName`) junto a su `CriteriaId` y el `Score` asignado.

2.  **Registro Anti-Fraude (Candado de Evaluación Cruzada):**
    Para impedir que este mismo teléfono pueda escanear de nuevo el proyecto y votar otra vez, se almacena un registro en la colección **`EvaluationDeviceRecords`**.
    - No se guarda el "DeviceId" en texto plano.
    - Se almacena computando un Hash: `DeviceIdHash = SHA256(Base64)`.
    - El registro inserta el `ProjectId`, el hash del dispositivo, y se ata al Object ID del documento central de la evaluación insertado en el paso anterior. Si este hash viola la llave única de índice indexada de Mongo `("idx_unique_device_evaluation")`, el motor falla bloqueando la redundancia.

---

## 5. Visualización Abierta de Proyectos
**La aplicación SÍ mostrará todos los proyectos sin necesidad de escanear un QR preventivamente.**

- **Modo Vitrina (Home):** Un invitado abre la app, carga de inmediato y puede navegar o buscar (próximas mejoras) entre todos los proyectos registrados, leer de qué tratan sus resúmenes y ver las categorías. 
- **Candado Evaluativo (Scanner):** El código QR solo entra en juego como llave obligatoria para destrabar el modo y las herramientas de evaluación ("Sliders"). Es un protocolo intencional donde un juez/asistente debe presentarse físicamente frente a un stand y escanear el papel impreso in situ para evidenciar su participación física.
