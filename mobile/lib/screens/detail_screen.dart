import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../models/user_models.dart';
import '../theme/app_theme.dart';
import '../theme/colors.dart';
import '../models/models.dart';

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
                _buildVideoSection(accentColor),
                const SizedBox(height: 30),
                _buildGallery(),
                const SizedBox(height: 30),
                const Text('Descripción', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 10),
                Text(
                  project.observations ?? 'Este proyecto busca innovar en su área mediante la aplicación de tecnologías de vanguardia y un diseño centrado en el usuario.',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 30),
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
                const SizedBox(height: 40),
                if (!widget.readOnly)
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accentColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      child: const Text('ENVIAR EVALUACIÓN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
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

  Widget _buildVideoSection(Color accent) {
    return GestureDetector(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reproduciendo video de 30 segundos (placeholder)')),
      ),
      child: Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.black87,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(child: Icon(Icons.play_circle_fill, size: 80, color: accent.withOpacity(0.8))),
      ),
    );
  }

  Widget _buildGallery() {
    return CarouselSlider(
      options: CarouselOptions(height: 180, enlargeCenterPage: true, autoPlay: true),
      items: [110, 111, 112, 113].map((id) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Image.network('https://picsum.photos/id/$id/400/300', fit: BoxFit.cover, width: double.infinity),
        );
      }).toList(),
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
