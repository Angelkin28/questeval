import 'package:flutter/material.dart';
import '../../theme/colors.dart';
import '../../theme/app_theme.dart';

/// Widget reutilizable de banner de error en contextos donde no
/// aplica un BottomSheet (dentro de un Scaffold con contenido).
///
/// Uso:
/// ```dart
/// ErrorBanner(
///   message: 'Sin conexión a internet',
///   type: ErrorBannerType.network,
///   onRetry: () => ref.invalidate(someProvider),
/// )
/// ```
enum ErrorBannerType { network, auth, notFound, generic }

class ErrorBanner extends StatelessWidget {
  final String message;
  final ErrorBannerType type;
  final String? retryLabel;
  final VoidCallback? onRetry;

  const ErrorBanner({
    super.key,
    required this.message,
    this.type = ErrorBannerType.generic,
    this.retryLabel,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (type) {
      ErrorBannerType.network =>
        (Icons.wifi_off_rounded, Colors.orange.shade700),
      ErrorBannerType.auth => (Icons.lock_outline_rounded, Colors.red.shade700),
      ErrorBannerType.notFound =>
        (Icons.search_off_rounded, Colors.blue.shade700),
      ErrorBannerType.generic =>
        (Icons.error_outline_rounded, Colors.red.shade700),
    };

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 52, color: color),
            ),
            const SizedBox(height: 20),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                height: 1.5,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text(retryLabel ?? 'Reintentar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: color,
                  side: BorderSide(color: color.withAlpha(128)),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Banner compacto para la parte superior de una pantalla (no ocupa toda la pantalla).
class CompactErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback? onDismiss;

  const CompactErrorBanner({super.key, required this.message, this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.red.shade900.withAlpha(230),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded,
              color: Colors.amber, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.white, fontSize: 13),
            ),
          ),
          if (onDismiss != null)
            GestureDetector(
              onTap: onDismiss,
              child: const Icon(Icons.close, color: Colors.white54, size: 18),
            ),
        ],
      ),
    );
  }
}
