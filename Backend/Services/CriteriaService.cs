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
    // Esta colección se usa en todos los métodos para realizar operaciones CRUD
    private readonly IMongoCollection<Criterion> _collection;

    /// <summary>
    /// Constructor que inicializa la conexión a MongoDB y obtiene la colección de criterios.
    /// Se inyecta la configuración mediante IOptions para seguir el patrón de DI de ASP.NET Core.
    /// </summary>
    /// <param name="settings">Configuración de la base de datos desde appsettings.json</param>
    public CriteriaService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        // Crear cliente de MongoDB con la cadena de conexión de configuración
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        
        // Obtener la base de datos específica
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        
        // Obtener la colección de criterios usando el nombre configurado
        _collection = database.GetCollection<Criterion>(settings.Value.CriteriaCollectionName);
    }

    /// <summary>
    /// Obtiene todos los criterios de evaluación sin filtro.
    /// </summary>
    /// <returns>Lista de todos los criterios en la base de datos</returns>
    public async Task<List<Criterion>> GetAllAsync()
    {
        // Usar Find con filtro vacío (_=> true) para obtener todos los documentos
        // ToListAsync() ejecuta la query de manera asíncrona
        return await _collection.Find(_ => true).ToListAsync();
    }

    /// <summary>
    /// Busca un criterio específico por su ID único de MongoDB.
    /// </summary>
    /// <param name="id">ID del criterio (string de 24 caracteres hexadecimales)</param>
    /// <returns>El criterio encontrado o null si no existe</returns>
    public async Task<Criterion?> GetByIdAsync(string id)
    {
        // Buscar usando expresión lambda que compara el Id
        // FirstOrDefaultAsync retorna el primer match o null si no encuentra
        return await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    /// <summary>
    /// Inserta un nuevo criterio en la base de datos.
    /// MongoDB generará automáticamente el ObjectId si no está presente.
    /// </summary>
    /// <param name="criterion">Criterio a crear (sin ID, se genera automáticamente)</param>
    public async Task CreateAsync(Criterion criterion)
    {
        // InsertOneAsync agrega el documento a la colección
        // El driver de MongoDB asignará automáticamente un _id al documento
        await _collection.InsertOneAsync(criterion);
    }

    /// <summary>
    /// Reemplaza completamente un criterio existente con nuevos datos.
    /// Todos los campos del criterio se sobrescriben.
    /// </summary>
    /// <param name="id">ID del criterio a actualizar</param>
    /// <param name="criterion">Nuevos datos del criterio</param>
    public async Task UpdateAsync(string id, Criterion criterion)
    {
        // ReplaceOneAsync busca por Id y reemplaza el documento completo
        // Esto es diferente a UpdateOneAsync que solo modifica campos específicos
        await _collection.ReplaceOneAsync(x => x.Id == id, criterion);
    }

    /// <summary>
    /// Elimina permanentemente un criterio de la base de datos.
    /// Esta operación no se puede deshacer.
    /// </summary>
    /// <param name="id">ID del criterio a eliminar</param>
    public async Task DeleteAsync(string id)
    {
        // DeleteOneAsync elimina el primer documento que coincida con el filtro
        // En este caso, como Id es único, solo se eliminará un documento
        await _collection.DeleteOneAsync(x => x.Id == id);
    }
}
