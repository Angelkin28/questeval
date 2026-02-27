import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../theme/colors.dart';
import '../models/models.dart';

class AnalysisScreen extends ConsumerWidget {
  const AnalysisScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeProvider);
    final accentColor = theme.category == AppCategory.videojuegos ? AppColors.neonCyan : AppColors.gold;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Análisis'),
          bottom: TabBar(
            indicatorColor: accentColor,
            labelColor: accentColor,
            tabs: const [
              Tab(text: 'Integrador'),
              Tab(text: 'Videojuegos'),
              Tab(text: 'Comparativa'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _RankingList(type: 'Integrador'),
            _RankingList(type: 'Videojuegos'),
            _ComparisonTab(accentColor: accentColor),
          ],
        ),
      ),
    );
  }
}

class _ComparisonTab extends ConsumerWidget {
  final Color accentColor;
  const _ComparisonTab({required this.accentColor});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(statsProvider);

    return statsAsync.when(
      data: (stats) {
        final intAvg = (stats['integradorAverage'] as num).toDouble();
        final gameAvg = (stats['videoGamesAverage'] as num).toDouble();

        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              const Text('Promedio por Categoría', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 40),
              SizedBox(
                height: 300,
                child: BarChart(
                  BarChartData(
                    alignment: BarChartAlignment.spaceAround,
                    maxY: 100,
                    barGroups: [
                      BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: intAvg, color: AppColors.gold, width: 40, borderRadius: BorderRadius.circular(8))]),
                      BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: gameAvg, color: AppColors.neonPink, width: 40, borderRadius: BorderRadius.circular(8))]),
                    ],
                    titlesData: FlTitlesData(
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (value, meta) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 10),
                              child: Text(value == 0 ? 'Integrador' : 'Juegos', style: const TextStyle(fontSize: 12)),
                            );
                          },
                        ),
                      ),
                      leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40)),
                      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    ),
                    gridData: FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                  ),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('Error: $err')),
    );
  }
}

class _RankingList extends ConsumerWidget {
  final String type;
  const _RankingList({required this.type});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rankingsAsync = ref.watch(rankingProvider(type));

    return rankingsAsync.when(
      data: (rankings) {
        if (rankings.isEmpty) {
          return const Center(child: Text('No hay proyectos evaluados en esta categoría.'));
        }

        final top = Project.fromJson(rankings.first);
        final accentColor = type == 'Videojuegos' ? AppColors.neonGreen : AppColors.gold;

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildTopProject(top, accentColor),
            const SizedBox(height: 30),
            const Text('Ranking Global', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 15),
            ...List.generate(rankings.length, (i) => _buildRow(context, Project.fromJson(rankings[i]), i + 1, accentColor)),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('Error: $err')),
    );
  }

  Widget _buildTopProject(Project p, Color accent) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: accent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accent, width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.emoji_events, color: accent, size: 50),
          const SizedBox(height: 10),
          const Text('MEJOR CALIFICADO', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5)),
          const SizedBox(height: 10),
          Text(p.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          Text('${p.score?.toInt() ?? 0} / 100', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: accent)),
        ],
      ),
    );
  }

  Widget _buildRow(BuildContext context, Project p, int pos, Color accent) {
    final scoreValue = p.score ?? 0.0;
    final status = scoreValue >= 90 ? 'SOBRESALIENTE' : 'APROBADO';
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(backgroundColor: accent, child: Text('#$pos', style: const TextStyle(color: Colors.white))),
      title: Text(p.title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(status, style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.bold)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('${p.score?.toInt() ?? 0}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.arrow_forward_ios, size: 16),
            onPressed: () => context.push('/projects/detail/${p.id}?readOnly=true'),
          ),
        ],
      ),
    );
  }
}
