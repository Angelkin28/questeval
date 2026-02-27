import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_models.dart';
import '../models/models.dart';

class ApiService {
  // Configuración de la URL base
  // - 10.0.2.2 es la dirección IP del host para el emulador de Android
  // - localhost funciona para iOS / Web / Escritorio
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5122/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5122/api';
      }
    } catch (_) {}
    return 'http://localhost:5122/api';
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<LoginResponse> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/users/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      return LoginResponse.fromJson(jsonDecode(response.body));
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Error al iniciar sesión (${response.statusCode})');
    }
  }

  Future<List<Project>> getProjects() async {
    final response = await http.get(
      Uri.parse('$baseUrl/projects'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Project.fromJson(json)).toList();
    } else {
      throw Exception('Error al cargar proyectos');
    }
  }

  Future<List<Criterion>> getCriteria() async {
    final response = await http.get(
      Uri.parse('$baseUrl/criteria'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Criterion.fromJson(json)).toList();
    } else {
      throw Exception('Error al cargar criterios');
    }
  }

  Future<List<Map<String, dynamic>>> getRankings(String category) async {
    final response = await http.get(
      Uri.parse('$baseUrl/analysis/ranking/$category'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Error al cargar rankings');
    }
  }

  Future<Project> getProjectById(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/projects/$id'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return Project.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Error al cargar el proyecto ($id)');
    }
  }

  Future<Map<String, dynamic>> getStats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/analysis/stats'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return Map<String, dynamic>.from(jsonDecode(response.body));
    } else {
      throw Exception('Error al cargar estadísticas');
    }
  }

  Future<void> submitEvaluation({
    required String projectId,
    required String userId,
    required List<Map<String, dynamic>> details,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/evaluations'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'projectId': projectId,
        'userId': userId,
        'details': details,
      }),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Error al enviar evaluación');
    }
  }
}
