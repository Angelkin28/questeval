using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Backend.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IMongoCollection<ActivityLog> _logs;

    public ActivityLogService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var db = client.GetDatabase(settings.Value.DatabaseName);
        _logs = db.GetCollection<ActivityLog>(settings.Value.ActivityLogsCollectionName ?? "activitylogs");
    }

    public async Task<List<ActivityLog>> GetAllAsync(int limit = 100)
    {
        return await _logs.Find(_ => true)
            .SortByDescending(l => l.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task LogAsync(string action, string detail, string category = "info",
                               string? actorId = null, string? actorName = null,
                               string? targetId = null, string? targetName = null)
    {
        var entry = new ActivityLog
        {
            Action = action,
            Detail = detail,
            Category = category,
            ActorId = actorId,
            ActorName = actorName,
            TargetId = targetId,
            TargetName = targetName,
            CreatedAt = DateTime.UtcNow
        };
        await _logs.InsertOneAsync(entry);
    }
}
