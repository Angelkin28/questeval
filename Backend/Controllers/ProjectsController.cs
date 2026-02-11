using Microsoft.AspNetCore.Mvc;
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

    public ProjectsController(IProjectsService service) =>
        _service = service;

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
            Name = p.Name,
            Description = p.Description,
            GroupId = p.GroupId,
            Status = p.Status,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
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
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectResponse>> Get(string id)
    {
        var project = await _service.GetByIdAsync(id);

        if (project is null)
        {
            return NotFound();
        }

        var response = new ProjectResponse
        {
            Id = project.Id!,
            Name = project.Name,
            Description = project.Description,
            GroupId = project.GroupId,
            Status = project.Status,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
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
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectResponse>> Post(CreateProjectRequest request)
    {
        var newProject = new Project
        {
            Name = request.Name,
            Description = request.Description,
            GroupId = request.GroupId,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newProject);

        var response = new ProjectResponse
        {
            Id = newProject.Id!,
            Name = newProject.Name,
            Description = newProject.Description,
            GroupId = newProject.GroupId,
            Status = newProject.Status,
            CreatedAt = newProject.CreatedAt,
            UpdatedAt = newProject.UpdatedAt
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
    [HttpPut("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, CreateProjectRequest request)
    {
        var project = await _service.GetByIdAsync(id);

        if (project is null)
        {
            return NotFound();
        }

        var updatedProject = new Project
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            GroupId = request.GroupId,
            Status = request.Status,
            CreatedAt = project.CreatedAt,
            UpdatedAt = DateTime.UtcNow
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
    [HttpDelete("{id:length(24)}")]
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
