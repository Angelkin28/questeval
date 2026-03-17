library;

/// Modelos de dominio para el flujo de evaluación móvil.
/// Mapean exactamente la respuesta de POST /api/Mobile/sessions/verify.

// ─────────────────────────────────────────────
// Respuesta de verify session
// ─────────────────────────────────────────────

class SessionModel {
  final String sessionToken;
  final ProjectInfo project;
  final List<CriteriaInfo> criteria;

  const SessionModel({
    required this.sessionToken,
    required this.project,
    required this.criteria,
  });

  factory SessionModel.fromJson(Map<String, dynamic> json) {
    return SessionModel(
      sessionToken: json['sessionToken'] as String,
      project: ProjectInfo.fromJson(json['project'] as Map<String, dynamic>),
      criteria: (json['criteria'] as List)
          .map((c) => CriteriaInfo.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Puntaje máximo total sumando todos los criterios
  int get totalMaxScore => criteria.fold(0, (sum, c) => sum + c.maxScore);
}

// ─────────────────────────────────────────────
// Info del proyecto dentro de la sesión
// ─────────────────────────────────────────────

class ProjectInfo {
  final String id;
  final String name;
  final String description;
  final List<String> teamMembers;
  final String? thumbnailUrl;
  final String? videoUrl;

  const ProjectInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.teamMembers,
    this.thumbnailUrl,
    this.videoUrl,
  });

  factory ProjectInfo.fromJson(Map<String, dynamic> json) {
    return ProjectInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      teamMembers: json['teamMembers'] != null
          ? List<String>.from(json['teamMembers'] as List)
          : [],
      thumbnailUrl: json['thumbnailUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
    );
  }
}

// ─────────────────────────────────────────────
// Criterio de evaluación (dinámico desde backend)
// ─────────────────────────────────────────────

class CriteriaInfo {
  final String id;
  final String name;
  final String description;
  final int maxScore;

  const CriteriaInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.maxScore,
  });

  factory CriteriaInfo.fromJson(Map<String, dynamic> json) {
    return CriteriaInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      maxScore: (json['maxScore'] as num).toInt(),
    );
  }
}

// ─────────────────────────────────────────────
// Request de evaluación hacia el backend
// ─────────────────────────────────────────────

class EvaluationDetailRequest {
  final String criteriaId;
  final String criterionName;
  final double score;

  const EvaluationDetailRequest({
    required this.criteriaId,
    required this.criterionName,
    required this.score,
  });

  Map<String, dynamic> toJson() => {
        'criteriaId': criteriaId,
        'criterionName': criterionName,
        'score': score,
      };
}
