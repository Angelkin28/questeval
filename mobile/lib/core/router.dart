import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/main_scaffold.dart';
import '../screens/projects_screen.dart';
import '../screens/detail_screen.dart';
import '../screens/analysis_screen.dart';
import '../screens/guest_name_screen.dart';
import '../screens/qr_scanner_screen.dart';
import '../screens/evaluation_screen.dart';
import '../screens/evaluation_success_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/welcome',
  routes: [
    // ── Pantalla de Bienvenida (Nombre de Invitado) ──────────────────
    GoRoute(
      path: '/welcome',
      builder: (context, state) => const GuestNameScreen(),
    ),
    // ── Sin barra de navegación inferior ──────────────────────────
    GoRoute(
      path: '/scan',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const QrScannerScreen(),
    ),
    GoRoute(
      path: '/evaluation',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const EvaluationScreen(),
    ),
    GoRoute(
      path: '/evaluation/success',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const EvaluationSuccessScreen(),
    ),

    // ── Con barra de navegación inferior (ShellRoute) ──────────────
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
                final isReadOnly =
                    state.uri.queryParameters['readOnly'] == 'true';
                return ProjectDetailScreen(
                    projectId: id, readOnly: isReadOnly);
              },
            ),
          ],
        ),
        GoRoute(
          path: '/analysis',
          builder: (context, state) => const AnalysisScreen(),
        ),
      ],
    ),
  ],
);

