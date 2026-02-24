using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interface para el servicio de gestión de proyectos de estudiantes.
/// Los proyectos pertenecen a un grupo y pueden ser evaluados.
/// </summary>
public interface IProjectsService
{
    /// <summary>
    /// Obtiene todos los proyectos del sistema.
    /// </summary>
    /// <returns>Lista completa de proyectos</returns>
    Task<List<Project>> GetAllAsync();

    /// <summary>
    /// Busca un proyecto específico por su ID.
    /// </summary>
    /// <param name="id">ID del proyecto (MongoDB ObjectId)</param>
    /// <returns>El proyecto encontrado o null si no existe</returns>
    Task<Project?> GetByIdAsync(string id);
    Task<Project?> GetByProjectIdAsync(string projectId);
    
    Task<List<Project>> GetByGroupIdAsync(string groupId);

    /// <summary>
    /// Crea un nuevo proyecto asociado a un grupo.
    /// El proyecto debe tener status inicial (generalmente "Active").
    /// </summary>
    /// <param name="project">Datos del nuevo proyecto</param>
    /// <returns>Tarea asíncrona de creación</returns>
    Task CreateAsync(Project project);

    /// <summary>
    /// Actualiza los datos de un proyecto existente.
    /// Útil para cambiar nombre, descripción o status.
    /// </summary>
    /// <param name="id">ID del proyecto a actualizar</param>
    /// <param name="project">Nuevos datos del proyecto</param>
    /// <returns>Tarea asíncrona de actualización</returns>
    Task UpdateAsync(string id, Project project);

    /// <summary>
    /// Busca y filtra proyectos con paginación.
    /// </summary>
    /// <param name="searchTerm">Texto a buscar en nombre o descripción</param>
    /// <param name="category">Filtro por categoría</param>
    /// <param name="status">Filtro por estado</param>
    /// <param name="page">Número de página (1-based)</param>
    /// <param name="pageSize">Tamaño de página</param>
    /// <returns>Tupla con la lista de proyectos y el total de coincidencias</returns>
    Task<(List<Project>, long)> SearchAsync(string? searchTerm, string? category, string? status, int page, int pageSize);

    /// <summary>
    /// Elimina un proyecto del sistema.
    /// ADVERTENCIA: Esto puede afectar evaluaciones asociadas.
    /// </summary>
    /// <param name="id">ID del proyecto a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);

    /// <summary>
    /// Genera IDs incrementales para proyectos existentes que tengan IDs tipo ObjectId.
    /// </summary>
    Task InitializeIncrementalIdsAsync();
}
