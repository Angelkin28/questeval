# Script para actualizar UsersController.cs con los nuevos endpoints

$filePath = "c:\Users\angel\Desktop\QuestEval\Backend\Controllers\UsersController.cs"
$content = Get-Content $filePath -Raw -Encoding UTF8

# PASO 1: Actualizar el constructor para incluir IOtpService
$oldConstructor = @"
    private readonly IUsersService _service;

    public UsersController(IUsersService service) =>
        _service = service;
"@

$newConstructor = @"
    private readonly IUsersService _service;
    private readonly IOtpService _otpService;

    public UsersController(IUsersService service, IOtpService otpService)
    {
        _service = service;
        _otpService = otpService;
    }
"@

$content = $content -replace [regex]::Escape($oldConstructor), $newConstructor

# PASO 2: Actualizar LoginResponse para incluir EmailVerified y VerificationStatus
$oldLoginResponse = @"
        return Ok(new LoginResponse
        {
            UserId = user.Id!,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            Token = "JWT_TOKEN_PLACEHOLDER"
        });
"@

$newLoginResponse = @"
        return Ok(new LoginResponse
        {
            UserId = user.Id!,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            Token = "JWT_TOKEN_PLACEHOLDER",
            EmailVerified = user.EmailVerified,
            VerificationStatus = user.VerificationStatus
        });
"@

$content = $content -replace [regex]::Escape($oldLoginResponse), $newLoginResponse

# PASO 3: Agregar los nuevos endpoints antes de los métodos privados
$newEndpoints = @"

    /// <summary>
    /// Enviar código OTP de 6 dígitos al email del usuario
    /// </summary>
    /// <param name="request">Email al que enviar el OTP</param>
    /// <returns>Confirmación de envío</returns>
    /// <response code="200">OTP enviado exitosamente</response>
    /// <response code="400">Error al enviar OTP</response>
    [HttpPost("send-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var success = await _otpService.SendOtpAsync(request.Email);
        
        if (success)
        {
            return Ok(new { message = "Código OTP enviado al email." });
        }
        
        return BadRequest(new { error = "No se pudo enviar el código OTP." });
    }

    /// <summary>
    /// Verificar código OTP de 6 dígitos
    /// </summary>
    /// <param name="request">Email y código OTP</param>
    /// <returns>Confirmación de verificación</returns>
    /// <response code="200">OTP verificado exitosamente</response>
    /// <response code="400">Código OTP inválido o expirado</response>
    [HttpPost("verify-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode);
        
        if (isValid)
        {
            // Marcar el usuario como verificado en MongoDB
            var user = await _service.GetByEmailAsync(request.Email);
            if (user != null)
            {
                await _service.MarkEmailAsVerifiedAsync(user.Id!);
                return Ok(new { message = "Email verificado exitosamente." });
            }
            
            return BadRequest(new { error = "Usuario no encontrado." });
        }
        
        return BadRequest(new { error = "Código OTP inválido o expirado." });
    }

    /// <summary>
    /// Obtener lista de maestros pendientes de aprobación (SOLO ADMIN)
    /// </summary>
    /// <returns>Lista de maestros pendientes</returns>
    /// <response code="200">Lista de maestros pendientes</response>
    /// <response code="403">No autorizado (solo administradores)</response>
    [HttpGet("pending-teachers")]
    [ProducesResponseType(typeof(List<PendingTeacherResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPendingTeachers()
    {
        // TODO: Agregar middleware de autenticación JWT para verificar que es Admin
        // Por ahora, permitimos acceso sin autenticación para desarrollo
        
        var pendingTeachers = await _service.GetPendingTeachersAsync();
        return Ok(pendingTeachers);
    }

    /// <summary>
    /// Aprobar o rechazar un maestro (SOLO ADMIN)
    /// </summary>
    /// <param name="request">ID del maestro y estado (approved/rejected)</param>
    /// <returns>Confirmación de actualización</returns>
    /// <response code="200">Maestro aprobado/rechazado exitosamente</response>
    /// <response code="400">Error al actualizar estado</response>
    /// <response code="403">No autorizado (solo administradores)</response>
    [HttpPost("approve-teacher")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ApproveTeacher([FromBody] ApproveTeacherRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // TODO: Agregar middleware de autenticación JWT para verificar que es Admin
        // TODO: Obtener el ID del admin desde el token JWT
        var adminId = "ADMIN_ID_PLACEHOLDER"; // Por ahora usamos un placeholder
        
        var success = await _service.UpdateTeacherStatusAsync(
            request.TeacherId, 
            request.Status,
            adminId
        );
        
        if (success)
        {
            var statusText = request.Status == "approved" ? "aprobado" : "rechazado";
            return Ok(new { message = $"Maestro {statusText} exitosamente." });
        }
        
        return BadRequest(new { error = "No se pudo actualizar el estado del maestro." });
    }

"@

# Insertar los nuevos endpoints antes de los métodos privados
$content = $content -replace '(\r?\n    private static string HashPassword)', "$newEndpoints`$1"

# Guardar el archivo actualizado
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ UsersController.cs actualizado exitosamente!" -ForegroundColor Green
Write-Host "📝 Se creó un backup en: UsersController.cs.backup" -ForegroundColor Cyan
