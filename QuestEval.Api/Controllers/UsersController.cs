using Microsoft.AspNetCore.Mvc;
using QuestEval.Shared.Models;
using QuestEval.Api.Services;
using System.Security.Cryptography;
using System.Text;

namespace QuestEval.Api.Controllers;

/// <summary>
/// Manages user authentication and registration
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly QuestEvalService _service;

    public UsersController(QuestEvalService service) =>
        _service = service;

    /// <summary>
    /// Register a new user
    /// </summary>
    /// <param name="request">User registration details</param>
    /// <returns>The created user</returns>
    /// <response code="201">Returns the newly created user</response>
    /// <response code="400">If the request is invalid or email already exists</response>
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
        var existingUser = await _service.GetUserByEmailAsync(request.Email);
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

        // Create new user
        var newUser = new User
        {
            Email = request.Email,
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
            FullName = newUser.FullName,
            Role = newUser.Role,
            AvatarUrl = newUser.AvatarUrl,
            CreatedAt = newUser.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = newUser.Id }, response);
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>User information and authentication token</returns>
    /// <response code="200">Returns user information and token</response>
    /// <response code="401">If credentials are invalid</response>
    /// <response code="400">If the request is invalid</response>
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

        var user = await _service.GetUserByEmailAsync(request.Email);
        
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
    /// Get all users
    /// </summary>
    /// <returns>List of all users</returns>
    /// <response code="200">Returns the list of users</response>
    [HttpGet]
    public async Task<List<UserResponse>> Get()
    {
        var users = await _service.GetUsersAsync();
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
        var user = await _service.GetUserByIdAsync(id);

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
