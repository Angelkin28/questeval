import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../theme/questeval_theme.dart';

class GuestNameScreen extends ConsumerStatefulWidget {
  const GuestNameScreen({super.key});

  @override
  ConsumerState<GuestNameScreen> createState() => _GuestNameScreenState();
}

class _GuestNameScreenState extends ConsumerState<GuestNameScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();

  Future<void> _submitName() async {
    if (_formKey.currentState!.validate()) {
      final name = _nameController.text.trim();
      if (name.isNotEmpty) {
        await ref.read(authProvider.notifier).loginAsGuest(guestName: name);
        if (mounted) {
          context.go('/projects');
        }
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mediaQuery = MediaQuery.of(context);
    final isWide = mediaQuery.size.width > 600;

    final horizontalPadding = isWide ? 48.0 : 24.0;
    final authState = ref.watch(authProvider);

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
                    Image.asset(
                      'assets/questeval.jpeg',
                      height: 120,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(Icons.school, size: 80, color: QuestEvalColors.primary),
                    ),
                    const SizedBox(height: 40),
                    const Text(
                      '¡Bienvenido!',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Por favor, ingresa tu nombre para continuar.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 30),
                    TextFormField(
                      controller: _nameController,
                      textInputAction: TextInputAction.done,
                      textCapitalization: TextCapitalization.words,
                      enabled: !authState.isLoading,
                      validator: (value) =>
                          (value == null || value.trim().isEmpty) ? 'Tu nombre es necesario' : null,
                      onFieldSubmitted: (_) => _submitName(),
                      decoration: const InputDecoration(
                        labelText: 'Tu Nombre y Apellido',
                        hintText: 'Ej. Juan Pérez',
                        prefixIcon: Icon(Icons.person),
                      ),
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: authState.isLoading ? null : _submitName,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: authState.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Comenzar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
