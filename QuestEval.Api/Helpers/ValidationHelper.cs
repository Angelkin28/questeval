using MongoDB.Bson;

namespace QuestEval.Api.Helpers;

/// <summary>
/// Helper methods for validating MongoDB ObjectIds and other common validations
/// </summary>
public static class ValidationHelper
{
    /// <summary>
    /// Validates if a string is a valid MongoDB ObjectId format
    /// </summary>
    public static bool IsValidObjectId(string? id)
    {
        if (string.IsNullOrWhiteSpace(id))
            return false;

        return ObjectId.TryParse(id, out _);
    }

    /// <summary>
    /// Validates if a string is a valid MongoDB ObjectId and throws if not
    /// </summary>
    public static void ValidateObjectId(string? id, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException($"{fieldName} cannot be null or empty.", fieldName);
        }

        if (!ObjectId.TryParse(id, out _))
        {
            throw new ArgumentException($"{fieldName} '{id}' is not a valid ObjectId format. Expected 24 hex characters.", fieldName);
        }
    }

    /// <summary>
    /// Validates multiple ObjectIds at once
    /// </summary>
    public static void ValidateObjectIds(params (string? id, string fieldName)[] idsToValidate)
    {
        foreach (var (id, fieldName) in idsToValidate)
        {
            ValidateObjectId(id, fieldName);
        }
    }
}
