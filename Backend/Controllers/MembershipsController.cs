using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona group memberships
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipsService _service;

    public MembershipsController(IMembershipsService service) =>
        _service = service;

    /// <summary>
    /// Obtener todos los memberships
    /// </summary>
    /// <returns>Lista de todas las membresías</returns>
    /// <response code="200">Retorna la lista de memberships</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<MembershipResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MembershipResponse>>> Get()
    {
        var memberships = await _service.GetAllAsync();
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
    /// Obtener un membership by ID
    /// </summary>
    /// <param name="id">El ID de la membresía</param>
    /// <returns>El recurso solicitado de membership</returns>
    /// <response code="200">Retorna el membership</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpGet("{id:length(24)}")]
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
            UserId = membership.UserId,
            GroupId = membership.GroupId,
            JoinedAt = membership.JoinedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Crear un nuevo membership (join a group)
    /// </summary>
    /// <param name="request">Detalles de la membresía</param>
    /// <returns>The created membership</returns>
    /// <response code="201">Retorna el newly created membership</response>
    /// <response code="400">Si la solicitud es inválida</response>
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

        await _service.CreateAsync(newMembership);

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
    /// Eliminar un membership (leave a group)
    /// </summary>
    /// <param name="id">El ID de la membresía</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si se completó exitosamente</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpDelete("{id:length(24)}")]
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
