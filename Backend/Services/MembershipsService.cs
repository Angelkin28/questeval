using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Linq;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio de gestión de membresías (relación Usuario-Grupo).
/// </summary>
public class MembershipsService : IMembershipsService
{
    private readonly IMongoCollection<Membership> _collection;
    private readonly IMongoCollection<DatabaseCounters> _counters;

    public MembershipsService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Membership>(settings.Value.MembershipsCollectionName);
        _counters = database.GetCollection<DatabaseCounters>("database_counters");
    }

    public async Task<List<Membership>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    public async Task<Membership?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<Membership?> GetByMiembroIdAsync(string miembroId) =>
        await _collection.Find(x => x.MiembroId == miembroId).FirstOrDefaultAsync();

    public async Task<List<Membership>> GetByUserIdAsync(string userId) =>
        await _collection.Find(x => x.UserId == userId).ToListAsync();
        
    public async Task<List<Membership>> GetByGroupIdAsync(string groupId) =>
        await _collection.Find(x => x.GroupId == groupId).ToListAsync();

    public async Task CreateAsync(Membership membership)
    {
        if (string.IsNullOrEmpty(membership.MiembroId))
        {
            membership.MiembroId = await GetNextIdAsync("memberships");
        }
        await _collection.InsertOneAsync(membership);
    }

    public async Task DeleteAsync(string id) =>
        await _collection.DeleteOneAsync(x => x.Id == id);

    /// <summary>
    /// Genera el siguiente ID incremental numérico para la colección.
    /// </summary>
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

    /// <summary>
    /// Migra membresías existentes: renombra IncrementalId a Codice y convierte UserId/GroupId (ObjectId) a Enrollment/Codice (string).
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var rawMemberships = _collection.Database.GetCollection<BsonDocument>(_collection.CollectionNamespace.CollectionName);
        var rawUsers = _collection.Database.GetCollection<BsonDocument>("users");
        var rawGroups = _collection.Database.GetCollection<BsonDocument>("groups");

        var memberships = await rawMemberships.Find(_ => true).ToListAsync();
        foreach (var membershipDoc in memberships)
        {
            var updates = new List<UpdateDefinition<BsonDocument>>();

            // 1. Migrar IncrementalId/Codice -> MiembroId
            if ((membershipDoc.Contains("IncrementalId") || membershipDoc.Contains("Codice")) && !membershipDoc.Contains("MiembroId"))
            {
                var val = membershipDoc.Contains("Codice") ? membershipDoc["Codice"].ToString() : membershipDoc["IncrementalId"].ToString();
                updates.Add(Builders<BsonDocument>.Update.Set("MiembroId", val));
                updates.Add(Builders<BsonDocument>.Update.Unset("IncrementalId"));
                updates.Add(Builders<BsonDocument>.Update.Unset("Codice"));
            }
            else if (!membershipDoc.Contains("MiembroId"))
            {
                var newMiembroId = await GetNextIdAsync("memberships");
                updates.Add(Builders<BsonDocument>.Update.Set("MiembroId", newMiembroId));
            }

            // 2. Migrar UserId (ObjectId) / UserEnrollment (string) -> UserId (string)
            if (!membershipDoc.Contains("UserId") || membershipDoc["UserId"].IsObjectId)
            {
                BsonValue? oldUserIdVal = membershipDoc.Contains("UserId") ? membershipDoc["UserId"] : (membershipDoc.Contains("UserEnrollment") ? membershipDoc["UserEnrollment"] : null);
                if (oldUserIdVal != null)
                {
                    string? userIdStr = null;
                    if (oldUserIdVal.IsObjectId)
                    {
                        var user = await rawUsers.Find(Builders<BsonDocument>.Filter.Eq("_id", oldUserIdVal)).FirstOrDefaultAsync();
                        if (user != null)
                        {
                            userIdStr = user.Contains("UserId") ? user["UserId"].ToString() : (user.Contains("Enrollment") ? user["Enrollment"].ToString() : (user.Contains("IncrementalId") ? user["IncrementalId"].ToString() : ""));
                        }
                    }
                    else
                    {
                        userIdStr = oldUserIdVal.ToString();
                    }

                    if (!string.IsNullOrEmpty(userIdStr))
                    {
                        updates.Add(Builders<BsonDocument>.Update.Set("UserId", userIdStr));
                        updates.Add(Builders<BsonDocument>.Update.Unset("UserEnrollment"));
                    }
                }
            }

            // 3. Migrar GroupId (ObjectId) / GroupCodice (string) -> GroupId (string)
            if (!membershipDoc.Contains("GroupId") || membershipDoc["GroupId"].IsObjectId)
            {
                BsonValue? oldGroupIdVal = membershipDoc.Contains("GroupId") ? membershipDoc["GroupId"] : (membershipDoc.Contains("GroupCodice") ? membershipDoc["GroupCodice"] : null);
                if (oldGroupIdVal != null)
                {
                    string? groupIdStr = null;
                    if (oldGroupIdVal.IsObjectId)
                    {
                        var group = await rawGroups.Find(Builders<BsonDocument>.Filter.Eq("_id", oldGroupIdVal)).FirstOrDefaultAsync();
                        if (group != null)
                        {
                            groupIdStr = group.Contains("GroupId") ? group["GroupId"].ToString() : (group.Contains("Codice") ? group["Codice"].ToString() : (group.Contains("IncrementalId") ? group["IncrementalId"].ToString() : ""));
                        }
                    }
                    else
                    {
                        groupIdStr = oldGroupIdVal.ToString();
                    }

                    if (!string.IsNullOrEmpty(groupIdStr))
                    {
                        updates.Add(Builders<BsonDocument>.Update.Set("GroupId", groupIdStr));
                        updates.Add(Builders<BsonDocument>.Update.Unset("GroupCodice"));
                    }
                }
            }

            if (updates.Any())
            {
                await rawMemberships.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", membershipDoc["_id"]),
                    Builders<BsonDocument>.Update.Combine(updates)
                );
            }
        }
    }
}
