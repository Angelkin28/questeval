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
    Task<Evaluation?> GetByEvaluationIdAsync(string evaluationId);
    Task<List<Evaluation>> GetByProjectIdAsync(string projectId);
    Task<List<Evaluation>> GetByUserIdAsync(string userId);
    Task<Evaluation?> GetByUserAndProjectAsync(string userId, string projectId);

    /// <summary>
    /// Crea o actualiza una evaluación para un proyecto.
    /// Si el usuario ya evaluó este proyecto, se actualizan los datos.
    /// </summary>
    /// <param name="evaluation">Datos de la evaluación</param>
    /// <returns>Tarea asíncrona</returns>
    Task CreateAsync(Evaluation evaluation);

    /// <summary>
    /// Elimina una evaluación del sistema.
    /// </summary>
    /// <param name="id">ID de la evaluación a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);

    /// <summary>
    /// Genera IDs incrementales para evaluaciones existentes que tengan IDs tipo ObjectId.
    /// </summary>
    Task InitializeIncrementalIdsAsync();
}
