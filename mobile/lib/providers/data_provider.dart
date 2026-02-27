import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

final projectsProvider = FutureProvider<List<Project>>((ref) async {
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
    data: (projects) => projects.where((p) => p.type == category).toList(),
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
