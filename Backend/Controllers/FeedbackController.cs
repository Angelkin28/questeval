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
    /// <returns>Lista de toda la retroalimentación</returns>
    /// <response code="200">Retorna la lista de feedback</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<FeedbackResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<FeedbackResponse>>> Get()
    {
        var feedback = await _service.GetAllAsync();
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
    /// Obtener un feedback by ID
    /// </summary>
    /// <param name="id">El ID de la retroalimentación</param>
    /// <returns>El recurso solicitado de feedback</returns>
    /// <response code="200">Retorna el feedback</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpGet("{id:length(24)}")]
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
            EvaluationId = feedback.EvaluationId,
            Comment = feedback.Comment,
            IsPublic = feedback.IsPublic,
            CreatedAt = feedback.CreatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Crear nuevo feedback
    /// </summary>
    /// <param name="request">Detalles de la retroalimentación</param>
    /// <returns>The created feedback</returns>
    /// <response code="201">Retorna el newly created feedback</response>
    /// <response code="400">Si la solicitud es inválida</response>
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

        await _service.CreateAsync(newFeedback);

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
    /// <param name="id">El ID de la retroalimentación</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si se completó exitosamente</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpDelete("{id:length(24)}")]
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
