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

    public EvaluationsController(IEvaluationsService service) =>
        _service = service;

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
            ProjectId = e.ProjectId,
            EvaluatorId = e.EvaluatorId,
            FinalScore = e.FinalScore,
            Details = e.Details.Select(d => new EvaluationDetailResponse
            {
                CriterionId = d.CriterionId,
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
    [HttpGet("{id:length(24)}")]
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
            ProjectId = evaluation.ProjectId,
            EvaluatorId = evaluation.EvaluatorId,
            FinalScore = evaluation.FinalScore,
            Details = evaluation.Details.Select(d => new EvaluationDetailResponse
            {
                CriterionId = d.CriterionId,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList(),
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Crear un nuevo evaluation
    /// </summary>
    /// <param name="request">Detalles de la evaluación</param>
    /// <returns>The created evaluation</returns>
    /// <response code="201">Retorna el newly created evaluation</response>
    /// <response code="400">Si la solicitud es inválida</response>
    [HttpPost]
    [ProducesResponseType(typeof(EvaluationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EvaluationResponse>> Post(CreateEvaluationRequest request)
    {
        var newEvaluation = new Evaluation
        {
            ProjectId = request.ProjectId,
            EvaluatorId = request.EvaluatorId,
            Details = request.Details.Select(d => new EvaluationDetail
            {
                CriterionId = d.CriterionId,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList(),
            FinalScore = request.Details.Average(d => d.Score),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newEvaluation);

        var response = new EvaluationResponse
        {
            Id = newEvaluation.Id!,
            ProjectId = newEvaluation.ProjectId,
            EvaluatorId = newEvaluation.EvaluatorId,
            FinalScore = newEvaluation.FinalScore,
            Details = newEvaluation.Details.Select(d => new EvaluationDetailResponse
            {
                CriterionId = d.CriterionId,
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
    [HttpDelete("{id:length(24)}")]
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
