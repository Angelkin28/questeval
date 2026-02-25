import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';
import '../theme/questeval_theme.dart';
import 'package:go_router/go_router.dart';

/// Credenciales de prueba para desarrollo y demostración.
const String kTestEmail = 'estudiante@questeval.com';
const String kTestPassword = 'Alumno123!';

/// Pantalla de inicio de sesión de QuestEval.
/// Incluye validación básica de campos vacíos y diseño responsive
/// orientado a móvil y modo kiosco (elementos grandes y espaciados).
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  /// Mensaje de error mostrado bajo el botón (validación local).
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Valida que email y contraseña no estén vacíos e inicia sesión con el backend.
  Future<void> _onLoginPressed() async {
    setState(() => _errorMessage = null);

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty) {
      _showError('Introduce tu correo electrónico.');
      return;
    }

    if (password.isEmpty) {
      _showError('Introduce tu contraseña.');
      return;
    }

    final success = await ref.read(authProvider.notifier).login(email, password);

    if (success) {
      if (mounted) {
        final user = ref.read(authProvider).user;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bienvenido, ${user?.fullName}!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        if (mounted) {
          context.go('/projects');
        }
      }
    } else {
      if (mounted) {
        final error = ref.read(authProvider).error;
        _showError(error ?? 'Error desconocido al iniciar sesión.');
      }
    }
  }

  void _showError(String message) {
    setState(() => _errorMessage = message);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: QuestEvalColors.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mediaQuery = MediaQuery.of(context);
    final isWide = mediaQuery.size.width > 600;
    final authState = ref.watch(authProvider);

    // Espaciado y tamaños adaptados para tablet/kiosco.
    final horizontalPadding = isWide ? 48.0 : 24.0;
    final verticalSpacing = isWide ? 28.0 : 20.0;
    final logoBottomPadding = isWide ? 36.0 : 28.0;

    return Scaffold(
      backgroundColor: QuestEvalColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo de QuestEval desde assets.
                    Image.asset(
                      'assets/questeval.jpeg',
                      height: isWide ? 120 : 96,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => Text(
                        'QuestEval',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          color: QuestEvalColors.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    SizedBox(height: logoBottomPadding),

                    // Botón para rellenar con datos de prueba.
                    TextButton(
                      onPressed: authState.isLoading
                          ? null
                          : () {
                              _emailController.text = kTestEmail;
                              _passwordController.text = kTestPassword;
                              setState(() => _errorMessage = null);
                            },
                      child: Text(
                        'Usar datos de prueba',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: QuestEvalColors.primary,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                    SizedBox(height: verticalSpacing - 8),

                    // Campo de correo electrónico.
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      enabled: !authState.isLoading,
                      decoration: const InputDecoration(
                        labelText: 'Correo electrónico',
                        hintText: 'tu.correo@institucion.edu',
                      ),
                      style: theme.textTheme.bodyLarge,
                    ),
                    SizedBox(height: verticalSpacing),

                    // Campo de contraseña (oculto).
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      textInputAction: TextInputAction.done,
                      enabled: !authState.isLoading,
                      onFieldSubmitted: (_) => _onLoginPressed(),
                      decoration: const InputDecoration(
                        labelText: 'Contraseña',
                        hintText: '••••••••',
                      ),
                      style: theme.textTheme.bodyLarge,
                    ),
                    SizedBox(height: verticalSpacing + 8),

                    // Botón principal de inicio de sesión.
                    ElevatedButton(
                      onPressed: authState.isLoading ? null : _onLoginPressed,
                      child: authState.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Iniciar sesión'),
                    ),
                    const SizedBox(height: 12),

                    // Botón de Invitado
                    OutlinedButton(
                      onPressed: authState.isLoading 
                          ? null 
                          : () async {
                              await ref.read(authProvider.notifier).loginAsGuest();
                              if (mounted) {
                                context.go('/projects');
                              }
                            },
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: theme.primaryColor),
                      ),
                      child: const Text('Entrar como invitado'),
                    ),
                    SizedBox(height: verticalSpacing),

                    // Mensaje de error bajo el botón (refuerzo visual).
                    if (_errorMessage != null) ...[
                      Text(
                        _errorMessage!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: QuestEvalColors.error,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: verticalSpacing),
                    ],

                    // Texto secundario: acceso institucional.
                    Text(
                      'Acceso para uso institucional',
                      style: theme.textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
