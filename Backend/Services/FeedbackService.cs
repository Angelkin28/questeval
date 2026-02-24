using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Linq;
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

    public async Task<Feedback?> GetByFeedbackIdAsync(string feedbackId) =>
        await _collection.Find(x => x.FeedbackId == feedbackId).FirstOrDefaultAsync();

    public async Task<List<Feedback>> GetByEvaluationIdAsync(string evaluationId) =>
        await _collection.Find(x => x.EvaluationId == evaluationId).ToListAsync();

    /// <summary>
    /// Crea un nuevo feedback para una evaluación con Códice secular.
    /// </summary>
    public async Task CreateAsync(Feedback feedback)
    {
        if (string.IsNullOrEmpty(feedback.FeedbackId))
        {
            feedback.FeedbackId = await GetNextIdAsync("feedback");
        }
        await _collection.InsertOneAsync(feedback);
    }

    /// <summary>
    /// Elimina un feedback.
    /// </summary>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Migra feedback existente: renombra IncrementalId a Codice y convierte EvaluationId (ObjectId) a EvaluationCodice (string).
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var rawFeedback = _collection.Database.GetCollection<BsonDocument>(_collection.CollectionNamespace.CollectionName);
        var rawEvaluations = _collection.Database.GetCollection<BsonDocument>("evaluations");

        var feedbacks = await rawFeedback.Find(_ => true).ToListAsync();
        foreach (var feedbackDoc in feedbacks)
        {
            var updates = new List<UpdateDefinition<BsonDocument>>();

            // 1. Migrar IncrementalId/Codice -> FeedbackId
            if ((feedbackDoc.Contains("IncrementalId") || feedbackDoc.Contains("Codice")) && !feedbackDoc.Contains("FeedbackId"))
            {
                var val = feedbackDoc.Contains("Codice") ? feedbackDoc["Codice"].ToString() : feedbackDoc["IncrementalId"].ToString();
                updates.Add(Builders<BsonDocument>.Update.Set("FeedbackId", val));
                updates.Add(Builders<BsonDocument>.Update.Unset("IncrementalId"));
                updates.Add(Builders<BsonDocument>.Update.Unset("Codice"));
            }
            else if (!feedbackDoc.Contains("FeedbackId"))
            {
                var newFeedId = await GetNextIdAsync("feedback");
                updates.Add(Builders<BsonDocument>.Update.Set("FeedbackId", newFeedId));
            }

            // 2. Migrar EvaluationId (ObjectId) / EvaluationCodice (string) -> EvaluationId (string)
            if (!feedbackDoc.Contains("EvaluationId") || feedbackDoc["EvaluationId"].IsObjectId)
            {
                BsonValue? oldEvalVal = feedbackDoc.Contains("EvaluationId") ? feedbackDoc["EvaluationId"] : (feedbackDoc.Contains("EvaluationCodice") ? feedbackDoc["EvaluationCodice"] : null);
                if (oldEvalVal != null)
                {
                    string? evalIdStr = null;
                    if (oldEvalVal.IsObjectId)
                    {
                        var eval = await rawEvaluations.Find(Builders<BsonDocument>.Filter.Eq("_id", oldEvalVal)).FirstOrDefaultAsync();
                        if (eval != null)
                        {
                            evalIdStr = eval.Contains("EvaluationId") ? eval["EvaluationId"].ToString() : (eval.Contains("Codice") ? eval["Codice"].ToString() : (eval.Contains("IncrementalId") ? eval["IncrementalId"].ToString() : ""));
                        }
                    }
                    else
                    {
                        evalIdStr = oldEvalVal.ToString();
                    }

                    if (!string.IsNullOrEmpty(evalIdStr))
                    {
                        updates.Add(Builders<BsonDocument>.Update.Set("EvaluationId", evalIdStr));
                        updates.Add(Builders<BsonDocument>.Update.Unset("EvaluationCodice"));
                    }
                }
            }

            if (updates.Any())
            {
                await rawFeedback.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", feedbackDoc["_id"]),
                    Builders<BsonDocument>.Update.Combine(updates)
                );
            }
        }
    }
}
