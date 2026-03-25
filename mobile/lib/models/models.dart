double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

class Project {
  // ... (keep fields as they are)
  final String id;
  final String title;
  final String type;
  final DateTime date;
  final bool isEvaluated;
  final double? score;
  final String? observations;
  final Map<String, double>? criteriaScores;
  final String description;
  final String? videoUrl;
  final String? thumbnailUrl;
  final List<String> galleryImages;
  final List<String> objectives;
  final List<String> technologies;
  final List<String> teamMembers;
  final List<String> competencies;
  final bool isEvaluatedByUser;
  final List<ComprehensionQuestion> questions;

  const Project({
    required this.id,
    required this.title,
    required this.type,
    required this.date,
    this.isEvaluated = false,
    this.score,
    this.observations,
    this.criteriaScores,
    this.description = '',
    this.videoUrl,
    this.thumbnailUrl,
    this.galleryImages = const [],
    this.objectives = const [],
    this.technologies = const [],
    this.teamMembers = const [],
    this.competencies = const [],
    this.questions = const [],
    this.isEvaluatedByUser = false,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    try {
      Map<String, double>? parsedCriteriaScores;
      if (json['criteriaScores'] != null && json['criteriaScores'] is Map) {
        parsedCriteriaScores = {};
        (json['criteriaScores'] as Map).forEach((k, v) {
          final val = _toDouble(v);
          if (val != null) parsedCriteriaScores![k.toString()] = val;
        });
      }

      return Project(
        id: (json['id'] ?? json['projectId'] ?? '').toString(),
        title: (json['name'] ?? '').toString(),
        type: (json['category'] ?? 'Integrador').toString(),
        date: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
        isEvaluated: json['status'] == 'EVALUADO',
        score: _toDouble(json['score']) ?? _toDouble(json['finalScore']),
        criteriaScores: parsedCriteriaScores,
        teamMembers: json['teamMembers'] != null ? List<String>.from(json['teamMembers']) : [],
        competencies: [],
        description: (json['description'] ?? '').toString(),
        videoUrl: json['videoUrl']?.toString(),
        thumbnailUrl: json['thumbnailUrl']?.toString(),
        galleryImages: json['galleryImages'] != null ? List<String>.from(json['galleryImages']) : [],
        objectives: json['objectives'] != null ? List<String>.from(json['objectives']) : [],
        technologies: json['technologies'] != null ? List<String>.from(json['technologies']) : [],
        questions: json['comprehensionQuestions'] != null 
            ? (json['comprehensionQuestions'] as List).map((q) => ComprehensionQuestion.fromJson(q)).toList()
            : [],
        isEvaluatedByUser: json['isEvaluatedByUser'] ?? false,
      );
    } catch (e) {
      print('Error parsing Project: $e');
      // Return a skeleton project to avoid breaking the whole list
      return Project(
        id: 'error',
        title: 'Error de carga',
        type: 'Integrador',
        date: DateTime.now(),
      );
    }
  }

  Project copyWith({
    bool? isEvaluated,
    double? score,
    String? observations,
    Map<String, double>? criteriaScores,
  }) {
    return Project(
      id: id,
      title: title,
      type: type,
      date: date,
      isEvaluated: isEvaluated ?? this.isEvaluated,
      score: score ?? this.score,
      observations: observations ?? this.observations,
      criteriaScores: criteriaScores ?? this.criteriaScores,
      description: description,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      galleryImages: galleryImages,
      objectives: objectives,
      technologies: technologies,
      teamMembers: teamMembers,
      competencies: competencies,
      questions: questions,
    );
  }
}

class ComprehensionQuestion {
  final String question;
  final List<String> options;
  final int correctIndex;

  const ComprehensionQuestion({
    required this.question,
    required this.options,
    required this.correctIndex,
  });

  factory ComprehensionQuestion.fromJson(Map<String, dynamic> json) {
    return ComprehensionQuestion(
      question: (json['question'] ?? '').toString(),
      options: json['options'] != null ? List<String>.from(json['options']) : [],
      correctIndex: (json['correctAnswerIndex'] as num?)?.toInt() ?? 0,
    );
  }
}

class Criterion {
  final String id;
  final String label;
  final double max;

  const Criterion({required this.id, required this.label, required this.max});

  factory Criterion.fromJson(Map<String, dynamic> json) {
    return Criterion(
      id: (json['criteriaId'] ?? '').toString(),
      label: (json['name'] ?? '').toString(),
      max: _toDouble(json['maxScore'] ?? json['MaxScore']) ?? 10.0,
    );
  }
}
