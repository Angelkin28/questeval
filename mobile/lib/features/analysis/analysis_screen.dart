import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/providers.dart';
import '../../core/app_colors.dart';

class AnalysisScreen extends ConsumerWidget {
  const AnalysisScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ranking = ref.watch(rankingProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Análisis y Ranking', style: TextStyle(fontFamily: 'Georgia'))),
      body: ranking.isEmpty 
        ? const Center(child: Text('No hay evaluaciones registradas aún.'))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildBestProject(ranking.first),
                const SizedBox(height: 30),
                const Text('Ranking Global', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Georgia')),
                const SizedBox(height: 15),
                ...List.generate(ranking.length, (i) => _buildRankingItem(ranking[i], i + 1)),
                const SizedBox(height: 40),
                const Text('Distribución de Puntajes', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Georgia')),
                const SizedBox(height: 20),
                _buildChart(ranking),
              ],
            ),
          ),
    );
  }

  Widget _buildBestProject(Map<String, dynamic> data) {
    final project = data['project'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.gold.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold, width: 2),
      ),
      child: Column(
        children: [
          const Text('🏆 MEJOR CALIFICADO', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
          const SizedBox(height: 10),
          Text(project.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Georgia')),
          Text('Score: ${data['score'].toInt()}/100', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildRankingItem(Map<String, dynamic> data, int pos) {
    final project = data['project'];
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: pos == 1 ? AppColors.gold : AppColors.black,
        child: Text('#$pos', style: const TextStyle(color: Colors.white)),
      ),
      title: Text(project.name),
      subtitle: Text(project.category),
      trailing: Text(
        '${data['score'].toInt()}',
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.gold),
      ),
    );
  }

  Widget _buildChart(List<Map<String, dynamic>> ranking) {
    return SizedBox(
      height: 200,
      child: BarChart(
        BarChartData(
          barGroups: ranking.map((d) {
            int index = ranking.indexOf(d);
            return BarChartGroupData(
              x: index,
              barRods: [
                BarChartRodData(toY: d['score'], color: AppColors.gold, width: 15),
              ],
            );
          }).toList(),
          titlesData: const FlTitlesData(
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
        ),
      ),
    );
  }
}
