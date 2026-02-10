using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

/// <summary>
/// Manages project evaluations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EvaluationsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public EvaluationsController(QuestEvalService service) =>
        _service = service;

    /// <summary>
    /// Get all evaluations
    /// </summary>
    /// <returns>List of all evaluations</returns>
    /// <response code="200">Returns the list of evaluations</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<EvaluationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EvaluationResponse>>> Get()
    {
        var evaluations = await _service.GetEvaluationsAsync();
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
    /// Get a specific evaluation by ID
    /// </summary>
    /// <param name="id">The evaluation ID</param>
    /// <returns>The requested evaluation</returns>
    /// <response code="200">Returns the evaluation</response>
    /// <response code="404">If the evaluation is not found</response>
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(EvaluationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvaluationResponse>> Get(string id)
    {
        var evaluation = await _service.GetEvaluationAsync(id);

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
    /// Create a new evaluation
    /// </summary>
    /// <param name="request">Evaluation details</param>
    /// <returns>The created evaluation</returns>
    /// <response code="201">Returns the newly created evaluation</response>
    /// <response code="400">If the request is invalid</response>
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

        await _service.CreateEvaluationAsync(newEvaluation);

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
    /// Delete an evaluation
    /// </summary>
    /// <param name="id">The evaluation ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the evaluation was deleted successfully</response>
    /// <response code="404">If the evaluation is not found</response>
    [HttpDelete("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var evaluation = await _service.GetEvaluationAsync(id);

        if (evaluation is null)
        {
            return NotFound();
        }

        await _service.RemoveEvaluationAsync(id);

        return NoContent();
    }
}
