import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models.dart';
import '../data/mock_data.dart';
import '../data/hive_service.dart';

// Theme Provider
enum AppThemeType { light, dark, videogame }

final themeTypeProvider = StateProvider<AppThemeType>((ref) => AppThemeType.light);

// Category Provider
final selectedCategoryProvider = StateProvider<String>((ref) => 'Integrador');

// Projects Provider
final projectsProvider = Provider<List<Project>>((ref) {
  final category = ref.watch(selectedCategoryProvider);
  return mockProjects.where((p) => p.category == category).toList();
});

// Evaluations Provider (cached evaluations)
final evaluationsProvider = StateNotifierProvider<EvaluationNotifier, Map<String, ProjectEvaluation>>((ref) {
  return EvaluationNotifier(ref.watch(hiveServiceProvider));
});

class EvaluationNotifier extends StateNotifier<Map<String, ProjectEvaluation>> {
  final HiveService _hiveService;
  EvaluationNotifier(this._hiveService) : super({}) {
    _loadAll();
  }

  void _loadAll() {
    // Logic to load from Hive and populate state
  }

  Future<void> save(ProjectEvaluation evaluation) async {
    await _hiveService.saveEvaluation(evaluation);
    state = {...state, evaluation.projectId: evaluation};
  }

  ProjectEvaluation? get(String projectId) => state[projectId] ?? _hiveService.getEvaluation(projectId);
}

// Global Ranking Provider
final rankingProvider = Provider<List<Map<String, dynamic>>>((ref) {
  final evals = ref.watch(evaluationsProvider);
  final list = evals.entries.map((e) {
    final project = mockProjects.firstWhere((p) => p.id == e.key);
    return {
      'project': project,
      'score': e.value.totalScore,
    };
  }).toList();
  
  list.sort((a, b) => (b['score'] as double).compareTo(a['score'] as double));
  return list;
});
