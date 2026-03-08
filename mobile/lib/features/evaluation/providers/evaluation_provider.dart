import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/evaluation_repository.dart';
import '../models/session_model.dart';
import '../../../core/exceptions.dart';
import '../../../providers/auth_provider.dart';

// ─────────────────────────────────────────────
// Provider del repositorio
// ─────────────────────────────────────────────

final evaluationRepositoryProvider = Provider<EvaluationRepository>((ref) {
  return EvaluationRepository(ref.watch(apiServiceProvider));
});

// ─────────────────────────────────────────────
// Estado del flujo de evaluación (sealed)
// ─────────────────────────────────────────────

sealed class EvaluationState {
  const EvaluationState();
}

class EvaluationInitial extends EvaluationState {
  const EvaluationInitial();
}

class EvaluationLoading extends EvaluationState {
  const EvaluationLoading();
}

class EvaluationSessionLoaded extends EvaluationState {
  final SessionModel session;
  const EvaluationSessionLoaded(this.session);
}

class EvaluationSubmitting extends EvaluationState {
  const EvaluationSubmitting();
}

class EvaluationSuccess extends EvaluationState {
  const EvaluationSuccess();
}

class EvaluationError extends EvaluationState {
  final EvaluationErrorType type;
  final String message;
  const EvaluationError(this.type, this.message);
}

enum EvaluationErrorType {
  qrExpired,
  qrInvalid,
  alreadyEvaluated,
  sessionExpired,
  projectNotFound,
  network,
  unknown,
}

// ─────────────────────────────────────────────
// Notifier principal del flujo
// ─────────────────────────────────────────────

class EvaluationNotifier extends StateNotifier<EvaluationState> {
  final EvaluationRepository _repository;

  EvaluationNotifier(this._repository) : super(const EvaluationInitial());

  /// Paso 1: verificar el QR escaneado.
  Future<void> verifySession(String qrToken) async {
    state = const EvaluationLoading();
    try {
      final session = await _repository.verifySession(qrToken);
      state = EvaluationSessionLoaded(session);
    } on QrExpiredException catch (e) {
      state = EvaluationError(EvaluationErrorType.qrExpired, e.message);
    } on QrInvalidException catch (e) {
      state = EvaluationError(EvaluationErrorType.qrInvalid, e.message);
    } on AlreadyEvaluatedException catch (e) {
      state = EvaluationError(EvaluationErrorType.alreadyEvaluated, e.message);
    } on ProjectNotFoundException catch (e) {
      state = EvaluationError(EvaluationErrorType.projectNotFound, e.message);
    } on NetworkException catch (e) {
      state = EvaluationError(EvaluationErrorType.network, e.message);
    } catch (e) {
      state = EvaluationError(EvaluationErrorType.unknown, e.toString());
    }
  }

  /// Paso 2: enviar la evaluación completa.
  Future<void> submit({
    required Map<String, double> scores,
    String? guestName,
  }) async {
    final current = state;
    if (current is! EvaluationSessionLoaded) return;

    state = const EvaluationSubmitting();
    try {
      await _repository.submitEvaluation(
        session: current.session,
        scores: scores,
        guestName: guestName,
      );
      state = const EvaluationSuccess();
    } on SessionExpiredException catch (e) {
      state = EvaluationError(EvaluationErrorType.sessionExpired, e.message);
    } on AlreadyEvaluatedException catch (e) {
      state = EvaluationError(EvaluationErrorType.alreadyEvaluated, e.message);
    } on ValidationException catch (e) {
      state = EvaluationError(EvaluationErrorType.unknown, e.message);
    } on NetworkException catch (e) {
      state = EvaluationError(EvaluationErrorType.network, e.message);
    } catch (e) {
      state = EvaluationError(EvaluationErrorType.unknown, e.toString());
    }
  }

  /// Reinicia el estado para permitir un nuevo escaneo.
  void reset() => state = const EvaluationInitial();
}

final evaluationProvider =
    StateNotifierProvider<EvaluationNotifier, EvaluationState>((ref) {
  return EvaluationNotifier(ref.watch(evaluationRepositoryProvider));
});
