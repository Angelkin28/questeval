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
    private readonly IMongoCollection<DatabaseCounters> _counters;

    /// <summary>
    /// Constructor que inicializa la conexión a la colección de groups en MongoDB.
    /// </summary>
    /// <param name="settings">Configuración de base de datos inyectada por DI</param>
    public GroupsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Group>(settings.Value.GroupsCollectionName);
        _counters = database.GetCollection<DatabaseCounters>("database_counters");
    }

    private async Task<string> GetNextIdAsync(string collectionName)
    {
        var filter = Builders<DatabaseCounters>.Filter.Eq(x => x.CollectionName, collectionName);
        var update = Builders<DatabaseCounters>.Update.Inc(x => x.LastId, 1);
        var options = new FindOneAndUpdateOptions<DatabaseCounters>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var counter = await _counters.FindOneAndUpdateAsync(filter, update, options);
        return counter.LastId.ToString();
    }

    /// <summary>
    /// Recupera todos los grupos sin aplicar filtros.
    /// </summary>
    public async Task<List<Group>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca un grupo por su ID único de MongoDB.
    /// </summary>
    public async Task<Group?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Crea un nuevo grupo en la base de datos con ID incremental.
    /// </summary>
    public async Task CreateAsync(Group group)
    {
        if (string.IsNullOrEmpty(group.IncrementalId))
        {
            group.IncrementalId = await GetNextIdAsync("groups");
        }
        await _collection.InsertOneAsync(group);
    }

    /// <summary>
    /// Actualiza todos los datos de un grupo existente.
    /// </summary>
    public async Task UpdateAsync(string id, Group group)
    {
        group.Id = id;
        await _collection.ReplaceOneAsync(x => x.Id == id, group);
    }

    /// <summary>
    /// Elimina un grupo permanentemente.
    /// </summary>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Asigna IncrementalId a grupos existentes que no lo tengan.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var groups = await _collection.Find(_ => true).ToListAsync();
        foreach (var group in groups)
        {
            if (string.IsNullOrEmpty(group.IncrementalId))
            {
                var newIncId = await GetNextIdAsync("groups");
                var filter = Builders<Group>.Filter.Eq(g => g.Id, group.Id);
                var update = Builders<Group>.Update.Set(g => g.IncrementalId, newIncId);
                await _collection.UpdateOneAsync(filter, update);
            }
        }
    }
}
