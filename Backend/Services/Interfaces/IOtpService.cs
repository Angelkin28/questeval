namespace Backend.Services.Interfaces;

/// <summary>
/// Servicio para manejar OTP (One-Time Password) usando Supabase
/// </summary>
public interface IOtpService
{
    /// <summary>
    /// Envía un código OTP de 6 dígitos al email especificado
    /// </summary>
    /// <param name="email">Email del destinatario</param>
    /// <returns>True si el OTP fue enviado exitosamente</returns>
    Task<bool> SendOtpAsync(string email);

    /// <summary>
    /// Verifica si el código OTP proporcionado es válido para el email
    /// </summary>
    /// <param name="email">Email del usuario</param>
    /// <param name="otpCode">Código OTP de 6 dígitos</param>
    /// <returns>True si el código es válido</returns>
    Task<bool> VerifyOtpAsync(string email, string otpCode);

    /// <summary>
    /// Elimina a un usuario completamente de Supabase Auth usando su email
    /// </summary>
    Task<bool> DeleteUserByEmailAsync(string email);
}
