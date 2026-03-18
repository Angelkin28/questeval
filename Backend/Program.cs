using Backend.Models;
using Backend.Services;
using Backend.Services.Interfaces;
using Backend.Middlewares;
using DotNetEnv;
using System.Security.Claims;

// Cargar variables de entorno desde .env (sobreescribe appsettings.json)
// El separador __ mapea automáticamente a secciones anidadas:
// QuestEvalDatabase__ConnectionString → QuestEvalDatabase:ConnectionString
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Límite de tamaño de request: 8 GB (para subida de archivos grandes)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 8L * 1024 * 1024 * 1024; // 8 GB
});
// ==================== CONFIGURACIÓN ====================
// Configurar ajustes de base de datos desde appsettings.json
// Esto vincula la sección "QuestEvalDatabase" al modelo QuestEvalDatabaseSettings
builder.Services.Configure<QuestEvalDatabaseSettings>(
    builder.Configuration.GetSection("QuestEvalDatabase"));

// ==================== INYECCIÓN DE DEPENDENCIAS - SERVICIOS ====================
// Registrar todos los servicios con tiempo de vida Scoped
// Scoped = una instancia por solicitud HTTP (recomendado para operaciones de BD)
// Cada servicio maneja operaciones para una entidad específica
builder.Services.AddScoped<ICriteriaService, CriteriaService>();      // Gestionar criterios de evaluación
builder.Services.AddScoped<IGroupsService, GroupsService>();          // Gestionar grupos de estudiantes
builder.Services.AddScoped<IUsersService, UsersService>();            // Gestionar usuarios (estudiantes, profesores, admins)
builder.Services.AddScoped<IProjectsService, ProjectsService>();      // Gestionar proyectos estudiantiles
builder.Services.AddScoped<IEvaluationsService, EvaluationsService>(); // Gestionar evaluaciones de proyectos
builder.Services.AddScoped<IMembershipsService, MembershipsService>(); // Gestionar relaciones usuario-grupo
builder.Services.AddScoped<IFeedbackService, FeedbackService>();      // Gestionar retroalimentación de evaluaciones
builder.Services.AddScoped<IOtpService, OtpService>();                // Gestionar OTP y autenticación de Supabase
builder.Services.AddScoped<IActivityLogService, ActivityLogService>(); // Gestionar logs de actividad del sistema
builder.Services.AddScoped<IMobileAuthService, MobileAuthService>();   // Gestionar tokens y huella digital móvil
builder.Services.AddScoped<IStorageService, StorageService>();        // Gestionar subida de archivos a Supabase Storage

// ==================== MANEJO DE EXCEPCIONES ====================
// GlobalExceptionHandler captura excepciones no manejadas y retorna RFC 7807 ProblemDetails
// Esto evita errores 500 exponiendo stack traces a los clientes
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails(); // Habilitar respuestas ProblemDetails

// ==================== CONFIGURACIÓN HTTP & SUPABASE ====================
builder.Services.AddHttpClient();

// Inicializar el cliente de Supabase como Singleton para que IOtpService pueda consumirlo
builder.Services.AddSingleton<Supabase.Client>(provider => 
{
    var config = provider.GetRequiredService<IConfiguration>();
    var url = config["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url");
    var key = config["Supabase:Key"] ?? throw new ArgumentNullException("Supabase:Key");
    
    var options = new Supabase.SupabaseOptions
    {
        AutoConnectRealtime = false,
        AutoRefreshToken = false
    };
    
    var client = new Supabase.Client(url, key, options);
    client.InitializeAsync().GetAwaiter().GetResult();
    return client;
});

// ==================== CONFIGURACIÓN CORS ====================
// Configurar Cross-Origin Resource Sharing para acceso del frontend
// Permite solicitudes desde servidores de desarrollo del frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // En desarrollo, permitimos cualquier origen para facilitar las pruebas móviles/web
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            // Leer orígenes permitidos desde variable de entorno (separados por coma)
            // o usar los valores por defecto si no está definida
            var allowedOriginsEnv = builder.Configuration["CORS_ALLOWED_ORIGINS"];
            var allowedOrigins = string.IsNullOrWhiteSpace(allowedOriginsEnv)
                ? new[] { "https://questeval.vercel.app" }
                : allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

// ==================== CONFIGURACIÓN DE CONTROLLERS ====================
builder.Services.AddControllers(options =>
    {
        options.Filters.Add(new Microsoft.AspNetCore.Mvc.RequestFormLimitsAttribute
        {
            MultipartBodyLengthLimit = 8L * 1024 * 1024 * 1024 // 8 GB
        });
        options.Filters.Add(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(8L * 1024 * 1024 * 1024));
    })
    // Usar camelCase en las respuestas JSON para coincidir con las interfaces TypeScript del frontend
    // Ejemplo: "Role" en C# → "role" en JSON, "UserId" → "userId"
    .AddJsonOptions(options => options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase)
    .ConfigureApiBehaviorOptions(options =>
    {
        // Habilitar validación automática de modelo basada en DataAnnotations
        // Los controllers retornarán 400 BadRequest automáticamente para datos inválidos
        options.SuppressModelStateInvalidFilter = false;
    });

// ==================== CONFIGURACIÓN DE AUTENTICACIÓN JWT ====================
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? throw new ArgumentNullException("Jwt:SecretKey no configurada en .env");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "QuestEvalBackend";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "QuestEvalFrontend";
var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecretKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = key,
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

// ==================== CONFIGURACIÓN SWAGGER/OpenAPI ====================
// Swagger proporciona documentación interactiva de la API en /swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Configurar metadatos de la API mostrados en Swagger UI
    options.SwaggerDoc("v1", new()
    {
        Title = "QuestEval API",
        Version = "v1",
        Description = "API para gestionar evaluaciones de proyectos estudiantiles, grupos y retroalimentación",
        Contact = new()
        {
            Name = "QuestEval Team"
        }
    });

    // Ordenar endpoints por método HTTP (GET, POST, PUT, DELETE)
    // Esto asegura que los endpoints aparezcan en el orden correcto en Swagger UI
    options.OrderActionsBy((apiDesc) =>
    {
        // Obtener el método HTTP real (GET, POST, PUT, DELETE, etc.)
        var httpMethod = apiDesc.HttpMethod ?? "OTHER";
        
        // Asignar orden basado en método HTTP
        var methodOrder = httpMethod.ToUpper() switch
        {
            "GET" => "0",
            "POST" => "1", 
            "PUT" => "2",
            "DELETE" => "3",
            _ => "4"
        };
        
        // Obtener la ruta para ordenamiento secundario dentro del mismo método
        var path = apiDesc.RelativePath ?? "";
        
        // Retornar orden: primero por método HTTP, luego por ruta
        return $"{methodOrder}_{path}";
    });

    // Incluir comentarios de documentación XML en Swagger UI
    // Esto muestra los comentarios /// summary en la documentación interactiva
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Incluir comentarios XML de models/DTOs (previamente en proyecto Shared)
    var sharedXmlFile = "QuestEval.Shared.xml";
    var sharedXmlPath = Path.Combine(AppContext.BaseDirectory, sharedXmlFile);
    if (File.Exists(sharedXmlPath))
    {
        options.IncludeXmlComments(sharedXmlPath);
    }

    // Agregar soporte para JWT Bearer en Swagger UI (botón "Authorize")
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Description = "Ingresa tu token JWT. Ejemplo: eyJhbGci..."
    });

    options.AddSecurityRequirement(document => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document),
            new List<string>()
        }
    });
});

// ==================== CONSTRUIR APLICACIÓN ====================
var app = builder.Build();

// ==================== PIPELINE DE MIDDLEWARE ====================
// El middleware se ejecuta en el orden que se agrega (de arriba hacia abajo)

// 1. Exception Handler - Capturar cualquier excepción no manejada
//    Debe ser primero para capturar errores de todos los demás middleware
app.UseExceptionHandler();

// 2. Swagger UI - Solo en entorno de desarrollo
//    Proporciona documentación interactiva de la API en /swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();       // Genera JSON de OpenAPI en /swagger/v1/swagger.json
    app.UseSwaggerUI();     // Proporciona UI en /swagger/index.html
}

// 3. Redirección HTTPS - Redirigir solicitudes HTTP a HTTPS
app.UseHttpsRedirection();

// 4. CORS - Habilitar solicitudes cross-origin desde el frontend
//    Debe estar antes de UseAuthorization
app.UseCors("AllowFrontend");

// 5. Authentication & Authorization - Verificar permisos de usuario (placeholder para futura autenticación JWT)
app.UseAuthentication();
app.UseAuthorization();

// 6. Controllers - Mapear solicitudes HTTP a acciones de controller
app.MapControllers();

// ==================== SEED: GARANTIZAR USUARIO ADMIN ====================
// Nota: ApplicationStarted.Register recibe Action (no Func<Task>), por eso usamos Task.Run
// para no crear un async void que ignora excepciones y crashea el app.
app.Lifetime.ApplicationStarted.Register(() =>
{
    Task.Run(async () =>
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var usersService = scope.ServiceProvider.GetRequiredService<IUsersService>();

            const string adminEmail = "won.dorado.mid@gmail.com";
            var adminUser = await usersService.GetByEmailAsync(adminEmail);

            if (adminUser != null)
            {
                bool needsUpdate = false;

                if (adminUser.Role != "Admin")
                {
                    adminUser.Role = "Admin";
                    needsUpdate = true;
                }

                // El admin siempre debe estar verificado (no necesita OTP)
                if (!adminUser.EmailVerified)
                {
                    adminUser.EmailVerified = true;
                    adminUser.VerificationStatus = "approved";
                    needsUpdate = true;
                }

                if (needsUpdate)
                {
                    await usersService.UpdateAsync(adminUser.Id!, adminUser);
                    Console.WriteLine($"✅ Usuario admin ({adminEmail}) actualizado: Role=Admin, EmailVerified=true.");
                }
                else
                {
                    Console.WriteLine($"✅ Usuario admin ({adminEmail}) ya está correctamente configurado.");
                }
            }
            else
            {
                Console.WriteLine($"⚠️  El usuario {adminEmail} no existe en la BD todavía.");
            }

            // ==================== VERIFICAR A TODOS LOS PROFESORES Y ALUMNOS ====================
            Console.WriteLine("⚙️  Verificando estado de profesores y alumnos en BD...");
            var allUsers = await usersService.GetAllAsync();
            var unverifiedUsers = allUsers.Where(u => (u.Role == "Profesor" || u.Role == "Alumno") && !u.EmailVerified).ToList();

            foreach (var user in unverifiedUsers)
            {
                user.EmailVerified = true;
                user.VerificationStatus = "approved"; // Mantenemos compatibilidad con el front antiguo si lo requiere aún
                await usersService.UpdateAsync(user.Id!, user);
                Console.WriteLine($"✅ Usuario verificado forzadamente: {user.Email} ({user.FullName} - {user.Role})");
            }
            
            if (!unverifiedUsers.Any())
            {
                 Console.WriteLine("✅ No hay profesores ni alumnos pendientes de verificación de correo.");
            }

        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️  Error al verificar usuarios en el startup: {ex.Message}");
        }
    });
});

// ==================== INICIAR SERVIDOR ====================
// Mostrar enlace de Swagger cuando la aplicación inicia
if (app.Environment.IsDevelopment())
{
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        var addresses = app.Urls;
        if (addresses.Any())
        {
            var swaggerUrl = addresses.First() + "/swagger";
            Console.WriteLine($"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine($"📚 Documentación Swagger: {swaggerUrl}");
            Console.WriteLine($"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        }
    });
}

app.Run();
