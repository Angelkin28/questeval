using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona memberships (usuarios en grupos)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Alumno,Profesor,Admin")]
[Produces("application/json")]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipsService _service;

    public MembershipsController(IMembershipsService service) =>
        _service = service;

    /// <summary>
    /// Obtener todos los memberships
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<MembershipResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MembershipResponse>>> Get()
    {
        var memberships = await _service.GetAllAsync();
        var response = memberships.Select(m => new MembershipResponse
        {
            Id = m.Id!,
            MiembroId = m.MiembroId,
            UserId = m.UserId,
            GroupId = m.GroupId,
            JoinedAt = m.JoinedAt
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Obtener un membership by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MembershipResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MembershipResponse>> Get(string id)
    {
        var membership = await _service.GetByIdAsync(id);

        if (membership is null)
        {
            return NotFound();
        }

        var response = new MembershipResponse
        {
            Id = membership.Id!,
            MiembroId = membership.MiembroId,
            UserId = membership.UserId,
            GroupId = membership.GroupId,
            JoinedAt = membership.JoinedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Eliminar un membership
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var membership = await _service.GetByIdAsync(id);

        if (membership is null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

        return NoContent();
    }
}
