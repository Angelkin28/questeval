using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

    public AdminController(
        IGroupsService groupsService,
        IUsersService usersService,
        IMembershipsService membershipsService,
        IActivityLogService logService)
    {
        _groupsService = groupsService;
        _usersService = usersService;
        _membershipsService = membershipsService;
        _logService = logService;
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

        var adminId = User.FindFirst("userId")?.Value;
        var adminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Admin";
        await _logService.LogAsync(
            "group_teacher_changed",
            $"Maestro del grupo \"{group.Name}\" cambiado a {newTeacher.FullName} ({newTeacher.Email})",
            "info", adminId, adminName, groupId, group.Name);

        return Ok(new { message = $"Maestro del grupo actualizado a {newTeacher.FullName}." });
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
