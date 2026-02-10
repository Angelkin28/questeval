import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'theme/questeval_theme.dart';

void main() {
  runApp(const QuestEvalApp());
}

/// Punto de entrada de la aplicación QuestEval.
/// Usa el tema personalizado (beige/arena/crema) y la pantalla de login como home.
class QuestEvalApp extends StatelessWidget {
  const QuestEvalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'QuestEval',
      debugShowCheckedModeBanner: false,
      theme: QuestEvalTheme.questevalTheme,
      home: const LoginScreen(),
    );
  }
}
