using Microsoft.Extensions.Options;
using MongoDB.Driver;
using QuestEval.Shared.Models;

namespace QuestEval.Api.Services;

public class QuestEvalService
{
    private readonly IMongoCollection<User> _usersCollection;
    private readonly IMongoCollection<Group> _groupsCollection;
    private readonly IMongoCollection<Membership> _membershipsCollection;
    private readonly IMongoCollection<Project> _projectsCollection;
    private readonly IMongoCollection<Criterion> _criteriaCollection;
    private readonly IMongoCollection<Evaluation> _evaluationsCollection;
    private readonly IMongoCollection<Feedback> _feedbackCollection;

    public QuestEvalService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);

        _usersCollection = database.GetCollection<User>(settings.Value.UsersCollectionName);
        _groupsCollection = database.GetCollection<Group>(settings.Value.GroupsCollectionName);
        _membershipsCollection = database.GetCollection<Membership>(settings.Value.MembershipsCollectionName);
        _projectsCollection = database.GetCollection<Project>(settings.Value.ProjectsCollectionName);
        _criteriaCollection = database.GetCollection<Criterion>(settings.Value.CriteriaCollectionName);
        _evaluationsCollection = database.GetCollection<Evaluation>(settings.Value.EvaluationsCollectionName);
        _feedbackCollection = database.GetCollection<Feedback>(settings.Value.FeedbackCollectionName);
    }

    // Users
    public async Task<List<User>> GetUsersAsync() =>
        await _usersCollection.Find(_ => true).ToListAsync();

    public async Task<User?> GetUserByIdAsync(string id) =>
        await _usersCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<User?> GetUserByEmailAsync(string email) =>
        await _usersCollection.Find(x => x.Email == email).FirstOrDefaultAsync();

    public async Task CreateUserAsync(User newUser) =>
        await _usersCollection.InsertOneAsync(newUser);

    public async Task UpdateUserAsync(string id, User updatedUser) =>
        await _usersCollection.ReplaceOneAsync(x => x.Id == id, updatedUser);

    public async Task RemoveUserAsync(string id) =>
        await _usersCollection.DeleteOneAsync(x => x.Id == id);


    // Groups
    public async Task<List<Group>> GetGroupsAsync() =>
        await _groupsCollection.Find(_ => true).ToListAsync();

    public async Task<Group?> GetGroupAsync(string id) =>
        await _groupsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task CreateGroupAsync(Group newGroup) =>
        await _groupsCollection.InsertOneAsync(newGroup);

    public async Task UpdateGroupAsync(string id, Group updatedGroup) =>
        await _groupsCollection.ReplaceOneAsync(x => x.Id == id, updatedGroup);

    public async Task RemoveGroupAsync(string id) =>
        await _groupsCollection.DeleteOneAsync(x => x.Id == id);

    // Memberships
    public async Task<List<Membership>> GetMembershipsAsync() =>
        await _membershipsCollection.Find(_ => true).ToListAsync();

    public async Task CreateMembershipAsync(Membership newMembership) =>
        await _membershipsCollection.InsertOneAsync(newMembership);

    // Projects
    public async Task<List<Project>> GetProjectsAsync() =>
        await _projectsCollection.Find(_ => true).ToListAsync();

    public async Task CreateProjectAsync(Project newProject) =>
        await _projectsCollection.InsertOneAsync(newProject);

    // Criteria
    public async Task<List<Criterion>> GetCriteriaAsync() =>
        await _criteriaCollection.Find(_ => true).ToListAsync();

    public async Task CreateCriterionAsync(Criterion newCriterion) =>
        await _criteriaCollection.InsertOneAsync(newCriterion);

    // Evaluations
    public async Task<List<Evaluation>> GetEvaluationsAsync() =>
        await _evaluationsCollection.Find(_ => true).ToListAsync();

    public async Task CreateEvaluationAsync(Evaluation newEvaluation) =>
        await _evaluationsCollection.InsertOneAsync(newEvaluation);

    // Feedback
    public async Task<List<Feedback>> GetFeedbackAsync() =>
        await _feedbackCollection.Find(_ => true).ToListAsync();

    public async Task CreateFeedbackAsync(Feedback newFeedback) =>
        await _feedbackCollection.InsertOneAsync(newFeedback);
}
