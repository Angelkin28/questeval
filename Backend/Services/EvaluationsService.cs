using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Linq;
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

    public async Task<Evaluation?> GetByEvaluationIdAsync(string evaluationId) =>
        await _collection.Find(x => x.EvaluationId == evaluationId).FirstOrDefaultAsync();

    /// <summary>
    /// Obtiene evaluaciones por ProjectCodice.
    /// </summary>
    public async Task<List<Evaluation>> GetByProjectIdAsync(string projectId) =>
        await _collection.Find(x => x.ProjectId == projectId).ToListAsync();

    /// <summary>
    /// Obtiene evaluaciones por UserEnrollment (Evaluador).
    /// </summary>
    public async Task<List<Evaluation>> GetByUserIdAsync(string userId) =>
        await _collection.Find(x => x.UserId == userId).ToListAsync();

    /// <summary>
    /// Crea una nueva evaluación de un proyecto con Códice secular.
    /// </summary>
    public async Task CreateAsync(Evaluation evaluation)
    {
        if (string.IsNullOrEmpty(evaluation.EvaluationId))
        {
            evaluation.EvaluationId = await GetNextIdAsync("evaluations");
        }
        await _collection.InsertOneAsync(evaluation);
    }

    /// <summary>
    /// Elimina una evaluación.
    /// </summary>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Migra evaluaciones existentes: renombra campos y resuelve relaciones (Project, User, Criteria).
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var rawEvaluations = _collection.Database.GetCollection<BsonDocument>(_collection.CollectionNamespace.CollectionName);
        var rawProjects = _collection.Database.GetCollection<BsonDocument>("projects");
        var rawUsers = _collection.Database.GetCollection<BsonDocument>("users");
        var rawCriteria = _collection.Database.GetCollection<BsonDocument>("criteria");

        var evaluations = await rawEvaluations.Find(_ => true).ToListAsync();
        foreach (var evalDoc in evaluations)
        {
            var updates = new List<UpdateDefinition<BsonDocument>>();

            // 1. Migrar IncrementalId/Codice -> EvaluationId
            if ((evalDoc.Contains("IncrementalId") || evalDoc.Contains("Codice")) && !evalDoc.Contains("EvaluationId"))
            {
                var val = evalDoc.Contains("Codice") ? evalDoc["Codice"].ToString() : evalDoc["IncrementalId"].ToString();
                updates.Add(Builders<BsonDocument>.Update.Set("EvaluationId", val));
                updates.Add(Builders<BsonDocument>.Update.Unset("IncrementalId"));
                updates.Add(Builders<BsonDocument>.Update.Unset("Codice"));
            }
            else if (!evalDoc.Contains("EvaluationId"))
            {
                var newEvalId = await GetNextIdAsync("evaluations");
                updates.Add(Builders<BsonDocument>.Update.Set("EvaluationId", newEvalId));
            }

            // 2. Migrar ProjectId (ObjectId) / ProjectCodice (string) -> ProjectId (string)
            if (!evalDoc.Contains("ProjectId") || evalDoc["ProjectId"].IsObjectId)
            {
                BsonValue? oldProjectIdVal = evalDoc.Contains("ProjectId") ? evalDoc["ProjectId"] : (evalDoc.Contains("ProjectCodice") ? evalDoc["ProjectCodice"] : null);
                if (oldProjectIdVal != null)
                {
                    string? projectIdStr = null;
                    if (oldProjectIdVal.IsObjectId)
                    {
                        var project = await rawProjects.Find(Builders<BsonDocument>.Filter.Eq("_id", oldProjectIdVal)).FirstOrDefaultAsync();
                        if (project != null)
                        {
                            projectIdStr = project.Contains("ProjectId") ? project["ProjectId"].ToString() : (project.Contains("Codice") ? project["Codice"].ToString() : (project.Contains("IncrementalId") ? project["IncrementalId"].ToString() : ""));
                        }
                    }
                    else
                    {
                        projectIdStr = oldProjectIdVal.ToString();
                    }

                    if (!string.IsNullOrEmpty(projectIdStr))
                    {
                        updates.Add(Builders<BsonDocument>.Update.Set("ProjectId", projectIdStr));
                        updates.Add(Builders<BsonDocument>.Update.Unset("ProjectCodice"));
                    }
                }
            }

            // 3. Migrar EvaluatorId/UserId (ObjectId) / UserEnrollment (string) -> UserId (string)
            string? oldUserField = evalDoc.Contains("EvaluatorId") ? "EvaluatorId" : (evalDoc.Contains("UserId") ? "UserId" : (evalDoc.Contains("UserEnrollment") ? "UserEnrollment" : null));
            if (oldUserField != null && (!evalDoc.Contains("UserId") || evalDoc["UserId"].IsObjectId || oldUserField == "UserEnrollment"))
            {
                var oldUserVal = evalDoc[oldUserField];
                string? userIdStr = null;
                if (oldUserVal.IsObjectId)
                {
                    var user = await rawUsers.Find(Builders<BsonDocument>.Filter.Eq("_id", oldUserVal)).FirstOrDefaultAsync();
                    if (user != null)
                    {
                        userIdStr = user.Contains("UserId") ? user["UserId"].ToString() : (user.Contains("Enrollment") ? user["Enrollment"].ToString() : (user.Contains("IncrementalId") ? user["IncrementalId"].ToString() : ""));
                    }
                }
                else
                {
                    userIdStr = oldUserVal.ToString();
                }

                if (!string.IsNullOrEmpty(userIdStr))
                {
                    updates.Add(Builders<BsonDocument>.Update.Set("UserId", userIdStr));
                    if (oldUserField != "UserId") updates.Add(Builders<BsonDocument>.Update.Unset(oldUserField));
                }
            }

            // 4. Migrar Details (CriterionId / CriterionCodice / CriteriaId)
            if (evalDoc.Contains("Details"))
            {
                var details = evalDoc["Details"].AsBsonArray;
                bool detailsChanged = false;
                foreach (var detail in details)
                {
                    var detailObj = detail.AsBsonDocument;
                    if (!detailObj.Contains("CriteriaId") || detailObj["CriteriaId"].IsObjectId)
                    {
                        BsonValue? oldCritVal = detailObj.Contains("CriteriaId") ? detailObj["CriteriaId"] : (detailObj.Contains("CriterionCodice") ? detailObj["CriterionCodice"] : (detailObj.Contains("CriterionId") ? detailObj["CriterionId"] : null));
                        
                        if (oldCritVal != null)
                        {
                            string? critIdStr = null;
                            if (oldCritVal.IsObjectId)
                            {
                                var crit = await rawCriteria.Find(Builders<BsonDocument>.Filter.Eq("_id", oldCritVal)).FirstOrDefaultAsync();
                                if (crit != null)
                                {
                                    critIdStr = crit.Contains("CriteriaId") ? crit["CriteriaId"].ToString() : (crit.Contains("Codice") ? crit["Codice"].ToString() : (crit.Contains("IncrementalId") ? crit["IncrementalId"].ToString() : ""));
                                }
                            }
                            else
                            {
                                critIdStr = oldCritVal.ToString();
                            }

                            if (!string.IsNullOrEmpty(critIdStr))
                            {
                                detailObj.Set("CriteriaId", critIdStr);
                                detailObj.Remove("CriterionCodice");
                                detailObj.Remove("CriterionId");
                                detailsChanged = true;
                            }
                        }
                    }
                }
                if (detailsChanged)
                {
                    updates.Add(Builders<BsonDocument>.Update.Set("Details", details));
                }
            }

            if (updates.Any())
            {
                await rawEvaluations.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", evalDoc["_id"]),
                    Builders<BsonDocument>.Update.Combine(updates)
                );
            }
        }
    }
}
