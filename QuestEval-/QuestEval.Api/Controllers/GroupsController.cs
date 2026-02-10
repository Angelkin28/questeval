using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public GroupsController(QuestEvalService service) =>
        _service = service;

    [HttpGet]
    public async Task<List<Group>> Get() =>
        await _service.GetGroupsAsync();

    [HttpGet("{id:length(24)}")]
    public async Task<ActionResult<Group>> Get(string id)
    {
        var group = await _service.GetGroupAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        return group;
    }

    [HttpPost]
    public async Task<IActionResult> Post(Group newGroup)
    {
        await _service.CreateGroupAsync(newGroup);

        return CreatedAtAction(nameof(Get), new { id = newGroup.Id }, newGroup);
    }

    [HttpPut("{id:length(24)}")]
    public async Task<IActionResult> Update(string id, Group updatedGroup)
    {
        var group = await _service.GetGroupAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        updatedGroup.Id = group.Id;

        await _service.UpdateGroupAsync(id, updatedGroup);

        return NoContent();
    }

    [HttpDelete("{id:length(24)}")]
    public async Task<IActionResult> Delete(string id)
    {
        var group = await _service.GetGroupAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        await _service.RemoveGroupAsync(id);

        return NoContent();
    }
}
