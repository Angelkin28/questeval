using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;

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

    public UsersController(IUsersService service) =>
        _service = service;

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
            Email = u.Email,
            FullName = u.FullName,
            Role = u.Role,
            AvatarUrl = u.AvatarUrl,
            CreatedAt = u.CreatedAt
        }).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetById(string id)
    {
        var user = await _service.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var response = new UserResponse
        {
            Id = user.Id!,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
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

        // Hash password
        var passwordHash = HashPassword(request.Password);

        // Crear nuevo user
        var newUser = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(newUser);

        var response = new UserResponse
        {
            Id = newUser.Id!,
            Email = newUser.Email,
            FullName = newUser.FullName,
            Role = newUser.Role,
            AvatarUrl = newUser.AvatarUrl,
            CreatedAt = newUser.CreatedAt
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
        
        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.2",
                Title = "Invalid Credentials",
                Status = StatusCodes.Status401Unauthorized,
                Detail = "Email or password is incorrect."
            });
        }

        var response = new LoginResponse
        {
            UserId = user.Id!,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            Token = "dummy-token" // TODO: Implement JWT token generation
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
            Token = "dummy-token", // TODO: Implement JWT token generation
            UserId = newUser.UserId
        };

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _service.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        await _service.DeleteAsync(id);

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
}
