import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

final projectsProvider = FutureProvider.autoDispose<List<Project>>((ref) async {
  ref.keepAlive(); // Mantener en caché pero permitir invalidación manual
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getProjects();
});

final criteriaProvider = FutureProvider<List<Criterion>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getCriteria();
});

final categoryFilterProvider = StateProvider<String>((ref) => 'Integrador');

final filteredProjectsProvider = Provider<List<Project>>((ref) {
  final projectsAsync = ref.watch(projectsProvider);
  final category = ref.watch(categoryFilterProvider);
  
  return projectsAsync.when(
    data: (projects) {
      final categoryProjects = projects.where((p) => p.type == category).toList();
      
      // Deduplicar proyectos por título
      final uniqueProjects = <String, Project>{};
      for (final p in categoryProjects) {
        final normalizedTitle = p.title.trim().toLowerCase();
        if (!uniqueProjects.containsKey(normalizedTitle)) {
          uniqueProjects[normalizedTitle] = p;
        } else {
          // Si hay duplicado, priorizamos el que esté evaluado, o en su defecto, el de creación más reciente
          final current = uniqueProjects[normalizedTitle]!;
          final isP_Evaluated = p.isEvaluated || p.isEvaluatedByUser || p.score != null;
          final isCurrent_Evaluated = current.isEvaluated || current.isEvaluatedByUser || current.score != null;
          
          if (isP_Evaluated && !isCurrent_Evaluated) {
             uniqueProjects[normalizedTitle] = p;
          } else if (isP_Evaluated == isCurrent_Evaluated) {
             // Priorizar el que tenga score más alto (calificación más reciente)
             final pScore = p.score ?? -1;
             final currentScore = current.score ?? -1;
             if (pScore > currentScore) {
               uniqueProjects[normalizedTitle] = p;
             } else if (pScore == currentScore && p.date.isAfter(current.date)) {
               // Si el score es igual, quedarse con el más reciente
               uniqueProjects[normalizedTitle] = p;
             }
          }
        }
      }
      
      return uniqueProjects.values.toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

// Ranking provider
final rankingProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, category) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getRankings(category);
});

// Best project provider for Analysis
final bestProjectProvider = Provider<Project?>((ref) {
  final projectsAsync = ref.watch(projectsProvider);
  return projectsAsync.when(
    data: (projects) {
      if (projects.isEmpty) return null;
      final evaluated = projects.where((p) => p.isEvaluated && p.score != null).toList();
      if (evaluated.isEmpty) return null;
      evaluated.sort((a, b) => (b.score ?? 0).compareTo(a.score ?? 0));
      return evaluated.first;
    },
    loading: () => null,
    error: (_, __) => null,
  );
});

final statsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getStats();
});

final projectDetailProvider = FutureProvider.family<Project, String>((ref, id) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getProjectById(id);
});
