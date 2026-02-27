/// Solicitud para iniciar sesión
class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

/// Respuesta de inicio de sesión conteniendo información del usuario y token
class LoginResponse {
  final String id;
  final String? userId;
  final String email;
  final String fullName;
  final String role;
  final String? avatarUrl;
  final String token;
  final bool emailVerified;
  final String verificationStatus;

  LoginResponse({
    required this.id,
    this.userId,
    required this.email,
    required this.fullName,
    required this.role,
    this.avatarUrl,
    required this.token,
    required this.emailVerified,
    required this.verificationStatus,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      id: json['id'] as String,
      userId: json['userId'] as String?,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      role: json['role'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      token: json['token'] as String,
      emailVerified: json['emailVerified'] as bool,
      verificationStatus: json['verificationStatus'] as String,
    );
  }
}
