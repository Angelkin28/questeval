using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

// DTOs para Registro e Inicio de Sesión de Usuarios

/// <summary>
/// Solicitud para registrar un nuevo usuario
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// Dirección de correo electrónico del usuario
    /// </summary>
    /// <example>estudiante@ejemplo.com</example>
    [Required(ErrorMessage = "El email es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de email inválido.")]
    [StringLength(100, ErrorMessage = "El email no puede exceder 100 caracteres.")]
    public string Email { get; set; } = null!;
    
    /// <summary>
    /// Contraseña del usuario
    /// </summary>
    /// <example>ContraseñaSegura123!</example>
    [Required(ErrorMessage = "La contraseña es requerida.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener entre 6 y 100 caracteres.")]
    public string Password { get; set; } = null!;
    
    /// <summary>
    /// Nombre completo del usuario
    /// </summary>
    /// <example>Juan Pérez</example>
    [Required(ErrorMessage = "El nombre completo es requerido.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre completo debe tener entre 2 y 100 caracteres.")]
    public string FullName { get; set; } = null!;
    
    /// <summary>
    /// Rol del usuario (Alumno, Profesor, Admin)
    /// </summary>
    /// <example>Alumno</example>
    [RegularExpression(@"^(Alumno|Profesor|Admin)$", ErrorMessage = "El rol debe ser 'Alumno', 'Profesor' o 'Admin'.")]
    public string Role { get; set; } = "Alumno"; // Rol por defecto
}

/// <summary>
/// Solicitud para iniciar sesión
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// Dirección de correo electrónico del usuario
    /// </summary>
    /// <example>estudiante@ejemplo.com</example>
    [Required(ErrorMessage = "El email es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de email inválido.")]
    public string Email { get; set; } = null!;
    
    /// <summary>
    /// Contraseña del usuario
    /// </summary>
    /// <example>ContraseñaSegura123!</example>
    [Required(ErrorMessage = "La contraseña es requerida.")]
    public string Password { get; set; } = null!;
}

/// <summary>
/// Respuesta de inicio de sesión conteniendo información del usuario y token
/// </summary>
public class LoginResponse
{
    public string UserId { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string Token { get; set; } = null!; // Token JWT (opcional por ahora)
    public bool EmailVerified { get; set; } // Si el email fue verificado con OTP
    public string VerificationStatus { get; set; } = null!; // Estado de aprobación (para Profesores)
}

/// <summary>
/// Respuesta de usuario conteniendo información del usuario
/// </summary>
public class UserResponse
{
    public string Id { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool EmailVerified { get; set; } // Nuevo campo
    public string VerificationStatus { get; set; } = null!; // Nuevo campo
}

/// <summary>
/// Solicitud para enviar código OTP
/// </summary>
public class SendOtpRequest
{
    /// <summary>
    /// Email al que se enviará el código OTP
    /// </summary>
    /// <example>estudiante@ejemplo.com</example>
    [Required(ErrorMessage = "El email es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de email inválido.")]
    public string Email { get; set; } = null!;
}

/// <summary>
/// Solicitud para verificar código OTP
/// </summary>
public class VerifyOtpRequest
{
    /// <summary>
    /// Email del usuario
    /// </summary>
    /// <example>estudiante@ejemplo.com</example>
    [Required(ErrorMessage = "El email es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de email inválido.")]
    public string Email { get; set; } = null!;

    /// <summary>
    /// Código OTP de 6 dígitos
    /// </summary>
    /// <example>123456</example>
    [Required(ErrorMessage = "El código OTP es requerido.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "El código debe tener 6 dígitos.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "El código debe contener solo números.")]
    public string OtpCode { get; set; } = null!;
}

/// <summary>
/// Solicitud para aprobar/rechazar un maestro
/// </summary>
public class ApproveTeacherRequest
{
    /// <summary>
    /// ID del maestro a aprobar/rechazar
    /// </summary>
    [Required(ErrorMessage = "El ID del maestro es requerido.")]
    public string TeacherId { get; set; } = null!;

    /// <summary>
    /// Estado de aprobación: "approved" o "rejected"
    /// </summary>
    /// <example>approved</example>
    [Required(ErrorMessage = "El estado es requerido.")]
    [RegularExpression(@"^(approved|rejected)$", ErrorMessage = "El estado debe ser 'approved' o 'rejected'.")]
    public string Status { get; set; } = null!;
}

/// <summary>
/// Respuesta con información de maestro pendiente de aprobación
/// </summary>
public class PendingTeacherResponse
{
    public string Id { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

