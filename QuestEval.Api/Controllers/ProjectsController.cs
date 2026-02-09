using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public ProjectsController(QuestEvalService service) =>
        _service = service;

    [HttpGet]
    public async Task<List<Project>> Get() =>
        await _service.GetProjectsAsync();

    [HttpPost]
    public async Task<IActionResult> Post(Project newProject)
    {
        await _service.CreateProjectAsync(newProject);
        return CreatedAtAction(nameof(Get), new { id = newProject.Id }, newProject);
    }
}
