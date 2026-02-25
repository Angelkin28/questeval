import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';
import '../../core/app_colors.dart';
import '../../data/models.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(projectsProvider);
    final selectedCategory = ref.watch(selectedCategoryProvider);
    final themeType = ref.watch(themeTypeProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.diamond, color: AppColors.gold),
            const SizedBox(width: 8),
            Text('QUESTEVAL', style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(themeType == AppThemeType.light ? Icons.dark_mode : Icons.light_mode),
            onPressed: () {
              ref.read(themeTypeProvider.notifier).state = 
                themeType == AppThemeType.light ? AppThemeType.dark : AppThemeType.light;
            },
          ),
          const IconButton(icon: Icon(Icons.account_circle_outlined), onPressed: null),
        ],
      ),
      body: Column(
        children: [
          _buildCategoryPills(ref, selectedCategory),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: projects.length,
              itemBuilder: (context, index) => _ProjectCard(project: projects[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryPills(WidgetRef ref, String selected) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: ['Integrador', 'Videojuegos'].map((cat) {
          final isSelected = cat == selected;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: ChoiceChip(
              label: Text(cat),
              selected: isSelected,
              onSelected: (val) {
                if (val) {
                  ref.read(selectedCategoryProvider.notifier).state = cat;
                  // Auto-switch to videogame theme if selected
                  if (cat == 'Videojuegos') {
                    ref.read(themeTypeProvider.notifier).state = AppThemeType.videogame;
                  } else {
                    ref.read(themeTypeProvider.notifier).state = AppThemeType.light;
                  }
                }
              },
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _ProjectCard extends ConsumerWidget {
  final Project project;
  const _ProjectCard({required this.project});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final evaluation = ref.watch(evaluationsProvider)[project.id];
    final isEvaluated = evaluation != null;

    return Card(
      margin: const EdgeInsets.only(bottom: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      elevation: 4,
      child: InkWell(
        onTap: () => context.push('/projects/${project.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Image.network(
                  project.thumbnail,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isEvaluated ? Colors.green : Colors.orange,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isEvaluated ? 'EVALUADO' : 'PENDIENTE',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                if (isEvaluated)
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: CircleAvatar(
                      backgroundColor: Colors.white.withOpacity(0.9),
                      radius: 25,
                      child: Text(
                        evaluation.totalScore.toInt().toString(),
                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.black),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    project.name,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    project.date.toString().substring(0, 10),
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  const Text('Competencias alcanzadas:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 8,
                    children: project.competencies.map((c) => Chip(
                      label: Text(c, style: const TextStyle(fontSize: 10)),
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    )).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
