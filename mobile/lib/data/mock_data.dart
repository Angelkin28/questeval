import 'models.dart';

final List<EvaluationCriterion> defaultCriteria = [
  EvaluationCriterion(name: 'Innovación', maxValue: 20),
  EvaluationCriterion(name: 'Calidad Técnica', maxValue: 30),
  EvaluationCriterion(name: 'Presentación', maxValue: 20),
  EvaluationCriterion(name: 'Impacto Social', maxValue: 15),
  EvaluationCriterion(name: 'Documentación', maxValue: 15),
];

final List<Project> mockProjects = [
  Project(
    id: '1',
    name: 'Smart Eco System',
    description: 'Sistema inteligente de gestión de residuos utilizando IoT y Machine Learning para optimizar la recolección urbana.',
    thumbnail: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800',
    category: 'Integrador',
    date: DateTime(2025, 5, 20),
    competencies: ['IoT', 'Machine Learning', 'Sustentabilidad'],
    quiz: _generateQuiz('Smart Eco System'),
  ),
  Project(
    id: '2',
    name: 'Cyber Samurai',
    description: 'Juego de acción lateral ambientado en un futuro ciberpunk con mecánicas de combate rápidas y precisas.',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800',
    category: 'Videojuegos',
    date: DateTime(2025, 6, 12),
    competencies: ['Unity', 'C#', 'Animación 2D'],
    quiz: _generateQuiz('Cyber Samurai'),
  ),
  Project(
    id: '3',
    name: 'Solar Health Tracker',
    description: 'Aplicación móvil que rastrea la exposición UV y recomienda el uso de protector solar basado en el tipo de piel.',
    thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800',
    category: 'Integrador',
    date: DateTime(2025, 5, 25),
    competencies: ['Mobile', 'HealthTech', 'Data Analysis'],
    quiz: _generateQuiz('Solar Health Tracker'),
  ),
  Project(
    id: '4',
    name: 'Neon Racer',
    description: 'Carreras futuristas con música synthwave y efectos visuales de partículas avanzadas.',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800',
    category: 'Videojuegos',
    date: DateTime(2025, 6, 15),
    competencies: ['Unreal Engine', 'Visual FX', 'Sound Design'],
    quiz: _generateQuiz('Neon Racer'),
  ),
  Project(
    id: '5',
    name: 'EduVR History',
    description: 'Plataforma educativa en Realidad Virtual que permite a los estudiantes visitar eventos históricos clave.',
    thumbnail: 'https://images.unsplash.com/photo-1478416272538-5f7e51dc5400?q=80&w=800',
    category: 'Integrador',
    date: DateTime(2025, 5, 30),
    competencies: ['VR', 'Education', '3D Modeling'],
    quiz: _generateQuiz('EduVR History'),
  ),
  Project(
    id: '6',
    name: 'Pixel Quest',
    description: 'RPG clásico de 8 bits con una narrativa profunda y sistema de combate por turnos.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800',
    category: 'Videojuegos',
    date: DateTime(2025, 6, 20),
    competencies: ['Pixel Art', 'Game Design', 'Narrative'],
    quiz: _generateQuiz('Pixel Quest'),
  ),
];

List<QuizQuestion> _generateQuiz(String projectName) {
  return [
    QuizQuestion(
      question: '¿Cuál es el objetivo principal de $projectName?',
      options: ['Resolver un problema social', 'Entretener al usuario', 'Generar ingresos', 'Investigación pura'],
      correctIndex: 0,
    ),
    QuizQuestion(
      question: '¿Qué tecnología es fundamental en este proyecto?',
      options: ['Cloud Computing', 'Hardware especializado', 'Algoritmos avanzados', 'Diseño de interfaz'],
      correctIndex: 2,
    ),
    QuizQuestion(
      question: '¿A qué categoría pertenece este proyecto?',
      options: ['Integrador', 'Videojuegos', 'Tesis', 'Práctica'],
      correctIndex: mockProjects.any((p) => p.name == projectName && p.category == 'Videojuegos') ? 1 : 0,
    ),
    QuizQuestion(
      question: '¿Cuál es el máximo score posible en una evaluación?',
      options: ['50', '100', '200', '10'],
      correctIndex: 1,
    ),
  ];
}
