using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Backend.Models;
using Backend.Services.Interfaces;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Controllers;

/// <summary>
/// Gestiona user authentication and registration
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUsersService _service;
    private readonly IOtpService _otpService;
    private readonly IConfiguration _configuration;
    private readonly IActivityLogService _logService;

    public UsersController(IUsersService service, IOtpService otpService, IConfiguration configuration, IActivityLogService logService)
    {
        _service = service;
        _otpService = otpService;
        _configuration = configuration;
        _logService = logService;
    }

    /// <summary>
    /// Obtener todos los users
    /// </summary>
    /// <returns>Lista de todos los usuarios</returns>
    /// <response code="200">Retorna la lista de users</response>
    [HttpGet]
    public async Task<List<UserResponse>> Get()
    {
        var users = await _service.GetAllAsync();
        return users.Select(u => new UserResponse
        {
            Id = u.Id!,
            UserId = u.UserId,
            Email = u.Email,
            FullName = u.FullName,
            Role = u.Role,
            AvatarUrl = u.AvatarUrl,
            CreatedAt = u.CreatedAt,
            EmailVerified = u.EmailVerified,
            VerificationStatus = u.VerificationStatus
        }).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetById(string id)
    {
        // Buscar primero por MongoDB ObjectId, luego por UserId incremental
        var user = await _service.GetByIdAsync(id)
                ?? await _service.GetByUserIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var response = new UserResponse
        {
            Id = user.Id!,
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt,
            EmailVerified = user.EmailVerified,
            VerificationStatus = user.VerificationStatus
        };

        return response;
    }

    /// <summary>
    /// Registrar un nuevo usuario
    /// </summary>
    /// <param name="request">User registration details</param>
    /// <returns>The created user</returns>
    /// <response code="201">Retorna el newly created user</response>
    /// <response code="400">Si la solicitud es inv�lida or email already exists</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Check if user already exists
        var existingUser = await _service.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Title = "User Already Exists",
                Status = StatusCodes.Status400BadRequest,
                Detail = $"A user with email '{request.Email}' already exists."
            });
        }

        // Validar dominio de correo institucional (excepto cuentas de test)
        bool isTestAccount = request.Email.ToLower().EndsWith("testquesteval@gmail.com");
        if (!isTestAccount)
        {
            var emailDomain = request.Email.Split('@').LastOrDefault()?.ToLower();
            if (request.Role == "Alumno" && emailDomain != "alumno.utmetropolitana.edu.mx")
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Correo no institucional",
                    Status = StatusCodes.Status400BadRequest,
                    Detail = "Los alumnos deben usar su correo institucional (@alumno.utmetropolitana.edu.mx)."
                });
            }
            if (request.Role == "Profesor" && emailDomain != "utmetropolitana.edu.mx")
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Correo no institucional",
                    Status = StatusCodes.Status400BadRequest,
                    Detail = "Los profesores deben usar su correo institucional (@utmetropolitana.edu.mx)."
                });
            }
        }

        // Hash password
        var passwordHash = HashPassword(request.Password);

        // Crear nuevo user
        var newUser = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Role = request.Role,
            EmailVerified = isTestAccount,
            VerificationStatus = isTestAccount ? "approved" : "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newUser);
        await _logService.LogAsync("user_registered", $"Nuevo usuario registrado: {newUser.FullName} ({newUser.Email}) — Rol: {newUser.Role}", "info", targetId: newUser.Id, targetName: newUser.FullName);

        var response = new UserResponse
        {
            Id = newUser.Id!,
            UserId = newUser.UserId,
            Email = newUser.Email,
            FullName = newUser.FullName,
            Role = newUser.Role,
            AvatarUrl = newUser.AvatarUrl,
            CreatedAt = newUser.CreatedAt,
            EmailVerified = newUser.EmailVerified,
            VerificationStatus = newUser.VerificationStatus
        };

        return CreatedAtAction(nameof(GetById), new { id = newUser.Id }, response);
    }

    /// <summary>
    /// Iniciar sesi�n con email y contrase�a
    /// </summary>
    /// <param name="request">Credenciales de inicio de sesi�n</param>
    /// <returns>Informaci�n del usuario y token de autenticaci�n</returns>
    /// <response code="200">Retorna informaci�n del usuario y token</response>
    /// <response code="401">Si las credenciales son inv�lidas</response>
    /// <response code="400">Si la solicitud es inv�lida</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _service.GetByEmailAsync(request.Email);
        
        // Caso 1: El correo no existe en la base de datos
        if (user == null)
        {
            return NotFound(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                Title = "Usuario no encontrado",
                Status = StatusCodes.Status404NotFound,
                Detail = "No existe ninguna cuenta registrada con ese correo electrónico."
            });
        }

        // Caso 2: Contraseña incorrecta
        if (!VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.2",
                Title = "Contraseña incorrecta",
                Status = StatusCodes.Status401Unauthorized,
                Detail = "La contraseña ingresada es incorrecta."
            });
        }

        // Todos los roles (Alumno, Profesor, Admin) acceden directamente con sus credenciales.
        // No se requiere aprobación previa para ningún rol.
        var response = new LoginResponse
        {
            Id = user.Id!,
            UserId = user.UserId,   // Matrícula incremental
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            EmailVerified = user.EmailVerified,
            VerificationStatus = user.VerificationStatus,
            Token = GenerateJwtToken(user)
        };

        return Ok(response);
    }

    /// <summary>
    /// Acceso para invitados (sin contraseña, solo nombre)
    /// </summary>
    /// <param name="request">Nombre del invitado</param>
    /// <returns>Información del usuario invitado y token</returns>
    /// <response code="200">Retorna información del invitado y token</response>
    /// <response code="400">Si la solicitud es inválida</response>
    [HttpPost("guest-access")]
    [ProducesResponseType(typeof(GuestAccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GuestAccess(GuestAccessRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Crear email único para invitado basado en GUID
        var guestEmail = $"guest-{Guid.NewGuid().ToString().Substring(0, 8)}@quest.local";

        // Crear contraseña aleatoria
        var randomPassword = Guid.NewGuid().ToString().Substring(0, 12);
        var passwordHash = HashPassword(randomPassword);

        // Crear nuevo usuario como Invitado
        var newUser = new User
        {
            Email = guestEmail,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Role = "Invitado",
            EmailVerified = true,
            VerificationStatus = "approved",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newUser);

        var response = new GuestAccessResponse
        {
            Id = newUser.Id!,
            FullName = newUser.FullName,
            Role = newUser.Role,
            Token = GenerateJwtToken(newUser),
            UserId = newUser.UserId
        };

        return Ok(response);
    }

    /// <summary>
    /// Envía un código OTP al email del usuario para verificar su registro
    /// </summary>
    [HttpPost("send-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var sent = await _otpService.SendOtpAsync(request.Email);

        if (!sent)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Error al enviar OTP",
                Status = StatusCodes.Status400BadRequest,
                Detail = "No se pudo enviar el código de verificación. Intenta más tarde."
            });
        }

        return Ok(new { message = "Código enviado exitosamente. Revisa tu correo." });
    }

    /// <summary>
    /// Verifica el código OTP y marca el email del usuario como verificado
    /// </summary>
    [HttpPost("verify-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode);

        if (!isValid)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Código inválido",
                Status = StatusCodes.Status400BadRequest,
                Detail = "El código ingresado es incorrecto o ha expirado."
            });
        }

        // Marcar el email como verificado en MongoDB
        var user = await _service.GetByEmailAsync(request.Email);
        if (user != null)
        {
            user.EmailVerified = true;
            user.VerificationStatus = "approved"; // Todos los roles se aprueban directamente
            await _service.UpdateAsync(user.Id!, user);
        }

        return Ok(new { message = "Email verificado exitosamente.", verified = true });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _service.GetByIdAsync(id) ?? await _service.GetByUserIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        // 1. Eliminar también de Supabase Auth
        await _otpService.DeleteUserByEmailAsync(user.Email);

        // 2. Eliminar de MongoDB local (usar el Id de Mongo real)
        await _service.DeleteAsync(user.Id!);

        // 3. Registrar en el log
        var adminId = User.FindFirst("userId")?.Value;
        var adminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Admin";
        await _logService.LogAsync("user_deleted", $"Usuario eliminado: {user.FullName} ({user.Email}) \u2014 Rol: {user.Role}", "delete", adminId, adminName, id, user.FullName);

        return NoContent();
    }

    // Simple password hashing (use BCrypt or similar in production)
    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        var passwordHash = HashPassword(password);
        return passwordHash == hash;
    }

    /// <summary>
    /// Genera un token JWT firmado con los datos del usuario
    /// </summary>
    private string GenerateJwtToken(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"]!;
        var issuer = _configuration["Jwt:Issuer"] ?? "QuestEvalBackend";
        var audience = _configuration["Jwt:Audience"] ?? "QuestEvalFrontend";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("userId", user.Id!),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("enrollmentId", user.UserId ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
