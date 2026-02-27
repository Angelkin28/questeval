using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona evaluation feedback
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _service;

    public FeedbackController(IFeedbackService service) =>
        _service = service;

    /// <summary>
    /// Obtener todos los feedback
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<FeedbackResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<FeedbackResponse>>> Get()
    {
        var feedback = await _service.GetAllAsync();
        var response = feedback.Select(f => new FeedbackResponse
        {
            Id = f.Id!,
            FeedbackId = f.FeedbackId,
            EvaluationId = f.EvaluationId ?? string.Empty,
            Comment = f.Comment,
            IsPublic = f.IsPublic,
            CreatedAt = f.CreatedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Obtener un feedback by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(FeedbackResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FeedbackResponse>> Get(string id)
    {
        var feedback = await _service.GetByIdAsync(id);

        if (feedback is null)
        {
            return NotFound();
        }

        var response = new FeedbackResponse
        {
            Id = feedback.Id!,
            FeedbackId = feedback.FeedbackId,
            EvaluationId = feedback.EvaluationId ?? string.Empty,
            Comment = feedback.Comment,
            IsPublic = feedback.IsPublic,
            CreatedAt = feedback.CreatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Crear nuevo feedback
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(FeedbackResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FeedbackResponse>> Post([FromBody] CreateFeedbackRequest request)
    {
        var newFeedback = new Feedback
        {
            EvaluationId = request.EvaluationId,
            Comment = request.Comment,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newFeedback);

        var response = new FeedbackResponse
        {
            Id = newFeedback.Id!,
            FeedbackId = newFeedback.FeedbackId,
            EvaluationId = newFeedback.EvaluationId,
            Comment = newFeedback.Comment,
            IsPublic = newFeedback.IsPublic,
            CreatedAt = newFeedback.CreatedAt
        };

        return CreatedAtAction(nameof(Get), new { id = newFeedback.Id }, response);
    }

    /// <summary>
    /// Delete feedback
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var feedback = await _service.GetByIdAsync(id);

        if (feedback is null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

        return NoContent();
    }
}
