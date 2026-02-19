
namespace Backend.Models;

public class DatabaseCounters
{
    [MongoDB.Bson.Serialization.Attributes.BsonId]
    public string CollectionName { get; set; } = null!;
    public long LastId { get; set; }
}
