# QuestEval – Web (React)

Aplicación web de QuestEval con React, Vite y Supabase.

## Requisitos

- Node.js 18+
- npm

## Configuración

1. Copia `.env.example` a `.env`.
2. Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los datos de tu proyecto Supabase.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Build

```bash
npm run build
```

La salida queda en `dist/`.

## Datos de prueba

En la pantalla de login puedes usar **"Usar datos de prueba"** para rellenar:

- Correo: `demo@questeval.edu`
- Contraseña: `demo1234`

(Necesitas tener un usuario con esas credenciales en Supabase Auth.)

## RLS (Row Level Security)

Para que los alumnos vean solo sus grupos y evaluaciones, ejecuta en el SQL Editor de Supabase el script:

`infrastructure/database/rls_policies_alumno.sql` (desde la raíz del repositorio).
