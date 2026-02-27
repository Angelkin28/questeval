class Project {
  final String id;
  final String name;
  final String description;
  final String thumbnail;
  final String category; // 'Integrador' or 'Videojuegos'
  final DateTime date;
  final List<String> competencies;
  final List<QuizQuestion> quiz;

  Project({
    required this.id,
    required this.name,
    required this.description,
    required this.thumbnail,
    required this.category,
    required this.date,
    required this.competencies,
    required this.quiz,
  });
}

class QuizQuestion {
  final String question;
  final List<String> options;
  final int correctIndex;

  QuizQuestion({
    required this.question,
    required this.options,
    required this.correctIndex,
  });
}

class EvaluationCriterion {
  final String name;
  final double maxValue;

  EvaluationCriterion({required this.name, required this.maxValue});
}

class ProjectEvaluation {
  final String projectId;
  final Map<String, double> scores; // Criterion name -> score
  final String observations;
  final double totalScore;
  final List<int> quizResults; // Selected indices

  ProjectEvaluation({
    required this.projectId,
    required this.scores,
    required this.observations,
    required this.totalScore,
    required this.quizResults,
  });
}
