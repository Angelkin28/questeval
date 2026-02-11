using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de grupos de estudiantes.
/// Los grupos son contenedores que agrupan proyectos y usuarios mediante membresías.
/// Cada grupo tiene un código de acceso único para que los usuarios puedan unirse.
/// </summary>
public class GroupsService : IGroupsService
{
    // Colección de MongoDB para la entidad Group
    private readonly IMongoCollection<Group> _collection;

    /// <summary>
    /// Constructor que inicializa la conexión a la colección de groups en MongoDB.
    /// </summary>
    /// <param name="settings">Configuración de base de datos inyectada por DI</param>
    public GroupsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Group>(settings.Value.GroupsCollectionName);
    }

    /// <summary>
    /// Recupera todos los grupos sin aplicar filtros.
    /// Útil para listar grupos disponibles o para administradores.
    /// </summary>
    public async Task<List<Group>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca un grupo por su ID único de MongoDB.
    /// Se usa para validar existencia antes de crear proyectos o membresías.
    /// </summary>
    /// <param name="id">ObjectId en formato string</param>
    public async Task<Group?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Crea un nuevo grupo en la base de datos.
    /// El AccessCode debe ser único - considerar validación previa.
    /// MongoDB asignará automáticamente el _id.
    /// </summary>
    /// <param name="group">Grupo a crear con Name y AccessCode</param>
    public async Task CreateAsync(Group group) =>
        await _collection.InsertOneAsync(group);

    /// <summary>
    /// Actualiza todos los datos de un grupo existente.
    /// Útil para cambiar nombre o código de acceso del grupo.
    /// </summary>
    /// <param name="id">ID del grupo a modificar</param>
    /// <param name="group">Nuevos datos del grupo</param>
    public async Task UpdateAsync(string id, Group group) =>
        await _collection.ReplaceOneAsync(x => x.Id == id, group);

    /// <summary>
    /// Elimina un grupo permanentemente.
    /// IMPORTANTE: Considerar eliminar o actualizar:
    /// - Proyectos asociados a este grupo
    /// - Membresías de usuarios en este grupo
    /// </summary>
    /// <param name="id">ID del grupo a eliminar</param>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);
}
