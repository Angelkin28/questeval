import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

/// Servicio para obtener un identificador único y estable del dispositivo.
///
/// El ID obtenido se envía al backend, donde se aplica SHA256 antes
/// de almacenarlo — nunca se guarda en texto plano en MongoDB.
///
/// Prioridad:
///   Android → androidId (hardware-level, persiste reinstalaciones en <API 29)
///   iOS     → identifierForVendor (por app, se resetea si desinstala)
///   Web/Fallback → UUID generado y guardado en SharedPreferences
class DeviceInfoService {
  static const String _fallbackKey = 'device_uuid_fallback';
  static final DeviceInfoPlugin _plugin = DeviceInfoPlugin();

  /// Devuelve el DeviceId del dispositivo actual.
  static Future<String> getDeviceId() async {
    try {
      if (!kIsWeb) {
        if (Platform.isAndroid) {
          final info = await _plugin.androidInfo;
          final id = info.id.isNotEmpty ? info.id : null;
          if (id != null) return id;
        } else if (Platform.isIOS) {
          final info = await _plugin.iosInfo;
          final id = info.identifierForVendor;
          if (id != null && id.isNotEmpty) return id;
        }
      }
    } catch (_) {
      // Si falla el plugin, caemos al fallback seguro
    }
    return _getFallbackId();
  }

  /// Genera (o recupera) un UUID persistido en SharedPreferences.
  /// Usado en Web, emulador, o cuando el plugin no está disponible.
  static Future<String> _getFallbackId() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_fallbackKey);
    if (existing != null && existing.isNotEmpty) return existing;

    final newId = const Uuid().v4();
    await prefs.setString(_fallbackKey, newId);
    return newId;
  }
}
