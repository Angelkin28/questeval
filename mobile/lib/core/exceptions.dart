library;

/// Jerarquía de excepciones tipadas para el flujo móvil de QuestEval.
/// Permite manejar cada error con un mensaje específico en la UI
/// sin depender de strings mágicos.

// ─────────────────────────────────────────────
// Clase base sellada
// ─────────────────────────────────────────────
sealed class AppException implements Exception {
  final String message;
  const AppException(this.message);

  @override
  String toString() => message;
}

// ─────────────────────────────────────────────
// Errores del QR
// ─────────────────────────────────────────────

/// El JWT del QR ya venció (exp < now).
class QrExpiredException extends AppException {
  const QrExpiredException([
    super.message =
        'Este código QR ha expirado. Pide al organizador que genere uno nuevo.',
  ]);
}

/// El QR es inválido o fue alterado.
class QrInvalidException extends AppException {
  const QrInvalidException([
    super.message = 'Código QR no válido. Asegúrate de escanear el QR del stand.',
  ]);
}

// ─────────────────────────────────────────────
// Errores de evaluación
// ─────────────────────────────────────────────

/// Este dispositivo ya registró una evaluación para este proyecto.
class AlreadyEvaluatedException extends AppException {
  const AlreadyEvaluatedException([
    super.message =
        'Ya registraste tu evaluación para este proyecto. ¡Gracias por participar!',
  ]);
}

/// El sessionToken de 15 minutos venció antes de hacer el submit.
class SessionExpiredException extends AppException {
  const SessionExpiredException([
    super.message =
        'Tu sesión de evaluación expiró (15 min). Escanea el código QR nuevamente.',
  ]);
}

/// El proyecto referenciado en el QR ya no existe.
class ProjectNotFoundException extends AppException {
  const ProjectNotFoundException([
    super.message = 'El proyecto ya no existe en el sistema.',
  ]);
}

/// Error de validación en los datos enviados.
class ValidationException extends AppException {
  const ValidationException([super.message = 'Datos de evaluación inválidos.']);
}

// ─────────────────────────────────────────────
// Errores de red / servidor
// ─────────────────────────────────────────────

/// Sin conexión a internet o timeout.
class NetworkException extends AppException {
  const NetworkException([
    super.message =
        'Sin conexión a internet. Verifica tu red e intenta de nuevo.',
  ]);
}

/// Error genérico del servidor (5xx, etc).
class ApiException extends AppException {
  final int? statusCode;
  const ApiException([super.message = 'Error del servidor.', this.statusCode]);
}
