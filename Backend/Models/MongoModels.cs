using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models;

/// <summary>
/// Configuración de la base de datos QuestEval
/// </summary>
public class QuestEvalDatabaseSettings
{
    public string ConnectionString { get; set; } = null!;
    public string DatabaseName { get; set; } = null!;
    public string UsersCollectionName { get; set; } = null!;
    public string GroupsCollectionName { get; set; } = null!;
    public string MembershipsCollectionName { get; set; } = null!;
    public string ProjectsCollectionName { get; set; } = null!;
    public string CriteriaCollectionName { get; set; } = null!;
    public string EvaluationsCollectionName { get; set; } = null!;
    public string FeedbackCollectionName { get; set; } = null!;
}

/// <summary>
/// Modelo de usuario del sistema
/// </summary>
public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!; // Password hasheado
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = "Alumno"; // Alumno, Profesor, Admin
    public string? AvatarUrl { get; set; }
    
    // Campos de verificación de email y aprobación
    public bool EmailVerified { get; set; } = false; // Si el email fue verificado con OTP
    public string VerificationStatus { get; set; } = "pending"; // pending, approved, rejected (solo para Profesores)
    public DateTime? ApprovedAt { get; set; } // Fecha de aprobación por admin
    public string? ApprovedBy { get; set; } // ID del admin que aprobó
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Modelo de grupo de estudiantes
/// </summary>
public class Group
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = null!;

    public string AccessCode { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Modelo de membresía (relación Usuario-Grupo)
/// </summary>
public class Membership
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // Almacena el ID externo del Usuario (ej., UUID de Supabase/Auth0) como string.
    // No usa [BsonRepresentation(BsonType.ObjectId)] para permitir cualquier formato de string.
    public string UserId { get; set; } = null!; 

    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Modelo de proyecto estudiantil
/// </summary>
public class Project
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Category { get; set; } = "Integrador"; // New field
    public string? VideoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public List<string> TeamMembers { get; set; } = new List<string>();

    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = null!;

    public string Status { get; set; } = "Active"; // Active, Finalized, Archived

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Modelo de criterio de evaluación
/// </summary>
public class Criterion
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int MaxScore { get; set; }
}

/// <summary>
/// Modelo de evaluación de proyecto
/// </summary>
public class Evaluation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string ProjectId { get; set; } = null!;

    // Almacena el ID externo del Evaluador (ej., UUID) como string.
    public string EvaluatorId { get; set; } = null!; 

    // Campo desnormalizado: Almacenar puntuación total calculada al momento de escritura
    public double FinalScore { get; set; }

    // Lista de documentos embebidos - Patrón típico de NoSQL
    public List<EvaluationDetail> Details { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Detalle de evaluación (documento embebido)
/// </summary>
public class EvaluationDetail
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string CriterionId { get; set; } = null!;

    // Desnormalización: Captura instantánea del nombre del criterio al momento de la evaluación.
    // Esto asegura que si el nombre del criterio cambia después, la evaluación histórica permanece precisa.
    public string CriterionName { get; set; } = null!;

    public int Score { get; set; }
}

/// <summary>
/// Modelo de retroalimentación de evaluación
/// </summary>
public class Feedback
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string EvaluationId { get; set; } = null!;

    public string Comment { get; set; } = null!;
    public bool IsPublic { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
