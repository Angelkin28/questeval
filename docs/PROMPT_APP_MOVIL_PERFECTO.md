# Prompt Inteligente para Construcción de la App Móvil (QuestEvalMobile)

Copia todo el texto a continuación (desde **"Actúa como un experto..."**) y pégalo tal cual en tu modelo de IA, Antigravity, o en cualquier herramienta asistiva de código. Este prompt condensa las decisiones, la arquitectura ya preparada de tu backend, el sistema elegante Anti-Fraude (Huella de equipo sin login) y los componentes visuales exactos para que la IA ensamble la app sin entrar en un limbo técnico o asumir tecnologías incorrectas.

---

Actúa como un ingeniero experto en desarrollo móvil multiplataforma (React Native / Expo) y backend C# (.NET 8). Tu objetivo es analizar la arquitectura existente de nuestro ecosistema y proponer/construir la aplicación móvil "QuestEval" enfocada a dispositivos Android e iOS. Todo debe engranar de manera perfecta con el backend y las medidas de seguridad que hemos predefinido a continuación, **sin alterar** el flujo del backend o la plataforma web administrativa existente (Next.js).

A continuación, cuentas con todo el contexto funcional y técnico vital del sistema sobre el que construirás:

### 1. Resumen y Tecnologías Core
- **Nombre de la App:** QuestEval
- **Casos de Uso:** Escenario de Feria Inmobiliaria o de Proyectos Universitario. Utilizado para permitir la navegación abierta del público por los proyectos registrados y habilitar un proceso interactivo de evaluación validada insitu (Requiere estar frente al módulo/stand).
- **Backend Actual:** C# (ASP.NET Core 8 Web API). Arquitectura 100% REST pura.
- **Base de Datos:** MongoDB.
- **Framework de la Web (Admin/Panel de Control):** Next.js (React) estructurado con TailwindCSS.
- **Plataforma Objetivo para el Frontend Móvil:** Dispositivos móviles usando **React Native impulsado por Expo**. Utilizaremos la infraestructura de `expo-router` (rutas anidadas y jerarquía basada en carpetas `app/` para la navegación moderna equivalente a Web).

### 2. Endpoints Móviles Listos para Consumir
El backend ha sido acondicionado con tres endpoints robustos aislados exclusivamente para la interfaz de aplicación. Guiarás la construcción reactiva empleando un cliente unificado (como Axios `src/lib/api.ts`) para consumirlos:

- `GET /api/Projects`: Trae la matriz de todos los proyectos activos en un formato superficial. No requiere autenticación.
- `POST /api/Mobile/sessions/verify`: Espera el `body` `{ "qrToken": "xyz", "deviceId": "hash_del_movil" }`. Retorna la información a fondo del proyecto por juzgar, una batería de parámetros dinámicos "Rúbrica" (`criteria [...]`) y un "Token de Sesión Efímera" (15 minutos de holgura).
- `POST /api/Mobile/evaluations`: Para enviar el escrutinio de los visitantes hacia la base de la nube apuntando al ID del Proyecto. Requiere autorizarse insertando el "Token de Sesión JWT Efímera" devuelto por `/verify` adjunto en una cabecera `Authorization: Bearer <token>`.

### 3. Sistema de Seguridad y Reglas de Negocio Vitales (Diseño Elegante)
- **Modo Invitado Integral (Cero Fricción Base):** La app móvil NO tiene Login, Sign In ni registros de correo al iniciar (ni para jurados ni para estudiantes o público). Un visitante la instala, la abre, e inmediatamente consume un modo "Vitrina" hojeando los distintos proyectos presentados en la feria. Solo ocupará permisos especiales y validaciones **exclusivamente al intentar evaluar**.
- **Flujo de Bloqueo-QR y Token Criptográfico (El Checkpoint Físico):** Un usuario NO puede calificar un proyecto desde casa u otra zona abriendo la aplicación a oscuras. Se connota obligatoriedad física: Debe acercarse al papel o afiche impreso del Stand del equipo, abrir el componente escáner nativo de la app y "atrapar" el QR. Este QR no es un enlace vulgar; *es un JSON Web Token (JWT) emitido por el Backend del profesor/panel administrativo* que esconde el `projectId` real, y expira al terminar la jornada de feria. Al escanearse el sistema web levanta el candado cediendo el acceso por 15 minutos en el celular para votar sus parámetros o Rúbrica.
- **Detección Anti-Fraude (Huella Digital del Modelo Móvil):** ¿Por qué un usuario anónimo y sin login en la app no abusará del escáner en su teléfono repitiendo mil votos 70 veces seguidas como AutoClicker sobre el mismo Stand o afiche? Porque la app, subyacentemente, debe capturar e instanciar un 'Device Fingerprint' único desde su hardware (vía `expo-application` de React Native `getIosIdForVendorAsync()` / `getAndroidId()`) que acompaña cada petición remota de la vida móvil de este usuario. El Backend atrapa, encripta/hashea el UUID de hardware con SHA-256 en MongoDB indexándolo por Stand. Si ese dispositivo, un millón de años después o segundos después retorna y busca re-juzgar ese id-colectivo, la petición rebota con `409 Conflict`.

### 4. Flujo Maestro y Componentes de Usuario (Arquitectura del Frontend requeridos a diseñar):

Asentaremos la jerarquía bajo el ruteador de `Expo` en el sistema de directorios:
**A. Pantalla Home / Vitrina `app/index.tsx`:**
Lienzo central estilo "Catálogo". Una lista infinita optimizada (`FlatList`) mostrando minicartas para cada equipo. Presenta la estética "Universitario y Limpio" (Fondos neutros perla `#fafafa`, Contraste textual Plomo Antracita `#0f172a`, con bandas color base Oro y Amarillo universitario `#eab308`). 

**B. Detalles Reactivos Inyección `app/project/[id].tsx` (Comportamiento Dual de Interfaz):**
Este es el control central interactivo, rutea una vista camaleónica:
- **Estado Pasivo (Modo de Interés y Lectura):** Solo lee y renderiza información de proyecto. Agrega texto enriquecido y el Botón Gigante Primario con icono "Escanear QR para Evaluar" el cual navega invirtiendo a la cámara del usuario (Scanner).
- **Estado Interactivo de Recolección (Modo Jurado):** Si el Scanner devolvió con éxito al usuario a este escenario reingresando el JWT Epímero por inyección, debe destrabar la sección inferior transformándola en un bloque dinámico para coleccionar respuestas (Rúbricas). Sugerimos `Sliders` (Barras de Progreso interactivo continuas `@react-native-community/slider` amarrando mínimos de 0 a máximos del parámetro `maxScore`). 

**C. Escáner Lente Ocular `app/scanner.tsx`:**
Full-cámara inmersiva implementando `expo-camera`.
- Atrapa los pulsos QR. Tranca la pantalla con un velo opaco y una rueda de carga (`ActivityIndicator`) para frenar lectura sucia extra mientras valida remotamente en `/verify`.
- De comprobar el éxito reenvía ("reemplazando" usando `router.replace` para evitar que apachurren `back/retroceder` burlando la validación) directo a `[id].tsx` con su token colmado.
- Agrega un botón rústico Dev de 'saltarse' para pruebas y flujos de web-server simuladores carentes de escáner.

**D. Transición Final  `app/success.tsx`:**
La única escapatoria posible del fin de evaluación. Pantalla inmersiva festiva que despide al jurado dando gracias y solo ofrece un botón de barrido que devuelve íntegramente todo el flujo a `Home` (Index.tsx).

=======================

## Instrucción Directa Principal Posterior al Contexto:
Almacenado el macro ambiente de **QuestEval Móvil** en tu memoria, tu tarea es crear y proveer paso a paso el código TypeScript necesario (`index.tsx`, `api.ts` de cliente, y el controlador visual camaleónico `[id].tsx`) cimentado en `React Native/Expo` y que brinde un resultado premium, aplicando la **UX descrita**, inyectando una tipografía pesada en los títulos y siendo visualmente receptivo. Limítate a generar el esqueleto, la comunicación y estilizar los "Tiers/Componentes", asumiendo que los endpoints ya fueron levantados. 

*Comienza proponiéndome el diseño estructural limpio para el módulo principal `index.tsx`.*
