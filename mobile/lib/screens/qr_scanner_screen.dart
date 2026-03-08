import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../features/evaluation/providers/evaluation_provider.dart';
import '../../theme/colors.dart';
import '../../theme/app_theme.dart';
import '../../providers/theme_provider.dart';

class QrScannerScreen extends ConsumerStatefulWidget {
  const QrScannerScreen({super.key});

  @override
  ConsumerState<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends ConsumerState<QrScannerScreen>
    with TickerProviderStateMixin {
  MobileScannerController? _cameraController;
  bool _hasPermission = false;
  bool _isProcessing = false;

  // ── Animaciones del visor ─────────────────────────────────────
  late AnimationController _pulseController;
  late AnimationController _scanLineController;
  late Animation<double> _pulseAnim;
  late Animation<double> _scanLineAnim;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _requestCameraPermission();
  }

  void _setupAnimations() {
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _scanLineController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _scanLineAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _scanLineController, curve: Curves.linear),
    );
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();
    if (mounted) {
      setState(() => _hasPermission = status.isGranted);
      if (status.isGranted) {
        _cameraController = MobileScannerController(
          detectionSpeed: DetectionSpeed.noDuplicates,
          facing: CameraFacing.back,
        );
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scanLineController.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  // ── Manejo del QR detectado ─────────────────────────────────────
  Future<void> _onQrDetected(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    setState(() => _isProcessing = true);
    await _cameraController?.stop();
    HapticFeedback.mediumImpact();

    final qrToken = barcode!.rawValue!;
    await ref.read(evaluationProvider.notifier).verifySession(qrToken);

    if (!mounted) return;
    final state = ref.read(evaluationProvider);
    if (state is EvaluationSessionLoaded) {
      context.push('/evaluation');
    } else if (state is EvaluationError) {
      _showError(state);
    }
  }

  // ── Modo desarrollo: saltar escaneo ────────────────────────────
  Future<void> _devSkip() async {
    setState(() => _isProcessing = true);
    await ref.read(evaluationProvider.notifier).verifySession('DEV_SKIP_QR');
    if (!mounted) return;
    final state = ref.read(evaluationProvider);
    if (state is EvaluationSessionLoaded) {
      context.push('/evaluation');
    } else if (state is EvaluationError) {
      _showError(state);
    }
  }

  void _showError(EvaluationError error) {
    setState(() => _isProcessing = false);
    _cameraController?.start();

    final (icon, color, action) = switch (error.type) {
      EvaluationErrorType.alreadyEvaluated => (
          Icons.check_circle_outline,
          Colors.green,
          () => context.go('/projects'),
        ),
      EvaluationErrorType.qrExpired => (
          Icons.timer_off_outlined,
          Colors.orange,
          null,
        ),
      _ => (Icons.error_outline, Colors.red, null),
    };

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _ErrorSheet(
        icon: icon,
        color: color,
        message: error.message,
        actionLabel: error.type == EvaluationErrorType.alreadyEvaluated
            ? 'Ver proyectos'
            : 'Intentar de nuevo',
        onAction: action ?? () => Navigator.pop(context),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeProvider);
    final isNeon = theme.category == AppCategory.videojuegos;
    final accentColor = isNeon ? AppColors.neonCyan : AppColors.gold;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Escanear QR',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: _hasPermission ? _buildScanner(accentColor) : _buildPermissionDenied(),
    );
  }

  // ── Vista principal del escáner ────────────────────────────────
  Widget _buildScanner(Color accentColor) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Cámara
        if (_cameraController != null)
          MobileScanner(
            controller: _cameraController!,
            onDetect: _onQrDetected,
          ),

        // Overlay oscuro con ventana recortada
        _ScannerOverlay(accentColor: accentColor),

        // Marco animado + línea de escaneo
        Center(
          child: AnimatedBuilder(
            animation: Listenable.merge([_pulseAnim, _scanLineAnim]),
            builder: (context, _) {
              return _ViewfinderBox(
                accentColor: accentColor,
                pulseValue: _pulseAnim.value,
                scanLinePosition: _scanLineAnim.value,
              );
            },
          ),
        ),

        // Texto instructivo
        Positioned(
          bottom: 140,
          left: 0,
          right: 0,
          child: Column(
            children: [
              const Text(
                'Apunta al código QR del stand',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'El QR se detectará automáticamente',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),

        // Indicador de carga durante procesamiento
        if (_isProcessing)
          Container(
            color: Colors.black.withOpacity(0.7),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: accentColor, strokeWidth: 3),
                  const SizedBox(height: 16),
                  const Text(
                    'Verificando QR...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            ),
          ),

        // Botón modo dev (solo en debug builds)
        if (kDebugMode)
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: TextButton.icon(
                onPressed: _isProcessing ? null : _devSkip,
                icon: const Icon(Icons.developer_mode,
                    color: Colors.white54, size: 18),
                label: const Text(
                  'Modo desarrollo',
                  style: TextStyle(color: Colors.white54, fontSize: 13),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildPermissionDenied() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.camera_alt_outlined, size: 72, color: Colors.white54),
            const SizedBox(height: 24),
            const Text(
              'Permiso de cámara requerido',
              style: TextStyle(
                  color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'La app necesita acceso a la cámara para escanear el código QR del stand.',
              style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 15),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () async {
                await openAppSettings();
                await _requestCameraPermission();
              },
              icon: const Icon(Icons.settings),
              label: const Text('Abrir configuración'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Overlay oscuro con ventana transparente cuadrada
// ─────────────────────────────────────────────────────────────────────

class _ScannerOverlay extends StatelessWidget {
  final Color accentColor;
  const _ScannerOverlay({required this.accentColor});

  @override
  Widget build(BuildContext context) {
    const boxSize = 260.0;
    final screen = MediaQuery.of(context).size;
    final top = (screen.height - boxSize) / 2 - 40;
    final left = (screen.width - boxSize) / 2;

    return CustomPaint(
      painter: _OverlayPainter(
        cutoutRect: Rect.fromLTWH(left, top, boxSize, boxSize),
      ),
      child: const SizedBox.expand(),
    );
  }
}

class _OverlayPainter extends CustomPainter {
  final Rect cutoutRect;
  _OverlayPainter({required this.cutoutRect});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.black.withOpacity(0.65);
    final fullRect = Rect.fromLTWH(0, 0, size.width, size.height);
    final path = Path()
      ..addRect(fullRect)
      ..addRRect(RRect.fromRectAndRadius(cutoutRect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_OverlayPainter old) => old.cutoutRect != cutoutRect;
}

// ─────────────────────────────────────────────────────────────────────
// Caja del visor con esquinas animadas y línea de escaneo
// ─────────────────────────────────────────────────────────────────────

class _ViewfinderBox extends StatelessWidget {
  final Color accentColor;
  final double pulseValue;
  final double scanLinePosition;

  const _ViewfinderBox({
    required this.accentColor,
    required this.pulseValue,
    required this.scanLinePosition,
  });

  @override
  Widget build(BuildContext context) {
    const size = 260.0;
    const cornerLen = 28.0;
    const cornerWidth = 4.0;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          // Línea de escaneo animada
          Positioned(
            top: scanLinePosition * (size - 2),
            left: 8,
            right: 8,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    accentColor.withOpacity(0.8),
                    accentColor,
                    accentColor.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Esquinas del visor (pulse)
          Transform.scale(
            scale: pulseValue,
            child: CustomPaint(
              size: const Size(size, size),
              painter: _CornersPainter(
                color: accentColor,
                cornerLength: cornerLen,
                strokeWidth: cornerWidth,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CornersPainter extends CustomPainter {
  final Color color;
  final double cornerLength;
  final double strokeWidth;

  _CornersPainter({
    required this.color,
    required this.cornerLength,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final corners = [
      // Top-left
      [Offset(0, cornerLength), const Offset(0, 0), Offset(cornerLength, 0)],
      // Top-right
      [
        Offset(size.width - cornerLength, 0),
        Offset(size.width, 0),
        Offset(size.width, cornerLength)
      ],
      // Bottom-right
      [
        Offset(size.width, size.height - cornerLength),
        Offset(size.width, size.height),
        Offset(size.width - cornerLength, size.height)
      ],
      // Bottom-left
      [
        Offset(cornerLength, size.height),
        Offset(0, size.height),
        Offset(0, size.height - cornerLength)
      ],
    ];

    for (final pts in corners) {
      final path = Path()
        ..moveTo(pts[0].dx, pts[0].dy)
        ..lineTo(pts[1].dx, pts[1].dy)
        ..lineTo(pts[2].dx, pts[2].dy);
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_CornersPainter old) =>
      old.color != color || old.cornerLength != cornerLength;
}

// ─────────────────────────────────────────────────────────────────────
// Bottom sheet de error
// ─────────────────────────────────────────────────────────────────────

class _ErrorSheet extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  const _ErrorSheet({
    required this.icon,
    required this.color,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 40),
          ),
          const SizedBox(height: 20),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                onAction();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: color,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                actionLabel,
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
