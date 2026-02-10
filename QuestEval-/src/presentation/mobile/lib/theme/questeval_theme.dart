import 'package:flutter/material.dart';

/// Paleta de colores de QuestEval: tonos beige, arena y crema.
/// Pensada para una interfaz académica seria y legible.
class QuestEvalColors {
  QuestEvalColors._();

  /// Color primario (botones, acentos): beige/arena.
  static const Color primary = Color(0xFFB8A88A);

  /// Fondo general de la aplicación: crema claro.
  static const Color background = Color(0xFFF5F0E6);

  /// Superficie para cards e inputs: blanco roto.
  static const Color surface = Color(0xFFFAF8F4);

  /// Texto principal: marrón oscuro para alto contraste.
  static const Color onPrimary = Color(0xFF2C2825);
  static const Color onSurface = Color(0xFF2C2825);
  static const Color onBackground = Color(0xFF2C2825);

  /// Texto secundario: gris medio.
  static const Color onSurfaceVariant = Color(0xFF5C5652);

  /// Error: rojo apagado (no saturado).
  static const Color error = Color(0xFFA65D5D);
  static const Color onError = Color(0xFFFAF8F4);
}

/// Tema de la aplicación QuestEval.
/// Incluye ColorScheme, TextTheme, InputDecoration y ElevatedButton
/// con bordes redondeados y espaciado adecuado para móvil y kiosco.
class QuestEvalTheme {
  QuestEvalTheme._();

  static ThemeData get questevalTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: QuestEvalColors.primary,
        onPrimary: QuestEvalColors.onPrimary,
        surface: QuestEvalColors.surface,
        onSurface: QuestEvalColors.onSurface,
        surfaceContainerHighest: QuestEvalColors.surface,
        error: QuestEvalColors.error,
        onError: QuestEvalColors.onError,
        outline: QuestEvalColors.onSurfaceVariant,
      ),
      scaffoldBackgroundColor: QuestEvalColors.background,
      textTheme: _textTheme,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: QuestEvalColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: QuestEvalColors.onSurfaceVariant, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: QuestEvalColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: QuestEvalColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        hintStyle: _textTheme.bodyLarge?.copyWith(color: QuestEvalColors.onSurfaceVariant),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: QuestEvalColors.primary,
          foregroundColor: QuestEvalColors.onPrimary,
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: _textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  static const TextTheme _textTheme = TextTheme(
    headlineMedium: TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.w600,
      color: QuestEvalColors.onSurface,
      letterSpacing: -0.5,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w500,
      color: QuestEvalColors.onSurface,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.normal,
      color: QuestEvalColors.onSurface,
    ),
    bodySmall: TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.normal,
      color: QuestEvalColors.onSurfaceVariant,
    ),
  );
}
