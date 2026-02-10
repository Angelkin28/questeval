using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EvaluationsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public EvaluationsController(QuestEvalService service) =>
        _service = service;

    [HttpGet]
    public async Task<List<Evaluation>> Get() =>
        await _service.GetEvaluationsAsync();

    [HttpPost]
    public async Task<IActionResult> Post(Evaluation newEvaluation)
    {
        await _service.CreateEvaluationAsync(newEvaluation);
        return CreatedAtAction(nameof(Get), new { id = newEvaluation.Id }, newEvaluation);
    }
}
