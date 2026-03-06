# Documentación de la Aplicación Móvil (QuestEvalMobile)

Esta documentación describe la arquitectura, la experiencia de usuario (UX), la interfaz de usuario (UI), y los flujos principales de la aplicación móvil QuestEval, diseñada para permitir que los asistentes (huéspedes) visualicen proyectos universitarios y realicen evaluaciones de forma segura.

## 1. Tecnologías Principales y Arquitectura
- **Framework:** React Native con **Expo**.
- **Enrutamiento:** **Expo Router** (el enrutador en base al sistema de archivos dentro de la carpeta `app/`).
- **Navegación Web:** Soporta ser ejecutada y renderizada en un entorno web (`expo start --web`), imponiendo una restricción de ancho (estilo contenedor móvil céntrico) para adaptar las pantallas largas.
- **Cliente HTTP:** Axios configurado en `src/lib/api.ts`, apuntando a distintas URL de backend según el entorno de la aplicación (URL del emulador, IP de la red local para dispositivos físicos y URL productiva para la web).

## 2. Requerimientos Funcionales y de Lógica de Negocios

### 2.1 Acceso Sin Credenciales (Modo Invitado)
La aplicación **no requiere login ni cuenta de usuario**. Los asistentes a la demostración pueden navegar por los proyectos existentes en la feria o exposición interactuando libremente con la pantalla de inicio principal, permitiéndoles decidir qué proyecto revisitar o aprender más.

### 2.2 Seguridad en Evaluaciones (Anti-fraude)
Para garantizar la integridad y veracidad de una evaluación se rigen las siguientes reglas de seguridad dictadas por requerimientos:
- **Lectura del QR Exclusiva de Evaluación:** El código QR de un proyecto *únicamente* sirve para habilitar el permiso temporal de evaluar.
- **Sesiones Temporales (Tokens Epímeros):** Una vez que un usuario escanea el código QR válido de un proyecto, el backend (`POST /Mobile/sessions/verify`) emite un *Session Token* temporal y la lista de criterios ("Rubrica") a calificar en ese instante de tiempo.
- **Restricción por Dispositivo:** El móvil siempre invoca a `getHardwareId()` para identificar de forma anónima pero persistente que este teléfono específico no pueda votar dos veces (o más) para un mismo proyecto. Si lo intenta, el servidor retornará un estado HTTP `409 Conflict`.

## 3. Flujo y Pantallas de la Aplicación

### A. Pantalla de Inicio (`app/index.tsx`)
- **Propósito:** Mostrar una lista pública de todos los proyectos activos universitarios.
- **Fuente de Datos:** Consume el endpoint `GET /api/Projects`.
- **UI:** Renderiza una experiencia en formato lista plana desplazable (`FlatList`) con tarjetas de presentación visualmente impactantes, con barras doradas acentuadas orientadas a un estilo moderno universitario en modo claro. Posee capacidad de *Pull-to-refresh* (deslizar para recargar). 

### B. Detalles del Proyecto (`app/project/[id].tsx`)
- **Propósito:** Mostrar la información a mayor profundidad del proyecto y, si se escaneó un código QR, cambiar a un lienzo de evaluación.
- **Comportamiento Dual:**
  - **Modo Vista (Solo Lectura):** Describe el proyecto y presenta un gran botón llamativo "Escanear QR para Calificar".
  - **Modo Evaluación (Ingreso de Datos):** Sucede cuando la ruta local recibe un `token` válido y datos de criterios (`criteriaData`). Muestra un panel interactivo y oscuro (Tarjeta de Calificación) listando los "sliders" paramétricos. El usuario define la puntuación y presiona "Enviar Evaluación" (`POST /Mobile/evaluations`).

### C. Escáner QR (`app/scanner.tsx`)
- **Propósito:** Consumir los permisos de cámara y realizar un escaneo en vivo de un QR.
- **Proceso:** Invoca el endpoint del backend (`/Mobile/sessions/verify`) enviando el código extraído. Se asegura visualmente de cargar (`ActivityIndicator`) hasta recibir fallo o éxito. Tras un éxito, hace un *router replace* de esta ventana, devolviendo al usuario a `[id].tsx` con sus parámetros de seguridad adjuntos.
- **UI:** Incorpora recubrimientos traslúcidos y marcos amarillos que le dictan al usuario exactitud, de la mano a botones de rescate y depuración (Probar sin cámara Web/Local).

### D. Pantalla de Éxito (`app/success.tsx`)
- **Propósito:** Brindar gratificación al usuario tras completar su evaluación y cerrar el ciclo. Sustituye la pila de negación para que no sea posible darle botón 'atrás' para re-evaluar inadvertidamente.

## 4. Estilo y Diseño de Interfaces (UI Prototype Guidelines)

- **Identidad Visual Premium:** Se descarta el tradicionalismo estándar para migrar a un modelo tipo "App Premium y Universitaria" integrando sombras sutiles, curvatura prominente de bordes, y un esquema de colores estricto:
  - **Fondo Neutral y Tarjetas:** Blanzo Tiza/Nieve (`#fafafa` / `#ffffff`).
  - **Oscuros base y profundos:** Grises carbón para lectura (`#0f172a`, `#1e293b`).
  - **Acentos y Dinamismo:** Tonos dorados / mostaza llamativos (`#eab308`, `#fde047`) que hacen resaltar puntajes, barras y alertas positivas.
- **Responsive y Web Constrained:** Todos los empaques maestros usan estilo en bloque `maxWidth: 500`. Esto obliga a toda la aplicación a renderizarse siempre como si fuera un dispositivo móvil a lo ancho, manteniendo siempre sus proporciones correctas aun si el emulador se despliega forzosamente a un monitor ultrarrápido web. Tipografías en negrilla extra pesada (`fontWeight: '800'/'900'`) diferencian fuertemente el foco principal. 

## 5. Próximos Pasos (Conectividad)
Para que esta aplicación trabaje eficientemente tanto en simulador local como en producción:
- El archivo `src/lib/api.ts` debe modificar la constante `API_URL` basado en qué IP local asigne la plataforma backend cuando la prueba el programador.
- La IP para test dentro del mismo entorno Wi-Fi suele ser típicamente la del IPv4 de la computadora donde corre el ASP.NET Core API.
