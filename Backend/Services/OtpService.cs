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

    public OtpService(Supabase.Client supabaseClient, ILogger<OtpService> logger)
    {
        _supabaseClient = supabaseClient;
        _logger = logger;
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
}
