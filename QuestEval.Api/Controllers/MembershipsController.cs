using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;

namespace QuestEval.Api.Controllers;

/// <summary>
/// Manages group memberships
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MembershipsController : ControllerBase
{
    private readonly QuestEvalService _service;

    public MembershipsController(QuestEvalService service) =>
        _service = service;

    /// <summary>
    /// Get all memberships
    /// </summary>
    /// <returns>List of all memberships</returns>
    /// <response code="200">Returns the list of memberships</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<MembershipResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MembershipResponse>>> Get()
    {
        var memberships = await _service.GetMembershipsAsync();
        var response = memberships.Select(m => new MembershipResponse
        {
            Id = m.Id!,
            UserId = m.UserId,
            GroupId = m.GroupId,
            JoinedAt = m.JoinedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Get a specific membership by ID
    /// </summary>
    /// <param name="id">The membership ID</param>
    /// <returns>The requested membership</returns>
    /// <response code="200">Returns the membership</response>
    /// <response code="404">If the membership is not found</response>
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(MembershipResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MembershipResponse>> Get(string id)
    {
        var membership = await _service.GetMembershipAsync(id);

        if (membership is null)
        {
            return NotFound();
        }

        var response = new MembershipResponse
        {
            Id = membership.Id!,
            UserId = membership.UserId,
            GroupId = membership.GroupId,
            JoinedAt = membership.JoinedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Create a new membership (join a group)
    /// </summary>
    /// <param name="request">Membership details</param>
    /// <returns>The created membership</returns>
    /// <response code="201">Returns the newly created membership</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(MembershipResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MembershipResponse>> Post(CreateMembershipRequest request)
    {
        var newMembership = new Membership
        {
            UserId = request.UserId,
            GroupId = request.GroupId,
            JoinedAt = DateTime.UtcNow
        };

        await _service.CreateMembershipAsync(newMembership);

        var response = new MembershipResponse
        {
            Id = newMembership.Id!,
            UserId = newMembership.UserId,
            GroupId = newMembership.GroupId,
            JoinedAt = newMembership.JoinedAt
        };

        return CreatedAtAction(nameof(Get), new { id = newMembership.Id }, response);
    }

    /// <summary>
    /// Delete a membership (leave a group)
    /// </summary>
    /// <param name="id">The membership ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the membership was deleted successfully</response>
    /// <response code="404">If the membership is not found</response>
    [HttpDelete("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var membership = await _service.GetMembershipAsync(id);

        if (membership is null)
        {
            return NotFound();
        }

        await _service.RemoveMembershipAsync(id);

        return NoContent();
    }
}
