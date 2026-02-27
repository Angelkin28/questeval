import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.gold,
      primary: AppColors.gold,
      onPrimary: Colors.white,
      surface: AppColors.cream,
      onSurface: AppColors.black,
      background: AppColors.cream,
    ),
    scaffoldBackgroundColor: AppColors.cream,
    textTheme: TextTheme(
      headlineLarge: TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold, color: AppColors.black),
      titleLarge: TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold, color: AppColors.black),
      bodyLarge: GoogleFonts.inter(color: AppColors.black),
      bodyMedium: GoogleFonts.inter(color: AppColors.black),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.gold,
      brightness: Brightness.dark,
      primary: AppColors.gold,
      onPrimary: Colors.black,
      surface: Color(0xFF1E1E1E),
      onSurface: Colors.white,
      background: AppColors.darkBg,
    ),
    scaffoldBackgroundColor: AppColors.darkBg,
    textTheme: TextTheme(
      headlineLarge: TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold, color: Colors.white),
      titleLarge: TextStyle(fontFamily: 'Georgia', fontWeight: FontWeight.bold, color: Colors.white),
      bodyLarge: GoogleFonts.inter(color: Colors.white70),
      bodyMedium: GoogleFonts.inter(color: Colors.white70),
    ),
  );

  static ThemeData videogameTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.neonGreen,
      secondary: AppColors.neonBlue,
      tertiary: AppColors.neonMagenta,
      surface: Color(0xFF0A0A0A),
      background: Colors.black,
    ),
    scaffoldBackgroundColor: Colors.black,
    textTheme: TextTheme(
      headlineLarge: const TextStyle(fontFamily: 'Courier New', fontWeight: FontWeight.bold, color: AppColors.neonGreen),
      titleLarge: const TextStyle(fontFamily: 'Courier New', fontWeight: FontWeight.bold, color: AppColors.neonBlue),
      bodyLarge: GoogleFonts.sourceCodePro(color: Colors.greenAccent),
      bodyMedium: GoogleFonts.sourceCodePro(color: Colors.greenAccent),
    ),
  );
}
