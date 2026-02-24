using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUsersService _service;
    private readonly IOtpService _otpService;
    private readonly IConfiguration _configuration;

    public UsersController(IUsersService service, IOtpService otpService, IConfiguration configuration)
    {
        _service = service;
        _otpService = otpService;
        _configuration = configuration;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

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

        var passwordHash = HashPassword(request.Password);

        var newUser = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Role = request.Role,
            UserId = request.UserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            EmailVerified = false,
            VerificationStatus = request.Role == "Profesor" ? "pending" : "approved"
        };

        await _service.CreateAsync(newUser);

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
        if (user == null)
        {
            return Unauthorized(new { error = "Credenciales inválidas." });
        }

        if (!VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Credenciales inválidas." });
        }


        var token = GenerateJwtToken(user);

        return Ok(new LoginResponse
        {
            Id = user.Id!,
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            Token = token,
            EmailVerified = user.EmailVerified,
            VerificationStatus = user.VerificationStatus
        });
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<UserResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var users = await _service.GetAllAsync();
        var response = users.Select(u => new UserResponse
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

        return Ok(response);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _service.GetByIdAsync(id);
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

        return Ok(response);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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

    [HttpGet("pending-teachers")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<PendingTeacherResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPendingTeachers()
    {
        var pendingTeachers = await _service.GetPendingTeachersAsync();
        return Ok(pendingTeachers);
    }

    [HttpPost("approve-teacher")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ApproveTeacher([FromBody] ApproveTeacherRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized("Invalid token claims");
        }
        
        var success = await _service.UpdateTeacherStatusAsync(
            request.UserId, 
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

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id!),
            new Claim("userId", user.UserId ?? ""),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role), // Roles: "Alumno", "Profesor", "Admin"
            new Claim("verificationStatus", user.VerificationStatus ?? "pending")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(7), // Token válido por 7 días
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        var passwordHash = HashPassword(password);
        return passwordHash == hash;
    }
}
