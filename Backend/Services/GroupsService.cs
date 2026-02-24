using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Linq;
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

    public async Task<Group?> GetByGroupIdAsync(string groupId) =>
        await _collection.Find(x => x.GroupId == groupId).FirstOrDefaultAsync();

    /// <summary>
    /// Crea un nuevo grupo en la base de datos con Códice secuencial.
    /// </summary>
    public async Task CreateAsync(Group group)
    {
        if (string.IsNullOrEmpty(group.GroupId))
        {
            group.GroupId = await GetNextIdAsync("groups");
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
    /// Migra grupos existentes: renombra IncrementalId a Codice y limpia campos viejos.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var rawCollection = _collection.Database.GetCollection<BsonDocument>(_collection.CollectionNamespace.CollectionName);
        var groups = await rawCollection.Find(_ => true).ToListAsync();

        foreach (var groupDoc in groups)
        {
            var updates = new List<UpdateDefinition<BsonDocument>>();

            if ((groupDoc.Contains("IncrementalId") || groupDoc.Contains("Codice")) && !groupDoc.Contains("GroupId"))
            {
                var val = groupDoc.Contains("Codice") ? groupDoc["Codice"].ToString() : groupDoc["IncrementalId"].ToString();
                updates.Add(Builders<BsonDocument>.Update.Set("GroupId", val));
                updates.Add(Builders<BsonDocument>.Update.Unset("IncrementalId"));
                updates.Add(Builders<BsonDocument>.Update.Unset("Codice"));
            }
            else if (!groupDoc.Contains("GroupId"))
            {
                var newGroupId = await GetNextIdAsync("groups");
                updates.Add(Builders<BsonDocument>.Update.Set("GroupId", newGroupId));
            }

            if (updates.Any())
            {
                await rawCollection.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", groupDoc["_id"]),
                    Builders<BsonDocument>.Update.Combine(updates)
                );
            }
        }
    }
}
