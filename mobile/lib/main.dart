import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/router.dart';
import 'theme/app_theme.dart';
import 'providers/theme_provider.dart';
import 'providers/persistence_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final prefs = await SharedPreferences.getInstance();
  final persistence = PersistenceService(prefs);
  await persistence.initHive();

  runApp(
    ProviderScope(
      overrides: [
        persistenceProvider.overrideWithValue(persistence),
      ],
      child: const QuestEvalApp(),
    ),
  );
}

class QuestEvalApp extends ConsumerWidget {
  const QuestEvalApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeState = ref.watch(themeProvider);
    
    return MaterialApp.router(
      title: 'QuestEval',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(themeState.category, themeState.isDark),
      routerConfig: appRouter,
    );
  }
}
