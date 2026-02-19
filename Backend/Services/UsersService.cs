using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de usuarios del sistema QuestEval.
/// </summary>
public class UsersService : IUsersService
{
    private readonly IMongoCollection<User> _collection;
    private readonly IMongoCollection<DatabaseCounters> _counters;

    public UsersService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<User>(settings.Value.UsersCollectionName);
        _counters = database.GetCollection<DatabaseCounters>("database_counters");
    }

    private async Task<string> GetNextIdAsync(string collectionName)
    {
        var filter = Builders<DatabaseCounters>.Filter.Eq(x => x.CollectionName, collectionName);
        var update = Builders<DatabaseCounters>.Update.Inc(x => x.LastId, 1);
        var options = new FindOneAndUpdateOptions<DatabaseCounters>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var counter = await _counters.FindOneAndUpdateAsync(filter, update, options);
        return counter.LastId.ToString();
    }

    public async Task<List<User>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    public async Task<User?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<User?> GetByEmailAsync(string email) =>
        await _collection.Find(x => x.Email == email).FirstOrDefaultAsync();

    /// <summary>
    /// Registra un nuevo usuario. MongoDB genera el _id automáticamente.
    /// Se asigna un IncrementalId corto ("1", "2", "3"...) como campo adicional.
    /// </summary>
    public async Task CreateAsync(User user)
    {
        if (string.IsNullOrEmpty(user.IncrementalId))
        {
            user.IncrementalId = await GetNextIdAsync("users");
        }
        await _collection.InsertOneAsync(user);
    }

    public async Task UpdateAsync(string id, User user)
    {
        user.Id = id;
        await _collection.ReplaceOneAsync(x => x.Id == id, user);
    }

    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    public async Task<bool> MarkEmailAsVerifiedAsync(string userId)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
        var update = Builders<User>.Update
            .Set(u => u.EmailVerified, true)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);
        
        var result = await _collection.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    public async Task<List<PendingTeacherResponse>> GetPendingTeachersAsync()
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Role, "Profesor"),
            Builders<User>.Filter.Eq(u => u.EmailVerified, true),
            Builders<User>.Filter.Eq(u => u.VerificationStatus, "pending")
        );
        
        var teachers = await _collection.Find(filter).ToListAsync();
        
        return teachers.Select(t => new PendingTeacherResponse
        {
            Id = t.Id!,
            Email = t.Email,
            FullName = t.FullName,
            CreatedAt = t.CreatedAt
        }).ToList();
    }

    public async Task<bool> UpdateTeacherStatusAsync(string teacherId, string status, string adminId)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, teacherId);
        var update = Builders<User>.Update
            .Set(u => u.VerificationStatus, status)
            .Set(u => u.ApprovedBy, adminId)
            .Set(u => u.ApprovedAt, DateTime.UtcNow)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);
        
        var result = await _collection.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    /// <summary>
    /// Asigna IncrementalId a usuarios existentes que no lo tengan
    /// y los marca como verificados para pruebas.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var users = await _collection.Find(_ => true).ToListAsync();
        foreach (var user in users)
        {
            if (string.IsNullOrEmpty(user.IncrementalId) || !user.EmailVerified || user.VerificationStatus != "approved")
            {
                var updateDef = Builders<User>.Update
                    .Set(u => u.EmailVerified, true)
                    .Set(u => u.VerificationStatus, "approved")
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);

                if (string.IsNullOrEmpty(user.IncrementalId))
                {
                    var newIncId = await GetNextIdAsync("users");
                    updateDef = updateDef.Set(u => u.IncrementalId, newIncId);
                }

                var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
                await _collection.UpdateOneAsync(filter, updateDef);
            }
        }
    }
}
