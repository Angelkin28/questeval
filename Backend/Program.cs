using Backend.Models;
using Backend.Services;
using Backend.Services.Interfaces;
using Backend.Middlewares;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<IStorageService, StorageService>();        // Gestionar subida de archivos (Supabase)

// ==================== SUPABASE CONFIGURATION ====================
// Register Supabase Client as a Singleton or Scoped
builder.Services.AddScoped<Supabase.Client>(provider => 
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var url = configuration["Supabase:Url"];
    var key = configuration["Supabase:Key"];
    
    if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key))
    {
        throw new InvalidOperationException("Supabase URL and Key must be configured in appsettings.json");
    }

    return new Supabase.Client(url, key, new Supabase.SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    });
});

// Register OTP Service for email verification
builder.Services.AddScoped<IOtpService, OtpService>();


// ==================== MANEJO DE EXCEPCIONES ====================
// GlobalExceptionHandler captura excepciones no manejadas y retorna RFC 7807 ProblemDetails
// Esto evita errores 500 exponiendo stack traces a los clientes
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails(); // Habilitar respuestas ProblemDetails

// ==================== CONFIGURACIÓN CORS ====================
// Configurar Cross-Origin Resource Sharing para acceso del frontend
// Permite solicitudes desde servidores de desarrollo del frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Agregar URLs del frontend aquí (servidores dev, URLs de producción, etc.)
        policy.WithOrigins("http://localhost:5173", "http://localhost:5248", "http://localhost:4200", "http://localhost:4201")
              .AllowAnyMethod()    // Permitir GET, POST, PUT, DELETE, etc.
              .AllowAnyHeader();   // Permitir todos los headers (Authorization, Content-Type, etc.)
    });
});

// ==================== AUTHENTICATION ====================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

// ==================== CONFIGURACIÓN DE CONTROLLERS ====================
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Habilitar validación automática de modelo basada en DataAnnotations
        // Los controllers retornarán 400 BadRequest automáticamente para datos inválidos
        options.SuppressModelStateInvalidFilter = false;
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

// 5. Authorization - Verificar permisos de usuario (placeholder para futura autenticación JWT)
// 5. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// 6. Controllers - Mapear solicitudes HTTP a acciones de controller
// 6. Controllers - Mapear solicitudes HTTP a acciones de controller
app.MapControllers();

// ==================== SEEDING ====================
using (var scope = app.Services.CreateScope())
{
    var usersService = scope.ServiceProvider.GetRequiredService<IUsersService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var adminEmail = "won.dorado.mid@gmail.com";
    
    var adminUser = await usersService.GetByEmailAsync(adminEmail);
    logger.LogInformation("Recreating Admin user to ensure correct role and password...");

    if (adminUser != null)
    {
        logger.LogInformation($"Admin user found (ID: {adminUser.Id}). Deleting...");
        await usersService.DeleteAsync(adminUser.Id!);
        logger.LogInformation("Existing admin user deleted.");
    }

    using var sha256 = System.Security.Cryptography.SHA256.Create();
    var bytes = System.Text.Encoding.UTF8.GetBytes("admin123");
    var hash = Convert.ToBase64String(sha256.ComputeHash(bytes));

    var newAdmin = new User
    {
        Email = adminEmail,
        PasswordHash = hash,
        FullName = "Administrator",
        Role = "Admin", // Explicitly set as Admin
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        EmailVerified = true,
        VerificationStatus = "approved"
    };
    
    await usersService.CreateAsync(newAdmin);
    logger.LogInformation("New Admin user created successfully.");

    // Initialize incremental IDs for existing data if any
    logger.LogInformation("Initializing incremental IDs for existing data...");
    
    var groupsService = scope.ServiceProvider.GetRequiredService<IGroupsService>();
    var projectsService = scope.ServiceProvider.GetRequiredService<IProjectsService>();
    var criteriaService = scope.ServiceProvider.GetRequiredService<ICriteriaService>();
    var evaluationsService = scope.ServiceProvider.GetRequiredService<IEvaluationsService>();
    var feedbackService = scope.ServiceProvider.GetRequiredService<IFeedbackService>();

    await usersService.InitializeIncrementalIdsAsync();
    await groupsService.InitializeIncrementalIdsAsync();
    await projectsService.InitializeIncrementalIdsAsync();
    await criteriaService.InitializeIncrementalIdsAsync();
    await evaluationsService.InitializeIncrementalIdsAsync();
    await feedbackService.InitializeIncrementalIdsAsync();
    
    logger.LogInformation("ID initialization complete.");
}

// ==================== INICIAR SERVIDOR ====================
app.Run();
