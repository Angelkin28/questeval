using Backend.Models;

namespace Backend.Services.Interfaces;

public interface IActivityLogService
{
    Task<List<ActivityLog>> GetAllAsync(int limit = 100);
    Task LogAsync(string action, string detail, string category = "info",
                  string? actorId = null, string? actorName = null,
                  string? targetId = null, string? targetName = null);
}
