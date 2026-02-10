# Cambios y recomendaciones – QuestEval Web (React)

Documento de referencia sobre el estado actual, los cambios planificados y las recomendaciones de mejora para la aplicación web QuestEval.

---

## 1. Cambios realizados (estado actual)

| Área | Descripción |
|------|-------------|
| **Proyecto** | App React creada con Vite + TypeScript en `src/presentation/web-app/`. |
| **Supabase** | Cliente configurado en `src/lib/supabase.ts` con variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. |
| **Tema** | Variables CSS en `src/index.css` (paleta beige, arena, crema) para interfaz académica. |
| **Login** | Pantalla de login con email/contraseña, validación de campos vacíos, integración con `supabase.auth.signInWithPassword`, mensajes de error y botón "Usar datos de prueba". |
| **Post-login** | Tras sesión válida se muestra mensaje y botón "Cerrar sesión"; no hay verificación de rol ni redirección por rol. |
| **Logo** | Imagen `questeval.jpeg` en `public/` con fallback a texto "QuestEval" si falla la carga. |
| **Entorno** | `.env` y `.env.example` para credenciales; `.env` en `.gitignore`. |

---

## 2. Cambios planificados (según el plan)

### 2.1 Infraestructura y dependencias

- Añadir **react-router-dom** para rutas (`/`, `/login`, `/app`, `/app/proyectos`, etc.).
- Añadir **SWR** para caché y deduplicación de peticiones.
- Definir **tipos TypeScript** en `src/types/` (Usuario, Grupo, Proyecto, Evaluacion, DetalleEvaluacion, Criterio, Retroalimentacion).

### 2.2 Autenticación y contexto

- Tras login, obtener **usuario + rol** desde `usuarios` (con join a `roles`) en una sola petición o en paralelo; evitar waterfalls.
- **Contexto global**: usuario actual (id, email, nombre, rol) y grupo seleccionado (id y opcionalmente datos del grupo).
- Redirigir a `/app` **solo si el rol es "Alumno"**; en caso contrario mostrar "Acceso no disponible" y opción de cerrar sesión.
- Al cargar la app con sesión existente, rellenar el contexto sin encadenar awaits innecesarios.

### 2.3 Routing y shell

- **Rutas**: `/` → redirección según sesión; `/login` → Login; `/app` → shell con tabs; `/app/proyectos`, `/app/proyectos/:proyectoId`, `/app/proyectos/:proyectoId/evaluacion`, `/app/analisis`, `/app/perfil`.
- **MainShell**: barra superior (logo, título de contexto, icono notificaciones) y bottom nav de 4 ítems (Inicio, Proyectos, Análisis, Perfil).
- **Lazy loading**: `React.lazy` + `Suspense` para pantallas de Detalle proyecto y Evaluación.

### 2.4 Datos (hooks y SWR)

- **Fetchers** que usen `supabase.from(...).select(...)`; usados por hooks con SWR.
- **Hooks**: `useUsuario`, `useGruposAlumno`, `useProyectosGrupo`, `useEvaluacionByProyecto`, `useDetalleEvaluacion`, `useRetroalimentacionPublica`.
- Claves SWR estables: p. ej. `['grupos', userId]`, `['proyectos', grupoId]`, `['evaluacion', proyectoId]`.
- Peticiones independientes en paralelo con `Promise.all` donde aplique (evitar waterfalls).

### 2.5 Pantallas

- **Inicio**: lista de grupos del alumno; al elegir uno se guarda como grupo seleccionado y se puede ir a Proyectos.
- **Proyectos**: lista de proyectos del grupo seleccionado (nombre, estado); enlace a Detalle proyecto.
- **Detalle proyecto**: comprobar si existe evaluación; si no, "Evaluación no disponible"; si sí, enlace a pantalla Evaluación.
- **Evaluación**: calificación final, fecha, desglose por criterios (nombre, puntuación obtenida/máxima), retroalimentación pública.
- **Perfil**: nombre/email y botón Cerrar sesión (signOut + redirección a login).
- **Análisis**: placeholder "Próximamente".

### 2.6 Buenas prácticas (skill Vercel React)

- Imports directos (evitar barrel files).
- Estado derivado en render, no en `useEffect`.
- `setState` funcional cuando dependa del estado anterior.
- Inicialización perezosa con `useState(() => ...)` si el valor inicial es costoso.
- `useTransition` para cargas no urgentes donde encaje.
- Condicionales con ternario cuando el valor pueda ser 0 o falsy (p. ej. puntuaciones).
- Early exit en validaciones; Map para lookups por id cuando haya arrays grandes.

### 2.7 RLS (Supabase)

- Script SQL con políticas para que el alumno autenticado pueda:
  - Leer `miembros_grupo` donde `usuario_id = auth.uid()`.
  - Leer `grupos` (al menos los de sus miembros).
  - Leer `proyectos` (ya documentada política autenticada).
  - Leer `evaluaciones`, `detalle_evaluaciones`, `retroalimentacion` para proyectos accesibles (p. ej. de sus grupos).
- Ejecutar el script en el proyecto Supabase antes de validar el flujo completo.

---

## 3. Futuros cambios y recomendaciones

### 3.1 Funcionalidad

- **Roles Profesor y Administrador**: flujos específicos (crear grupos, evaluar proyectos, gestión de usuarios) cuando se requieran.
- **Análisis**: definir métricas (p. ej. evolución de notas, comparativa por criterios) y alimentar la pestaña con datos reales.
- **Notificaciones**: implementar el icono de la barra superior (avisos, recordatorios o mensajes del profesor).
- **Recuperación de contraseña**: pantalla "¿Olvidaste tu contraseña?" con `supabase.auth.resetPasswordForEmail`.
- **Modo kiosco**: vista optimizada para pantallas compartidas (tamaños de fuente y touch targets más grandes, menos navegación).

### 3.2 UX y accesibilidad

- **Mensajes de error** más específicos (credenciales incorrectas, cuenta no verificada, sin conexión).
- **Estados de carga** consistentes (skeletons o spinners) en listas y detalle; usar `useTransition` donde tenga sentido.
- **Empty states** claros (sin grupos, sin proyectos, sin evaluación) con indicación de qué hacer.
- **Navegación**: breadcrumbs o título de contexto en el shell para saber en qué grupo/proyecto se está.
- **Accesibilidad**: etiquetas en formularios, contraste suficiente (ya iniciado con el tema), soporte teclado y lectores de pantalla (ARIA donde haga falta).

### 3.3 Rendimiento

- **Listas largas**: si grupos o proyectos crecen mucho, aplicar `content-visibility` en CSS o virtualización (p. ej. `react-window`).
- **Imágenes**: optimizar logo y futuros recursos (formatos modernos, tamaños adecuados).
- **Prefetch**: preload de rutas o datos al hacer hover en enlaces críticos (regla bundle-preload del skill).
- **Service Worker / PWA**: considerar caché offline para uso en tablets o kioscos con conexión inestable.

### 3.4 Seguridad y robustez

- **Variables de entorno**: no subir `.env` al repositorio; en producción usar variables del host (Vercel, Netlify, etc.).
- **RLS**: revisar periódicamente políticas; evitar SELECT demasiado amplio en tablas sensibles.
- **Rate limiting**: si se exponen acciones sensibles (login, recuperación de contraseña), valorar límites en backend o Supabase Edge Functions.
- **Validación**: validar en backend (o con Edge Functions) datos que modifiquen estado; no confiar solo en el cliente.

### 3.5 Código y mantenimiento

- **Tests**: pruebas unitarias (hooks, utilidades) y de integración (flujo de login, listados) con Vitest o React Testing Library.
- **Linting y formato**: ESLint y Prettier con reglas alineadas al skill (evitar barrels, preferir ternarios en condicionales de render).
- **Documentación**: mantener este MD y el README actualizados; comentar decisiones no obvias en el código.
- **Manejo de errores**: capa centralizada para errores de red/Supabase (toasts o mensajes) y opcionalmente reporte a un servicio (Sentry, etc.).

### 3.6 Despliegue y DevOps

- **CI**: pipeline que ejecute `npm run build` y tests en cada push o PR.
- **Despliegue**: configurar en Vercel/Netlify u otro host; variables de entorno para `VITE_SUPABASE_*`.
- **Dominio y HTTPS**: usar siempre HTTPS en producción.
- **Monitoreo**: tiempos de carga, errores en producción y uso básico (opcional).

### 3.7 Base de datos

- **Índices**: revisar índices en columnas usadas en filtros (ej. `proyectos.grupo_id`, `evaluaciones.proyecto_id`, `miembros_grupo.usuario_id`).
- **Backups**: asegurar backups automáticos del proyecto Supabase.
- **Migraciones**: llevar un historial de scripts SQL (schema + RLS) para entornos nuevos o actualizaciones.

---

## 4. Resumen

- **Hecho**: Login funcional con Supabase, tema QuestEval y pantalla post-login mínima.
- **Planificado**: Flujo completo alumno (grupos → proyectos → evaluación), router, contexto, SWR, shell con bottom nav, RLS y buenas prácticas del skill.
- **Recomendado**: Extender a otros roles, análisis con datos reales, mejor UX/rendimiento/seguridad, tests, CI y documentación viva.

Este documento puede actualizarse a medida que se implementen los cambios planificados y se incorporen nuevas mejoras.
