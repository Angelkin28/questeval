import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:carousel_slider/carousel_slider.dart';
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

    return Scaffold(
      appBar: AppBar(title: Text(project.name)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildGallery(project),
            const SizedBox(height: 20),
            Text(project.description, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 30),
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
    return CarouselSlider(
      options: CarouselOptions(height: 200, enlargeCenterPage: true, autoPlay: true),
      items: [project.thumbnail, project.thumbnail, project.thumbnail].map((url) {
        return Container(
          width: double.infinity,
          margin: const EdgeInsets.symmetric(horizontal: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            image: DecorationImage(image: NetworkImage(url), fit: BoxFit.cover),
          ),
        );
      }).toList(),
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
