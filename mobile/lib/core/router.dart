import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/main_scaffold.dart';
import '../screens/projects_screen.dart';
import '../screens/detail_screen.dart';
import '../screens/analysis_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/login_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => MainScaffold(child: child),
      routes: [
        GoRoute(
          path: '/projects',
          builder: (context, state) => const ProjectsScreen(),
          routes: [
            GoRoute(
              path: 'detail/:id',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final isReadOnly = state.uri.queryParameters['readOnly'] == 'true';
                return ProjectDetailScreen(projectId: id, readOnly: isReadOnly);
              },
            ),
          ],
        ),
        GoRoute(
          path: '/analysis',
          builder: (context, state) => const AnalysisScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
  ],
);
