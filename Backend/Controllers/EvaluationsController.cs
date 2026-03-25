using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona project evaluations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EvaluationsController : ControllerBase
{
    private readonly IEvaluationsService _service;
    private readonly IUsersService _usersService;
    private readonly IProjectsService _projectsService;

    public EvaluationsController(IEvaluationsService service, IUsersService usersService, IProjectsService projectsService)
    {
        _service = service;
        _usersService = usersService;
        _projectsService = projectsService;
    }

    /// <summary>
    /// Obtener todos los evaluations
    /// </summary>
    /// <returns>Lista de todas las evaluaciones</returns>
    /// <response code="200">Retorna la lista de evaluations</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<EvaluationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EvaluationResponse>>> Get()
    {
        var evaluations = await _service.GetAllAsync();
        var response = evaluations.Select(e => new EvaluationResponse
        {
            Id = e.Id!,
            EvaluationId = e.EvaluationId ?? string.Empty,
            ProjectId = e.ProjectId ?? string.Empty,
            UserId = e.UserId ?? string.Empty,
            EvaluatorRole = e.EvaluatorRole,
            EvaluatorName = e.EvaluatorName,
            FinalScore = e.FinalScore,
            Details = e.Details.Select(d => new EvaluationDetailResponse
            {
                CriteriaId = d.CriteriaId ?? string.Empty,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList(),
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Obtener un evaluation by ID
    /// </summary>
    /// <param name="id">El ID de la evaluación</param>
    /// <returns>El recurso solicitado de evaluation</returns>
    /// <response code="200">Retorna el evaluation</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EvaluationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvaluationResponse>> Get(string id)
    {
        var evaluation = await _service.GetByIdAsync(id);

        if (evaluation is null)
        {
            return NotFound();
        }

        var response = new EvaluationResponse
        {
            Id = evaluation.Id!,
            EvaluationId = evaluation.EvaluationId ?? string.Empty,
            ProjectId = evaluation.ProjectId ?? string.Empty,
            UserId = evaluation.UserId ?? string.Empty,
            EvaluatorRole = evaluation.EvaluatorRole,
            EvaluatorName = evaluation.EvaluatorName,
            FinalScore = evaluation.FinalScore,
            Details = evaluation.Details.Select(d => new EvaluationDetailResponse
            {
                CriteriaId = d.CriteriaId ?? string.Empty,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList(),
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Ok(response);
    }
    
    /// <summary>
    /// Obtener evaluaciones de un proyecto
    /// </summary>
    /// <param name="projectId">El ID del proyecto</param>
    /// <returns>Lista de evaluaciones del proyecto</returns>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(typeof(List<EvaluationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EvaluationResponse>>> GetByProject(string projectId)
    {
        var evaluations = await _service.GetByProjectIdAsync(projectId);
        var response = evaluations.Select(e => new EvaluationResponse
        {
            Id = e.Id!,
            EvaluationId = e.EvaluationId ?? string.Empty,
            ProjectId = e.ProjectId ?? string.Empty,
            UserId = e.UserId ?? string.Empty,
            EvaluatorRole = e.EvaluatorRole,
            EvaluatorName = e.EvaluatorName,
            FinalScore = e.FinalScore,
            Details = e.Details.Select(d => new EvaluationDetailResponse
            {
                CriteriaId = d.CriteriaId ?? string.Empty,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList(),
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Crear un nuevo evaluation
    /// </summary>
    /// <param name="request">Detalles de la evaluación (especifica UserId)</param>
    /// <returns>The created evaluation</returns>
    /// <response code="201">Retorna el newly created evaluation</response>
    /// <response code="400">Si la solicitud es inválida</response>
    [HttpPost]
    [ProducesResponseType(typeof(EvaluationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EvaluationResponse>> Post([FromBody] CreateEvaluationRequest request)
    {
        // Resolver rol y nombre del evaluador: buscar primero por UserId incremental, luego por MongoDB ObjectId
        var evaluator = await _usersService.GetByUserIdAsync(request.UserId)
                     ?? await _usersService.GetByIdAsync(request.UserId);
        if (evaluator == null) return BadRequest("El usuario evaluador no existe.");

        var evaluatorRole = evaluator.Role;
        var evaluatorName = evaluator.FullName;

        var newEvaluation = new Evaluation
        {
            ProjectId = request.ProjectId,
            UserId = request.UserId,
            EvaluatorRole = evaluatorRole,
            EvaluatorName = evaluatorName,
            Details = request.Details.Select(d => new EvaluationDetail
            {
                CriteriaId = d.CriteriaId,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList(),
            FinalScore = request.Details.Any() ? request.Details.Average(d => d.Score) : 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newEvaluation);

        // Actualizar el Score promedio del proyecto
        var allEvals = await _service.GetByProjectIdAsync(request.ProjectId);
        if (allEvals.Any())
        {
            var project = await _projectsService.GetByIdAsync(request.ProjectId);
            if (project != null)
            {
                project.Score = allEvals.Average(e => e.FinalScore);
                await _projectsService.UpdateAsync(project.Id!, project);
            }
        }

        var response = new EvaluationResponse
        {
            Id = newEvaluation.Id!,
            EvaluationId = newEvaluation.EvaluationId ?? string.Empty,
            ProjectId = newEvaluation.ProjectId ?? string.Empty,
            UserId = newEvaluation.UserId ?? string.Empty,
            EvaluatorRole = newEvaluation.EvaluatorRole,
            EvaluatorName = newEvaluation.EvaluatorName,
            FinalScore = newEvaluation.FinalScore,
            Details = newEvaluation.Details.Select(d => new EvaluationDetailResponse
            {
                CriteriaId = d.CriteriaId ?? string.Empty,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList(),
            CreatedAt = newEvaluation.CreatedAt,
            UpdatedAt = newEvaluation.UpdatedAt
        };

        return CreatedAtAction(nameof(Get), new { id = newEvaluation.Id }, response);
    }

    /// <summary>
    /// Eliminar un evaluation
    /// </summary>
    /// <param name="id">El ID de la evaluación</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si se completó exitosamente</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var evaluation = await _service.GetByIdAsync(id);

        if (evaluation is null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

        return NoContent();
    }
}
