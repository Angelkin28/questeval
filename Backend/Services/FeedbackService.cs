using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de retroalimentación (feedback) de evaluaciones.
/// 
/// El feedback complementa las evaluaciones numéricas con comentarios cualitativos.
/// Permite a los profesores dar:
/// - Comentarios generales sobre el proyecto
/// - Sugerencias de mejora
/// - Reconocimiento de fortalezas
/// - Orientación para futuros trabajos
/// 
/// RELACIÓN: Feedback → Evaluation (1 feedback puede referirse a 1 evaluación)
/// NOTA: Es opcional - no todas las evaluaciones requieren feedback textual.
/// </summary>
public class FeedbackService : IFeedbackService
{
    // Colección de MongoDB para feedback
    private readonly IMongoCollection<Feedback> _collection;
    private readonly IMongoCollection<DatabaseCounters> _counters;

    /// <summary>
    /// Constructor que establece la conexión a la colección de feedbacks.
    /// </summary>
    /// <param name="settings">Configuración de base de datos</param>
    public FeedbackService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Feedback>(settings.Value.FeedbackCollectionName);
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
    /// Obtiene todos los feedbacks sin filtro.
    /// </summary>
    public async Task<List<Feedback>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca un feedback por su ID único.
    /// </summary>
    public async Task<Feedback?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Crea un nuevo feedback para una evaluación con ID incremental.
    /// </summary>
    public async Task CreateAsync(Feedback feedback)
    {
        if (string.IsNullOrEmpty(feedback.IncrementalId))
        {
            feedback.IncrementalId = await GetNextIdAsync("feedback");
        }
        await _collection.InsertOneAsync(feedback);
    }

    /// <summary>
    /// Elimina un feedback.
    /// </summary>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Asigna IncrementalId a feedbacks existentes que no lo tengan.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var feedbacks = await _collection.Find(_ => true).ToListAsync();
        foreach (var feedback in feedbacks)
        {
            if (string.IsNullOrEmpty(feedback.IncrementalId))
            {
                var newIncId = await GetNextIdAsync("feedback");
                var filter = Builders<Feedback>.Filter.Eq(f => f.Id, feedback.Id);
                var update = Builders<Feedback>.Update.Set(f => f.IncrementalId, newIncId);
                await _collection.UpdateOneAsync(filter, update);
            }
        }
    }
}
