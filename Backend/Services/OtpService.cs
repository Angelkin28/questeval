using Backend.Services.Interfaces;
using Supabase.Gotrue;
using Supabase.Gotrue.Interfaces;

namespace Backend.Services;

/// <summary>
/// Servicio para manejar OTP (One-Time Password) usando Supabase Auth
/// </summary>
public class OtpService : IOtpService
{
    private readonly Supabase.Client _supabaseClient;
    private readonly ILogger<OtpService> _logger;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public OtpService(Supabase.Client supabaseClient, ILogger<OtpService> logger, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _supabaseClient = supabaseClient;
        _logger = logger;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Envía un código OTP usando el flujo de SignUp de Supabase
    /// para disparar la plantilla de correo "Confirm Sign Up".
    /// </summary>
    public async Task<bool> SendOtpAsync(string email)
    {
        try
        {
            _logger.LogInformation($"Intentando enviar OTP de registro a {email}...");
            
            var randomPassword = Guid.NewGuid().ToString() + "A1!";

            try 
            {
                var session = await _supabaseClient.Auth.SignUp(email, randomPassword);
                
                if (session?.User != null)
                {
                    _logger.LogInformation($"✅ Solicitud de registro inicial enviada a {email}");
                    return true;
                }
            }
            catch (Exception ex) when (ex.Message.Contains("already_registered") || ex.Message.Contains("exists") || ex.Message.Contains("400"))
            {
                _logger.LogWarning($"Usuario {email} ya existe en Supabase Auth. No se puede registrar de nuevo automáticamente. Detalles: {ex.Message}");
                return true;
            }

            return true;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("429") || ex.Message.Contains("rate_limit"))
            {
                _logger.LogError($"🛑 LÍMITE DE VELOCIDAD EXCEDIDO: Supabase ha bloqueado el envío de correos temporalmente. Por favor, espera una hora o usa otro email.");
            }
            else
            {
                _logger.LogError($"❌ Error al enviar OTP a {email}: {ex.Message}");
            }
            return false;
        }
    }

    /// <summary>
    /// Verifica el código OTP (Token de confirmación de registro)
    /// </summary>
    public async Task<bool> VerifyOtpAsync(string email, string otpCode)
    {
        try
        {
            // Al usar SignUp, el tipo de verificación es Signup
            var session = await _supabaseClient.Auth.VerifyOTP(
                email, 
                otpCode, 
                Supabase.Gotrue.Constants.EmailOtpType.Signup
            );

            if (session?.User != null)
            {
                _logger.LogInformation($"✅ OTP verificado exitosamente para {email}");
                return true;
            }
            
            // Si falla, intentamos como MagicLink por si acaso se envió por el otro método antes
             try 
             {
                var sessionRecovery = await _supabaseClient.Auth.VerifyOTP(
                    email, 
                    otpCode, 
                    Supabase.Gotrue.Constants.EmailOtpType.Email
                );
                if (sessionRecovery?.User != null) return true;
             } catch {}
             
             try 
             {
                var sessionMagic = await _supabaseClient.Auth.VerifyOTP(
                    email, 
                    otpCode, 
                    Supabase.Gotrue.Constants.EmailOtpType.MagicLink
                );
                if (sessionMagic?.User != null) return true;
             } catch {}

            _logger.LogWarning($"⚠️ OTP inválido para {email}");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error al verificar OTP para {email}: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Elimina a un usuario completamente de Supabase Auth usando su email
    /// </summary>
    public async Task<bool> DeleteUserByEmailAsync(string email)
    {
        try
        {
            var url = _config["Supabase:Url"];
            var key = _config["Supabase:Key"];
            
            if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key)) return false;

            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("apikey", key);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {key}");

            // 1. Obtener la lista de usuarios
            var getUrl = $"{url}/auth/v1/admin/users";
            var response = await client.GetAsync(getUrl);
            
            if (!response.IsSuccessStatusCode) return false;

            var json = await response.Content.ReadAsStringAsync();
            var doc = System.Text.Json.JsonDocument.Parse(json);
            
            string? targetId = null;
            
            // Supabase admin listing devuelve a veces un array, y a veces un objeto con propiedad "users"
            System.Text.Json.JsonElement usersArray = default;
            
            if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                usersArray = doc.RootElement;
            }
            else if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object && doc.RootElement.TryGetProperty("users", out var uArr))
            {
                usersArray = uArr;
            }

            if (usersArray.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var userItem in usersArray.EnumerateArray())
                {
                    if (userItem.TryGetProperty("email", out var emailProp) && emailProp.GetString() == email)
                    {
                        if (userItem.TryGetProperty("id", out var idProp))
                        {
                            targetId = idProp.GetString();
                        }
                        break;
                    }
                }
            }

            // 2. Eliminar el usuario por su UUID si se encontró
            if (!string.IsNullOrEmpty(targetId))
            {
                var deleteUrl = $"{url}/auth/v1/admin/users/{targetId}";
                var delResult = await client.DeleteAsync(deleteUrl);
                
                if (delResult.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"✅ Usuario {email} borrado de Supabase Auth.");
                    return true;
                }
            }
            
            _logger.LogInformation($"⚠️ El usuario {email} no existía o no pudo ser borrado en Supabase Auth.");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error al borrar a {email} de Supabase Auth: {ex.Message}");
            return false;
        }
    }
}
