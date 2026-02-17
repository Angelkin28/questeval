using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interface para el servicio de gestión de membresías.
/// Las membresías representan la relación many-to-many entre usuarios y grupos.
/// </summary>
public interface IMembershipsService
{
    /// <summary>
    /// Obtiene todas las membresías del sistema.
    /// </summary>
    /// <returns>Lista completa de membresías</returns>
    Task<List<Membership>> GetAllAsync();

    /// <summary>
    /// Busca una membresía específica por su ID.
    /// </summary>
    /// <param name="id">ID de la membresía (MongoDB ObjectId)</param>
    /// <returns>La membresía encontrada o null si no existe</returns>
    Task<Membership?> GetByIdAsync(string id);
    
    Task<List<Membership>> GetByUserIdAsync(string userId);
    
    Task<List<Membership>> GetByGroupIdAsync(string groupId);

    /// <summary>
    /// Crea una nueva membresía (usuario se une a un grupo).
    /// </summary>
    /// <param name="membership">Datos de la nueva membresía (UserId + GroupId)</param>
    /// <returns>Tarea asíncrona de creación</returns>
    Task CreateAsync(Membership membership);

    /// <summary>
    /// Elimina una membresía (usuario abandona un grupo).
    /// </summary>
    /// <param name="id">ID de la membresía a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);
}
