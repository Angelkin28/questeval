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

    /// <summary>
    /// Constructor que establece la conexión a la colección de evaluaciones.
    /// </summary>
    /// <param name="settings">Configuración de base de datos</param>
    public EvaluationsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Evaluation>(settings.Value.EvaluationsCollectionName);
    }

    /// <summary>
    /// Obtiene todas las evaluaciones.
    /// MEJORA FUTURA: Agregar filtros por:
    /// - ProjectId (evaluaciones de un proyecto específico)
    /// - EvaluatorId (evaluaciones hechas por un profesor)
    /// - Rango de fechas
    /// </summary>
    public async Task<List<Evaluation>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca una evaluación por su ID.
    /// Útil para ver detalles de una calificación específica.
    /// </summary>
    /// <param name="id">ObjectId de la evaluación</param>
    public async Task<Evaluation?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Crea una nueva evaluación de un proyecto.
    /// 
    /// VALIDACIONES IMPORTANTES ANTES DE LLAMAR:
    /// 1. Verificar que ProjectId existe
    /// 2. Verificar que cada CriterionId en Criteria existe
    /// 3. Calcular FinalScore = suma de todos los Score en Criteria[]
    /// 4. Establecer CreatedAt con DateTime.UtcNow
    /// 5. Validar que Score de cada criterio <= MaxScore del criterio
    /// 
    /// ESTRUCTURA DE Criteria (array embebido):
    /// - CriterionId: referencia al criterio usado
    /// - CriterionName: nombre duplicado para consultas rápidas (desnormalizado)
    /// - Score: puntuación otorgada en este criterio
    /// - MaxScore: puntuación máxima posible (copiado del criterio)
    /// </summary>
    /// <param name="evaluation">Evaluación con todos los datos calculados</param>
    public async Task CreateAsync(Evaluation evaluation) =>
        await _collection.InsertOneAsync(evaluation);

    /// <summary>
    /// Elimina una evaluación.
    /// 
    /// CONSIDERACIONES:
    /// - Esta es la única forma de "corregir" una evaluación (eliminar y recrear)
    /// - En sistemas de producción, considerar soft delete o historial de cambios
    /// - Impacto: El FinalScore del proyecto debe recalcularse si hay múltiples evaluaciones
    /// </summary>
    /// <param name="id">ID de la evaluación a eliminar</param>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);
}
