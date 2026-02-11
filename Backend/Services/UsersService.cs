using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de usuarios del sistema QuestEval.
/// Responsable de operaciones de autenticación, registro y administración de usuarios.
/// Los usuarios pueden tener roles: Alumno, Profesor o Admin.
/// </summary>
public class UsersService : IUsersService
{
    // Colección de MongoDB para usuarios
    private readonly IMongoCollection<User> _collection;

    /// <summary>
    /// Constructor que establece conexión con la colección de usuarios en MongoDB.
    /// </summary>
    /// <param name="settings">Configuración de base de datos desde appsettings.json</param>
    public UsersService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<User>(settings.Value.UsersCollectionName);
    }

    /// <summary>
    /// Obtiene lista completa de usuarios.
    /// NOTA: En producción considerar paginación para grandes volúmenes.
    /// </summary>
    public async Task<List<User>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca usuario por su ID único de MongoDB.
    /// Se usa para obtener perfil de usuario o validar existencia.
    /// </summary>
    /// <param name="id">ObjectId del usuario en formato string</param>
    public async Task<User?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Busca usuario por email.
    /// IMPORTANTE: Email debe ser único en el sistema (validar antes de crear).
    /// Se usa principalmente en el proceso de login.
    /// </summary>
    /// <param name="email">Dirección de correo electrónico</param>
    public async Task<User?> GetByEmailAsync(string email) =>
        await _collection.Find(x => x.Email == email).FirstOrDefaultAsync();

    /// <summary>
    /// Registra un nuevo usuario en la base de datos.
    /// IMPORTANTE: 
    /// - El password debe venir ya hasheado (SHA256 o BCrypt)
    /// - CreatedAt y UpdatedAt deben establecerse antes de llamar este método
    /// - Validar que el email no exista previamente
    /// </summary>
    /// <param name="user">Objeto User con todos los datos necesarios</param>
    public async Task CreateAsync(User user) =>
        await _collection.InsertOneAsync(user);

    /// <summary>
    /// Actualiza datos de un usuario existente.
    /// Útil para cambiar nombre, avatar, rol, etc.
    /// NOTA: UpdatedAt debe actualizarse en el objeto user antes de llamar.
    /// </summary>
    /// <param name="id">ID del usuario a modificar</param>
    /// <param name="user">Objeto con los datos actualizados</param>
    public async Task UpdateAsync(string id, User user) =>
        await _collection.ReplaceOneAsync(x => x.Id == id, user);

    /// <summary>
    /// Elimina permanentemente un usuario.
    /// CONSIDERACIONES:
    /// - Las evaluaciones creadas por este usuario quedarán huérfanas
    /// - Las membresías del usuario deben manejarse (eliminar o mantener)
    /// - Considerar "soft delete" en lugar de eliminación física
    /// </summary>
    /// <param name="id">ID del usuario a eliminar</param>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);
}
