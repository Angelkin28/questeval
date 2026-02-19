using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;

namespace Backend.Controllers;

/// <summary>
/// Gestiona criterios de evaluación
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CriteriaController : ControllerBase
{
    private readonly ICriteriaService _service;

    public CriteriaController(ICriteriaService service) =>
        _service = service;

    /// <summary>
    /// Obtener todos los criterios
    /// </summary>
    /// <returns>Lista de todos los criterios</returns>
    /// <response code="200">Retorna la lista de criterios</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<CriterionResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CriterionResponse>>> Get()
    {
        var criteria = await _service.GetAllAsync();
        var response = criteria.Select(c => new CriterionResponse
        {
            Id = c.Id!,
            Name = c.Name,
            Description = c.Description,
            MaxScore = c.MaxScore
        }).ToList();
        return Ok(response);
    }

    /// <summary>
    /// Obtener un criterio específico por ID
    /// </summary>
    /// <param name="id">El ID del criterio</param>
    /// <returns>El criterio solicitado</returns>
    /// <response code="200">Retorna el criterio</response>
    /// <response code="404">Si el criterio no se encuentra</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CriterionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CriterionResponse>> Get(string id)
    {
        var criterion = await _service.GetByIdAsync(id);

        if (criterion is null)
        {
            return NotFound();
        }

        var response = new CriterionResponse
        {
            Id = criterion.Id!,
            Name = criterion.Name,
            Description = criterion.Description,
            MaxScore = criterion.MaxScore
        };

        return Ok(response);
    }

    /// <summary>
    /// Crear un nuevo criterio
    /// </summary>
    /// <param name="request">Detalles del criterio</param>
    /// <returns>El criterio creado</returns>
    /// <response code="201">Retorna el criterio recién creado</response>
    /// <response code="400">Si la solicitud es inválida</response>
    [HttpPost]
    [ProducesResponseType(typeof(CriterionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CriterionResponse>> Post(CreateCriterionRequest request)
    {
        var newCriterion = new Criterion
        {
            Name = request.Name,
            Description = request.Description,
            MaxScore = request.MaxScore
        };

        await _service.CreateAsync(newCriterion);

        var response = new CriterionResponse
        {
            Id = newCriterion.Id!,
            Name = newCriterion.Name,
            Description = newCriterion.Description,
            MaxScore = newCriterion.MaxScore
        };

        return CreatedAtAction(nameof(Get), new { id = newCriterion.Id }, response);
    }

    /// <summary>
    /// Actualizar un criterio existente
    /// </summary>
    /// <param name="id">El ID del criterio</param>
    /// <param name="request">Detalles actualizados del criterio</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si el criterio fue actualizado exitosamente</response>
    /// <response code="404">Si el criterio no se encuentra</response>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, CreateCriterionRequest request)
    {
        var criterion = await _service.GetByIdAsync(id);

        if (criterion is null)
        {
            return NotFound();
        }

        var updatedCriterion = new Criterion
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            MaxScore = request.MaxScore
        };

        await _service.UpdateAsync(id, updatedCriterion);

        return NoContent();
    }

    /// <summary>
    /// Eliminar un criterio
    /// </summary>
    /// <param name="id">El ID del criterio</param>
    /// <returns>Sin contenido</returns>
    /// <response code="204">Si el criterio fue eliminado exitosamente</response>
    /// <response code="404">Si el criterio no se encuentra</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var criterion = await _service.GetByIdAsync(id);

        if (criterion is null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

        return NoContent();
    }
}
