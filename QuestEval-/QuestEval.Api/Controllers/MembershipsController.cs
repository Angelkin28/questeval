using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembershipsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public MembershipsController(QuestEvalService service) =>
        _service = service;

    [HttpGet]
    public async Task<List<Membership>> Get() =>
        await _service.GetMembershipsAsync();

    [HttpPost]
    public async Task<IActionResult> Post(Membership newMembership)
    {
        await _service.CreateMembershipAsync(newMembership);
        return CreatedAtAction(nameof(Get), new { id = newMembership.Id }, newMembership);
    }
}
