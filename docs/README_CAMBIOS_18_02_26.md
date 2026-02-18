# Registro de Cambios - 18 de Febrero de 2026

## Resumen General
Se realizaron mejoras significativas en la experiencia de usuario del Dashboard del alumno, correcciones de errores técnicos en el Backend y Frontend, y se implementó una navegación global más fluida.

## 🛠️ Backend
- **Corrección de Pruebas**: Se solucionó un conflicto de punto de entrada (`CS7022`) en `ApiTests.cs` eliminando el método `Main` redundante.
- **Gestión de Procesos**: Se resolvieron problemas de bloqueo de archivos (`MSB3027`) mediante la terminación de procesos huérfanos.
- **Configuración SMTP**: Se brindó asesoría para la configuración del servicio de correos en Supabase para evitar limitaciones de "Rate Limit".
- **Limpieza**: Eliminación de archivos de log de construcción redundantes.

## 💻 Frontend

### Dashboard del Alumno (`/dashboard`)
- **Nueva Tarjeta de Información**: Se reemplazó el saludo genérico por una tarjeta profesional que muestra:
  - Nombre del alumno.
  - **Matrícula** resaltada visiblemente.
  - Icono de perfil estilizado.
- **Funcionalidad de Búsqueda**:
  - Implementación de barra de búsqueda en tiempo real.
  - Filtrado por nombre de proyecto y descripción.
  - Integración con filtros de categoría (Integrador vs Videojuegos).
- **Sección "Mis Proyectos"**:
  - Endpoint conectado para mostrar solo los proyectos del usuario.
  - Manejo de estados vacíos con accesos directos.
  - Rediseño de botones de acción ("Crear Proyecto", "Unirse a Grupo") movidos a la cabecera de la sección.

### Navegación y Layout (`Header.tsx` & `layout.tsx`)
- **Botón "Volver" Global**: 
  - Se implementó un botón de retroceso en el encabezado principal.
  - Visible en todas las páginas excepto en el Dashboard/Home.
  - Utiliza el historial del navegador para una navegación intuitiva.
- **Correcciones de Layout**:
  - Solución a errores de tipografía (fuentes Geist y Playfair).
  - Ajuste de metadatos `viewport` para cumplir con estándares de Next.js.

## 🚀 Estado Actual
- El sistema compila y ejecuta correctamente en ambos entornos (Frontend: puerto 4200, Backend: puerto 5122).
- La funcionalidad de correos depende de la configuración final de las credenciales SMTP en el panel de Supabase.
