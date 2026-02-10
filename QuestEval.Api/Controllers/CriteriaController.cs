using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

/// <summary>
/// Manages evaluation criteria
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CriteriaController : ControllerBase
{
    private readonly QuestEvalService _service;

    public CriteriaController(QuestEvalService service) =>
        _service = service;

    /// <summary>
    /// Get all criteria
    /// </summary>
    /// <returns>List of all criteria</returns>
    /// <response code="200">Returns the list of criteria</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<CriterionResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CriterionResponse>>> Get()
    {
        var criteria = await _service.GetCriteriaAsync();
        var response = criteria.Select(c => new CriterionResponse
        {
            Id = c.Id!,
            Name = c.Name,
            Description = c.Description,
            MaxScore = c.MaxScore
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Get a specific criterion by ID
    /// </summary>
    /// <param name="id">The criterion ID</param>
    /// <returns>The requested criterion</returns>
    /// <response code="200">Returns the criterion</response>
    /// <response code="404">If the criterion is not found</response>
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(CriterionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CriterionResponse>> Get(string id)
    {
        var criterion = await _service.GetCriterionAsync(id);

        if (criterion is null)
        {
            return NotFound();
        }

        var response = new CriterionResponse
        {
            Id = criterion.Id!,
            Name = criterion.Name,
            Description = criterion.Description,
            MaxScore = criterion.MaxScore
        };

        return Ok(response);
    }

    /// <summary>
    /// Create a new criterion
    /// </summary>
    /// <param name="request">Criterion details</param>
    /// <returns>The created criterion</returns>
    /// <response code="201">Returns the newly created criterion</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(CriterionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CriterionResponse>> Post(CreateCriterionRequest request)
    {
        var newCriterion = new Criterion
        {
            Name = request.Name,
            Description = request.Description,
            MaxScore = request.MaxScore
        };

        await _service.CreateCriterionAsync(newCriterion);

        var response = new CriterionResponse
        {
            Id = newCriterion.Id!,
            Name = newCriterion.Name,
            Description = newCriterion.Description,
            MaxScore = newCriterion.MaxScore
        };

        return CreatedAtAction(nameof(Get), new { id = newCriterion.Id }, response);
    }

    /// <summary>
    /// Update an existing criterion
    /// </summary>
    /// <param name="id">The criterion ID</param>
    /// <param name="request">Updated criterion details</param>
    /// <returns>No content</returns>
    /// <response code="204">If the criterion was updated successfully</response>
    /// <response code="404">If the criterion is not found</response>
    [HttpPut("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, CreateCriterionRequest request)
    {
        var criterion = await _service.GetCriterionAsync(id);

        if (criterion is null)
        {
            return NotFound();
        }

        var updatedCriterion = new Criterion
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            MaxScore = request.MaxScore
        };

        await _service.UpdateCriterionAsync(id, updatedCriterion);

        return NoContent();
    }

    /// <summary>
    /// Delete a criterion
    /// </summary>
    /// <param name="id">The criterion ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the criterion was deleted successfully</response>
    /// <response code="404">If the criterion is not found</response>
    [HttpDelete("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var criterion = await _service.GetCriterionAsync(id);

        if (criterion is null)
        {
            return NotFound();
        }

        await _service.RemoveCriterionAsync(id);

        return NoContent();
    }
}
