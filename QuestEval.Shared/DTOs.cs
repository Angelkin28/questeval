using System.ComponentModel.DataAnnotations;

namespace QuestEval.Shared.Models;

// ============================================
// CRITERION DTOs
// ============================================

/// <summary>
/// Request to create a new criterion
/// </summary>
public class CreateCriterionRequest
{
    /// <summary>
    /// Name of the criterion
    /// </summary>
    /// <example>Code Quality</example>
    [Required(ErrorMessage = "Criterion name is required.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Criterion name must be between 3 and 100 characters.")]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Detailed description of what this criterion evaluates
    /// </summary>
    /// <example>Evaluates the quality, readability, and maintainability of the code</example>
    [Required(ErrorMessage = "Criterion description is required.")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 500 characters.")]
    public string Description { get; set; } = null!;

    /// <summary>
    /// Maximum possible score for this criterion
    /// </summary>
    /// <example>100</example>
    [Required(ErrorMessage = "MaxScore is required.")]
    [Range(1, 1000, ErrorMessage = "MaxScore must be between 1 and 1000.")]
    public int MaxScore { get; set; }
}

/// <summary>
/// Response containing criterion details
/// </summary>
public class CriterionResponse
{
    /// <summary>
    /// Unique identifier of the criterion
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Name of the criterion
    /// </summary>
    /// <example>Code Quality</example>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Detailed description
    /// </summary>
    /// <example>Evaluates the quality, readability, and maintainability of the code</example>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Maximum possible score
    /// </summary>
    /// <example>100</example>
    public int MaxScore { get; set; }
}

// ============================================
// GROUP DTOs
// ============================================

/// <summary>
/// Request to create a new group
/// </summary>
public class CreateGroupRequest
{
    /// <summary>
    /// Name of the group
    /// </summary>
    /// <example>Software Engineering 2024</example>
    [Required(ErrorMessage = "Group name is required.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Group name must be between 3 and 100 characters.")]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Access code for students to join the group
    /// </summary>
    /// <example>SE2024ABC</example>
    [Required(ErrorMessage = "Access code is required.")]
    [StringLength(20, MinimumLength = 4, ErrorMessage = "Access code must be between 4 and 20 characters.")]
    [RegularExpression(@"^[A-Za-z0-9]+$", ErrorMessage = "Access code can only contain letters and numbers.")]
    public string AccessCode { get; set; } = null!;
}

/// <summary>
/// Request to update an existing group
/// </summary>
public class UpdateGroupRequest
{
    /// <summary>
    /// Updated name of the group
    /// </summary>
    /// <example>Software Engineering 2024 - Spring</example>
    [Required]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Updated access code
    /// </summary>
    /// <example>SE2024SPRING</example>
    [Required]
    public string AccessCode { get; set; } = null!;
}

/// <summary>
/// Response containing group details
/// </summary>
public class GroupResponse
{
    /// <summary>
    /// Unique identifier of the group
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Name of the group
    /// </summary>
    /// <example>Software Engineering 2024</example>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Access code for joining
    /// </summary>
    /// <example>SE2024ABC</example>
    public string AccessCode { get; set; } = null!;

    /// <summary>
    /// Date and time when the group was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

// ============================================
// PROJECT DTOs
// ============================================

/// <summary>
/// Request to create a new project
/// </summary>
public class CreateProjectRequest
{
    /// <summary>
    /// Project name
    /// </summary>
    /// <example>E-commerce Website</example>
    [Required]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Detailed project description
    /// </summary>
    /// <example>A full-stack e-commerce platform with user authentication and payment integration</example>
    [Required]
    public string Description { get; set; } = null!;

    /// <summary>
    /// ID of the group this project belongs to
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string GroupId { get; set; } = null!;

    /// <summary>
    /// Project status
    /// </summary>
    /// <example>Active</example>
    public string Status { get; set; } = "Active";
}

/// <summary>
/// Response containing project details
/// </summary>
public class ProjectResponse
{
    /// <summary>
    /// Unique identifier of the project
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Project name
    /// </summary>
    /// <example>E-commerce Website</example>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Project description
    /// </summary>
    /// <example>A full-stack e-commerce platform with user authentication and payment integration</example>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Group ID
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string GroupId { get; set; } = null!;

    /// <summary>
    /// Current status
    /// </summary>
    /// <example>Active</example>
    public string Status { get; set; } = null!;

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

// ============================================
// EVALUATION DTOs
// ============================================

/// <summary>
/// Request to create a new evaluation
/// </summary>
public class CreateEvaluationRequest
{
    /// <summary>
    /// ID of the project being evaluated
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string ProjectId { get; set; } = null!;

    /// <summary>
    /// ID of the user performing the evaluation
    /// </summary>
    /// <example>auth0|123456789</example>
    [Required]
    public string EvaluatorId { get; set; } = null!;

    /// <summary>
    /// List of scores for each criterion
    /// </summary>
    [Required]
    public List<EvaluationDetailRequest> Details { get; set; } = new();
}

/// <summary>
/// Score for a specific criterion
/// </summary>
public class EvaluationDetailRequest
{
    /// <summary>
    /// ID of the criterion being evaluated
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string CriterionId { get; set; } = null!;

    /// <summary>
    /// Name of the criterion (snapshot)
    /// </summary>
    /// <example>Code Quality</example>
    [Required]
    public string CriterionName { get; set; } = null!;

    /// <summary>
    /// Score assigned
    /// </summary>
    /// <example>85</example>
    [Required]
    [Range(0, int.MaxValue)]
    public int Score { get; set; }
}

/// <summary>
/// Response containing evaluation details
/// </summary>
public class EvaluationResponse
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Project ID
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string ProjectId { get; set; } = null!;

    /// <summary>
    /// Evaluator ID
    /// </summary>
    /// <example>auth0|123456789</example>
    public string EvaluatorId { get; set; } = null!;

    /// <summary>
    /// Final calculated score
    /// </summary>
    /// <example>87.5</example>
    public double FinalScore { get; set; }

    /// <summary>
    /// Detailed scores per criterion
    /// </summary>
    public List<EvaluationDetailResponse> Details { get; set; } = new();

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Score details for a criterion in response
/// </summary>
public class EvaluationDetailResponse
{
    /// <summary>
    /// Criterion ID
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string CriterionId { get; set; } = null!;

    /// <summary>
    /// Criterion name snapshot
    /// </summary>
    /// <example>Code Quality</example>
    public string CriterionName { get; set; } = null!;

    /// <summary>
    /// Score assigned
    /// </summary>
    /// <example>85</example>
    public int Score { get; set; }
}

// ============================================
// FEEDBACK DTOs
// ============================================

/// <summary>
/// Request to create feedback
/// </summary>
public class CreateFeedbackRequest
{
    /// <summary>
    /// ID of the evaluation this feedback is for
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string EvaluationId { get; set; } = null!;

    /// <summary>
    /// Feedback comment
    /// </summary>
    /// <example>Great work on the user interface! Consider adding more unit tests.</example>
    [Required]
    public string Comment { get; set; } = null!;

    /// <summary>
    /// Whether this feedback is visible to students
    /// </summary>
    /// <example>true</example>
    public bool IsPublic { get; set; } = true;
}

/// <summary>
/// Response containing feedback details
/// </summary>
public class FeedbackResponse
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Evaluation ID
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string EvaluationId { get; set; } = null!;

    /// <summary>
    /// Feedback comment
    /// </summary>
    /// <example>Great work on the user interface! Consider adding more unit tests.</example>
    public string Comment { get; set; } = null!;

    /// <summary>
    /// Visibility status
    /// </summary>
    /// <example>true</example>
    public bool IsPublic { get; set; }

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

// ============================================
// MEMBERSHIP DTOs
// ============================================

/// <summary>
/// Request to create a membership (join a group)
/// </summary>
public class CreateMembershipRequest
{
    /// <summary>
    /// User ID joining the group
    /// </summary>
    /// <example>auth0|123456789</example>
    [Required]
    public string UserId { get; set; } = null!;

    /// <summary>
    /// Group ID to join
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    [Required]
    public string GroupId { get; set; } = null!;
}

/// <summary>
/// Response containing membership details
/// </summary>
public class MembershipResponse
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string Id { get; set; } = null!;

    /// <summary>
    /// User ID
    /// </summary>
    /// <example>auth0|123456789</example>
    public string UserId { get; set; } = null!;

    /// <summary>
    /// Group ID
    /// </summary>
    /// <example>507f1f77bcf86cd799439011</example>
    public string GroupId { get; set; } = null!;

    /// <summary>
    /// Join timestamp
    /// </summary>
    public DateTime JoinedAt { get; set; }
}
