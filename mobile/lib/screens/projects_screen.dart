import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/theme_provider.dart';
import '../providers/data_provider.dart';
import '../theme/colors.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../shared/widgets/error_banner.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeProvider);
    final projectsAsync = ref.watch(projectsProvider);
    final selectedCategory = ref.watch(categoryFilterProvider);
    final projects = ref.watch(filteredProjectsProvider);
    final isNeon = theme.category == AppCategory.videojuegos;

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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/scan'),
        backgroundColor: isNeon ? AppColors.neonCyan : AppColors.gold,
        foregroundColor: Colors.white,
        elevation: 6,
        icon: const Icon(Icons.qr_code_scanner, size: 26),
        label: const Text(
          'Escanear QR',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
        ),
      ),
      body: Column(
        children: [
          _buildCategorySelector(ref, theme.category),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(projectsProvider);
                // Esperamos a que la nueva petición termine o de error
                try {
                  await ref.read(projectsProvider.future);
                } catch (_) {}
              },
              color: isNeon ? AppColors.neonCyan : AppColors.gold,
              child: projectsAsync.when(
                data: (_) => ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: projects.length,
                  itemBuilder: (context, index) => _ProjectCard(project: projects[index]),
                ),
                loading: () => _ProjectsShimmer(accentColor: isNeon ? AppColors.neonCyan : AppColors.gold),
                error: (err, _) => ErrorBanner(
                message: err.toString().contains('SocketException') || err.toString().contains('Network')
                    ? 'Sin conexión a internet.\nVerifica tu red e intenta de nuevo.'
                    : 'Error al cargar los proyectos.\n${err.toString()}',
                type: err.toString().contains('SocketException') || err.toString().contains('Network')
                    ? ErrorBannerType.network
                    : ErrorBannerType.generic,
                retryLabel: 'Reintentar',
                onRetry: () => ref.invalidate(projectsProvider),
              ),
            ),
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
        onTap: () => context.push('/projects/detail/${project.id}?readOnly=true'),
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

// ─────────────────────────────────────────────────────────────────────
// Shimmer placeholder de carga de proyectos
// ─────────────────────────────────────────────────────────────────────

class _ProjectsShimmer extends StatefulWidget {
  final Color accentColor;
  const _ProjectsShimmer({required this.accentColor});

  @override
  State<_ProjectsShimmer> createState() => _ProjectsShimmerState();
}

class _ProjectsShimmerState extends State<_ProjectsShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) {
        final opacity = 0.3 + _anim.value * 0.3;
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          itemBuilder: (_, i) => Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: widget.accentColor.withAlpha((opacity * 40).toInt()),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _ShimmerBox(w: 80, h: 20, color: widget.accentColor, opacity: opacity),
                    _ShimmerBox(w: 60, h: 30, color: widget.accentColor, opacity: opacity),
                  ],
                ),
                const SizedBox(height: 16),
                _ShimmerBox(w: double.infinity, h: 18, color: widget.accentColor, opacity: opacity),
                const SizedBox(height: 8),
                _ShimmerBox(w: 120, h: 12, color: widget.accentColor, opacity: opacity),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double w, h, opacity;
  final Color color;
  const _ShimmerBox(
      {required this.w, required this.h, required this.color, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: w == double.infinity ? null : w,
      height: h,
      decoration: BoxDecoration(
        color: color.withAlpha((opacity * 80).toInt()),
        borderRadius: BorderRadius.circular(6),
      ),
    );
  }
}

