using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de membresías (relación Usuario-Grupo).
/// 
/// Las membresías implementan la relación many-to-many:
/// - Un usuario puede pertenecer a múltiples grupos
/// - Un grupo puede tener múltiples usuarios
/// 
/// Esta es una colección intermedia que conecta Users con Groups.
/// </summary>
public class MembershipsService : IMembershipsService
{
    // Colección de MongoDB para membresías
    private readonly IMongoCollection<Membership> _collection;

    /// <summary>
    /// Constructor que inicializa la conexión a la colección de memberships.
    /// </summary>
    /// <param name="settings">Configuración de la base de datos</param>
    public MembershipsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Membership>(settings.Value.MembershipsCollectionName);
    }

    /// <summary>
    /// Obtiene todas las membresías sin filtro.
    /// 
    /// MEJORAS FUTURAS - Agregar métodos de consulta:
    /// - GetByUserIdAsync(userId) → todos los grupos de un usuario
    /// - GetByGroupIdAsync(groupId) → todos los usuarios de un grupo
    /// - CheckMembershipAsync(userId, groupId) → verificar si existe membresía
    /// </summary>
    public async Task<List<Membership>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca una membresía específica por su ID.
    /// Raramente se usa directamente - más común buscar por UserId o GroupId.
    /// </summary>
    /// <param name="id">ObjectId de la membresía</param>
    public async Task<Membership?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Crea una nueva membresía (usuario se une a un grupo).
    /// 
    /// VALIDACIONES PREVIAS RECOMENDADAS:
    /// 1. Verificar que el UserId existe en la colección Users
    /// 2. Verificar que el GroupId existe en la colección Groups
    /// 3. IMPORTANTE: Verificar que no exista ya una membresía con este UserId+GroupId
    ///    (evitar duplicados - un usuario no puede unirse dos veces al mismo grupo)
    /// 4. Establecer JoinedAt con DateTime.UtcNow
    /// 
    /// ÍNDICE RECOMENDADO: 
    /// Crear índice único compuesto en (UserId, GroupId) para prevenir duplicados automáticamente.
    /// </summary>
    /// <param name="membership">Membresía con UserId y GroupId</param>
    public async Task CreateAsync(Membership membership) =>
        await _collection.InsertOneAsync(membership);

    /// <summary>
    /// Elimina una membresía (usuario abandona o es removido de un grupo).
    /// 
    /// CASOS DE USO:
    /// - Usuario voluntariamente abandona un grupo
    /// - Administrador/Profesor remueve a un usuario del grupo
    /// - Limpieza cuando se elimina un usuario o grupo
    /// 
    /// NO AFECTA:
    /// - Proyectos existentes en el grupo (se mantienen)
    /// - Evaluaciones ya realizadas
    /// </summary>
    /// <param name="id">ID de la membresía a eliminar</param>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);
}
