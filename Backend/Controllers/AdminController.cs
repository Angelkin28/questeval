using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Endpoints exclusivos del panel de administración
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IGroupsService _groupsService;
    private readonly IUsersService _usersService;
    private readonly IMembershipsService _membershipsService;
    private readonly IActivityLogService _logService;
    private readonly IMongoCollection<DatabaseCounters> _counters;

    public AdminController(
        IGroupsService groupsService,
        IUsersService usersService,
        IMembershipsService membershipsService,
        IActivityLogService logService,
        IOptions<QuestEvalDatabaseSettings> dbSettings)
    {
        _groupsService = groupsService;
        _usersService = usersService;
        _membershipsService = membershipsService;
        _logService = logService;

        var client = new MongoClient(dbSettings.Value.ConnectionString);
        var db = client.GetDatabase(dbSettings.Value.DatabaseName);
        _counters = db.GetCollection<DatabaseCounters>("database_counters");
    }

    // ==================== GRUPOS ====================

    /// <summary>
    /// Obtener TODOS los grupos del sistema (solo Admin)
    /// </summary>
    [HttpGet("groups")]
    [ProducesResponseType(typeof(List<AdminGroupResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllGroups()
    {
        try
        {
            var groups = await _groupsService.GetAllAsync();
            var allUsers = await _usersService.GetAllAsync();

            // Diccionario de usuarios por Id (filtrando nulos)
            var userDict = allUsers
                .Where(u => u.Id != null)
                .GroupBy(u => u.Id!)
                .ToDictionary(g => g.Key, g => g.First());

            var result = new List<AdminGroupResponse>();

            foreach (var grp in groups)
            {
                string? teacherName = null;
                string? teacherEmail = null;
                int studentCount = 0;
                int totalMembers = 0;

                // Resolver maestro
                if (!string.IsNullOrEmpty(grp.TeacherId) && userDict.TryGetValue(grp.TeacherId, out var teacher))
                {
                    teacherName = teacher.FullName;
                    teacherEmail = teacher.Email;
                }

                // Obtener membresías de este grupo con tolerancia a errores
                try
                {
                    // Intentar por Id de Mongo primero, luego por GroupId incremental
                    var memberships = await _membershipsService.GetByGroupIdAsync(grp.Id ?? "");
                    if (!memberships.Any() && !string.IsNullOrEmpty(grp.GroupId))
                        memberships = await _membershipsService.GetByGroupIdAsync(grp.GroupId);

                    totalMembers = memberships.Count;

                    foreach (var m in memberships)
                    {
                        var member = allUsers.FirstOrDefault(u => u.Id == m.UserId || u.UserId == m.UserId);
                        if (member?.Role == "Alumno") studentCount++;
                    }
                }
                catch
                {
                    // Si falla la query de membresías para este grupo, continuar con 0
                }

                result.Add(new AdminGroupResponse
                {
                    Id = grp.Id!,
                    GroupId = grp.GroupId,
                    Name = grp.Name,
                    AccessCode = grp.AccessCode,
                    TeacherId = grp.TeacherId,
                    TeacherName = teacherName,
                    TeacherEmail = teacherEmail,
                    StudentCount = studentCount,
                    TotalMembers = totalMembers,
                    CreatedAt = grp.CreatedAt
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ProblemDetails
            {
                Title = "Error al cargar grupos",
                Detail = ex.Message,
                Status = 500
            });
        }
    }

    /// <summary>
    /// Cambiar el maestro asignado a un grupo
    /// </summary>
    [HttpPut("groups/{groupId}/teacher")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangeGroupTeacher(string groupId, [FromBody] ChangeTeacherRequest request)
    {
        var group = await _groupsService.GetByIdAsync(groupId);
        if (group == null) return NotFound(new { detail = "Grupo no encontrado." });

        var newTeacher = await _usersService.GetByIdAsync(request.TeacherId);
        if (newTeacher == null) return NotFound(new { detail = "Profesor no encontrado." });
        if (newTeacher.Role != "Profesor") return BadRequest(new { detail = "El usuario no tiene rol de Profesor." });

        var oldTeacherId = group.TeacherId;
        group.TeacherId = request.TeacherId;
        await _groupsService.UpdateAsync(groupId, group);

        // Eliminar la membresía del maestro anterior en este grupo
        if (!string.IsNullOrEmpty(oldTeacherId) && oldTeacherId != request.TeacherId)
        {
            var oldMemberships = await _membershipsService.GetByUserIdAsync(oldTeacherId);
            var oldTeacherMembership = oldMemberships.FirstOrDefault(m => m.GroupId == group.GroupId);
            if (oldTeacherMembership != null)
                await _membershipsService.DeleteAsync(oldTeacherMembership.Id!);
        }

        // Crear membresía para el nuevo maestro si no la tiene ya
        var newTeacherMemberships = await _membershipsService.GetByUserIdAsync(request.TeacherId);
        var alreadyMember = newTeacherMemberships.Any(m => m.GroupId == group.GroupId);
        if (!alreadyMember)
        {
            await _membershipsService.CreateAsync(new Membership
            {
                UserId = request.TeacherId,
                GroupId = group.GroupId!,
                JoinedAt = DateTime.UtcNow
            });
        }

        var adminId = User.FindFirst("userId")?.Value;
        var adminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Admin";
        await _logService.LogAsync(
            "group_teacher_changed",
            $"Maestro del grupo \"{group.Name}\" cambiado a {newTeacher.FullName} ({newTeacher.Email})",
            "info", adminId, adminName, groupId, group.Name);

        return Ok(new { message = $"Maestro del grupo actualizado a {newTeacher.FullName}." });
    }

    /// <summary>
    /// Eliminar un grupo y todas sus membresías (solo Admin)
    /// </summary>
    [HttpDelete("groups/{groupId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteGroup(string groupId)
    {
        var group = await _groupsService.GetByIdAsync(groupId);
        if (group == null) return NotFound(new { detail = "Grupo no encontrado." });

        // Eliminar todas las membresías del grupo
        var memberships = await _membershipsService.GetByGroupIdAsync(group.GroupId!);
        foreach (var m in memberships)
        {
            if (m.Id != null)
                await _membershipsService.DeleteAsync(m.Id);
        }

        // Eliminar el grupo
        await _groupsService.DeleteAsync(groupId);

        var adminId = User.FindFirst("userId")?.Value;
        var adminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Admin";
        await _logService.LogAsync("group_deleted",
            $"Grupo \"{group.Name}\" (ID: {group.GroupId}) eliminado con {memberships.Count} membresías.",
            "warning", adminId, adminName, groupId, group.Name);

        return Ok(new { message = $"Grupo \"{group.Name}\" eliminado correctamente." });
    }

    // ==================== CONTADORES ====================

    /// <summary>
    /// Reinicia los contadores incrementales de una o todas las colecciones.
    /// Recalcula el máximo ID existente para evitar duplicados.
    /// </summary>
    [HttpPost("reset-counters")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetCounters([FromQuery] string? collection = null)
    {
        var targets = new[] { "users", "groups", "memberships", "projects", "criteria", "evaluations", "feedback" };

        if (!string.IsNullOrEmpty(collection) && !targets.Contains(collection))
            return BadRequest(new { detail = $"Colección no reconocida. Válidas: {string.Join(", ", targets)}" });

        var toReset = string.IsNullOrEmpty(collection) ? targets : new[] { collection };
        var results = new List<object>();

        foreach (var col in toReset)
        {
            // Calcular el máximo UserId/CriteriaId/etc. existente para no generar duplicados
            // Si no hay registros, resetea a 0
            long maxExisting = 0;
            try
            {
                // Obtener todos los IDs incrementales de la colección para calcular el máximo
                var rawCol = _counters.Database.GetCollection<MongoDB.Bson.BsonDocument>(col);
                var allDocs = await rawCol.Find(MongoDB.Bson.BsonDocument.Parse("{}")).ToListAsync();
                foreach (var doc in allDocs)
                {
                    // Buscar campos de ID incremental (UserId, GroupId, CriteriaId, etc.)
                    foreach (var field in new[] { "UserId", "GroupId", "MiembroId", "ProjectId", "CriteriaId", "EvaluationId", "FeedbackId" })
                    {
                        if (doc.Contains(field) && doc[field].IsString)
                        {
                            if (long.TryParse(doc[field].AsString, out var val) && val > maxExisting)
                                maxExisting = val;
                        }
                    }
                }
            }
            catch { /* Si la colección está vacía o no existe, maxExisting queda en 0 */ }

            var filter = Builders<DatabaseCounters>.Filter.Eq(x => x.CollectionName, col);
            var update = Builders<DatabaseCounters>.Update.Set(x => x.LastId, maxExisting);
            await _counters.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });

            results.Add(new { collection = col, resetTo = maxExisting });
        }

        var adminId = User.FindFirst("userId")?.Value;
        var adminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Admin";
        await _logService.LogAsync("counters_reset",
            $"Contadores reseteados: {string.Join(", ", toReset)}",
            "warning", adminId, adminName, null, null);

        return Ok(new { message = "Contadores actualizados.", results });
    }

    // ==================== LOGS ====================

    /// <summary>
    /// Obtener los logs de actividad del sistema
    /// </summary>
    [HttpGet("logs")]
    [ProducesResponseType(typeof(List<ActivityLog>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLogs([FromQuery] int limit = 100)
    {
        var logs = await _logService.GetAllAsync(limit);
        return Ok(logs);
    }
}

// ==================== DTOs ====================

public class AdminGroupResponse
{
    public string Id { get; set; } = null!;
    public string? GroupId { get; set; }
    public string Name { get; set; } = null!;
    public string AccessCode { get; set; } = null!;
    public string? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public string? TeacherEmail { get; set; }
    public int StudentCount { get; set; }
    public int TotalMembers { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChangeTeacherRequest
{
    public string TeacherId { get; set; } = null!;
}
