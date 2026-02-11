using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

// ============================================
// DTOs de CRITERIOS
// ============================================

/// <summary>
/// Solicitud para crear un nuevo criterio
/// </summary>
public class CreateCriterionRequest
{
    /// <summary>
    /// Nombre del criterio
    /// </summary>
    /// <example>Calidad de Código</example>
    [Required(ErrorMessage = "El nombre del criterio es requerido.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre del criterio debe tener entre 3 y 100 caracteres.")]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Descripción detallada de qué evalúa este criterio
    /// </summary>
    /// <example>Evalúa la calidad, legibilidad y mantenibilidad del código</example>
    [Required(ErrorMessage = "La descripción del criterio es requerida.")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "La descripción debe tener entre 10 y 500 caracteres.")]
    public string Description { get; set; } = null!;

    /// <summary>
    /// Puntuación máxima posible para este criterio
    /// </summary>
    /// <example>100</example>
    [Required(ErrorMessage = "MaxScore es requerido.")]
    [Range(1, 1000, ErrorMessage = "MaxScore debe estar entre 1 y 1000.")]
    public int MaxScore { get; set; }
}

/// <summary>
/// Respuesta conteniendo detalles del criterio
/// </summary>
public class CriterionResponse
{
    /// <summary>
    /// Identificador único del criterio
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Nombre del criterio
    /// </summary>
    /// <example>Calidad de Código</example>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Descripción detallada
    /// </summary>
    /// <example>Evalúa la calidad, legibilidad y mantenibilidad del código</example>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Puntuación máxima posible
    /// </summary>
    /// <example>100</example>
    public int MaxScore { get; set; }
}

// ============================================
// DTOs de GRUPOS
// ============================================

/// <summary>
/// Solicitud para crear un nuevo grupo
/// </summary>
public class CreateGroupRequest
{
    /// <summary>
    /// Nombre del grupo
    /// </summary>
    /// <example>Ingeniería de Software 2024</example>
    [Required(ErrorMessage = "El nombre del grupo es requerido.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre del grupo debe tener entre 3 y 100 caracteres.")]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Código de acceso para que los estudiantes se unan al grupo
    /// </summary>
    /// <example>IS2024ABC</example>
    [Required(ErrorMessage = "El código de acceso es requerido.")]
    [StringLength(20, MinimumLength = 4, ErrorMessage = "El código de acceso debe tener entre 4 y 20 caracteres.")]
    [RegularExpression(@"^[A-Za-z0-9]+$", ErrorMessage = "El código de acceso solo puede contener letras y números.")]
    public string AccessCode { get; set; } = null!;
}

/// <summary>
/// Solicitud para actualizar un grupo existente
/// </summary>
public class UpdateGroupRequest
{
    /// <summary>
    /// Nombre actualizado del grupo
    /// </summary>
    /// <example>Ingeniería de Software 2024 - Primavera</example>
    [Required]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Código de acceso actualizado
    /// </summary>
    /// <example>IS2024PRIMAVERA</example>
    [Required]
    public string AccessCode { get; set; } = null!;
}

/// <summary>
/// Respuesta conteniendo detalles del grupo
/// </summary>
public class GroupResponse
{
    /// <summary>
    /// Identificador único del grupo
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Nombre del grupo
    /// </summary>
    /// <example>Ingeniería de Software 2024</example>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Código de acceso para unirse
    /// </summary>
    /// <example>IS2024ABC</example>
    public string AccessCode { get; set; } = null!;

    /// <summary>
    /// Fecha y hora de creación del grupo
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

// ============================================
// DTOs de PROYECTOS
// ============================================

/// <summary>
/// Solicitud para crear un nuevo proyecto
/// </summary>
public class CreateProjectRequest
{
    /// <summary>
    /// Nombre del proyecto
    /// </summary>
    /// <example>Sitio Web de E-commerce</example>
    [Required]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Descripción detallada del proyecto
    /// </summary>
    /// <example>Plataforma de e-commerce full-stack con autenticación de usuarios e integración de pagos</example>
    [Required]
    public string Description { get; set; } = null!;

    /// <summary>
    /// ID del grupo al que pertenece este proyecto
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string GroupId { get; set; } = null!;

    /// <summary>
    /// Estado del proyecto
    /// </summary>
    /// <example>Activo</example>
    public string Status { get; set; } = "Active";
}

/// <summary>
/// Respuesta conteniendo detalles del proyecto
/// </summary>
public class ProjectResponse
{
    /// <summary>
    /// Identificador único del proyecto
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Nombre del proyecto
    /// </summary>
    /// <example>Sitio Web de E-commerce</example>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Descripción del proyecto
    /// </summary>
    /// <example>Plataforma de e-commerce full-stack con autenticación de usuarios e integración de pagos</example>
    public string Description { get; set; } = null!;

    /// <summary>
    /// ID del grupo
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string GroupId { get; set; } = null!;

    /// <summary>
    /// Estado actual
    /// </summary>
    /// <example>Activo</example>
    public string Status { get; set; } = null!;

    /// <summary>
    /// Marca de tiempo de creación
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Marca de tiempo de última actualización
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

// ============================================
// DTOs de EVALUACIONES
// ============================================

/// <summary>
/// Solicitud para crear una nueva evaluación
/// </summary>
public class CreateEvaluationRequest
{
    /// <summary>
    /// ID del proyecto siendo evaluado
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string ProjectId { get; set; } = null!;

    /// <summary>
    /// ID del usuario realizando la evaluación
    /// </summary>
    /// <example>auth0|123456789</example>
    [Required]
    public string EvaluatorId { get; set; } = null!;

    /// <summary>
    /// Lista de puntuaciones para cada criterio
    /// </summary>
    [Required]
    public List<EvaluationDetailRequest> Details { get; set; } = new();
}

/// <summary>
/// Puntuación para un criterio específico
/// </summary>
public class EvaluationDetailRequest
{
    /// <summary>
    /// ID del criterio siendo evaluado
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string CriterionId { get; set; } = null!;

    /// <summary>
    /// Nombre del criterio (copia instantánea)
    /// </summary>
    /// <example>Calidad de Código</example>
    [Required]
    public string CriterionName { get; set; } = null!;

    /// <summary>
    /// Puntuación asignada
    /// </summary>
    /// <example>85</example>
    [Required]
    [Range(0, int.MaxValue)]
    public int Score { get; set; }
}

/// <summary>
/// Respuesta conteniendo detalles de la evaluación
/// </summary>
public class EvaluationResponse
{
    /// <summary>
    /// Identificador único
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// ID del proyecto
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string ProjectId { get; set; } = null!;

    /// <summary>
    /// ID del evaluador
    /// </summary>
    /// <example>auth0|123456789</example>
    public string EvaluatorId { get; set; } = null!;

    /// <summary>
    /// Puntuación final calculada
    /// </summary>
    /// <example>87.5</example>
    public double FinalScore { get; set; }

    /// <summary>
    /// Puntuaciones detalladas por criterio
    /// </summary>
    public List<EvaluationDetailResponse> Details { get; set; } = new();

    /// <summary>
    /// Marca de tiempo de creación
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Marca de tiempo de última actualización
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Detalles de puntuación para un criterio en la respuesta
/// </summary>
public class EvaluationDetailResponse
{
    /// <summary>
    /// ID del criterio
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string CriterionId { get; set; } = null!;

    /// <summary>
    /// Nombre del criterio (copia instantánea)
    /// </summary>
    /// <example>Calidad de Código</example>
    public string CriterionName { get; set; } = null!;

    /// <summary>
    /// Puntuación asignada
    /// </summary>
    /// <example>85</example>
    public int Score { get; set; }
}

// ============================================
// DTOs de RETROALIMENTACIÓN
// ============================================

/// <summary>
/// Solicitud para crear retroalimentación
/// </summary>
public class CreateFeedbackRequest
{
    /// <summary>
    /// ID de la evaluación para la que es esta retroalimentación
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string EvaluationId { get; set; } = null!;

    /// <summary>
    /// Comentario de retroalimentación
    /// </summary>
    /// <example>¡Excelente trabajo en la interfaz de usuario! Considera agregar más pruebas unitarias.</example>
    [Required]
    public string Comment { get; set; } = null!;

    /// <summary>
    /// Si esta retroalimentación es visible para estudiantes
    /// </summary>
    /// <example>true</example>
    public bool IsPublic { get; set; } = true;
}

/// <summary>
/// Respuesta conteniendo detalles de retroalimentación
/// </summary>
public class FeedbackResponse
{
    /// <summary>
    /// Identificador único
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// ID de la evaluación
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string EvaluationId { get; set; } = null!;

    /// <summary>
    /// Comentario de retroalimentación
    /// </summary>
    /// <example>¡Excelente trabajo en la interfaz de usuario! Considera agregar más pruebas unitarias.</example>
    public string Comment { get; set; } = null!;

    /// <summary>
    /// Estado de visibilidad
    /// </summary>
    /// <example>true</example>
    public bool IsPublic { get; set; }

    /// <summary>
    /// Marca de tiempo de creación
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

// ============================================
// DTOs de MEMBRESÍAS
// ============================================

/// <summary>
/// Solicitud para crear una membresía (unirse a un grupo)
/// </summary>
public class CreateMembershipRequest
{
    /// <summary>
    /// ID del usuario que se une al grupo
    /// </summary>
    /// <example>auth0|123456789</example>
    [Required]
    public string UserId { get; set; } = null!;

    /// <summary>
    /// ID del grupo al que unirse
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string GroupId { get; set; } = null!;
}

/// <summary>
/// Respuesta conteniendo detalles de membresía
/// </summary>
public class MembershipResponse
{
    /// <summary>
    /// Identificador único
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// ID del usuario
    /// </summary>
    /// <example>auth0|123456789</example>
    public string UserId { get; set; } = null!;

    /// <summary>
    /// ID del grupo
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string GroupId { get; set; } = null!;

    /// <summary>
    /// Marca de tiempo de unión
    /// </summary>
    public DateTime JoinedAt { get; set; }
}
