using System.ComponentModel.DataAnnotations;

namespace QuestEval.Shared.Models;

// DTOs for User Registration and Login

/// <summary>
/// Request to register a new user
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// User email address
    /// </summary>
    /// <example>student@example.com</example>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
    public string Email { get; set; } = null!;
    
    /// <summary>
    /// User password
    /// </summary>
    /// <example>SecurePassword123!</example>
    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters.")]
    public string Password { get; set; } = null!;
    
    /// <summary>
    /// Full name of the user
    /// </summary>
    /// <example>Juan Pérez</example>
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters.")]
    public string FullName { get; set; } = null!;
    
    /// <summary>
    /// User role (Alumno, Profesor, Admin)
    /// </summary>
    /// <example>Alumno</example>
    [RegularExpression(@"^(Alumno|Profesor|Admin)$", ErrorMessage = "Role must be 'Alumno', 'Profesor', or 'Admin'.")]
    public string Role { get; set; } = "Alumno"; // Default role
}

/// <summary>
/// Request to login
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// User email address
    /// </summary>
    /// <example>student@example.com</example>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = null!;
    
    /// <summary>
    /// User password
    /// </summary>
    /// <example>SecurePassword123!</example>
    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = null!;
}

/// <summary>
/// Login response containing user information and token
/// </summary>
public class LoginResponse
{
    public string UserId { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string Token { get; set; } = null!; // JWT token (optional for now)
}

/// <summary>
/// User response containing user information
/// </summary>
public class UserResponse
{
    public string Id { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
