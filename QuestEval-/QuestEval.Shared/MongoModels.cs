using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace QuestEval.Shared.Models;

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

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!; // Hashed password
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = "Alumno"; // Alumno, Profesor, Admin
    public string? AvatarUrl { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


public class Group
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = null!;

    public string AccessCode { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Membership
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // Stores the external User ID (e.g., from Supabase/Auth0 UUID) as a string.
    // Not using [BsonRepresentation(BsonType.ObjectId)] to allow any string format.
    public string UserId { get; set; } = null!; 

    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class Project
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupId { get; set; } = null!;

    public string Status { get; set; } = "Active"; // Active, Finalized, Archived

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Criterion
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int MaxScore { get; set; }
}

public class Evaluation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string ProjectId { get; set; } = null!;

    // Stores the external Evaluator ID (e.g., UUID) as a string.
    public string EvaluatorId { get; set; } = null!; 

    // Denormalized field: Store total score calculated at write time
    public double FinalScore { get; set; }

    // Embedded document list - Typical NoSQL pattern
    public List<EvaluationDetail> Details { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class EvaluationDetail
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string CriterionId { get; set; } = null!;

    // Denormalization: Snapshot the criterion name at the time of evaluation.
    // This ensures that if the criterion name changes later, the historical evaluation remains accurate.
    public string CriterionName { get; set; } = null!;

    public int Score { get; set; }
}

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
