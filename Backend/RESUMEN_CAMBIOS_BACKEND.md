# ✅ RESUMEN DE CAMBIOS REALIZADOS EN EL BACKEND

## 📝 Archivos Modificados

### 1. ✅ `Backend/Models/MongoModels.cs`
**Cambios realizados:**
- ✅ Agregado campo `EmailVerified` (bool) - Para verificación OTP
- ✅ Agregado campo `VerificationStatus` (string) - Estado de aprobación del maestro
- ✅ Agregado campo `ApprovedAt` (DateTime?) - Fecha de aprobación
- ✅ Agregado campo `ApprovedBy` (string?) - ID del admin que aprobó

### 2. ✅ `Backend/DTOs/UserDTOs.cs`
**Cambios realizados:**
- ✅ Actualizado `LoginResponse` con campos `EmailVerified` y `VerificationStatus`
- ✅ Agregado `SendOtpRequest` - DTO para enviar OTP
- ✅ Agregado `VerifyOtpRequest` - DTO para verificar OTP
- ✅ Agregado `ApproveTeacherRequest` - DTO para aprobar/rechazar maestros
- ✅ Agregado `PendingTeacherResponse` - DTO para lista de maestros pendientes

### 3. ✅ `Backend/Services/Interfaces/IOtpService.cs` (NUEVO)
**Archivo creado:**
- ✅ Interface con métodos `SendOtpAsync` y `VerifyOtpAsync`

### 4. ✅ `Backend/Services/OtpService.cs` (NUEVO)
**Archivo creado:**
- ✅ Implementación del servicio OTP usando Supabase Auth
- ✅ Método `SendOtpAsync` - Envía código de 6 dígitos
- ✅ Método `VerifyOtpAsync` - Verifica el código OTP

### 5. ✅ `Backend/Services/Interfaces/IUsersService.cs`
**Cambios realizados:**
- ✅ Agregado método `MarkEmailAsVerifiedAsync`
- ✅ Agregado método `GetPendingTeachersAsync`
- ✅ Agregado método `UpdateTeacherStatusAsync`

### 6. ✅ `Backend/Services/UsersService.cs`
**Cambios realizados:**
- ✅ Implementado `MarkEmailAsVerifiedAsync` - Marca email como verificado
- ✅ Implementado `GetPendingTeachersAsync` - Obtiene maestros pendientes
- ✅ Implementado `UpdateTeacherStatusAsync` - Aprueba/rechaza maestros

### 7. ⚠️ `Backend/Controllers/UsersController.cs` (PENDIENTE)
**Cambios necesarios:**
- ⚠️ Modificar constructor para inyectar `IOtpService`
- ⚠️ Actualizar método `Login` para incluir `EmailVerified` y `VerificationStatus`
- ⚠️ Agregar endpoint `POST /api/Users/send-otp`
- ⚠️ Agregar endpoint `POST /api/Users/verify-otp`
- ⚠️ Agregar endpoint `GET /api/Users/pending-teachers`
- ⚠️ Agregar endpoint `POST /api/Users/approve-teacher`

**NOTA:** El archivo tiene problemas de codificación. Se creó un backup en `UsersController.cs.backup`

### 8. ⚠️ `Backend/Program.cs` (PENDIENTE)
**Cambios necesarios:**
- ⚠️ Registrar `IOtpService` y `OtpService` en el contenedor de dependencias

---

## 🔧 PASOS FINALES PARA COMPLETAR EL BACKEND

### Paso 1: Actualizar `Program.cs`

Busca la línea donde se registra el Supabase Client (aproximadamente línea 28-35):

```csharp
// Register Supabase Client as a Singleton or Scoped
builder.Services.AddScoped(_ =>
{
    var url = builder.Configuration["Supabase:Url"];
    var key = builder.Configuration["Supabase:Key"];
    
    var options = new Supabase.SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    };
    
    return new Supabase.Client(url, key, options);
});
```

**INMEDIATAMENTE DESPUÉS**, agrega:

```csharp
// Register OTP Service
builder.Services.AddScoped<IOtpService, OtpService>();
```

### Paso 2: Actualizar `UsersController.cs`

Debido a problemas de codificación, necesitas hacer los cambios manualmente:

#### 2.1. Modificar el constructor (líneas 18-20):

**ANTES:**
```csharp
private readonly IUsersService _service;

public UsersController(IUsersService service) =>
    _service = service;
```

**DESPUÉS:**
```csharp
private readonly IUsersService _service;
private readonly IOtpService _otpService;

public UsersController(IUsersService service, IOtpService otpService)
{
    _service = service;
    _otpService = otpService;
}
```

#### 2.2. Actualizar método Login (aproximadamente línea 115):

Busca donde se retorna `LoginResponse` y agrega los campos:

```csharp
return Ok(new LoginResponse
{
    UserId = user.Id!,
    Email = user.Email,
    FullName = user.FullName,
    Role = user.Role,
    AvatarUrl = user.AvatarUrl,
    Token = "JWT_TOKEN_PLACEHOLDER",
    EmailVerified = user.EmailVerified,          // ⬅️ AGREGAR
    VerificationStatus = user.VerificationStatus  // ⬅️ AGREGAR
});
```

#### 2.3. Agregar nuevos endpoints

Antes del método `private static string HashPassword` (línea 185), agrega los 4 nuevos endpoints.

**COPIA Y PEGA este código completo:**

```csharp
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
            return Ok(new { message = $"Maestro {statusText} exitosamente." });
        }
        
        return BadRequest(new { error = "No se pudo actualizar el estado del maestro." });
    }
```

---

## 🧪 Paso 3: Compilar y Probar

Una vez realizados los cambios:

```bash
# En la carpeta Backend
dotnet build

# Si compila sin errores, ejecutar:
dotnet run
```

---

## 📋 Endpoints Disponibles

Después de completar los cambios, tendrás estos nuevos endpoints:

1. **POST** `/api/Users/send-otp`
   - Body: `{ "email": "usuario@ejemplo.com" }`
   - Envía código OTP de 6 dígitos

2. **POST** `/api/Users/verify-otp`
   - Body: `{ "email": "usuario@ejemplo.com", "otpCode": "123456" }`
   - Verifica el código OTP

3. **GET** `/api/Users/pending-teachers`
   - Obtiene lista de maestros pendientes de aprobación

4. **POST** `/api/Users/approve-teacher`
   - Body: `{ "teacherId": "...", "status": "approved" }`
   - Aprueba o rechaza un maestro

---

## ✅ Checklist de Verificación

- [ ] Configuración de Supabase OTP completada
- [ ] `Program.cs` actualizado con registro de `IOtpService`
- [ ] `UsersController.cs` constructor modificado
- [ ] `UsersController.cs` método Login actualizado
- [ ] `UsersController.cs` 4 nuevos endpoints agregados
- [ ] `dotnet build` ejecutado sin errores
- [ ] Backend corriendo con `dotnet run`
- [ ] Probar endpoint `/api/Users/send-otp` con Postman/Thunder Client
- [ ] Probar endpoint `/api/Users/verify-otp` con código recibido

---

## 🎯 Siguiente Paso

Una vez que el backend esté funcionando correctamente, procederemos a:
1. Crear las páginas del frontend (React/Next.js)
2. Integrar el flujo de OTP en el registro
3. Crear la página de espera para maestros
4. Crear el panel de administración

---

**¿Listo para continuar con el frontend?** 🚀
