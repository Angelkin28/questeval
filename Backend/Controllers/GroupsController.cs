using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona student groups
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Alumno,Profesor,Admin")]
[Produces("application/json")]
public class GroupsController : ControllerBase
{
    private readonly IGroupsService _service;
    private readonly IMembershipsService _membershipsService;
    private readonly IUsersService _usersService;
    private readonly IProjectsService _projectsService;
    private readonly IActivityLogService _logService;

    public GroupsController(
        IGroupsService service, 
        IMembershipsService membershipsService,
        IUsersService usersService,
        IProjectsService projectsService,
        IActivityLogService logService)
    {
        _service = service;
        _membershipsService = membershipsService;
        _usersService = usersService;
        _projectsService = projectsService;
        _logService = logService;
    }

    /// <summary>
    /// Obtener todos los groups (Admin only ideally, or public directory)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<GroupResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GroupResponse>>> Get()
    {
        var groups = await _service.GetAllAsync();
        var response = groups.Select(g => new GroupResponse
        {
            Id = g.Id!,
            GroupId = g.GroupId,
            Name = g.Name,
            AccessCode = g.AccessCode,
            CreatedAt = g.CreatedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Obtener grupos del usuario autenticado
    /// </summary>
    [HttpGet("mine")]
    [ProducesResponseType(typeof(List<GroupResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GroupResponse>>> GetMyGroups()
    {
        var userId = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var memberships = await _membershipsService.GetByUserIdAsync(userId);
        var groupIds = memberships.Select(m => m.GroupId).Distinct();
        
        var myGroups = new List<GroupResponse>();
        foreach (var groupId in groupIds)
        {
            var group = await _service.GetByGroupIdAsync(groupId);
            if (group != null)
            {
                myGroups.Add(new GroupResponse
                {
                    Id = group.Id!,
                    GroupId = group.GroupId,
                    Name = group.Name,
                    AccessCode = group.AccessCode,
                    CreatedAt = group.CreatedAt
                });
            }
        }
        
        return Ok(myGroups);
    }

    /// <summary>
    /// Obtener miembros de un grupo
    /// </summary>
    [HttpGet("{id}/members")]
    [ProducesResponseType(typeof(List<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<UserResponse>>> GetMembers(string id)
    {
        var group = await _service.GetByIdAsync(id);
        if (group == null) return NotFound("Group not found");

        var memberships = await _membershipsService.GetByGroupIdAsync(group.GroupId ?? "");
        var members = new List<UserResponse>();
        
        foreach (var membership in memberships)
        {
            var user = await _usersService.GetByUserIdAsync(membership.UserId);
            if (user != null)
            {
                members.Add(new UserResponse
                {
                    Id = user.Id!,
                    UserId = user.UserId,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role,
                    AvatarUrl = user.AvatarUrl,
                    CreatedAt = user.CreatedAt,
                    EmailVerified = user.EmailVerified,
                    VerificationStatus = user.VerificationStatus
                });
            }
        }
        
        return Ok(members);
    }

    /// <summary>
    /// Obtener proyectos de un grupo
    /// </summary>
    [HttpGet("{id}/projects")]
    [ProducesResponseType(typeof(List<ProjectResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<ProjectResponse>>> GetProjects(string id)
    {
        var group = await _service.GetByIdAsync(id);
        if (group == null) return NotFound("Group not found");

        var projects = await _projectsService.GetByGroupIdAsync(group.GroupId ?? "");
        
        var response = projects.Select(p => new ProjectResponse
        {
            Id = p.Id!,
            ProjectId = p.ProjectId,
            Name = p.Name,
            Description = p.Description,
            GroupId = p.GroupId ?? string.Empty,
            Status = p.Status,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            Category = p.Category,
            VideoUrl = p.VideoUrl,
            ThumbnailUrl = p.ThumbnailUrl,
            TeamMembers = p.TeamMembers
        }).ToList();
        
        return Ok(response);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(GroupResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GroupResponse>> Get(string id)
    {
        var group = await _service.GetByIdAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        var response = new GroupResponse
        {
            Id = group.Id!,
            GroupId = group.GroupId,
            Name = group.Name,
            AccessCode = group.AccessCode,
            CreatedAt = group.CreatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Crear un nuevo group y unir al creador
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(GroupResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<GroupResponse>> Post(CreateGroupRequest request)
    {
        var userId = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var newGroup = new Group
        {
            Name = request.Name,
            AccessCode = request.AccessCode,
            TeacherId = userId,  // Guardar el ID del maestro creador
            CreatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newGroup);
        
        // Auto-join creator
        await _membershipsService.CreateAsync(new Membership
        {
            UserId = userId,
            GroupId = newGroup.GroupId!,
            JoinedAt = DateTime.UtcNow
        });

        // Registrar en el log de actividad
        var creatorName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Profesor";
        await _logService.LogAsync("group_created", $"Nuevo grupo creado: \"{newGroup.Name}\" (Código: {newGroup.AccessCode}) por {creatorName}", "info", userId, creatorName, newGroup.Id, newGroup.Name);

        var response = new GroupResponse
        {
            Id = newGroup.Id!,
            GroupId = newGroup.GroupId,
            Name = newGroup.Name,
            AccessCode = newGroup.AccessCode,
            CreatedAt = newGroup.CreatedAt
        };

        return CreatedAtAction(nameof(Get), new { id = newGroup.Id }, response);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, UpdateGroupRequest request)
    {
        var group = await _service.GetByIdAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        var updatedGroup = new Group
        {
            Id = id,
            GroupId = group.GroupId, // Preservar - no editable
            Name = request.Name,
            AccessCode = request.AccessCode,
            CreatedAt = group.CreatedAt
        };

        await _service.UpdateAsync(id, updatedGroup);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var group = await _service.GetByIdAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

        return NoContent();
    }

    /// <summary>
    /// Join a group using access code
    /// </summary>
    [HttpPost("join")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> JoinGroup([FromBody] JoinGroupRequest request)
    {
        var userId = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var group = (await _service.GetAllAsync())
            .FirstOrDefault(g => g.AccessCode == request.AccessCode);

        if (group == null)
            return NotFound(new { message = "Código de acceso inválido." });

        var existingMembership = (await _membershipsService.GetByUserIdAsync(userId))
            .FirstOrDefault(m => m.GroupId == group.GroupId);

        if (existingMembership != null)
            return BadRequest(new { message = "Ya eres miembro de este grupo." });

        await _membershipsService.CreateAsync(new Membership
        {
            UserId = userId,
            GroupId = group.GroupId!,
            JoinedAt = DateTime.UtcNow
        });

        return Ok(new { message = "Te has unido al grupo exitosamente.", groupId = group.GroupId });
    }
}

public class JoinGroupRequest
{
    public string AccessCode { get; set; } = null!;
}
