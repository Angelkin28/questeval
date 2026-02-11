using Backend.Models;

namespace Backend.Services.Interfaces;

/// <summary>
/// Interface para el servicio de gestión de usuarios del sistema.
/// Maneja autenticación, registro y operaciones CRUD de usuarios.
/// </summary>
public interface IUsersService
{
    /// <summary>
    /// Obtiene todos los usuarios registrados en el sistema.
    /// </summary>
    /// <returns>Lista completa de usuarios</returns>
    Task<List<User>> GetAllAsync();

    /// <summary>
    /// Busca un usuario por su ID único.
    /// </summary>
    /// <param name="id">ID del usuario (MongoDB ObjectId)</param>
    /// <returns>El usuario encontrado o null si no existe</returns>
    Task<User?> GetByIdAsync(string id);

    /// <summary>
    /// Busca un usuario por su correo electrónico.
    /// Útil para login y validación de duplicados al registrar.
    /// </summary>
    /// <param name="email">Correo electrónico del usuario</param>
    /// <returns>El usuario con ese email o null si no existe</returns>
    Task<User?> GetByEmailAsync(string email);

    /// <summary>
    /// Registra un nuevo usuario en el sistema.
    /// El password debe venir ya hasheado desde el controller.
    /// </summary>
    /// <param name="user">Datos del nuevo usuario</param>
    /// <returns>Tarea asíncrona de creación</returns>
    Task CreateAsync(User user);

    /// <summary>
    /// Actualiza los datos de un usuario existente.
    /// </summary>
    /// <param name="id">ID del usuario a actualizar</param>
    /// <param name="user">Nuevos datos del usuario</param>
    /// <returns>Tarea asíncrona de actualización</returns>
    Task UpdateAsync(string id, User user);

    /// <summary>
    /// Elimina un usuario del sistema.
    /// ADVERTENCIA: Puede afectar membresías y evaluaciones relacionadas.
    /// </summary>
    /// <param name="id">ID del usuario a eliminar</param>
    /// <returns>Tarea asíncrona de eliminación</returns>
    Task DeleteAsync(string id);
}
