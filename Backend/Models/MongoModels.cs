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
    public string ActivityLogsCollectionName { get; set; } = null!;
    public string EvaluationDeviceRecordsCollectionName { get; set; } = null!;
}

/// <summary>
/// Modelo de usuario del sistema
/// </summary>
[BsonIgnoreExtraElements]
public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? UserId { get; set; } // ID incremental corto ("1", "2", "3"...) - Antes Enrollment

    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!; // Password hasheado
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = "Alumno"; // Alumno, Profesor, Admin, Invitado
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
[BsonIgnoreExtraElements]
public class Group
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? GroupId { get; set; } // Antes Codice

    public string Name { get; set; } = null!;

    public string AccessCode { get; set; } = null!;

    public string? TeacherId { get; set; } // ID del profesor que creó/gestiona el grupo

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Registro de actividad del sistema para el panel de administración
/// </summary>
[BsonIgnoreExtraElements]
public class ActivityLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Action { get; set; } = null!;       // "user_created", "group_created", "user_deleted", etc.
    public string Detail { get; set; } = null!;        // Descripción legible
    public string Category { get; set; } = "info";    // "info", "warning", "delete", "auth"
    public string? ActorId { get; set; }               // Quién hizo la acción
    public string? ActorName { get; set; }             // Nombre del actor
    public string? TargetId { get; set; }              // ID del objeto afectado
    public string? TargetName { get; set; }            // Nombre del objeto afectado
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Modelo de membresía (relación Usuario-Grupo)
/// </summary>
[BsonIgnoreExtraElements]
public class Membership
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? MiembroId { get; set; } // Antes Codice

    // Almacena el ID externo del Usuario como Matrícula (Enrollment/UserId).
    public string UserId { get; set; } = null!; 

    public string GroupId { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Modelo de proyecto estudiantil
/// </summary>
[BsonIgnoreExtraElements]
public class Project
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? ProjectId { get; set; } // Antes Codice

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Category { get; set; } = "Integrador"; // New field
    public string? VideoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public List<string> TeamMembers { get; set; } = new List<string>();

    public string? GroupId { get; set; } // Antes GroupCodice
    public string? UserId { get; set; } // Propietario del proyecto

    public string Status { get; set; } = "Active"; // Active, Finalized, Archived

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<QuestionAnswer> ComprehensionQuestions { get; set; } = new();
}

public class QuestionAnswer
{
    public string Question { get; set; } = null!;
    public List<string> Options { get; set; } = new();
    public int CorrectAnswerIndex { get; set; }
    public string Answer { get; set; } = null!;
}

/// <summary>
/// Modelo de criterio de evaluación
/// </summary>
[BsonIgnoreExtraElements]
public class Criterion
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? CriteriaId { get; set; } // Antes Codice

    public string? ProjectId { get; set; } // ID del proyecto al que pertenece este criterio

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int MaxScore { get; set; }
}

/// <summary>
/// Modelo de evaluación de proyecto
/// </summary>
[BsonIgnoreExtraElements]
public class Evaluation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? EvaluationId { get; set; } // Antes Codice

    public string? ProjectId { get; set; } // Antes ProjectCodice

    // Almacena la Matrícula del Evaluador (UserId).
    public string? UserId { get; set; } 

    // Identificador único de hardware encriptado (solo aplica para evaluaciones móviles sin login)
    public string? EvaluatorDeviceId { get; set; }

    // Desnormalización: Rol del evaluador al momento de la evaluación (Alumno/Profesor)
    public string EvaluatorRole { get; set; } = null!;

    // Desnormalización: Nombre del evaluador al momento de la evaluación
    public string EvaluatorName { get; set; } = null!;

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
[BsonIgnoreExtraElements]
public class EvaluationDetail
{
    public string? CriteriaId { get; set; } // Antes CriterionCodice

    // Desnormalización: Captura instantánea del nombre del criterio al momento de la evaluación.
    public string CriterionName { get; set; } = null!;

    public double Score { get; set; }
}

/// <summary>
/// Modelo de retroalimentación de evaluación
/// </summary>
[BsonIgnoreExtraElements]
public class Feedback
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? FeedbackId { get; set; } // Antes Codice

    public string? EvaluationId { get; set; } // Antes EvaluationCodice

    public string Comment { get; set; } = null!;
    public bool IsPublic { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Registro de seguridad para prevenir dobles evaluaciones desde la app móvil
/// </summary>
[BsonIgnoreExtraElements]
public class EvaluationDeviceRecord
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string ProjectId { get; set; } = string.Empty;
    public string DeviceIdHash { get; set; } = string.Empty;
    public string EvaluationId { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
}
