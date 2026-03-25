using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MobileController : ControllerBase
{
    private readonly IMobileAuthService _mobileAuthService;
    private readonly IEvaluationsService _evaluationsService;
    private readonly IProjectsService _projectsService;
    private readonly ICriteriaService _criteriaService;

    public MobileController(
        IMobileAuthService mobileAuthService,
        IEvaluationsService evaluationsService,
        IProjectsService projectsService,
        ICriteriaService criteriaService)
    {
        _mobileAuthService = mobileAuthService;
        _evaluationsService = evaluationsService;
        _projectsService = projectsService;
        _criteriaService = criteriaService;
    }

    /// <summary>
    /// Verifica un código QR escaneado y devuelve los datos del proyecto y rúbrica si es válido.
    /// </summary>
    [HttpPost("sessions/verify")]
    public async Task<IActionResult> VerifySession([FromBody] VerifySessionRequestDTO request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        string? projectId;
        if (request.QrToken == "DEV_SKIP_QR")
        {
            var projects = await _projectsService.GetAllAsync();
            var firstProject = projects.FirstOrDefault();
            if (firstProject == null) return NotFound(new { detail = "No hay proyectos para el modo dev." });
            projectId = firstProject.Id;
        }
        else if (!_mobileAuthService.ValidateQRToken(request.QrToken, out projectId, out var errorMessage))
        {
            return Unauthorized(new { detail = errorMessage });
        }

        // Verificar si este dispositivo ya evaluó este proyecto
        var hasEvaluated = await _mobileAuthService.HasDeviceEvaluatedProjectAsync(projectId!, request.DeviceId);
        if (hasEvaluated)
        {
            return StatusCode(403, new { detail = "Este dispositivo ya ha registrado una evaluación para este proyecto. Solo se permite una evaluación por dispositivo." });
        }

        var project = await _projectsService.GetByIdAsync(projectId!);
        if (project == null)
            return NotFound(new { detail = "El proyecto referenciado en el código QR ya no existe." });

        var criteriaList = await _criteriaService.GetAllAsync();

        // Generar un SessionToken ultra-corto (15 mins) para que envíen la evaluación real vinculada a esta apertura
        var sessionToken = _mobileAuthService.GenerateQRToken(projectId!, 15);

        return Ok(new
        {
            sessionToken = sessionToken,
            project = new
            {
                id = project.Id,
                name = project.Name,
                description = project.Description,
                teamMembers = project.TeamMembers,
                thumbnailUrl = project.ThumbnailUrl
            },
            criteria = criteriaList.Select(c => new
            {
                id = c.Id,
                name = c.Name,
                description = c.Description,
                maxScore = c.MaxScore
            })
        });
    }

    /// <summary>
    /// Recibe una evaluación de la app móvil. Requiere un Token vigente y previene múltiples envíos del mismo dispositivo.
    /// </summary>
    [HttpPost("evaluations")]
    public async Task<IActionResult> SubmitMobileEvaluation([FromHeader(Name = "Authorization")] string bearerToken, [FromBody] MobileEvaluationRequestDTO request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Limpiar "Bearer " del header
        var token = bearerToken?.Replace("Bearer ", "").Trim();
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new { detail = "Falta el token de sesión móvil." });

        // El sessionToken no deja de ser un QR Token reciclado para vida útil minúscula.
        if (!_mobileAuthService.ValidateQRToken(token, out var tokenProjectId, out var errorMessage))
        {
            return Unauthorized(new { detail = errorMessage });
        }

        if (tokenProjectId != request.ProjectId)
        {
            return BadRequest(new { detail = "El token provisto pertenece a otro proyecto." });
        }

        // Validación de Check/Lock por DeviceId
        if (await _mobileAuthService.HasDeviceEvaluatedProjectAsync(request.ProjectId, request.DeviceId))
        {
            return StatusCode(409, new { detail = "El dispositivo ya evaluó este proyecto. Conflicto rechazado." });
        }

        // Calcular puntaje final
        double finalScore = request.Details.Sum(d => d.Score);

        var evaluationRecord = new Evaluation
        {
            ProjectId = request.ProjectId,
            EvaluatorDeviceId = request.DeviceId,
            EvaluatorRole = "Invitado Móvil",
            EvaluatorName = string.IsNullOrWhiteSpace(request.GuestName) ? "Anónimo (App)" : request.GuestName.Trim(),
            FinalScore = finalScore,
            Details = request.Details.Select(d => new EvaluationDetail
            {
                CriteriaId = d.CriteriaId,
                CriterionName = d.CriterionName,
                Score = d.Score
            }).ToList()
        };

        // Guardado Base (Reutilizando lógica base)
        await _evaluationsService.CreateAsync(evaluationRecord);

        // Actualizar el Score promedio del proyecto
        var allEvals = await _evaluationsService.GetByProjectIdAsync(request.ProjectId);
        if (allEvals.Any())
        {
            var project = await _projectsService.GetByIdAsync(request.ProjectId);
            if (project != null)
            {
                project.Score = allEvals.Average(e => e.FinalScore);
                await _projectsService.UpdateAsync(project.Id!, project);
            }
        }

        // Tras haber guardado la evaluación, "Quemamos" o registramos el DeviceId
        // En una base SQL se haría Transaccional. En Mongo, manejamos de este orden lógico. 
        await _mobileAuthService.RegisterDeviceEvaluationAsync(request.ProjectId, request.DeviceId, evaluationRecord.Id!);

        return Created($"/api/Evaluations/{evaluationRecord.Id}", new { id = evaluationRecord.Id, status = "Evaluación Móvil Completa" });
    }
}
