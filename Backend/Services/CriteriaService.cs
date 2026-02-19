using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de criterios de evaluación.
/// Implementa todas las operaciones de base de datos para la entidad Criterion.
/// Utiliza MongoDB.Driver para acceso directo a la colección de criterios.
/// </summary>
public class CriteriaService : ICriteriaService
{
    // Campo privado que mantiene la referencia a la colección de MongoDB
    private readonly IMongoCollection<Criterion> _collection;
    private readonly IMongoCollection<DatabaseCounters> _counters;

    /// <summary>
    /// Constructor que inicializa la conexión a MongoDB y obtiene la colección de criterios.
    /// </summary>
    /// <param name="settings">Configuración de la base de datos desde appsettings.json</param>
    public CriteriaService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Criterion>(settings.Value.CriteriaCollectionName);
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
    /// Obtiene todos los criterios de evaluación sin filtro.
    /// </summary>
    public async Task<List<Criterion>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca un criterio específico por su ID único de MongoDB.
    /// </summary>
    public async Task<Criterion?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Inserta un nuevo criterio en la base de datos con ID incremental.
    /// </summary>
    public async Task CreateAsync(Criterion criterion)
    {
        if (string.IsNullOrEmpty(criterion.IncrementalId))
        {
            criterion.IncrementalId = await GetNextIdAsync("criteria");
        }
        await _collection.InsertOneAsync(criterion);
    }

    /// <summary>
    /// Reemplaza completamente un criterio existente con nuevos datos.
    /// </summary>
    public async Task UpdateAsync(string id, Criterion criterion)
    {
        criterion.Id = id;
        await _collection.ReplaceOneAsync(x => x.Id == id, criterion);
    }

    /// <summary>
    /// Elimina permanentemente un criterio de la base de datos.
    /// </summary>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Asigna IncrementalId a criterios existentes que no lo tengan.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var criteria = await _collection.Find(_ => true).ToListAsync();
        foreach (var criterion in criteria)
        {
            if (string.IsNullOrEmpty(criterion.IncrementalId))
            {
                var newIncId = await GetNextIdAsync("criteria");
                var filter = Builders<Criterion>.Filter.Eq(c => c.Id, criterion.Id);
                var update = Builders<Criterion>.Update.Set(c => c.IncrementalId, newIncId);
                await _collection.UpdateOneAsync(filter, update);
            }
        }
    }
}
