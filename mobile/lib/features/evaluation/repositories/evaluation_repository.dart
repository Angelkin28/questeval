import '../models/session_model.dart'; // SessionModel + EvaluationDetailRequest
import '../../../services/api_service.dart';
import '../../../core/device_info_service.dart';

/// Repositorio del módulo de evaluación.
/// Encapsula: obtener DeviceId + llamar al ApiService.
/// La UI y los providers NUNCA llaman a ApiService directamente.
class EvaluationRepository {
  final ApiService _api;

  const EvaluationRepository(this._api);

  /// Verifica el QR y devuelve una sesión con proyecto + criterios.
  Future<SessionModel> verifySession(String qrToken) async {
    final deviceId = await DeviceInfoService.getDeviceId();
    return _api.verifyQrSession(qrToken: qrToken, deviceId: deviceId);
  }

  /// Envía la evaluación completa al backend.
  ///
  /// [session]    → contiene el sessionToken y los criterios
  /// [scores]     → Map<criteriaId, score> generado por los sliders
  /// [guestName]  → nombre opcional del visitante
  Future<void> submitEvaluation({
    required SessionModel session,
    required Map<String, double> scores,
    String? guestName,
  }) async {
    final deviceId = await DeviceInfoService.getDeviceId();

    final details = session.criteria
        .map((c) => EvaluationDetailRequest(
              criteriaId: c.id,
              criterionName: c.name,
              score: scores[c.id] ?? 0.0,
            ))
        .toList();

    await _api.submitMobileEvaluation(
      sessionToken: session.sessionToken,
      projectId: session.project.id,
      deviceId: deviceId,
      guestName: guestName,
      details: details,
    );
  }
}
