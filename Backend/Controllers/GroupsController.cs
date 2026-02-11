using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona student groups
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GroupsController : ControllerBase
{
    private readonly IGroupsService _service;

    public GroupsController(IGroupsService service) =>
        _service = service;

    /// <summary>
    /// Obtener todos los groups
    /// </summary>
    /// <returns>Lista de todos los grupos</returns>
    /// <response code="200">Retorna la lista de groups</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<GroupResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GroupResponse>>> Get()
    {
        var groups = await _service.GetAllAsync();
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
    /// Obtener un group by ID
    /// </summary>
    /// <param name="id">El ID del grupo</param>
    /// <returns>El recurso solicitado de group</returns>
    /// <response code="200">Retorna el group</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(GroupResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GroupResponse>> Get(string id)
    {
        var group = await _service.GetByIdAsync(id);

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
    /// Crear un nuevo group
    /// </summary>
    /// <param name="request">Detalles del grupo</param>
    /// <returns>The created group</returns>
    /// <response code="201">Retorna el newly created group</response>
    /// <response code="400">Si la solicitud es inválida</response>
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

        await _service.CreateAsync(newGroup);

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
    /// Actualizar un group
    /// </summary>
    /// <param name="id">El ID del grupo</param>
    /// <param name="request">Updated Detalles del grupo</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si se completó exitosamente</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpPut("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, UpdateGroupRequest request)
    {
        var group = await _service.GetByIdAsync(id);

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

        await _service.UpdateAsync(id, updatedGroup);

        return NoContent();
    }

    /// <summary>
    /// Eliminar un group
    /// </summary>
    /// <param name="id">El ID del grupo</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si se completó exitosamente</response>
    /// <response code="404">Si el recurso no se encuentra</response>
    [HttpDelete("{id:length(24)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var group = await _service.GetByIdAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

        return NoContent();
    }
}
