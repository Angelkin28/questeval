import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/theme_provider.dart';
import '../providers/data_provider.dart';
import '../theme/colors.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeProvider);
    final projectsAsync = ref.watch(projectsProvider);
    final selectedCategory = ref.watch(categoryFilterProvider);
    final projects = ref.watch(filteredProjectsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Proyectos'),
            Text('Bienvenido, Estudiante', style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(theme.isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => ref.read(themeProvider.notifier).toggleDark(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          _buildCategorySelector(ref, theme.category),
          Expanded(
            child: projectsAsync.when(
              data: (_) => ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: projects.length,
                itemBuilder: (context, index) => _ProjectCard(project: projects[index]),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Error: $err')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector(WidgetRef ref, AppCategory selected) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _CategoryPill(
            label: 'Integrador',
            isSelected: selected == 'Integrador',
            color: AppColors.gold,
            onTap: () {
              ref.read(categoryFilterProvider.notifier).state = 'Integrador';
              ref.read(themeProvider.notifier).setCategory(AppCategory.integrador);
            },
          ),
          const SizedBox(width: 15),
          _CategoryPill(
            label: 'Videojuegos',
            isSelected: selected == 'Videojuegos',
            color: AppColors.neonPink,
            isNeon: true,
            onTap: () {
              ref.read(categoryFilterProvider.notifier).state = 'Videojuegos';
              ref.read(themeProvider.notifier).setCategory(AppCategory.videojuegos);
            },
          ),
        ],
      ),
    );
  }
}

class _CategoryPill extends StatelessWidget {
  final String label;
  final bool isSelected;
  final Color color;
  final bool isNeon;
  final VoidCallback onTap;

  const _CategoryPill({
    required this.label,
    required this.isSelected,
    required this.color,
    this.isNeon = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: color, width: 2),
          boxShadow: isSelected && isNeon ? AppTheme.neonGlow(color) : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : color,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Project project;
  const _ProjectCard({required this.project});

  @override
  Widget build(BuildContext context) {
    final isNeon = project.type == 'Videojuegos';
    final accentColor = isNeon ? AppColors.neonCyan : AppColors.gold;

    return Card(
      margin: const EdgeInsets.only(bottom: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 4,
      child: InkWell(
        onTap: () => context.push('/projects/detail/${project.id}'),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: project.isEvaluatedByUser ? Colors.green.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      project.isEvaluatedByUser ? 'EVALUADO' : 'PENDIENTE',
                      style: TextStyle(
                        color: project.isEvaluatedByUser ? Colors.green : Colors.orange,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    project.score != null ? '${project.score!.toInt()}/100' : '--/100',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: accentColor),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              Text(project.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 5),
              Text(project.date.toString().substring(0, 10), style: const TextStyle(color: Colors.grey, fontSize: 12)),
              if (project.isEvaluated) ...[
                const SizedBox(height: 15),
                Row(
                  children: [
                    Icon(Icons.check_circle, color: accentColor, size: 16),
                    const SizedBox(width: 5),
                    const Text('COMPETENCIAS ALCANZADAS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
