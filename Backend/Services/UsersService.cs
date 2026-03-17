using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Linq;
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
    private readonly IMongoCollection<Membership> _memberships;
    private readonly IMongoCollection<Project> _projects;
    private readonly IMongoCollection<Evaluation> _evaluations;

    public UsersService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<User>(settings.Value.UsersCollectionName);
        _counters = database.GetCollection<DatabaseCounters>("database_counters");
        _memberships = database.GetCollection<Membership>(settings.Value.MembershipsCollectionName);
        _projects = database.GetCollection<Project>(settings.Value.ProjectsCollectionName);
        _evaluations = database.GetCollection<Evaluation>(settings.Value.EvaluationsCollectionName);
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

    public async Task<User?> GetByIdAsync(string id)
    {
        // Si no es un ObjectId válido, evitamos el FormatException del driver de MongoDB
        if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
            return null;
        return await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByEmailAsync(string email) =>
        await _collection.Find(x => x.Email == email).FirstOrDefaultAsync();

    public async Task<User?> GetByUserIdAsync(string userId) =>
        await _collection.Find(x => x.UserId == userId).FirstOrDefaultAsync();

    /// <summary>
    /// Registra un nuevo usuario.
    /// Se asigna un Enrollment corto ("1", "2", "3"...) como campo adicional si no se provee.
    /// </summary>
    public async Task CreateAsync(User user)
    {
        if (string.IsNullOrEmpty(user.UserId))
        {
            user.UserId = await GetNextIdAsync("users");
        }
        await _collection.InsertOneAsync(user);
    }

    public async Task UpdateAsync(string id, User user)
    {
        user.Id = id;
        await _collection.ReplaceOneAsync(x => x.Id == id, user);
    }

    public async Task DeleteAsync(string id)
    {
        var user = await GetByIdAsync(id);
        if (user == null) return;

        // Lista de posibles IDs del usuario para buscar en otras colecciones
        var userIds = new List<string> { user.Id! };
        if (!string.IsNullOrEmpty(user.UserId))
        {
            userIds.Add(user.UserId);
        }

        // 1. Borrar membresías del usuario
        var memFilter = Builders<Membership>.Filter.In(m => m.UserId, userIds);
        await _memberships.DeleteManyAsync(memFilter);

        // 2. Manejar proyectos relacionados con este usuario
        // 2a. Proyectos donde el usuario es dueño
        var ownedFilter = Builders<Project>.Filter.In(p => p.UserId, userIds);
        var ownedProjects = await _projects.Find(ownedFilter).ToListAsync();
        foreach (var project in ownedProjects)
        {
            if (project.TeamMembers == null || project.TeamMembers.Count == 0)
            {
                // Sin integrantes de equipo → eliminar el proyecto
                await _projects.DeleteOneAsync(p => p.Id == project.Id);
            }
            else
            {
                // Aún hay integrantes → solo limpiar el UserId del dueño
                await _projects.UpdateOneAsync(
                    p => p.Id == project.Id,
                    Builders<Project>.Update.Unset(p => p.UserId));
            }
        }

        // 2b. Proyectos donde el usuario aparece como integrante de equipo (TeamMembers por nombre)
        if (!string.IsNullOrEmpty(user.FullName))
        {
            var memberFilter = Builders<Project>.Filter.AnyEq(p => p.TeamMembers, user.FullName);
            var projectsAsMember = await _projects.Find(memberFilter).ToListAsync();
            foreach (var project in projectsAsMember)
            {
                var updatedMembers = project.TeamMembers
                    .Where(m => !m.Equals(user.FullName, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                bool noOwner = string.IsNullOrEmpty(project.UserId) || userIds.Contains(project.UserId);
                if (noOwner && updatedMembers.Count == 0)
                {
                    // Proyecto totalmente huérfano → eliminar
                    await _projects.DeleteOneAsync(p => p.Id == project.Id);
                }
                else
                {
                    await _projects.UpdateOneAsync(
                        p => p.Id == project.Id,
                        Builders<Project>.Update.Set(p => p.TeamMembers, updatedMembers));
                }
            }
        }

        // 3. Borrar evaluaciones hechas por este usuario
        var evalFilter = Builders<Evaluation>.Filter.In(e => e.UserId, userIds);
        await _evaluations.DeleteManyAsync(evalFilter);

        // 4. Finalmente, borrar al usuario
        await _collection.DeleteOneAsync(x => x.Id == id);
    }

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
    /// Migra usuarios existentes: renombra IncrementalId a Enrollment y asegura status aprobado.
    /// </summary>
    public async Task InitializeIncrementalIdsAsync()
    {
        var rawCollection = _collection.Database.GetCollection<BsonDocument>(_collection.CollectionNamespace.CollectionName);
        var users = await rawCollection.Find(_ => true).ToListAsync();

        foreach (var userDoc in users)
        {
            var id = userDoc["_id"].AsObjectId.ToString();
            var updates = new List<UpdateDefinition<BsonDocument>>();

            // 1. Migrar IncrementalId/Enrollment -> UserId si existe el viejo y no el nuevo
            if ((userDoc.Contains("IncrementalId") || userDoc.Contains("Enrollment")) && !userDoc.Contains("UserId"))
            {
                var val = userDoc.Contains("Enrollment") ? userDoc["Enrollment"].ToString() : userDoc["IncrementalId"].ToString();
                updates.Add(Builders<BsonDocument>.Update.Set("UserId", val));
                updates.Add(Builders<BsonDocument>.Update.Unset("IncrementalId"));
                updates.Add(Builders<BsonDocument>.Update.Unset("Enrollment"));
            }
            else if (!userDoc.Contains("UserId"))
            {
                // Si no tiene ninguno, generar uno nuevo
                var newUserId = await GetNextIdAsync("users");
                updates.Add(Builders<BsonDocument>.Update.Set("UserId", newUserId));
            }

            // 2. Asegurar verificación y aprobación para datos existentes
            if (!userDoc.Contains("EmailVerified") || userDoc["EmailVerified"] == false)
            {
                updates.Add(Builders<BsonDocument>.Update.Set("EmailVerified", true));
            }
            if (!userDoc.Contains("VerificationStatus") || userDoc["VerificationStatus"] != "approved")
            {
                updates.Add(Builders<BsonDocument>.Update.Set("VerificationStatus", "approved"));
            }

            if (updates.Any())
            {
                updates.Add(Builders<BsonDocument>.Update.Set("UpdatedAt", DateTime.UtcNow));
                await rawCollection.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", userDoc["_id"]),
                    Builders<BsonDocument>.Update.Combine(updates)
                );
            }
        }
    }
}
