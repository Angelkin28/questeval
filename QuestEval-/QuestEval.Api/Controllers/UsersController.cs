using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;
using System.Security.Cryptography;
using System.Text;

namespace QuestEval.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly QuestEvalService _service;

    public UsersController(QuestEvalService service) =>
        _service = service;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        // Check if user already exists
        var existingUser = await _service.GetUserByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "El email ya está registrado" });
        }

        // Hash password
        var passwordHash = HashPassword(request.Password);

        // Create new user
        var newUser = new User
        {
            Email = request.Email,
            Enrollment = request.Enrollment,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _service.CreateUserAsync(newUser);

        var response = new UserResponse
        {
            Id = newUser.Id!,
            Email = newUser.Email,
            Enrollment = newUser.Enrollment,
            FullName = newUser.FullName,
            Role = newUser.Role,
            AvatarUrl = newUser.AvatarUrl,
            CreatedAt = newUser.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = newUser.Id }, response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _service.GetUserByEmailAsync(request.Email);
        
        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Email o contraseña incorrectos" });
        }

        var response = new LoginResponse
        {
            UserId = user.Id!,
            Email = user.Email,
            Enrollment = user.Enrollment,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            Token = "dummy-token" // TODO: Implement JWT token generation
        };

        return Ok(response);
    }

    [HttpGet]
    public async Task<List<UserResponse>> Get()
    {
        var users = await _service.GetUsersAsync();
        return users.Select(u => new UserResponse
        {
            Id = u.Id!,
            Email = u.Email,
            Enrollment = u.Enrollment,
            FullName = u.FullName,
            Role = u.Role,
            AvatarUrl = u.AvatarUrl,
            CreatedAt = u.CreatedAt
        }).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetById(string id)
    {
        var user = await _service.GetUserByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var response = new UserResponse
        {
            Id = user.Id!,
            Email = user.Email,
            Enrollment = user.Enrollment,
            FullName = user.FullName,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        };

        return response;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _service.GetUserByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        await _service.RemoveUserAsync(id);

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
