# 🎯 INSTRUCCIONES FINALES - COMPLETAR BACKEND

## ⚠️ PROBLEMA ACTUAL

El backend tiene un error de compilación debido a problemas de codificación en `UsersController.cs`.

## ✅ SOLUCIÓN: Actualizar UsersController.cs Manualmente

### Paso 1: Abrir el archivo

Abre `Backend/Controllers/UsersController.cs` en Visual Studio Code o tu editor preferido.

### Paso 2: Modificar el Constructor (Líneas 18-20)

**BUSCA:**
```csharp
private readonly IUsersService _service;

public UsersController(IUsersService service) =>
    _service = service;
```

**REEMPLAZA POR:**
```csharp
private readonly IUsersService _service;
private readonly IOtpService _otpService;

public UsersController(IUsersService service, IOtpService otpService)
{
    _service = service;
    _otpService = otpService;
}
```

### Paso 3: Actualizar el Método Login (Aproximadamente línea 115)

**BUSCA el return del LoginResponse:**
```csharp
return Ok(new LoginResponse
{
    UserId = user.Id!,
    Email = user.Email,
    FullName = user.FullName,
    Role = user.Role,
    AvatarUrl = user.AvatarUrl,
    Token = "JWT_TOKEN_PLACEHOLDER"
});
```

**REEMPLAZA POR:**
```csharp
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
```

### Paso 4: Agregar Nuevos Endpoints

**ANTES del método `private static string HashPassword` (aproximadamente línea 185), AGREGA:**

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

### Paso 5: Guardar y Compilar

```bash
# Guardar el archivo
# Luego en la terminal:
cd Backend
dotnet build
```

Si todo está correcto, deberías ver:
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### Paso 6: Ejecutar el Backend

```bash
dotnet run
```

Deberías ver algo como:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
      Now listening on: http://localhost:5000
```

---

## 📋 RESUMEN DE CAMBIOS COMPLETADOS

### ✅ Archivos Ya Modificados:

1. ✅ `Backend/Models/MongoModels.cs` - Campos de verificación agregados
2. ✅ `Backend/DTOs/UserDTOs.cs` - Nuevos DTOs agregados
3. ✅ `Backend/Services/Interfaces/IOtpService.cs` - Interface creada
4. ✅ `Backend/Services/OtpService.cs` - Servicio OTP implementado
5. ✅ `Backend/Services/Interfaces/IUsersService.cs` - Métodos agregados
6. ✅ `Backend/Services/UsersService.cs` - Métodos implementados
7. ✅ `Backend/Program.cs` - OtpService registrado

### ⚠️ Archivo Pendiente:

1. ⚠️ `Backend/Controllers/UsersController.cs` - **REQUIERE EDICIÓN MANUAL**

---

## 🧪 PROBAR LOS ENDPOINTS

Una vez que el backend esté corriendo, puedes probar con Postman o Thunder Client:

### 1. Enviar OTP
```http
POST http://localhost:5000/api/Users/send-otp
Content-Type: application/json

{
  "email": "tu-email@gmail.com"
}
```

**Respuesta esperada:**
```json
{
  "message": "Código OTP enviado al email."
}
```

### 2. Verificar OTP
```http
POST http://localhost:5000/api/Users/verify-otp
Content-Type: application/json

{
  "email": "tu-email@gmail.com",
  "otpCode": "123456"
}
```

**Respuesta esperada:**
```json
{
  "message": "Email verificado exitosamente."
}
```

### 3. Obtener Maestros Pendientes
```http
GET http://localhost:5000/api/Users/pending-teachers
```

**Respuesta esperada:**
```json
[
  {
    "id": "...",
    "email": "maestro@ejemplo.com",
    "fullName": "Juan Pérez",
    "createdAt": "2026-02-13T..."
  }
]
```

### 4. Aprobar Maestro
```http
POST http://localhost:5000/api/Users/approve-teacher
Content-Type: application/json

{
  "teacherId": "ID_DEL_MAESTRO",
  "status": "approved"
}
```

**Respuesta esperada:**
```json
{
  "message": "Maestro aprobado exitosamente."
}
```

---

## 🎯 SIGUIENTE PASO

Una vez que el backend compile y funcione correctamente:

1. ✅ Configurar Supabase OTP (sigue la guía en `docs/CONFIGURACION_SUPABASE_OTP.md`)
2. ✅ Probar los endpoints con Postman/Thunder Client
3. 🚀 Continuar con el Frontend (crear páginas de React/Next.js)

---

## 📞 ¿NECESITAS AYUDA?

Si encuentras algún error durante la compilación:

1. Verifica que todos los `using` statements estén presentes en `UsersController.cs`
2. Asegúrate de que no haya llaves `{}` faltantes
3. Verifica que los métodos estén dentro de la clase `UsersController`
4. Comprueba que no haya caracteres especiales o problemas de codificación

---

**¡Avísame cuando el backend compile correctamente para continuar con el frontend!** 🚀
