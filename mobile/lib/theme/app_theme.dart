import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

enum AppCategory { integrador, videojuegos }

class AppTheme {
  static ThemeData getTheme(AppCategory category, bool isDark) {
    if (category == AppCategory.videojuegos) {
      return _buildGameTheme(isDark);
    }
    return _buildIntegradorTheme(isDark);
  }

  static ThemeData _buildIntegradorTheme(bool isDark) {
    final base = isDark ? ThemeData.dark() : ThemeData.light();
    return base.copyWith(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.gold,
        primary: AppColors.gold,
        onPrimary: Colors.white,
        surface: isDark ? const Color(0xFF1E1E1B) : AppColors.cream,
        background: isDark ? AppColors.darkBg : AppColors.cream,
        brightness: isDark ? Brightness.dark : Brightness.light,
      ),
      scaffoldBackgroundColor: isDark ? AppColors.darkBg : AppColors.cream,
      textTheme: GoogleFonts.poppinsTextTheme(base.textTheme).copyWith(
        displayLarge: const TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold),
        titleLarge: const TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Georgia',
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : AppColors.black,
        ),
      ),
    );
  }

  static ThemeData _buildGameTheme(bool isDark) {
    if (!isDark) return _buildIntegradorTheme(false); // Same design as integrador in light mode
    
    final base = ThemeData.dark();
    return base.copyWith(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: Colors.black,
      colorScheme: ColorScheme.dark(
        primary: AppColors.neonGreen,
        secondary: AppColors.neonCyan,
        tertiary: AppColors.neonPink,
        surface: const Color(0xFF0D0D0D),
      ),
      textTheme: GoogleFonts.poppinsTextTheme(base.textTheme).copyWith(
        displayLarge: TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold, color: AppColors.neonGreen),
        titleLarge: TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold, color: AppColors.neonCyan),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        titleTextStyle: TextStyle(
          fontFamily: 'Georgia',
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: AppColors.neonPink,
        ),
      ),
    );
  }

  // Helper for neon glow effects
  static List<BoxShadow> neonGlow(Color color) {
    return [
      BoxShadow(
        color: color.withOpacity(0.5),
        blurRadius: 10,
        spreadRadius: 2,
      ),
      BoxShadow(
        color: color.withOpacity(0.3),
        blurRadius: 20,
        spreadRadius: 4,
      ),
    ];
  }
}
