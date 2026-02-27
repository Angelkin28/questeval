import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/theme_provider.dart';
import '../providers/data_provider.dart';
import '../providers/auth_provider.dart';
import '../models/user_models.dart';
import '../theme/app_theme.dart';
import '../theme/colors.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeProvider);
    final authState = ref.watch(authProvider);
    final isNeon = theme.category == AppCategory.videojuegos;
    final accentColor = isNeon ? AppColors.neonPink : AppColors.gold;
    
    final projectsAsync = ref.watch(projectsProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Mi Perfil')),
      body: projectsAsync.when(
        data: (allProjects) {
          final evaluatedProjects = allProjects.where((p) => p.isEvaluatedByUser).toList();
          final avg = evaluatedProjects.isEmpty 
              ? 0.0 
              : evaluatedProjects.fold(0.0, (sum, p) => sum + (p.score ?? 0)) / evaluatedProjects.length;

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                const SizedBox(height: 40),
                _buildHeader(accentColor, user),
                const SizedBox(height: 40),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStat('Evaluados', evaluatedProjects.length.toString(), accentColor),
                    _buildStat('Promedio', avg.toStringAsFixed(1), accentColor),
                  ],
                ),
                const SizedBox(height: 40),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Últimas Evaluaciones', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 15),
                ...evaluatedProjects.map((p) => _buildEvaluatedItem(context, p, accentColor)),
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: OutlinedButton(
                    onPressed: () async {
                      await ref.read(authProvider.notifier).logout();
                      if (context.mounted) {
                        context.go('/login');
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    child: const Text('Cerrar sesión', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildHeader(Color accent, LoginResponse? user) {
    return Column(
      children: [
        CircleAvatar(
          radius: 60,
          backgroundColor: accent.withOpacity(0.2),
          child: (user?.avatarUrl != null)
            ? ClipRRect(
                borderRadius: BorderRadius.circular(60),
                child: Image.network(user!.avatarUrl!, fit: BoxFit.cover, width: 120, height: 120),
              )
            : Icon(Icons.person, size: 80, color: accent),
        ),
        const SizedBox(height: 20),
        Text(user?.fullName ?? 'Estudiante Ejemplo', 
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Georgia')),
        Text('ID: ${user?.userId ?? 'N/A'}', style: const TextStyle(color: Colors.grey)),
        Text(user?.email ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ],
    );
  }

  Widget _buildStat(String label, String value, Color accent) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: accent)),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildEvaluatedItem(BuildContext context, dynamic p, Color accent) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(p.title),
      subtitle: Text(p.type, style: const TextStyle(fontSize: 12)),
      trailing: Text(
        p.score?.toInt().toString() ?? '0', 
        style: TextStyle(fontWeight: FontWeight.bold, color: accent),
      ),
      onTap: () => context.push('/projects/detail/${p.id}?readOnly=true'),
    );
  }
}
