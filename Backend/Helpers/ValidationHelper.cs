using MongoDB.Bson;

namespace Backend.Helpers;

/// <summary>
/// Métodos auxiliares para validar ObjectIds de MongoDB y otras validaciones comunes
/// </summary>
public static class ValidationHelper
{
    /// <summary>
    /// Valida si un string tiene formato de ObjectId de MongoDB válido
    /// </summary>
    public static bool IsValidObjectId(string? id)
    {
        if (string.IsNullOrWhiteSpace(id))
            return false;

        return ObjectId.TryParse(id, out _);
    }

    /// <summary>
    /// Valida si un string es un ObjectId de MongoDB válido y lanza excepción si no lo es
    /// </summary>
    public static void ValidateObjectId(string? id, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException($"{fieldName} no puede ser nulo o vacío.", fieldName);
        }

        if (!ObjectId.TryParse(id, out _))
        {
            throw new ArgumentException($"{fieldName} '{id}' no es un formato ObjectId válido. Se esperan 24 caracteres hexadecimales.", fieldName);
        }
    }

    /// <summary>
    /// Valida múltiples ObjectIds a la vez
    /// </summary>
    public static void ValidateObjectIds(params (string? id, string fieldName)[] idsToValidate)
    {
        foreach (var (id, fieldName) in idsToValidate)
        {
            ValidateObjectId(id, fieldName);
        }
    }
}
