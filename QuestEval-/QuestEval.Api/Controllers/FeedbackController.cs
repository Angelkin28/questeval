using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly QuestEvalService _service;

    public FeedbackController(QuestEvalService service) =>
        _service = service;

    [HttpGet]
    public async Task<List<Feedback>> Get() =>
        await _service.GetFeedbackAsync();

    [HttpPost]
    public async Task<IActionResult> Post(Feedback newFeedback)
    {
        await _service.CreateFeedbackAsync(newFeedback);
        return CreatedAtAction(nameof(Get), new { id = newFeedback.Id }, newFeedback);
    }
}
