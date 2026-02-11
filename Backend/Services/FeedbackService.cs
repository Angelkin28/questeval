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

    /// <summary>
    /// Constructor que establece la conexión a la colección de feedbacks.
    /// </summary>
    /// <param name="settings">Configuración de base de datos</param>
    public FeedbackService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Feedback>(settings.Value.FeedbackCollectionName);
    }

    /// <summary>
    /// Obtiene todos los feedbacks sin filtro.
    /// 
    /// MEJORAS FUTURAS - Agregar filtros por:
    /// - EvaluationId (feedback específico de una evaluación)
    /// - ProviderId (todos los feedbacks dados por un profesor)
    /// - Rango de fechas
    /// </summary>
    public async Task<List<Feedback>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    /// <summary>
    /// Busca un feedback por su ID único.
    /// </summary>
    /// <param name="id">ObjectId del feedback</param>
    public async Task<Feedback?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    /// <summary>
    /// Crea un nuevo feedback para una evaluación.
    /// 
    /// VALIDACIONES PREVIAS RECOMENDADAS:
    /// 1. Verificar que el EvaluationId existe
    /// 2. Verificar que el ProviderId (quien da el feedback) existe y es profesor
    /// 3. (Opcional) Verificar que no exista ya un feedback para esta evaluación
    ///     - Decidir si permitir múltiples feedbacks o solo uno por evaluación
    /// 4. Establecer CreatedAt con DateTime.UtcNow
    /// 5. Validar que Comments no esté vacío
    /// 
    /// ESTRUCTURA DEL FEEDBACK:
    /// - EvaluationId: a qué evaluación corresponde este comentario
    /// - ProviderId: quién escribió el feedback (generalmente el mismo evaluador)
    /// - Comments: texto libre con la retroalimentación
    /// - CreatedAt: timestamp de creación
    /// </summary>
    /// <param name="feedback">Feedback con EvaluationId, ProviderId y Comments</param>
    public async Task CreateAsync(Feedback feedback) =>
        await _collection.InsertOneAsync(feedback);

    /// <summary>
    /// Elimina un feedback.
    /// 
    /// CONSIDERACIONES:
    /// - Similar a las evaluaciones, el feedback es generalmente inmutable
    /// - Esta es la única forma de "editar" (eliminar y recrear)
    /// - En producción, considerar soft delete para mantener historial
    /// 
    /// CASOS DE USO:
    /// - Eliminar feedback escrito por error
    /// - Limpieza cuando se elimina la evaluación asociada
    /// </summary>
    /// <param name="id">ID del feedback a eliminar</param>
    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);
}
