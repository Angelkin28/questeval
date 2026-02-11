using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interface para el servicio de gestión de retroalimentación (feedback).
/// El feedback permite a profesores dar comentarios adicionales sobre evaluaciones.
/// </summary>
public interface IFeedbackService
{
    /// <summary>
    /// Obtiene todos los feedbacks del sistema.
    /// </summary>
    /// <returns>Lista completa de feedbacks</returns>
    Task<List<Feedback>> GetAllAsync();

    /// <summary>
    /// Busca un feedback específico por su ID.
    /// </summary>
    /// <param name="id">ID del feedback (MongoDB ObjectId)</param>
    /// <returns>El feedback encontrado o null si no existe</returns>
    Task<Feedback?> GetByIdAsync(string id);

    /// <summary>
    /// Crea un nuevo feedback asociado a una evaluación.
    /// </summary>
    /// <param name="feedback">Datos del nuevo feedback</param>
    /// <returns>Tarea asíncrona de creación</returns>
    Task CreateAsync(Feedback feedback);

    /// <summary>
    /// Elimina un feedback del sistema.
    /// No se permite actualizar para mantener historial inmutable.
    /// </summary>
    /// <param name="id">ID del feedback a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);
}
