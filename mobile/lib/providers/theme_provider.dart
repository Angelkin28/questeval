import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import 'persistence_provider.dart';

class ThemeState {
  final bool isDark;
  final AppCategory category;

  ThemeState({required this.isDark, required this.category});

  ThemeState copyWith({bool? isDark, AppCategory? category}) {
    return ThemeState(
      isDark: isDark ?? this.isDark,
      category: category ?? this.category,
    );
  }
}

class ThemeNotifier extends StateNotifier<ThemeState> {
  final PersistenceService _persistence;

  ThemeNotifier(this._persistence) 
    : super(ThemeState(
        isDark: _persistence.getIsDark(), 
        category: _persistence.getCategory(),
      ));

  void toggleDark() {
    final newVal = !state.isDark;
    state = state.copyWith(isDark: newVal);
    _persistence.saveTheme(newVal);
  }

  void setCategory(AppCategory cat) {
    state = state.copyWith(category: cat);
    _persistence.saveCategory(cat);
  }
}

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeState>((ref) {
  final persistence = ref.watch(persistenceProvider);
  return ThemeNotifier(persistence);
});
