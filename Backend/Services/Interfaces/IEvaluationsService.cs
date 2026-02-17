using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interface para el servicio de gestión de evaluaciones.
/// Las evaluaciones son calificaciones de proyectos basadas en criterios específicos.
/// </summary>
public interface IEvaluationsService
{
    /// <summary>
    /// Obtiene todas las evaluaciones del sistema.
    /// </summary>
    /// <returns>Lista completa de evaluaciones</returns>
    Task<List<Evaluation>> GetAllAsync();

    /// <summary>
    /// Busca una evaluación específica por su ID.
    /// </summary>
    /// <param name="id">ID de la evaluación (MongoDB ObjectId)</param>
    /// <returns>La evaluación encontrada o null si no existe</returns>
    Task<Evaluation?> GetByIdAsync(string id);
    Task<List<Evaluation>> GetByProjectIdAsync(string projectId);

    /// <summary>
    /// Crea una nueva evaluación para un proyecto.
    /// La evaluación incluye criterios y puntuaciones individuales.
    /// </summary>
    /// <param name="evaluation">Datos de la nueva evaluación</param>
    /// <returns>Tarea asíncrona de creación</returns>
    Task CreateAsync(Evaluation evaluation);

    /// <summary>
    /// Elimina una evaluación del sistema.
    /// No se permite actualizar evaluaciones para mantener integridad de calificaciones.
    /// </summary>
    /// <param name="id">ID de la evaluación a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);
}
