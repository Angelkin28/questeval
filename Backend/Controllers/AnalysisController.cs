using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AnalysisController : ControllerBase
{
    private readonly IProjectsService _projectsService;
    private readonly IEvaluationsService _evaluationsService;

    public AnalysisController(IProjectsService projectsService, IEvaluationsService evaluationsService)
    {
        _projectsService = projectsService;
        _evaluationsService = evaluationsService;
    }

    [HttpGet("ranking/{category}")]
    public async Task<IActionResult> GetRanking(string category)
    {
        var projects = await _projectsService.GetAllAsync();
        var evaluations = await _evaluationsService.GetAllAsync();

        var rankedProjects = projects
            .Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
            .Select(p => {
                var projectEvaluations = evaluations.Where(e => e.ProjectId == p.ProjectId).ToList();
                var avgScore = projectEvaluations.Any() ? projectEvaluations.Average(e => e.FinalScore) : 0;
                return new {
                    p.ProjectId,
                    p.Name,
                    p.TeamMembers,
                    Score = avgScore,
                    p.Status,
                    p.ThumbnailUrl
                };
            })
            .OrderByDescending(p => p.Score)
            .ToList();

        return Ok(rankedProjects);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var projects = await _projectsService.GetAllAsync();
        var evaluations = await _evaluationsService.GetAllAsync();

        var integradorProjects = projects.Where(p => p.Category == "Integrador").ToList();
        var videoGamesProjects = projects.Where(p => p.Category == "Videojuegos").ToList();

        var integradorAvg = integradorProjects.Any() 
            ? evaluations.Where(e => integradorProjects.Any(p => p.ProjectId == e.ProjectId)).Average(e => e.FinalScore) 
            : 0;
            
        var videoGamesAvg = videoGamesProjects.Any() 
            ? evaluations.Where(e => videoGamesProjects.Any(p => p.ProjectId == e.ProjectId)).Average(e => e.FinalScore) 
            : 0;

        return Ok(new {
            IntegradorAverage = integradorAvg,
            VideoGamesAverage = videoGamesAvg,
            TotalProjects = projects.Count,
            TotalEvaluations = evaluations.Count
        });
    }
}
