import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_models.dart';
import '../models/models.dart';
import '../core/constants.dart';
import '../core/exceptions.dart';
import '../features/evaluation/models/session_model.dart';

class ApiService {
  // ── URL base (centralizada en AppConstants) ──────────────────────
  static String get baseUrl => AppConstants.baseUrl;

  // ── Headers ──────────────────────────────────────────────────────

  Future<Map<String, String>> _getHeaders({String? bearerToken}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = bearerToken ?? prefs.getString(AppConstants.keyAuthToken);
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ── Método helper para llamadas seguras con timeout ───────────────

  Future<http.Response> _get(String path) async {
    try {
      return await http
          .get(Uri.parse('$baseUrl/$path'), headers: await _getHeaders())
          .timeout(AppConstants.httpTimeout);
    } on SocketException {
      throw const NetworkException();
    } on HttpException {
      throw const NetworkException();
    }
  }

  Future<http.Response> _post(
    String path,
    Map<String, dynamic> body, {
    Map<String, String>? headers,
  }) async {
    try {
      final h = headers ?? await _getHeaders();
      return await http
          .post(Uri.parse('$baseUrl/$path'),
              headers: h, body: jsonEncode(body))
          .timeout(AppConstants.httpTimeout);
    } on SocketException {
      throw const NetworkException();
    } on HttpException {
      throw const NetworkException();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Endpoints existentes (sin cambios de comportamiento)
  // ─────────────────────────────────────────────────────────────────

  Future<LoginResponse> login(String email, String password) async {
    final response = await _post('users/login', {
      'email': email,
      'password': password,
    }, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      return LoginResponse.fromJson(jsonDecode(response.body));
    }
    final errorData = jsonDecode(response.body);
    throw Exception(
        errorData['error'] ?? 'Error al iniciar sesión (${response.statusCode})');
  }

  Future<List<Project>> getProjects() async {
    final response = await _get('projects');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Project.fromJson(json)).toList();
    }
    throw const ApiException('Error al cargar proyectos');
  }

  Future<List<Criterion>> getCriteria() async {
    final response = await _get('criteria');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Criterion.fromJson(json)).toList();
    }
    throw const ApiException('Error al cargar criterios');
  }

  Future<List<Map<String, dynamic>>> getRankings(String category) async {
    final response = await _get('analysis/ranking/$category');
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    throw const ApiException('Error al cargar rankings');
  }

  Future<Project> getProjectById(String id) async {
    final response = await _get('projects/$id');
    if (response.statusCode == 200) {
      return Project.fromJson(jsonDecode(response.body));
    }
    throw ApiException('Error al cargar el proyecto ($id)');
  }

  Future<Map<String, dynamic>> getStats() async {
    final response = await _get('analysis/stats');
    if (response.statusCode == 200) {
      return Map<String, dynamic>.from(jsonDecode(response.body));
    }
    throw const ApiException('Error al cargar estadísticas');
  }

  Future<void> submitEvaluation({
    required String projectId,
    required String userId,
    required List<Map<String, dynamic>> details,
  }) async {
    final response = await _post('evaluations', {
      'projectId': projectId,
      'userId': userId,
      'details': details,
    });

    if (response.statusCode != 201 && response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Error al enviar evaluación');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // ── NUEVOS: Endpoints móvil ───────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  /// Verifica el JWT del QR y obtiene proyecto + criterios.
  /// POST /api/Mobile/sessions/verify
  Future<SessionModel> verifyQrSession({
    required String qrToken,
    required String deviceId,
  }) async {
    final response = await _post(
      'Mobile/sessions/verify',
      {'qrToken': qrToken, 'deviceId': deviceId},
      headers: {'Content-Type': 'application/json'},
    );

    switch (response.statusCode) {
      case 200:
        return SessionModel.fromJson(jsonDecode(response.body));

      case 401:
        final detail = _extractDetail(response.body);
        // El backend devuelve distintos mensajes para QR expirado vs inválido
        if (detail.toLowerCase().contains('expir')) {
          throw QrExpiredException(detail);
        }
        throw QrInvalidException(detail);

      case 403:
        final detail = _extractDetail(response.body);
        throw AlreadyEvaluatedException(detail);

      case 404:
        throw const ProjectNotFoundException();

      default:
        throw ApiException(
            'Error del servidor: ${response.statusCode}', response.statusCode);
    }
  }

  /// Envía la evaluación completa con el sessionToken en el header.
  /// POST /api/Mobile/evaluations
  Future<void> submitMobileEvaluation({
    required String sessionToken,
    required String projectId,
    required String deviceId,
    String? guestName,
    required List<EvaluationDetailRequest> details,
  }) async {
    final response = await _post(
      'Mobile/evaluations',
      {
        'projectId': projectId,
        'deviceId': deviceId,
        if (guestName != null && guestName.isNotEmpty) 'guestName': guestName,
        'details': details.map((d) => d.toJson()).toList(),
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $sessionToken',
      },
    );

    switch (response.statusCode) {
      case 200:
      case 201:
        return;

      case 401:
        final detail = _extractDetail(response.body);
        throw SessionExpiredException(detail);

      case 409:
        final detail = _extractDetail(response.body);
        throw AlreadyEvaluatedException(detail);

      case 400:
        final detail = _extractDetail(response.body);
        throw ValidationException(detail);

      default:
        throw ApiException(
            'Error al enviar evaluación: ${response.statusCode}',
            response.statusCode);
    }
  }

  // ── Helper para extraer "detail" del cuerpo de error ─────────────
  String _extractDetail(String body) {
    try {
      final json = jsonDecode(body);
      return json['detail'] as String? ??
          json['error'] as String? ??
          'Error desconocido';
    } catch (_) {
      return 'Error desconocido';
    }
  }
}
