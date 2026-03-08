# 📱 QuestEval Mobile

Aplicación Flutter para visitantes de feria escolar — evaluación mediante escaneo de QR.

> **No reemplaza la app web.** Comparte el mismo backend (ASP.NET Core + MongoDB).

---

## Inicio rápido

```powershell
cd mobile
flutter pub get
flutter run     # emulador o teléfono físico conectado
```

### Requisitos

| Herramienta | Versión mínima |
|-------------|---------------|
| Flutter | 3.x stable |
| Android SDK | API 21 (Android 5.0) |
| Dart | 3.x |

---

## Flujo principal

```
Proyectos → [Escanear QR] → Verificación Backend → Sliders → Éxito ✅
```

El QR de cada stand contiene un JWT emitido por el backend.  
Un dispositivo solo puede votar **una vez por proyecto** (control antifraude en DB).

---

## Variables de entorno

El archivo `lib/core/constants.dart` lee la URL del backend:

```dart
// Cambiar para apuntar al servidor de producción:
static const baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:5000/api',  // localhost desde emulador Android
);
```

Para compilar apuntando a producción:

```powershell
flutter build apk --dart-define=API_BASE_URL=https://tu-servidor.com/api
```

---

## Build APK

```powershell
# Debug (para pruebas)
flutter build apk --debug
# → build/app/outputs/flutter-apk/app-debug.apk

# Release (para distribución)
flutter build apk --release
```

---

## Permisos Android requeridos

| Permiso | Motivo |
|---------|--------|
| `CAMERA` | Escanear códigos QR |
| `INTERNET` | Comunicación con el backend |

Se solicitan en runtime la primera vez que el usuario abre el escáner.

---

## Documentación completa

Ver [`documentacion_mobile_questeval.md`](../docs/documentacion_mobile_questeval.md) para:
- Arquitectura detallada
- Contratos de API (request/response)
- Sistema antifraude DeviceId
- Manejo de errores tipado
- Guía de navegación
