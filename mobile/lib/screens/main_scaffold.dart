import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainScaffold extends StatelessWidget {
  final Widget child;
  const MainScaffold({super.key, required this.child});

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/projects')) return 0;
    if (location.startsWith('/analysis')) return 1;
    if (location.startsWith('/profile')) return 2;
    return 0;
  }

  void _onTap(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/projects');
        break;
      case 1:
        context.go('/analysis');
        break;
      case 2:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _getSelectedIndex(context),
        onTap: (i) => _onTap(i, context),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.folder), label: 'Proyectos'),
          BottomNavigationBarItem(icon: Icon(Icons.bar_chart_rounded), label: 'Análisis'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }
}
