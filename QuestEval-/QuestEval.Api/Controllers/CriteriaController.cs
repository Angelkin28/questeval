using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CriteriaController : ControllerBase
{
    private readonly QuestEvalService _service;

    public CriteriaController(QuestEvalService service) =>
        _service = service;

    [HttpGet]
    public async Task<List<Criterion>> Get() =>
        await _service.GetCriteriaAsync();

    [HttpPost]
    public async Task<IActionResult> Post(Criterion newCriterion)
    {
        await _service.CreateCriterionAsync(newCriterion);
        return CreatedAtAction(nameof(Get), new { id = newCriterion.Id }, newCriterion);
    }
}
