using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Backend.Services;

public class MobileAuthService : IMobileAuthService
{
    private readonly IMongoCollection<EvaluationDeviceRecord> _deviceRecords;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;

    public MobileAuthService(
        IOptions<QuestEvalDatabaseSettings> settings,
        IConfiguration config)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _deviceRecords = database.GetCollection<EvaluationDeviceRecord>(settings.Value.EvaluationDeviceRecordsCollectionName);

        _jwtSecret = config["Jwt:SecretKey"] ?? throw new ArgumentNullException("Jwt:SecretKey");
        _jwtIssuer = config["Jwt:Issuer"] ?? "QuestEvalBackend";
        _jwtAudience = config["Jwt:Audience"] ?? "QuestEvalFrontend";
        
        // Ensure index for unique device-project evaluation
        EnsureIndexes();
    }

    private void EnsureIndexes()
    {
        var indexKeys = Builders<EvaluationDeviceRecord>.IndexKeys
            .Ascending(r => r.ProjectId)
            .Ascending(r => r.DeviceIdHash);
            
        var indexOptions = new CreateIndexOptions { Unique = true, Name = "idx_unique_device_evaluation" };
        var indexModel = new CreateIndexModel<EvaluationDeviceRecord>(indexKeys, indexOptions);
        
        try
        {
            _deviceRecords.Indexes.CreateOne(indexModel);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Warning] No se pudo crear el índice único IMobileAuthService: {ex.Message}");
        }
    }

    private string HashDeviceId(string plainDeviceId)
    {
        // Encripta el Hardware ID para no guardarlo como texto plano.
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(plainDeviceId);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    public string GenerateQRToken(string projectId, int expiresInMinutes = 120)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        
        var claims = new List<Claim>
        {
            new Claim("projectId", projectId),
            new Claim("intent", "mobile_evaluation") // Para distinguir de tokens de login
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes),
            Issuer = _jwtIssuer,
            Audience = _jwtAudience,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public bool ValidateQRToken(string qrToken, out string? projectId, out string? errorMessage)
    {
        projectId = null;
        errorMessage = null;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));

        try
        {
            tokenHandler.ValidateToken(qrToken, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = _jwtIssuer,
                ValidateAudience = true,
                ValidAudience = _jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero // QR expirado inmediatamente si pasa su tiempo
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            
            var intent = jwtToken.Claims.FirstOrDefault(x => x.Type == "intent")?.Value;
            if (intent != "mobile_evaluation")
            {
                errorMessage = "Token no autorizado para evaluación móvil.";
                return false;
            }

            projectId = jwtToken.Claims.FirstOrDefault(x => x.Type == "projectId")?.Value;
            
            if (string.IsNullOrEmpty(projectId))
            {
                errorMessage = "El token no contiene un proyecto válido.";
                return false;
            }

            return true;
        }
        catch (SecurityTokenExpiredException)
        {
            errorMessage = "El código QR ha expirado. Pide al organizador que genere uno nuevo.";
            return false;
        }
        catch (Exception)
        {
            errorMessage = "Código QR inválido o alterado.";
            return false;
        }
    }

    public async Task<bool> HasDeviceEvaluatedProjectAsync(string projectId, string deviceId)
    {
        var hashedId = HashDeviceId(deviceId);
        var existingRecord = await _deviceRecords.Find(r => r.ProjectId == projectId && r.DeviceIdHash == hashedId).FirstOrDefaultAsync();
        return existingRecord != null;
    }

    public async Task RegisterDeviceEvaluationAsync(string projectId, string deviceId, string evaluationId)
    {
        var record = new EvaluationDeviceRecord
        {
            ProjectId = projectId,
            DeviceIdHash = HashDeviceId(deviceId),
            EvaluationId = evaluationId,
            EvaluatedAt = DateTime.UtcNow
        };

        // Si ocurre DuplicateKeyException, fallará automáticamente.
        await _deviceRecords.InsertOneAsync(record);
    }
}
