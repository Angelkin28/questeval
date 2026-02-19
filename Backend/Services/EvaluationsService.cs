using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de evaluaciones de proyectos.
/// Las evaluaciones son documentos complejos que contienen:
/// - Referencia al proyecto evaluado
/// - Múltiples criterios con puntuaciones individuales
/// - Puntaje final calculado (suma de scores individuales)
/// - Evaluador (quien realizó la evaluación)
/// 
/// NOTA IMPORTANTE: Las evaluaciones son INMUTABLES una vez creadas.
/// No existe método Update() para preservar la integridad histórica de las calificaciones.
/// </summary>
public class EvaluationsService : IEvaluationsService
{
    // Colección de MongoDB para evaluaciones
    private readonly IMongoCollection<Evaluation> _collection;
    private readonly IMongoCollection<DatabaseCounters> _counters;

    /// <summary>
    /// Constructor que establece la conexión a la colección de evaluaciones.
    /// </summary>
    /// <param name="settings">Configuración de base de datos</param>
    public EvaluationsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Evaluation>(settings.Value.EvaluationsCollectionName);
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
    /// Obtiene todas las evaluaciones.
    /// </summary>
    public async Task<List<Evaluation>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca una evaluación por su ID.
    /// </summary>
    public async Task<Evaluation?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Obtiene evaluaciones por ProjectId.
    /// </summary>
    public async Task<List<Evaluation>> GetByProjectIdAsync(string projectId) =>
        await _collection.Find(x => x.ProjectId == projectId).ToListAsync();

    /// <summary>
    /// Crea una nueva evaluación de un proyecto con ID incremental.
    /// </summary>
    public async Task CreateAsync(Evaluation evaluation)
    {
        if (string.IsNullOrEmpty(evaluation.IncrementalId))
        {
            evaluation.IncrementalId = await GetNextIdAsync("evaluations");
        }
        await _collection.InsertOneAsync(evaluation);
    }

    /// <summary>
    /// Elimina una evaluación.
    /// </summary>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Asigna IncrementalId a evaluaciones existentes que no lo tengan.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var evaluations = await _collection.Find(_ => true).ToListAsync();
        foreach (var evaluation in evaluations)
        {
            if (string.IsNullOrEmpty(evaluation.IncrementalId))
            {
                var newIncId = await GetNextIdAsync("evaluations");
                var filter = Builders<Evaluation>.Filter.Eq(e => e.Id, evaluation.Id);
                var update = Builders<Evaluation>.Update.Set(e => e.IncrementalId, newIncId);
                await _collection.UpdateOneAsync(filter, update);
            }
        }
    }
}
