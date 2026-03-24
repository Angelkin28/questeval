import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:carousel_slider/carousel_slider.dart';
import '../../core/providers.dart';
import '../../data/models.dart';
import '../../data/mock_data.dart';
import '../../core/app_colors.dart';

class ProjectDetailScreen extends ConsumerStatefulWidget {
  final String projectId;
  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  ConsumerState<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends ConsumerState<ProjectDetailScreen> {
  final Map<String, double> _scores = {};
  final List<int?> _quizAnswers = List.filled(4, null);
  final TextEditingController _obsController = TextEditingController();
  int _galleryIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final existing = ref.read(evaluationsProvider)[widget.projectId];
      if (existing != null) {
        setState(() {
          _scores.addAll(existing.scores);
          _obsController.text = existing.observations;
        });
      }
    });
  }

  void _submitEvaluation() async {
    double total = _scores.values.fold(0, (sum, val) => sum + val);
    final evaluation = ProjectEvaluation(
      projectId: widget.projectId,
      scores: _scores,
      observations: _obsController.text,
      totalScore: total,
      quizResults: _quizAnswers.map((a) => a ?? -1).toList(),
    );

    await ref.read(evaluationsProvider.notifier).save(evaluation);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Evaluación guardada: $total puntos')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final project = mockProjects.firstWhere((p) => p.id == widget.projectId);

    final isNeon = project.type == 'Videojuegos';
    return Scaffold(
      appBar: AppBar(title: Text(project.title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildGallery(project),
            const SizedBox(height: 20),
            const Text('DESCRIPCIÓN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey, letterSpacing: 1.2)),
            const SizedBox(height: 8),
            Text(project.description, style: const TextStyle(fontSize: 15, height: 1.5)),
            const SizedBox(height: 24),
            if (project.objectives.isNotEmpty) ...[
              const Text('OBJETIVOS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey, letterSpacing: 1.2)),
              const SizedBox(height: 12),
              ...project.objectives.map((obj) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 6.0, right: 10.0),
                      child: Icon(Icons.circle, size: 8, color: AppColors.gold),
                    ),
                    Expanded(child: Text(obj, style: const TextStyle(fontSize: 14))),
                  ],
                ),
              )),
              const SizedBox(height: 24),
            ],
            if (project.technologies.isNotEmpty) ...[
              const Text('HERRAMIENTAS & TECNOLOGÍAS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey, letterSpacing: 1.2)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: project.technologies.map((tech) => Chip(
                  label: Text(tech, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  backgroundColor: Colors.grey[200],
                  side: BorderSide.none,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                )).toList(),
              ),
              const SizedBox(height: 30),
            ],
            if (project.teamMembers.isNotEmpty) ...[
              const Text('INTEGRANTES DEL EQUIPO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey, letterSpacing: 1.2)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: project.teamMembers.map((member) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.grey.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircleAvatar(
                        radius: 12,
                        backgroundColor: AppColors.gold,
                        child: Icon(Icons.person, size: 16, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      Text(member, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    ],
                  ),
                )).toList(),
              ),
              const SizedBox(height: 30),
            ],
            _buildVideoPlaceholder(),
            const SizedBox(height: 40),
            const Text('QUIZ DEL PROYECTO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, fontFamily: 'Georgia')),
            const SizedBox(height: 20),
            ...List.generate(project.quiz.length, (i) => _buildQuizItem(project.quiz[i], i)),
            const SizedBox(height: 40),
            const Text('EVALUAR CRITERIOS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, fontFamily: 'Georgia')),
            const SizedBox(height: 20),
            ...defaultCriteria.map((c) => _buildCriterionSlider(c)),
            const SizedBox(height: 20),
            TextField(
              controller: _obsController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Observaciones del evaluador',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
              ),
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: _submitEvaluation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                ),
                child: const Text('ENVIAR EVALUACIÓN', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildGallery(Project project) {
    final images = project.galleryImages.isNotEmpty
        ? project.galleryImages
        : [project.thumbnail, project.thumbnail, project.thumbnail];

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
                          color: isSelected ? AppColors.gold : Colors.transparent,
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

  Widget _buildVideoPlaceholder() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.play_circle_fill, size: 60, color: Colors.white70),
            SizedBox(height: 10),
            Text('Video del proyecto (30s)', style: TextStyle(color: Colors.white70)),
          ],
        ),
      ),
    );
  }

  Widget _buildQuizItem(QuizQuestion q, int index) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('${index + 1}. ${q.question}', style: const TextStyle(fontWeight: FontWeight.bold)),
        ...List.generate(q.options.length, (i) => RadioListTile<int>(
          title: Text(q.options[i]),
          value: i,
          groupValue: _quizAnswers[index],
          onChanged: (val) => setState(() => _quizAnswers[index] = val),
        )),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildCriterionSlider(EvaluationCriterion c) {
    final current = _scores[c.name] ?? 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(c.name, style: const TextStyle(fontWeight: FontWeight.w500)),
            Text('${current.toInt()} / ${c.maxValue.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
          ],
        ),
        Slider(
          value: current,
          max: c.maxValue,
          divisions: c.maxValue.toInt(),
          activeColor: AppColors.gold,
          onChanged: (val) => setState(() => _scores[c.name] = val),
        ),
      ],
    );
  }
}
