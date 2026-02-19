using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interface para el servicio de gestión de grupos de estudiantes.
/// Los grupos permiten organizar usuarios y proyectos en el sistema.
/// </summary>
public interface IGroupsService
{
    /// <summary>
    /// Obtiene todos los grupos registrados en el sistema.
    /// </summary>
    /// <returns>Lista completa de grupos</returns>
    Task<List<Group>> GetAllAsync();

    /// <summary>
    /// Busca un grupo específico por su ID único.
    /// </summary>
    /// <param name="id">ID del grupo (MongoDB ObjectId)</param>
    /// <returns>El grupo encontrado o null si no existe</returns>
    Task<Group?> GetByIdAsync(string id);

    /// <summary>
    /// Crea un nuevo grupo en la base de datos.
    /// El código de acceso debe ser único en el sistema.
    /// </summary>
    /// <param name="group">Objeto con los datos del nuevo grupo</param>
    /// <returns>Tarea asíncrona de creación</returns>
    Task CreateAsync(Group group);

    /// <summary>
    /// Actualiza los datos de un grupo existente.
    /// </summary>
    /// <param name="id">ID del grupo a actualizar</param>
    /// <param name="group">Objeto con los datos actualizados</param>
    /// <returns>Tarea asíncrona de actualización</returns>
    Task UpdateAsync(string id, Group group);

    /// <summary>
    /// Elimina permanentemente un grupo del sistema.
    /// ADVERTENCIA: Esto puede afectar proyectos y membresías relacionadas.
    /// </summary>
    /// <param name="id">ID del grupo a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);

    /// <summary>
    /// Genera IDs incrementales para grupos existentes que tengan IDs tipo ObjectId.
    /// </summary>
    Task InitializeIncrementalIdsAsync();
}
