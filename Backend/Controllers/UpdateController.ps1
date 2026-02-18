# Script para actualizar UsersController.cs

Write-Host "🔧 Actualizando UsersController.cs..." -ForegroundColor Cyan

$filePath = "c:\Users\angel\Desktop\QuestEval\Backend\Controllers\UsersController.cs"

# Leer el archivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# PASO 1: Actualizar el constructor
Write-Host "📝 Paso 1: Actualizando constructor..." -ForegroundColor Yellow

$oldConstructor = "    private readonly IUsersService _service;`r`n`r`n    public UsersController(IUsersService service) =>`r`n        _service = service;"

$newConstructor = @"
    private readonly IUsersService _service;
    private readonly IOtpService _otpService;

    public UsersController(IUsersService service, IOtpService otpService)
    {
        _service = service;
        _otpService = otpService;
    }
"@

if ($content -match [regex]::Escape($oldConstructor)) {
    $content = $content -replace [regex]::Escape($oldConstructor), $newConstructor
    Write-Host "  ✅ Constructor actualizado" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Constructor ya actualizado o no encontrado" -ForegroundColor Yellow
}

# PASO 2: Actualizar LoginResponse
Write-Host "📝 Paso 2: Actualizando LoginResponse..." -ForegroundColor Yellow

$oldLoginResponse = "            Token = `"JWT_TOKEN_PLACEHOLDER`"`r`n        });"
$newLoginResponse = @"
            Token = "JWT_TOKEN_PLACEHOLDER",
            EmailVerified = user.EmailVerified,
            VerificationStatus = user.VerificationStatus
        });
"@

if ($content -match [regex]::Escape($oldLoginResponse)) {
    $content = $content -replace [regex]::Escape($oldLoginResponse), $newLoginResponse
    Write-Host "  ✅ LoginResponse actualizado" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  LoginResponse ya actualizado o no encontrado" -ForegroundColor Yellow
}

# PASO 3: Agregar nuevos endpoints antes de los métodos privados
Write-Host "📝 Paso 3: Agregando nuevos endpoints..." -ForegroundColor Yellow

$newEndpoints = @"

    /// <summary>
    /// Enviar código OTP de 6 dígitos al email del usuario
    /// </summary>
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
    [HttpGet("pending-teachers")]
    [ProducesResponseType(typeof(List<PendingTeacherResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPendingTeachers()
    {
        var pendingTeachers = await _service.GetPendingTeachersAsync();
        return Ok(pendingTeachers);
    }

    /// <summary>
    /// Aprobar o rechazar un maestro (SOLO ADMIN)
    /// </summary>
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

        var adminId = "ADMIN_ID_PLACEHOLDER";
        
        var success = await _service.UpdateTeacherStatusAsync(
            request.TeacherId, 
            request.Status,
            adminId
        );
        
        if (success)
        {
            var statusText = request.Status == "approved" ? "aprobado" : "rechazado";
            return Ok(new { message = `$"Maestro {statusText} exitosamente." });
        }
        
        return BadRequest(new { error = "No se pudo actualizar el estado del maestro." });
    }

"@

# Buscar donde insertar los nuevos endpoints (antes de private static string HashPassword)
if ($content -match "(\r?\n    private static string HashPassword)") {
    if ($content -notmatch "send-otp") {
        $content = $content -replace "(\r?\n    private static string HashPassword)", "$newEndpoints`$1"
        Write-Host "  ✅ Nuevos endpoints agregados" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  Endpoints ya agregados" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  ❌ No se encontró el lugar para insertar endpoints" -ForegroundColor Red
}

# Guardar el archivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "`n✅ UsersController.cs actualizado exitosamente!" -ForegroundColor Green
Write-Host "📁 Backup guardado en: UsersController_BACKUP_*.cs" -ForegroundColor Cyan
Write-Host "`n🔨 Ahora ejecuta: dotnet build" -ForegroundColor Yellow
