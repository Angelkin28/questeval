import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:carousel_slider/carousel_slider.dart';
import 'package:go_router/go_router.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../models/user_models.dart';
import '../theme/app_theme.dart';
import '../theme/colors.dart';
import '../models/models.dart';
import '../shared/widgets/project_video_player.dart';

class ProjectDetailScreen extends ConsumerStatefulWidget {
  final String projectId;
  final bool readOnly;
  const ProjectDetailScreen({super.key, required this.projectId, this.readOnly = false});

  @override
  ConsumerState<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends ConsumerState<ProjectDetailScreen> {
  final Map<String, double> _localScores = {};
  final TextEditingController _obsController = TextEditingController();
  final Map<int, int?> _quizAnswers = {};
  int _galleryIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    // Los datos se cargarán a través del provider en el build
    // Pero necesitamos inicializar las preguntas de comprensión si existen
  }

  void _submit() async {
    final total = _localScores.values.fold(0.0, (sum, v) => sum + v);
    final authState = ref.read(authProvider);
    final apiService = ref.read(apiServiceProvider);
    final criteria = ref.read(criteriaProvider).value ?? [];

    if (authState.user == null) return;

    try {
      final details = _localScores.entries.map((e) {
        final c = criteria.firstWhere((crit) => crit.label == e.key);
        return {
          'criteriaId': c.id,
          'criterionName': c.label,
          'score': e.value,
        };
      }).toList();

      await apiService.submitEvaluation(
        projectId: widget.projectId,
        userId: authState.user!.userId ?? authState.user!.id,
        details: details,
      );

      if (mounted) {
        ref.invalidate(projectsProvider);
        ref.invalidate(rankingProvider);
        ref.invalidate(statsProvider);
        
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Evaluación enviada con éxito')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al enviar evaluación: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final projectAsync = ref.watch(projectDetailProvider(widget.projectId));
    final criteriaAsync = ref.watch(criteriaProvider);
    final theme = ref.watch(themeProvider);
    final isNeon = theme.category == AppCategory.videojuegos;
    final accentColor = isNeon ? AppColors.neonCyan : AppColors.gold;

    return projectAsync.when(
      data: (project) {
        // Inicializar scores locales si están vacíos
        if (_localScores.isEmpty) {
          criteriaAsync.whenData((criteria) {
            for (final c in criteria) {
              _localScores[c.label] = project.criteriaScores?[c.label] ?? 0.0;
            }
            if (_obsController.text.isEmpty) {
              _obsController.text = project.observations ?? '';
            }
          });
        }

        return Scaffold(
          appBar: AppBar(title: Text(project.title)),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildVideoSection(accentColor, project.videoUrl),
                const SizedBox(height: 30),
                _buildGallery(project, accentColor),
                const SizedBox(height: 30),
                const Text('Descripción', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 10),
                Text(
                  project.description.isNotEmpty ? project.description : (project.observations ?? 'Sin descripción disponible.'),
                  style: const TextStyle(color: Colors.grey, height: 1.5),
                ),
                const SizedBox(height: 30),
                if (project.objectives.isNotEmpty) ...[
                  const Text('Objetivos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 10),
                  ...project.objectives.map((obj) => Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(top: 6.0, right: 8.0),
                              child: Icon(Icons.circle, size: 8, color: accentColor),
                            ),
                            Expanded(child: Text(obj, style: const TextStyle(color: Colors.grey, height: 1.4))),
                          ],
                        ),
                      )),
                  const SizedBox(height: 30),
                ],
                if (project.teamMembers.isNotEmpty) ...[
                  const Text('Integrantes del Equipo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: project.teamMembers.map((member) => Chip(
                          avatar: Icon(Icons.person, size: 16, color: theme.isDark ? Colors.white : Colors.black87),
                          label: Text(member, style: const TextStyle(fontSize: 13)),
                          backgroundColor: theme.isDark ? Colors.grey[850] : Colors.grey[100],
                          side: BorderSide(color: Colors.grey.withOpacity(0.3)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        )).toList(),
                  ),
                  const SizedBox(height: 30),
                ],
                if (project.technologies.isNotEmpty) ...[
                  const Text('Tecnologías Usadas', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: project.technologies.map((tech) => Chip(
                          label: Text(tech, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          backgroundColor: theme.isDark ? Colors.grey[850] : Colors.grey[200],
                          side: BorderSide.none,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        )).toList(),
                  ),
                  const SizedBox(height: 30),
                ],
                if (project.questions.isNotEmpty) ...[
                  const Text('Preguntas de Comprensión', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 15),
                  ...project.questions.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final q = entry.value;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(q.question, style: const TextStyle(fontWeight: FontWeight.w500)),
                            const SizedBox(height: 10),
                            ...q.options.asMap().entries.map((optEntry) {
                              final optIdx = optEntry.key;
                              final optText = optEntry.value;
                              return RadioListTile<int>(
                                title: Text(optText),
                                value: optIdx,
                                groupValue: _quizAnswers[idx],
                                onChanged: widget.readOnly ? null : (val) => setState(() => _quizAnswers[idx] = val),
                                dense: true,
                                activeColor: accentColor,
                              );
                            }),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 30),
                ],
                // ── MODO SOLO-LECTURA: Ocultar criterios interactivos ──────
                if (!widget.readOnly) ...[
                  const Text('Criterios de Evaluación', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                  const SizedBox(height: 20),
                  if (criteriaAsync.hasValue)
                    ...criteriaAsync.value!.map((c) => _buildSlider(c, accentColor)),
                  const SizedBox(height: 30),
                  TextField(
                    controller: _obsController,
                    enabled: !widget.readOnly,
                    maxLines: 4,
                    decoration: InputDecoration(
                      labelText: 'Comentarios del revisor',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
                // ── Botón evaluar vía QR (visitantes de feria) ──────
                if (widget.readOnly)
                  _QrEvaluateButton(
                    accentColor: accentColor,
                    projectName: project.title,
                  ),
                const SizedBox(height: 16),
                if (!widget.readOnly)
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: OutlinedButton(
                      onPressed: _submit,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: accentColor,
                        side: BorderSide(color: accentColor),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      child: const Text('EVALUAR (Vista Web)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                const SizedBox(height: 50),
              ],
            ),
          ),
        );
      },
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (err, _) => Scaffold(body: Center(child: Text('Error: $err'))),
    );
  }

  Widget _buildVideoSection(Color accent, String? videoUrl) {
    if (videoUrl == null || videoUrl.isEmpty) {
      return Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.black87,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.video_library, size: 40, color: accent.withOpacity(0.5)),
              const SizedBox(height: 8),
              Text(
                'Sin video disponible',
                style: TextStyle(color: accent.withOpacity(0.5)),
              )
            ],
          ),
        ),
      );
    }
    
    return ProjectVideoPlayer(
      videoUrl: videoUrl,
      accentColor: accent,
    );
  }

  Widget _buildGallery(Project project, Color accentColor) {
    final List<String> images = project.galleryImages.isNotEmpty
        ? project.galleryImages
        : (project.thumbnailUrl != null ? [project.thumbnailUrl!] : []);

    if (images.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        // Main Image Area
        Container(
          width: double.infinity,
          height: 200,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withOpacity(0.2)),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
          ),
          child: Stack(
            children: [
              Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: Image.network(
                      images[_galleryIndex],
                      key: ValueKey<int>(_galleryIndex),
                      fit: BoxFit.contain,
                      width: double.infinity,
                      height: double.infinity,
                    ),
                  ),
                ),
              ),
              if (images.length > 1) ...[
                Align(
                  alignment: Alignment.centerLeft,
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withOpacity(0.5),
                      radius: 16,
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.chevron_left, color: Colors.white, size: 20),
                        onPressed: () {
                          setState(() {
                            _galleryIndex = (_galleryIndex - 1 + images.length) % images.length;
                          });
                        },
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withOpacity(0.5),
                      radius: 16,
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.chevron_right, color: Colors.white, size: 20),
                        onPressed: () {
                          setState(() {
                            _galleryIndex = (_galleryIndex + 1) % images.length;
                          });
                        },
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: images.asMap().entries.map((entry) {
                        return GestureDetector(
                          onTap: () => setState(() => _galleryIndex = entry.key),
                          child: Container(
                            width: _galleryIndex == entry.key ? 16.0 : 6.0,
                            height: 6.0,
                            margin: const EdgeInsets.symmetric(horizontal: 2.0),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(4),
                              color: Colors.white.withOpacity(_galleryIndex == entry.key ? 1.0 : 0.5),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        // Thumbnails Strip
        if (images.length > 1)
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Row(
              children: images.asMap().entries.map((entry) {
                final isSelected = _galleryIndex == entry.key;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _galleryIndex = entry.key),
                    child: Container(
                      height: 50,
                      margin: EdgeInsets.only(right: entry.key == images.length - 1 ? 0 : 4.0),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? accentColor : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 200),
                          opacity: isSelected ? 1.0 : 0.5,
                          child: Image.network(
                            entry.value,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildSlider(Criterion c, Color accent) {
    final value = _localScores[c.label] ?? 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(c.label, style: const TextStyle(fontWeight: FontWeight.w500))),
              Text('${value.toStringAsFixed(1)} / ${c.max.toInt()}', style: TextStyle(color: accent, fontWeight: FontWeight.bold)),
            ],
          ),
          Slider(
            value: value > c.max ? c.max : value,
            max: c.max,
            divisions: c.max > 0 ? (c.max * 2).toInt() : 1,
            activeColor: accent,
            label: value.toStringAsFixed(1),
            onChanged: widget.readOnly ? null : (val) => setState(() => _localScores[c.label] = val),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Botón QR para evaluar (visitantes de feria — modo móvil)
// ─────────────────────────────────────────────────────────────────────

class _QrEvaluateButton extends StatelessWidget {
  final Color accentColor;
  final String projectName;

  const _QrEvaluateButton({
    required this.accentColor,
    required this.projectName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            accentColor,
            accentColor.withAlpha(180),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: accentColor.withAlpha(100),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/scan'),
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(40),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Evaluar este proyecto',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Escanea el QR del stand para comenzar',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Colors.white70,
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

