using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

/// <summary>
/// Manages evaluation feedback
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class FeedbackController : ControllerBase
{
    private readonly QuestEvalService _service;

    public FeedbackController(QuestEvalService service) =>
        _service = service;

    /// <summary>
    /// Get all feedback
    /// </summary>
    /// <returns>List of all feedback</returns>
    /// <response code="200">Returns the list of feedback</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<FeedbackResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<FeedbackResponse>>> Get()
    {
        var feedback = await _service.GetFeedbackAsync();
        var response = feedback.Select(f => new FeedbackResponse
        {
            Id = f.Id!,
            EvaluationId = f.EvaluationId,
            Comment = f.Comment,
            IsPublic = f.IsPublic,
            CreatedAt = f.CreatedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Get a specific feedback by ID
    /// </summary>
    /// <param name="id">The feedback ID</param>
    /// <returns>The requested feedback</returns>
    /// <response code="200">Returns the feedback</response>
    /// <response code="404">If the feedback is not found</response>
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(FeedbackResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FeedbackResponse>> Get(string id)
    {
        var feedback = await _service.GetFeedbackByIdAsync(id);

        if (feedback is null)
        {
            return NotFound();
        }

        var response = new FeedbackResponse
        {
            Id = feedback.Id!,
            EvaluationId = feedback.EvaluationId,
            Comment = feedback.Comment,
            IsPublic = feedback.IsPublic,
            CreatedAt = feedback.CreatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Create new feedback
    /// </summary>
    /// <param name="request">Feedback details</param>
    /// <returns>The created feedback</returns>
    /// <response code="201">Returns the newly created feedback</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(FeedbackResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FeedbackResponse>> Post(CreateFeedbackRequest request)
    {
        var newFeedback = new Feedback
        {
            EvaluationId = request.EvaluationId,
            Comment = request.Comment,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow
        };

        await _service.CreateFeedbackAsync(newFeedback);

        var response = new FeedbackResponse
        {
            Id = newFeedback.Id!,
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
    /// <param name="id">The feedback ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the feedback was deleted successfully</response>
    /// <response code="404">If the feedback is not found</response>
    [HttpDelete("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var feedback = await _service.GetFeedbackByIdAsync(id);

        if (feedback is null)
        {
            return NotFound();
        }

        await _service.RemoveFeedbackAsync(id);

        return NoContent();
    }
}
