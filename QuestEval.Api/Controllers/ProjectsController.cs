using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

/// <summary>
/// Manages student projects
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProjectsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public ProjectsController(QuestEvalService service) =>
        _service = service;

    /// <summary>
    /// Get all projects
    /// </summary>
    /// <returns>List of all projects</returns>
    /// <response code="200">Returns the list of projects</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProjectResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProjectResponse>>> Get()
    {
        var projects = await _service.GetProjectsAsync();
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
    /// Get a specific project by ID
    /// </summary>
    /// <param name="id">The project ID</param>
    /// <returns>The requested project</returns>
    /// <response code="200">Returns the project</response>
    /// <response code="404">If the project is not found</response>
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectResponse>> Get(string id)
    {
        var project = await _service.GetProjectAsync(id);

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
    /// Create a new project
    /// </summary>
    /// <param name="request">Project details</param>
    /// <returns>The created project</returns>
    /// <response code="201">Returns the newly created project</response>
    /// <response code="400">If the request is invalid</response>
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

        await _service.CreateProjectAsync(newProject);

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
    /// Update an existing project
    /// </summary>
    /// <param name="id">The project ID</param>
    /// <param name="request">Updated project details</param>
    /// <returns>No content</returns>
    /// <response code="204">If the project was updated successfully</response>
    /// <response code="404">If the project is not found</response>
    [HttpPut("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, CreateProjectRequest request)
    {
        var project = await _service.GetProjectAsync(id);

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

        await _service.UpdateProjectAsync(id, updatedProject);

        return NoContent();
    }

    /// <summary>
    /// Delete a project
    /// </summary>
    /// <param name="id">The project ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the project was deleted successfully</response>
    /// <response code="404">If the project is not found</response>
    [HttpDelete("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var project = await _service.GetProjectAsync(id);

        if (project is null)
        {
            return NotFound();
        }

        await _service.RemoveProjectAsync(id);

        return NoContent();
    }
}
