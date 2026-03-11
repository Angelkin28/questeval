using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona student projects
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectsService _service;
    private readonly IMembershipsService _membershipsService;
    private readonly IGroupsService _groupsService;

    public ProjectsController(IProjectsService service, IMembershipsService membershipsService, IGroupsService groupsService)
    {
        _service = service;
        _membershipsService = membershipsService;
        _groupsService = groupsService;
    }

    /// <summary>
    /// Buscar y filtrar proyectos con paginación
    /// </summary>
    /// <param name="searchTerm">Texto a buscar en nombre o descripción</param>
    /// <param name="category">Filtro por categoría</param>
    /// <param name="status">Filtro por estado</param>
    /// <param name="page">Número de página (default 1)</param>
    /// <param name="pageSize">Tamaño de página (default 10)</param>
    /// <returns>Lista paginada de proyectos y metadata</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedProjectResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedProjectResponse>> Search(
        [FromQuery] string? searchTerm,
        [FromQuery] string? category,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (projects, total) = await _service.SearchAsync(searchTerm, category, status, page, pageSize);
        
        var projectResponses = projects.Select(p => new ProjectResponse
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
            TeamMembers = p.TeamMembers,
            ComprehensionQuestions = p.ComprehensionQuestions.Select(q => new QuestionAnswerDto
            {
                Question = q.Question,
                Answer = q.Answer
            }).ToList()
        }).ToList();

        return Ok(new PagedProjectResponse
        {
            Items = projectResponses,
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)total / pageSize)
        });
    }

    /// <summary>
    /// Obtener todos los projects
    /// </summary>
    /// <returns>Lista de todos los proyectos</returns>
    /// <response code="200">Retorna la lista de projects</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProjectResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProjectResponse>>> Get()
    {
        var projects = await _service.GetAllAsync();
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
            TeamMembers = p.TeamMembers,
            ComprehensionQuestions = p.ComprehensionQuestions.Select(q => new QuestionAnswerDto
            {
                Question = q.Question,
                Answer = q.Answer
            }).ToList()
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Obtener proyectos del usuario autenticado (mis proyectos)
    /// </summary>
    /// <returns>Lista de mis proyectos</returns>
    [HttpGet("mine")]
    [Authorize(Roles = "Alumno,Profesor,Admin")]
    [ProducesResponseType(typeof(List<ProjectResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProjectResponse>>> GetMine()
    {
        var userId = User.FindFirst("userId")?.Value;
        var userFullName = User.FindFirst(ClaimTypes.Name)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // 1. Obtener grupos del usuario
        var memberships = await _membershipsService.GetByUserIdAsync(userId);
        var memberGroupIds = memberships.Select(m => m.GroupId).Distinct().ToList();

        if (!memberGroupIds.Any()) return Ok(new List<ProjectResponse>());

        // 2. Resolver tanto el GroupId incremental como el ObjectId de cada grupo
        var allGroupIdVariants = new HashSet<string>(memberGroupIds);
        foreach (var gId in memberGroupIds)
        {
            var group = await _groupsService.GetByGroupIdAsync(gId);
            if (group?.Id != null) allGroupIdVariants.Add(group.Id);
            if (group?.GroupId != null) allGroupIdVariants.Add(group.GroupId);
        }

        // 3. Obtener proyectos de esos grupos (buscando por cada variante de ID)
        var allGroupProjects = new List<Backend.Models.Project>();
        var seenProjectIds = new HashSet<string>();
        foreach (var groupId in allGroupIdVariants)
        {
            var groupProjects = await _service.GetByGroupIdAsync(groupId);
            foreach (var p in groupProjects)
            {
                if (p.Id != null && seenProjectIds.Add(p.Id))
                    allGroupProjects.Add(p);
            }
        }

        // 4. Filtrar solo proyectos donde el usuario es creador o miembro del equipo
        var myProjects = allGroupProjects.Where(p =>
            p.UserId == userId ||
            (!string.IsNullOrEmpty(userFullName) &&
             p.TeamMembers.Any(tm => string.Equals(tm, userFullName, StringComparison.OrdinalIgnoreCase)))
        ).ToList();

        var response = myProjects.Select(p => new ProjectResponse
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
            TeamMembers = p.TeamMembers,
            ComprehensionQuestions = p.ComprehensionQuestions.Select(q => new QuestionAnswerDto
            {
                Question = q.Question,
                Answer = q.Answer
            }).ToList()
        }).ToList();

        return Ok(response);
    }

    /// <summary>
    /// Obtener un project by ID
    /// </summary>
    /// <param name="id">El ID del proyecto</param>
    /// <returns>El recurso solicitado de project</returns>
    /// <response code="200">Retorna el project</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectResponse>> Get(string id)
    {
        // Intentar buscar por ID interno (ObjectId)
        var project = await _service.GetByIdAsync(id);
        
        // Si no se encuentra, intentar buscar por ProjectId secuencial (ej: "1", "2")
        if (project is null)
        {
            project = await _service.GetByProjectIdAsync(id);
        }

        if (project is null)
        {
            return NotFound();
        }

        var response = new ProjectResponse
        {
            Id = project.Id!,
            ProjectId = project.ProjectId,
            Name = project.Name,
            Description = project.Description,
            GroupId = project.GroupId ?? string.Empty,
            Status = project.Status,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Category = project.Category,
            VideoUrl = project.VideoUrl,
            ThumbnailUrl = project.ThumbnailUrl,
            TeamMembers = project.TeamMembers,
            ComprehensionQuestions = project.ComprehensionQuestions.Select(q => new QuestionAnswerDto
            {
                Question = q.Question,
                Answer = q.Answer
            }).ToList()
        };

        return Ok(response);
    }

    /// <summary>
    /// Crear un nuevo project
    /// </summary>
    /// <param name="request">Detalles del proyecto</param>
    /// <returns>The created project</returns>
    /// <response code="201">Retorna el newly created project</response>
    /// <response code="400">Si la solicitud es inválida</response>
    [HttpPost]
    [Authorize(Roles = "Alumno,Profesor,Admin")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectResponse>> Post(CreateProjectRequest request)
    {
        var creatorId = User.FindFirst("userId")?.Value;

        var newProject = new Backend.Models.Project
        {
            Name = request.Name,
            Description = request.Description,
            GroupId = request.GroupId,
            Status = request.Status,
            UserId = creatorId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Category = request.Category,
            VideoUrl = request.VideoUrl,
            ThumbnailUrl = request.ThumbnailUrl,
            TeamMembers = request.TeamMembers,
            ComprehensionQuestions = request.ComprehensionQuestions.Select(q => new QuestionAnswer
            {
                Question = q.Question,
                Answer = q.Answer
            }).ToList()
        };

        await _service.CreateAsync(newProject);

        var response = new ProjectResponse
        {
            Id = newProject.Id!,
            ProjectId = newProject.ProjectId,
            Name = newProject.Name,
            Description = newProject.Description,
            GroupId = newProject.GroupId,
            Status = newProject.Status,
            CreatedAt = newProject.CreatedAt,
            UpdatedAt = newProject.UpdatedAt,
            Category = newProject.Category,
            VideoUrl = newProject.VideoUrl,
            ThumbnailUrl = newProject.ThumbnailUrl,
            TeamMembers = newProject.TeamMembers
        };

        return CreatedAtAction(nameof(Get), new { id = newProject.Id }, response);
    }

    /// <summary>
    /// Actualizar un project
    /// </summary>
    /// <param name="id">El ID del proyecto</param>
    /// <param name="request">Updated Detalles del proyecto</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si se completó exitosamente</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpPut("{id}")]
    [Authorize(Roles = "Profesor,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, CreateProjectRequest request)
    {
        var project = await _service.GetByIdAsync(id);

        if (project is null)
        {
            return NotFound();
        }

        var updatedProject = new Backend.Models.Project
        {
            Id = id,
            ProjectId = project.ProjectId, // Preservar - no editable
            Name = request.Name,
            Description = request.Description,
            GroupId = request.GroupId,
            Status = request.Status,
            CreatedAt = project.CreatedAt,
            UpdatedAt = DateTime.UtcNow,
            Category = request.Category,
            VideoUrl = request.VideoUrl,
            ThumbnailUrl = request.ThumbnailUrl,
            TeamMembers = request.TeamMembers,
            ComprehensionQuestions = request.ComprehensionQuestions.Select(q => new QuestionAnswer
            {
                Question = q.Question,
                Answer = q.Answer
            }).ToList()
        };

        await _service.UpdateAsync(id, updatedProject);

        return NoContent();
    }

    /// <summary>
    /// Eliminar un project
    /// </summary>
    /// <param name="id">El ID del proyecto</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si se completó exitosamente</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Profesor,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var project = await _service.GetByIdAsync(id);

        if (project is null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

        return NoContent();
    }
}

