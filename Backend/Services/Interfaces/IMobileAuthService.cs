using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interfaz para gestionar la seguridad, tokens y persistencia de dispositivos en el cliente móvil.
/// </summary>
public interface IMobileAuthService
{
    /// <summary>
    /// Genera un token JWT (QR) válido para evaluar un proyecto específico.
    /// </summary>
    /// <param name="projectId">ID del proyecto a evaluar</param>
    /// <param name="expiresInMinutes">Tiempo de vida del QR</param>
    /// <returns>Token JWT en string</returns>
    string GenerateQRToken(string projectId, int expiresInMinutes = 120);

    /// <summary>
    /// Valida un token QR escaneado y extrae el ProjectId si es válido y no ha expirado.
    /// </summary>
    bool ValidateQRToken(string qrToken, out string? projectId, out string? errorMessage);

    /// <summary>
    /// Verifica si un dispositivo dado ya ha evaluado un proyecto específico.
    /// </summary>
    Task<bool> HasDeviceEvaluatedProjectAsync(string projectId, string deviceId);

    /// <summary>
    /// Registra de forma segura que un dispositivo acaba de evaluar un proyecto.
    /// </summary>
    Task RegisterDeviceEvaluationAsync(string projectId, string deviceId, string evaluationId);
}
