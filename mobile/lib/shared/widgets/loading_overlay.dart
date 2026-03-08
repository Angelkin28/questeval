import 'package:flutter/material.dart';

/// Overlay de carga semitransparente que bloquea interacción
/// durante operaciones asíncronas (submit, verify, etc).
///
/// Uso: envolver el body del Scaffold en un Stack:
/// ```dart
/// Stack(children: [
///   YourContent(),
///   if (isLoading) const LoadingOverlay(),
/// ])
/// ```
class LoadingOverlay extends StatelessWidget {
  final String? message;
  final Color? color;

  const LoadingOverlay({super.key, this.message, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withAlpha(140),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(80),
                blurRadius: 30,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(
                color: color ?? Theme.of(context).colorScheme.primary,
                strokeWidth: 3,
              ),
              if (message != null) ...[
                const SizedBox(height: 18),
                Text(
                  message!,
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
