using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Linq;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de proyectos de estudiantes.
/// Los proyectos son trabajos entregables que pertenecen a un grupo específico.
/// Pueden tener diferentes estados: Active (en progreso), Finalized (completado), Archived (archivado).
/// </summary>
public class ProjectsService : IProjectsService
{
    // Colección de MongoDB para proyectos
   private readonly IMongoCollection<Project> _collection;
   private readonly IMongoCollection<DatabaseCounters> _counters;

    /// <summary>
    /// Constructor que inicializa la conexión a la colección de proyectos.
    /// </summary>
    /// <param name="settings">Configuración de la base de datos</param>
    public ProjectsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Project>(settings.Value.ProjectsCollectionName);
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
    /// Recupera todos los proyectos sin filtro.
    /// </summary>
    public async Task<List<Project>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca un proyecto por su ID único.
    /// </summary>
    public async Task<Project?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<Project?> GetByProjectIdAsync(string projectId) =>
        await _collection.Find(x => x.ProjectId == projectId).FirstOrDefaultAsync();

    /// <summary>
    /// Obtiene todos los proyectos que pertenecen a un grupo especfico.
    /// </summary>
    public async Task<List<Project>> GetByGroupIdAsync(string groupId) =>
        await _collection.Find(x => x.GroupId == groupId).ToListAsync();

    /// <summary>
    /// Crea un nuevo proyecto en la base de datos con Códice secular.
    /// </summary>
    public async Task CreateAsync(Project project)
    {
        if (string.IsNullOrEmpty(project.ProjectId))
        {
            project.ProjectId = await GetNextIdAsync("projects");
        }
        await _collection.InsertOneAsync(project);
    }

    /// <summary>
    /// Actualiza un proyecto existente.
    /// </summary>
    public async Task UpdateAsync(string id, Project project)
    {
        project.Id = id;
        await _collection.ReplaceOneAsync(x => x.Id == id, project);
    }

    /// <summary>
    /// Elimina permanentemente un proyecto.
    /// </summary>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Busca y filtra proyectos con paginación.
    /// </summary>
    public async Task<(List<Project>, long)> SearchAsync(string? searchTerm, string? category, string? status, int page, int pageSize)
    {
        var builder = Builders<Project>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchFilter = builder.Or(
                builder.Regex(x => x.Name, new BsonRegularExpression(searchTerm, "i")),
                builder.Regex(x => x.Description, new BsonRegularExpression(searchTerm, "i"))
            );
            filter = builder.And(filter, searchFilter);
        }

        if (!string.IsNullOrEmpty(category))
        {
            filter = builder.And(filter, builder.Eq(x => x.Category, category));
        }

        if (!string.IsNullOrEmpty(status))
        {
            filter = builder.And(filter, builder.Eq(x => x.Status, status));
        }

        var total = await _collection.CountDocumentsAsync(filter);
        var projects = await _collection.Find(filter)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (projects, total);
    }

    /// <summary>
    /// Migra proyectos existentes: renombra IncrementalId a Codice y convierte GroupId (ObjectId) a GroupCodice (string).
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var rawProjects = _collection.Database.GetCollection<BsonDocument>(_collection.CollectionNamespace.CollectionName);
        var rawGroups = _collection.Database.GetCollection<BsonDocument>("groups"); // Nombre de colección por defecto o desde settings si fuera posible

        var projects = await rawProjects.Find(_ => true).ToListAsync();
        foreach (var projectDoc in projects)
        {
            var updates = new List<UpdateDefinition<BsonDocument>>();

            // 1. Migrar IncrementalId/Codice -> ProjectId
            if ((projectDoc.Contains("IncrementalId") || projectDoc.Contains("Codice")) && !projectDoc.Contains("ProjectId"))
            {
                var val = projectDoc.Contains("Codice") ? projectDoc["Codice"].ToString() : projectDoc["IncrementalId"].ToString();
                updates.Add(Builders<BsonDocument>.Update.Set("ProjectId", val));
                updates.Add(Builders<BsonDocument>.Update.Unset("IncrementalId"));
                updates.Add(Builders<BsonDocument>.Update.Unset("Codice"));
            }
            else if (!projectDoc.Contains("ProjectId"))
            {
                var newProjId = await GetNextIdAsync("projects");
                updates.Add(Builders<BsonDocument>.Update.Set("ProjectId", newProjId));
            }

            // 2. Migrar GroupId (ObjectId) / GroupCodice (string) -> GroupId (string)
            if (projectDoc.Contains("GroupId") || projectDoc.Contains("GroupCodice"))
            {
                BsonValue? oldGroupIdVal = projectDoc.Contains("GroupId") ? projectDoc["GroupId"] : projectDoc["GroupCodice"];
                
                if (oldGroupIdVal != null)
                {
                    string? groupIdStr = null;
                    if (oldGroupIdVal.IsObjectId)
                    {
                        var group = await rawGroups.Find(Builders<BsonDocument>.Filter.Eq("_id", oldGroupIdVal)).FirstOrDefaultAsync();
                        if (group != null)
                        {
                            groupIdStr = group.Contains("GroupId") ? group["GroupId"].ToString() : (group.Contains("Codice") ? group["Codice"].ToString() : (group.Contains("IncrementalId") ? group["IncrementalId"].ToString() : ""));
                        }
                        
                        // Si después de todo no tenemos un ID de grupo secuencial, al menos convertir el ObjectId a string para evitar errores de tipo
                        if (string.IsNullOrEmpty(groupIdStr))
                        {
                            groupIdStr = oldGroupIdVal.ToString();
                        }
                    }
                    else
                    {
                        groupIdStr = oldGroupIdVal.ToString();
                    }

                    if (!string.IsNullOrEmpty(groupIdStr))
                    {
                        updates.Add(Builders<BsonDocument>.Update.Set("GroupId", groupIdStr));
                        updates.Add(Builders<BsonDocument>.Update.Unset("GroupCodice"));
                    }
                }
            }

            // 3. Migrar UserId (ObjectId) -> UserId (string)
            if (projectDoc.Contains("UserId") && projectDoc["UserId"].IsObjectId)
            {
                var userObjId = projectDoc["UserId"].AsObjectId;
                var rawUsers = _collection.Database.GetCollection<BsonDocument>("users");
                var user = await rawUsers.Find(Builders<BsonDocument>.Filter.Eq("_id", userObjId)).FirstOrDefaultAsync();
                
                string userIdStr;
                if (user != null)
                {
                    userIdStr = user.Contains("UserId") ? user["UserId"].ToString() ?? string.Empty : (user.Contains("Enrollment") ? user["Enrollment"].ToString() ?? string.Empty : (user.Contains("IncrementalId") ? user["IncrementalId"].ToString() ?? string.Empty : userObjId.ToString()));
                }
                else
                {
                    userIdStr = userObjId.ToString();
                }
                
                updates.Add(Builders<BsonDocument>.Update.Set("UserId", userIdStr));
            }

            if (updates.Any())
            {
                await rawProjects.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", projectDoc["_id"]),
                    Builders<BsonDocument>.Update.Combine(updates)
                );
            }
        }
    }
}
