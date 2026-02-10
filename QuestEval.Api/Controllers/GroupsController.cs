using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

/// <summary>
/// Manages student groups
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GroupsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public GroupsController(QuestEvalService service) =>
        _service = service;

    /// <summary>
    /// Get all groups
    /// </summary>
    /// <returns>List of all groups</returns>
    /// <response code="200">Returns the list of groups</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<GroupResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GroupResponse>>> Get()
    {
        var groups = await _service.GetGroupsAsync();
        var response = groups.Select(g => new GroupResponse
        {
            Id = g.Id!,
            Name = g.Name,
            AccessCode = g.AccessCode,
            CreatedAt = g.CreatedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Get a specific group by ID
    /// </summary>
    /// <param name="id">The group ID</param>
    /// <returns>The requested group</returns>
    /// <response code="200">Returns the group</response>
    /// <response code="404">If the group is not found</response>
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(GroupResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GroupResponse>> Get(string id)
    {
        var group = await _service.GetGroupAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        var response = new GroupResponse
        {
            Id = group.Id!,
            Name = group.Name,
            AccessCode = group.AccessCode,
            CreatedAt = group.CreatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Create a new group
    /// </summary>
    /// <param name="request">Group details</param>
    /// <returns>The created group</returns>
    /// <response code="201">Returns the newly created group</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(GroupResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<GroupResponse>> Post(CreateGroupRequest request)
    {
        var newGroup = new Group
        {
            Name = request.Name,
            AccessCode = request.AccessCode,
            CreatedAt = DateTime.UtcNow
        };

        await _service.CreateGroupAsync(newGroup);

        var response = new GroupResponse
        {
            Id = newGroup.Id!,
            Name = newGroup.Name,
            AccessCode = newGroup.AccessCode,
            CreatedAt = newGroup.CreatedAt
        };

        return CreatedAtAction(nameof(Get), new { id = newGroup.Id }, response);
    }

    /// <summary>
    /// Update an existing group
    /// </summary>
    /// <param name="id">The group ID</param>
    /// <param name="request">Updated group details</param>
    /// <returns>No content</returns>
    /// <response code="204">If the group was updated successfully</response>
    /// <response code="404">If the group is not found</response>
    [HttpPut("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, UpdateGroupRequest request)
    {
        var group = await _service.GetGroupAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        var updatedGroup = new Group
        {
            Id = id,
            Name = request.Name,
            AccessCode = request.AccessCode,
            CreatedAt = group.CreatedAt
        };

        await _service.UpdateGroupAsync(id, updatedGroup);

        return NoContent();
    }

    /// <summary>
    /// Delete a group
    /// </summary>
    /// <param name="id">The group ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the group was deleted successfully</response>
    /// <response code="404">If the group is not found</response>
    [HttpDelete("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
