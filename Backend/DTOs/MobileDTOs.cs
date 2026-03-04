using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

/// <summary>
/// DTO exclusivo para enviar y procesar una evaluación desde la App Móvil usando TokenQR y DeviceId
/// </summary>
public class MobileEvaluationRequestDTO
{
    [Required]
    public string ProjectId { get; set; } = null!;

    [Required]
    public string DeviceId { get; set; } = null!; // Identificador único de Hardware

    public string? GuestName { get; set; } // Opcional, nombre de quien evaluó en campo (para registro visual)

    [Required]
    public List<EvaluationDetailRequest> Details { get; set; } = new();
}

/// <summary>
/// Solicitud de verificación inicial del código QR escaneado
/// </summary>
public class VerifySessionRequestDTO
{
    [Required]
    public string QrToken { get; set; } = null!;
    
    [Required]
    public string DeviceId { get; set; } = null!;
}
