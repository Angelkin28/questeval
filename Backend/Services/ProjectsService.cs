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

    /// <summary>
    /// Constructor que inicializa la conexión a la colección de proyectos.
    /// </summary>
    /// <param name="settings">Configuración de la base de datos</param>
    public ProjectsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Project>(settings.Value.ProjectsCollectionName);
    }

    /// <summary>
    /// Recupera todos los proyectos sin filtro.
    /// MEJORA FUTURA: Implementar filtro por GroupId o Status para optimizar queries.
    /// </summary>
    public async Task<List<Project>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca un proyecto por su ID único.
    /// Se usa para obtener detalles antes de crear evaluaciones.
    /// </summary>
    /// <param name="id">MongoDB ObjectId del proyecto</param>
    public async Task<Project?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Obtiene todos los proyectos que pertenecen a un grupo especfico.
    /// til para mostrar proyectos en la lista de grupos o en el perfil de usuario.
    /// </summary>
    public async Task<List<Project>> GetByGroupIdAsync(string groupId) =>
        await _collection.Find(x => x.GroupId == groupId).ToListAsync();

    /// <summary>
    /// Crea un nuevo proyecto en la base de datos.
    /// VALIDACIONES PREVIAS RECOMENDADAS:
    /// - Verificar que el GroupId exista
    /// - Establecer Status inicial (por defecto "Active")
    /// - Establecer CreatedAt y UpdatedAt con DateTime.UtcNow
    /// </summary>
    /// <param name="project">Proyecto con Name, Description y GroupId</param>
    public async Task CreateAsync(Project project) =>
        await _collection.InsertOneAsync(project);

    /// <summary>
    /// Actualiza un proyecto existente.
    /// Casos de uso comunes:
    /// - Cambiar el status a "Finalized" cuando se completa
    /// - Actualizar nombre o descripción
    /// - Archivar proyectos antiguos (status = "Archived")
    /// IMPORTANTE: Actualizar el campo UpdatedAt antes de llamar este método.
    /// </summary>
    /// <param name="id">ID del proyecto a modificar</param>
    /// <param name="project">Datos actualizados del proyecto</param>
    public async Task UpdateAsync(string id, Project project) =>
        await _collection.ReplaceOneAsync(x => x.Id == id, project);

    /// <summary>
    /// Elimina permanentemente un proyecto.
    /// IMPACTO EN CASCADA:
    /// - Las evaluaciones asociadas quedarán huérfanas (considerar eliminarlas también)
    /// - Mejor práctica: cambiar Status a "Archived" en lugar de eliminar
    /// </summary>
    /// <param name="id">ID del proyecto a eliminar</param>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);
}
