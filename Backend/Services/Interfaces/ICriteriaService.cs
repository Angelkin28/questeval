using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interface para el servicio de gestión de criterios de evaluación.
/// Define todas las operaciones CRUD disponibles para criterios.
/// </summary>
public interface ICriteriaService
{
    /// <summary>
    /// Obtiene todos los criterios de evaluación registrados en el sistema.
    /// </summary>
    /// <returns>Lista completa de criterios</returns>
    Task<List<Criterion>> GetAllAsync();

    /// <summary>
    /// Busca un criterio específico por su ID único.
    /// </summary>
    /// <param name="id">ID del criterio (MongoDB ObjectId)</param>
    /// <returns>El criterio encontrado o null si no existe</returns>
    Task<Criterion?> GetByIdAsync(string id);

    /// <summary>
    /// Crea un nuevo criterio de evaluación en la base de datos.
    /// </summary>
    /// <param name="criterion">Objeto con los datos del nuevo criterio</param>
    /// <returns>Tarea asíncrona de creación</returns>
    Task CreateAsync(Criterion criterion);

    /// <summary>
    /// Actualiza un criterio existente con nuevos datos.
    /// </summary>
    /// <param name="id">ID del criterio a actualizar</param>
    /// <param name="criterion">Objeto con los datos actualizados</param>
    /// <returns>Tarea asíncrona de actualización</returns>
    Task UpdateAsync(string id, Criterion criterion);

    /// <summary>
    /// Elimina permanentemente un criterio del sistema.
    /// </summary>
    /// <param name="id">ID del criterio a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);
}
