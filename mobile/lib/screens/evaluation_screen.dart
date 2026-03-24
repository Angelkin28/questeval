import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/evaluation/models/session_model.dart';
import '../../features/evaluation/providers/evaluation_provider.dart';
import '../../theme/colors.dart';
import '../../theme/app_theme.dart';
import '../../providers/theme_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/data_provider.dart';
import '../../shared/widgets/project_video_player.dart';

class EvaluationScreen extends ConsumerStatefulWidget {
  const EvaluationScreen({super.key});

  @override
  ConsumerState<EvaluationScreen> createState() => _EvaluationScreenState();
}

class _EvaluationScreenState extends ConsumerState<EvaluationScreen>
    with SingleTickerProviderStateMixin {
  final Map<String, double> _scores = {};
  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;
  bool _initialized = false;
  SessionModel? _session;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeIn);
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _initScores(SessionModel session) {
    if (_initialized) return;
    _initialized = true;
    for (final c in session.criteria) {
      _scores[c.id] = 0.0;
    }
  }

  Future<void> _submit() async {
    if (_session == null) return;

    HapticFeedback.lightImpact();

    final authState = ref.read(authProvider);
    final guestName = authState.user?.fullName;

    await ref.read(evaluationProvider.notifier).submit(
          scores: _scores,
          guestName: guestName == 'Invitado' ? null : guestName,
        );

    if (!mounted) return;
    final state = ref.read(evaluationProvider);

    if (state is EvaluationSuccess) {
      // Invalidar providers para forzar recarga de los datos en ProjectsScreen
      ref.invalidate(projectsProvider);
      ref.invalidate(rankingProvider);
      ref.invalidate(statsProvider);
      
      context.pushReplacement('/evaluation/success');
    } else if (state is EvaluationError) {
      _showErrorSnackbar(state.message);
    }
  }

  void _showErrorSnackbar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final evalState = ref.watch(evaluationProvider);
    final theme = ref.watch(themeProvider);
    final isNeon = theme.category == AppCategory.videojuegos;
    final accentColor = isNeon ? AppColors.neonCyan : AppColors.gold;
    final isDark = theme.isDark || isNeon;

    // Extraer sesión del estado
    if (evalState is EvaluationSessionLoaded) {
      _session = evalState.session;
      _initScores(evalState.session);
    }

    if (_session == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Sesión no disponible'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/projects'),
                child: const Text('Volver a proyectos'),
              ),
            ],
          ),
        ),
      );
    }

    final session = _session!;
    final isSubmitting = evalState is EvaluationSubmitting;
    final totalScore =
        _scores.values.fold(0.0, (sum, v) => sum + v);

    return FadeTransition(
      opacity: _fadeAnim,
      child: Scaffold(
        backgroundColor: isDark ? AppColors.darkBg : AppColors.cream,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new),
            onPressed: () {
              ref.read(evaluationProvider.notifier).reset();
              context.pop();
            },
          ),
          title: const Text(
            'Evaluación',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
        ),
        body: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 140),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Cabecera del proyecto ──────────────────────────
                  _ProjectHeader(session: session, accentColor: accentColor),
                  const SizedBox(height: 28),

                  // ── Criterios con sliders ──────────────────────────
                  Text(
                    'Criterios de evaluación',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Mueve cada slider para asignar tu puntuación',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white54 : Colors.black45,
                    ),
                  ),
                  const SizedBox(height: 20),

                  ...session.criteria.asMap().entries.map((entry) {
                    final i = entry.key;
                    final c = entry.value;
                    return _CriterionCard(
                      criterion: c,
                      score: _scores[c.id] ?? 0.0,
                      accentColor: accentColor,
                      index: i + 1,
                      isDark: isDark,
                      onChanged: (val) =>
                          setState(() => _scores[c.id] = val),
                    );
                  }),

                  const SizedBox(height: 28),



                  // ── Puntaje total ──────────────────────────────────
                  _TotalScoreBar(
                    total: totalScore,
                    maxTotal: session.totalMaxScore.toDouble(),
                    accentColor: accentColor,
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            // ── Botón flotante de envío ────────────────────────────
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: _SubmitButton(
                accentColor: accentColor,
                isSubmitting: isSubmitting,
                onPressed: _submit,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Cabecera del proyecto
// ─────────────────────────────────────────────────────────────────────

class _ProjectHeader extends StatelessWidget {
  final SessionModel session;
  final Color accentColor;

  const _ProjectHeader({required this.session, required this.accentColor});

  @override
  Widget build(BuildContext context) {
    final project = session.project;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: accentColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accentColor.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '📋 ${session.criteria.length} criterios',
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            project.name,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              height: 1.2,
            ),
          ),
          if (project.videoUrl != null && project.videoUrl!.isNotEmpty) ...[
            const SizedBox(height: 16),
            ProjectVideoPlayer(
              videoUrl: project.videoUrl!,
              accentColor: accentColor,
            ),
            const SizedBox(height: 16),
          ],
          if (project.description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              project.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
                height: 1.4,
              ),
            ),
          ],
          if (project.teamMembers.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: project.teamMembers
                  .map((m) => Chip(
                        label: Text(
                          m,
                          style: const TextStyle(fontSize: 11),
                        ),
                        avatar: const Icon(Icons.person_outline, size: 14),
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        materialTapTargetSize:
                            MaterialTapTargetSize.shrinkWrap,
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Tarjeta de criterio con slider
// ─────────────────────────────────────────────────────────────────────

class _CriterionCard extends StatelessWidget {
  final CriteriaInfo criterion;
  final double score;
  final Color accentColor;
  final int index;
  final bool isDark;
  final ValueChanged<double> onChanged;

  const _CriterionCard({
    required this.criterion,
    required this.score,
    required this.accentColor,
    required this.index,
    required this.isDark,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final pct = criterion.maxScore > 0 ? score / criterion.maxScore : 0.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF1E1E1E)
            : Colors.white.withOpacity(0.85),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          )
        ],
        border: Border.all(
          color: pct > 0
              ? accentColor.withOpacity(0.3)
              : Colors.transparent,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Título + puntaje
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '$index',
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      criterion.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (criterion.description.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        criterion.description,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white54 : Colors.black45,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // Score badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(pct > 0 ? 0.15 : 0.06),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${score.toInt()} / ${criterion.maxScore}',
                  style: TextStyle(
                    color: pct > 0 ? accentColor : Colors.grey,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          // Slider
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              thumbShape:
                  const RoundSliderThumbShape(enabledThumbRadius: 10),
              overlayShape:
                  const RoundSliderOverlayShape(overlayRadius: 20),
              trackHeight: 5,
              activeTrackColor: accentColor,
              inactiveTrackColor: accentColor.withOpacity(0.15),
              thumbColor: accentColor,
              overlayColor: accentColor.withOpacity(0.2),
              valueIndicatorColor: accentColor,
              valueIndicatorTextStyle: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
            child: Slider(
              value: score.clamp(0.0, criterion.maxScore.toDouble()),
              min: 0,
              max: criterion.maxScore.toDouble(),
              divisions: criterion.maxScore,
              label: score.toInt().toString(),
              onChanged: onChanged,
            ),
          ),

          // Etiquetas verbales
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Nivel bajo',
                  style: TextStyle(
                    fontSize: 10,
                    color: isDark ? Colors.white38 : Colors.black38,
                  ),
                ),
                Text(
                  'Nivel excelente',
                  style: TextStyle(
                    fontSize: 10,
                    color: isDark ? Colors.white38 : Colors.black38,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


// ─────────────────────────────────────────────────────────────────────
// Barra de puntaje total
// ─────────────────────────────────────────────────────────────────────

class _TotalScoreBar extends StatelessWidget {
  final double total;
  final double maxTotal;
  final Color accentColor;
  final bool isDark;

  const _TotalScoreBar({
    required this.total,
    required this.maxTotal,
    required this.accentColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final pct = maxTotal > 0 ? (total / maxTotal).clamp(0.0, 1.0) : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: accentColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Puntaje total',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                '${total.toInt()} / ${maxTotal.toInt()} pts',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: accentColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: pct,
              backgroundColor: accentColor.withOpacity(0.15),
              valueColor: AlwaysStoppedAnimation<Color>(accentColor),
              minHeight: 10,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Botón de envío
// ─────────────────────────────────────────────────────────────────────

class _SubmitButton extends StatelessWidget {
  final Color accentColor;
  final bool isSubmitting;
  final VoidCallback onPressed;

  const _SubmitButton({
    required this.accentColor,
    required this.isSubmitting,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: accentColor.withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        height: 58,
        child: ElevatedButton(
          onPressed: isSubmitting ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: accentColor,
            foregroundColor: Colors.white,
            disabledBackgroundColor: accentColor.withOpacity(0.6),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
          ),
          child: isSubmitting
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.send_rounded, size: 20),
                    SizedBox(width: 10),
                    Text(
                      'ENVIAR EVALUACIÓN',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
