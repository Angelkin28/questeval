import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/evaluation/providers/evaluation_provider.dart';
import '../../theme/colors.dart';
import '../../theme/app_theme.dart';
import '../../providers/theme_provider.dart';

class EvaluationSuccessScreen extends ConsumerStatefulWidget {
  const EvaluationSuccessScreen({super.key});

  @override
  ConsumerState<EvaluationSuccessScreen> createState() =>
      _EvaluationSuccessScreenState();
}

class _EvaluationSuccessScreenState
    extends ConsumerState<EvaluationSuccessScreen>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _fadeController;
  late AnimationController _particleController;

  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;
  late Animation<double> _particleAnim;

  @override
  void initState() {
    super.initState();

    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _particleController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    _scaleAnim = CurvedAnimation(
      parent: _scaleController,
      curve: Curves.elasticOut,
    );
    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeIn);
    _particleAnim = _particleController;

    // Arrancar animaciones en cadena
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) _scaleController.forward();
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _fadeController.forward();
    });
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _fadeController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  void _goToProjects() {
    ref.read(evaluationProvider.notifier).reset();
    context.go('/projects');
  }

  void _scanAnother() {
    ref.read(evaluationProvider.notifier).reset();
    context.go('/scan');
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeProvider);
    final isNeon = theme.category == AppCategory.videojuegos;
    final accentColor = isNeon ? AppColors.neonCyan : AppColors.gold;
    final isDark = theme.isDark || isNeon;
    final bgColor = isDark ? AppColors.darkBg : AppColors.cream;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (_, __) => _goToProjects(),
      child: Scaffold(
        backgroundColor: bgColor,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Partículas de fondo
            AnimatedBuilder(
              animation: _particleAnim,
              builder: (_, __) => CustomPaint(
                painter: _ParticlePainter(
                  progress: _particleAnim.value,
                  color: accentColor,
                ),
              ),
            ),

            // Contenido principal
            SafeArea(
              child: FadeTransition(
                opacity: _fadeAnim,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Spacer(flex: 2),

                      // ── Ícono de éxito animado ──────────────────
                      ScaleTransition(
                        scale: _scaleAnim,
                        child: Container(
                          width: 130,
                          height: 130,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: accentColor.withOpacity(0.12),
                            border: Border.all(
                              color: accentColor.withOpacity(0.4),
                              width: 2.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: accentColor.withOpacity(0.3),
                                blurRadius: 40,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.check_rounded,
                            size: 72,
                            color: accentColor,
                          ),
                        ),
                      ),

                      const SizedBox(height: 36),

                      // ── Título ──────────────────────────────────
                      Text(
                        '¡Evaluación enviada!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : AppColors.black,
                          height: 1.2,
                        ),
                      ),

                      const SizedBox(height: 14),

                      Text(
                        'Tu evaluación ha sido registrada exitosamente.\n¡Gracias por participar en la feria!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          color: isDark ? Colors.white60 : Colors.black54,
                          height: 1.55,
                        ),
                      ),

                      const SizedBox(height: 8),

                      // ── Badge de confirmación ───────────────────
                      Container(
                        margin: const EdgeInsets.symmetric(vertical: 24),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: accentColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: accentColor.withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.verified_outlined,
                              color: accentColor,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                'Registrado · Solo 1 voto por dispositivo',
                                style: TextStyle(
                                  color: accentColor,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.visible,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Spacer(flex: 2),

                      // ── Botones de acción ───────────────────────
                      SizedBox(
                        width: double.infinity,
                        height: 58,
                        child: ElevatedButton.icon(
                          onPressed: _scanAnother,
                          icon: const Icon(Icons.qr_code_scanner, size: 22),
                          label: const Text(
                            'Evaluar otro proyecto',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: accentColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: OutlinedButton.icon(
                          onPressed: _goToProjects,
                          icon: Icon(
                            Icons.grid_view_rounded,
                            size: 20,
                            color: accentColor,
                          ),
                          label: Text(
                            'Ver todos los proyectos',
                            style: TextStyle(
                              color: accentColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: accentColor.withOpacity(0.5),
                              width: 1.5,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Partículas flotantes de fondo
// ─────────────────────────────────────────────────────────────────────

class _ParticlePainter extends CustomPainter {
  final double progress;
  final Color color;

  _ParticlePainter({required this.progress, required this.color});

  // Posiciones fijas de partículas (pseudo-aleatorias)
  static const _positions = [
    [0.12, 0.15],
    [0.85, 0.08],
    [0.25, 0.82],
    [0.75, 0.75],
    [0.45, 0.12],
    [0.60, 0.90],
    [0.08, 0.55],
    [0.92, 0.50],
    [0.35, 0.40],
    [0.68, 0.30],
  ];

  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < _positions.length; i++) {
      final pos = _positions[i];
      final phase = (progress + i * 0.1) % 1.0;
      final y = pos[1] - phase * 0.3;
      final opacity = (1.0 - phase).clamp(0.0, 1.0) * 0.35;

      if (opacity <= 0) continue;

      final paint = Paint()
        ..color = color.withOpacity(opacity)
        ..style = PaintingStyle.fill;

      final radius = 3.0 + (i % 3) * 2.0;
      canvas.drawCircle(
        Offset(pos[0] * size.width, y * size.height),
        radius,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_ParticlePainter old) => old.progress != progress;
}
