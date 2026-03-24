import 'dart:io';
import 'package:flutter/foundation.dart';

/// Constantes globales de configuración de la app.
///
/// La URL base se puede sobrescribir en build-time con:
///   flutter run --dart-define=API_HOST=https://api.midominio.com
class AppConstants {
  AppConstants._();

  // ── URL Base ────────────────────────────────────────────────────
  /// Host del backend. Sobrescribible con --dart-define=API_HOST=...
  static const String _apiHostOverride = String.fromEnvironment(
    'API_HOST',
    defaultValue: '',
  );

  static String get baseUrl {
    if (_apiHostOverride.isNotEmpty) return '$_apiHostOverride/api';

    // URL productiva en Render (comentada para pruebas locales):
    // return 'https://questeval-api.onrender.com/api';

    // Para pruebas locales:
    if (kIsWeb) return 'http://localhost:5122/api';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:5122/api';
    } catch (_) {}
    return 'http://localhost:5122/api';
  }

  // ── Timeouts ────────────────────────────────────────────────────
  /// Timeout general para llamadas HTTP (ferias con red lenta)
  static const Duration httpTimeout = Duration(seconds: 12);

  // ── Rutas de navegación ─────────────────────────────────────────
  static const String routeProjects = '/projects';
  static const String routeProjectDetail = '/projects/detail';
  static const String routeScan = '/scan';
  static const String routeEvaluation = '/evaluation';
  static const String routeEvaluationSuccess = '/evaluation/success';
  static const String routeAnalysis = '/analysis';
  static const String routeProfile = '/profile';

  // ── Storage keys ────────────────────────────────────────────────
  static const String keyAuthToken = 'auth_token';
  static const String keySessionToken = 'mobile_session_token'; // en SecureStorage
}
