using Microsoft.Extensions.Options;
using MongoDB.Driver;
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

    /// <summary>
    /// Obtiene todos los proyectos que pertenecen a un grupo especfico.
    /// </summary>
    public async Task<List<Project>> GetByGroupIdAsync(string groupId) =>
        await _collection.Find(x => x.GroupId == groupId).ToListAsync();

    /// <summary>
    /// Crea un nuevo proyecto en la base de datos con ID incremental.
    /// </summary>
    public async Task CreateAsync(Project project)
    {
        if (string.IsNullOrEmpty(project.IncrementalId))
        {
            project.IncrementalId = await GetNextIdAsync("projects");
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
    /// Asigna IncrementalId a proyectos existentes que no lo tengan.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var projects = await _collection.Find(_ => true).ToListAsync();
        foreach (var project in projects)
        {
            if (string.IsNullOrEmpty(project.IncrementalId))
            {
                var newIncId = await GetNextIdAsync("projects");
                var filter = Builders<Project>.Filter.Eq(p => p.Id, project.Id);
                var update = Builders<Project>.Update.Set(p => p.IncrementalId, newIncId);
                await _collection.UpdateOneAsync(filter, update);
            }
        }
    }
}
