import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_models.dart';
import '../services/api_service.dart';

// Proveedor para el servicio API
final apiServiceProvider = Provider((ref) => ApiService());

// Clase para el estado de autenticación
class AuthState {
  final bool isLoading;
  final LoginResponse? user;
  final String? error;

  AuthState({
    this.isLoading = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    LoginResponse? user,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
    );
  }
}

// Notificador para el estado de autenticación
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;

  AuthNotifier(this._apiService) : super(AuthState()) {
    _loadUser();
  }

  Future<void> _loadUser() async {
    // Podríamos cargar el usuario persistido aquí si fuera necesario
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final userResponse = await _apiService.login(email, password);
      
      // Persistir token
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', userResponse.token);
      
      state = state.copyWith(isLoading: false, user: userResponse);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    state = AuthState();
  }

  Future<void> loginAsGuest({String guestName = 'Invitado'}) async {
    state = state.copyWith(isLoading: true, error: null);
    // Simular un retardo pequeño para feedback visual
    await Future.delayed(const Duration(milliseconds: 500));
    
    final guestUser = LoginResponse(
      id: 'guest_id',
      userId: 'guest',
      email: 'invitado@questeval.com',
      fullName: guestName,
      role: 'Invitado',
      token: 'guest_token',
      emailVerified: true,
      verificationStatus: 'approved',
    );
    
    state = state.copyWith(isLoading: false, user: guestUser);
  }
}

// Proveedor para el notifier de autenticación
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthNotifier(apiService);
});
