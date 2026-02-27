import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import 'theme_provider.dart';
import 'data_provider.dart';

class PersistenceService {
  static const String evaluationsBox = 'evaluations_v2';
  static const String themeKey = 'is_dark';
  static const String categoryKey = 'category';

  final SharedPreferences prefs;

  PersistenceService(this.prefs);

  Future<void> initHive() async {
    await Hive.initFlutter();
    await Hive.openBox(evaluationsBox);
  }

  // Theme & Category
  bool getIsDark() => prefs.getBool(themeKey) ?? false;
  AppCategory getCategory() {
    final catIndex = prefs.getInt(categoryKey) ?? 0;
    return AppCategory.values[catIndex];
  }

  Future<void> saveTheme(bool isDark) async => prefs.setBool(themeKey, isDark);
  Future<void> saveCategory(AppCategory cat) async => prefs.setInt(categoryKey, cat.index);

  // Evaluations
  Future<void> saveEvaluation(Project project) async {
    final box = Hive.box(evaluationsBox);
    await box.put(project.id, {
      'score': project.score,
      'observations': project.observations,
      'criteriaScores': project.criteriaScores,
      'isEvaluated': project.isEvaluated,
    });
  }

  Map<String, dynamic>? getEvaluation(String id) {
    final box = Hive.box(evaluationsBox);
    final data = box.get(id);
    if (data == null) return null;
    return Map<String, dynamic>.from(data);
  }
}

final persistenceProvider = Provider<PersistenceService>((ref) {
  throw UnimplementedError('Initialize in ProviderScope');
});
