import 'package:flutter/material.dart';

import '../theme/questeval_theme.dart';

/// Credenciales de prueba para desarrollo y demostración.
const String kTestEmail = 'demo@questeval.edu';
const String kTestPassword = 'demo1234';

/// Pantalla de inicio de sesión de QuestEval.
/// Incluye validación básica de campos vacíos y diseño responsive
/// orientado a móvil y modo kiosco (elementos grandes y espaciados).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
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

  /// Valida que email y contraseña no estén vacíos y muestra error por SnackBar o texto.
  void _onLoginPressed() {
    setState(() => _errorMessage = null);

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty) {
      setState(() => _errorMessage = 'Introduce tu correo electrónico.');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Introduce tu correo electrónico.'),
          backgroundColor: QuestEvalColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (password.isEmpty) {
      setState(() => _errorMessage = 'Introduce tu contraseña.');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Introduce tu contraseña.'),
          backgroundColor: QuestEvalColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    // Aquí se integrará la autenticación con backend más adelante.
    // Por ahora solo validación de campos.
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Credenciales válidas (sin backend aún).'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mediaQuery = MediaQuery.of(context);
    final isWide = mediaQuery.size.width > 600;

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
                      onPressed: () {
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
                      onPressed: _onLoginPressed,
                      child: const Text('Iniciar sesión'),
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
