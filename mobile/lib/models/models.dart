class Project {
  final String id;
  final String title;
  final String type; // 'Integrador' or 'Videojuegos'
  final DateTime date;
  final bool isEvaluated;
  final double? score;
  final String? observations;
  final Map<String, double>? criteriaScores;
  final List<String> competencies;
  final String? videoUrl;
  final String? thumbnailUrl;

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
    this.competencies = const [],
    this.videoUrl,
    this.thumbnailUrl,
    this.questions = const [],
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] ?? json['projectId'] ?? '',
      title: json['name'] ?? '',
      type: json['category'] ?? 'Integrador',
      date: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      isEvaluated: json['status'] == 'EVALUADO',
      score: json['score']?.toDouble() ?? (json['finalScore']?.toDouble()),
      competencies: json['teamMembers'] != null ? List<String>.from(json['teamMembers']) : [],
      videoUrl: json['videoUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      questions: json['comprehensionQuestions'] != null 
          ? (json['comprehensionQuestions'] as List).map((q) => ComprehensionQuestion.fromJson(q)).toList()
          : [],
    );
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
      competencies: competencies,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
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
      question: json['question'] ?? '',
      options: json['options'] != null ? List<String>.from(json['options']) : [],
      correctIndex: json['correctAnswerIndex'] ?? 0,
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
      id: json['criteriaId'] ?? '',
      label: json['name'] ?? '',
      max: json['maxScore']?.toDouble() ?? 100.0,
    );
  }
}
