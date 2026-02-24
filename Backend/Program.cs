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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "QuestEval API",
        Version = "v1",
        Description = "API para gestionar evaluaciones de proyectos estudiantiles, grupos y retroalimentación",
        Contact = new() { Name = "QuestEval Team" }
    });

    // Incluir comentarios XML
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) options.IncludeXmlComments(xmlPath);

    var sharedXmlPath = Path.Combine(AppContext.BaseDirectory, "QuestEval.Shared.xml");
    if (File.Exists(sharedXmlPath)) options.IncludeXmlComments(sharedXmlPath);
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
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "QuestEval API v1");

        // Habilitar autenticación JWT en la UI
        c.ConfigObject.AdditionalItems["persistAuthorization"] = true;
    });

    // Mostrar link de Swagger en la terminal
    app.Logger.LogInformation("\n============================================");
    app.Logger.LogInformation("  📚 Swagger UI: http://localhost:5122/swagger");
    app.Logger.LogInformation("============================================\n");
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
    try
    {
    
    // --- 0. Inicializar IDs para datos existentes ---
    logger.LogInformation("Initializing incremental IDs for existing data...");
    var groupsService = scope.ServiceProvider.GetRequiredService<IGroupsService>();
    var projectsService = scope.ServiceProvider.GetRequiredService<IProjectsService>();
    var criteriaService = scope.ServiceProvider.GetRequiredService<ICriteriaService>();
    var evaluationsService = scope.ServiceProvider.GetRequiredService<IEvaluationsService>();
    var feedbackService = scope.ServiceProvider.GetRequiredService<IFeedbackService>();
    var membershipsService = scope.ServiceProvider.GetRequiredService<IMembershipsService>();

    await usersService.InitializeIncrementalIdsAsync();
    await groupsService.InitializeIncrementalIdsAsync();
    await projectsService.InitializeIncrementalIdsAsync();
    await criteriaService.InitializeIncrementalIdsAsync();
    await evaluationsService.InitializeIncrementalIdsAsync();
    await feedbackService.InitializeIncrementalIdsAsync();
    await membershipsService.InitializeIncrementalIdsAsync();
    logger.LogInformation("ID initialization complete.");

    // Función auxiliar para hashear contraseñas (SHA256)
    string HashPassword(string password)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = System.Text.Encoding.UTF8.GetBytes(password);
        var hash = Convert.ToBase64String(sha256.ComputeHash(bytes));
        return hash;
    }

    // --- 1. Crear ADMIN si no existe ---
    var adminEmail = "admin@questeval.com";
    var adminUser = await usersService.GetByEmailAsync(adminEmail);
    if (adminUser == null)
    {
        logger.LogInformation("Creating Admin user...");
        await usersService.CreateAsync(new User
        {
            Email = adminEmail,
            PasswordHash = HashPassword("Admin123!"),
            FullName = "Admin QuestEval",
            Role = "Admin",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            EmailVerified = true,
            VerificationStatus = "approved"
        });
    }

    // --- 2. Crear PROFESOR si no existe ---
    var profEmail = "profesor@questeval.com";
    var profUser = await usersService.GetByEmailAsync(profEmail);
    if (profUser == null)
    {
        logger.LogInformation("Creating Professor user...");
        await usersService.CreateAsync(new User
        {
            Email = profEmail,
            PasswordHash = HashPassword("Profesor123!"),
            FullName = "Dr. Roberto Solis",
            Role = "Profesor",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            EmailVerified = true,
            VerificationStatus = "approved"
        });
        profUser = await usersService.GetByEmailAsync(profEmail);
    }

    // --- 3. Crear ALUMNO si no existe ---
    var studentEmail = "estudiante@questeval.com";
    var studentUser = await usersService.GetByEmailAsync(studentEmail);
    if (studentUser == null)
    {
        logger.LogInformation("Creating Student user...");
        await usersService.CreateAsync(new User
        {
            Email = studentEmail,
            PasswordHash = HashPassword("Alumno123!"),
            FullName = "Kevin Meza",
            Role = "Alumno",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            EmailVerified = true,
            VerificationStatus = "approved"
        });
        studentUser = await usersService.GetByEmailAsync(studentEmail);
    }

    // --- 3.1 Crear más ALUMNOS para evaluaciones ---
    var otherStudents = new List<(string Name, string Email)>
    {
        ("Ana Garcia", "ana@questeval.com"),
        ("Luis Perez", "luis@questeval.com"),
        ("Maria Jose", "maria@questeval.com"),
        ("Carlos Ruiz", "carlos@questeval.com")
    };

    foreach (var (name, email) in otherStudents)
    {
        var user = await usersService.GetByEmailAsync(email);
        if (user == null)
        {
            await usersService.CreateAsync(new User
            {
                Email = email,
                PasswordHash = HashPassword("Alumno123!"),
                FullName = name,
                Role = "Alumno",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                EmailVerified = true,
                VerificationStatus = "approved"
            });
        }
    }

    // --- 4. Crear GRUPO si no existe ---
    var existingGroups = await groupsService.GetAllAsync();
    var sampleGroup = existingGroups.FirstOrDefault(g => g.AccessCode == "SWENG101");
    if (sampleGroup == null)
    {
        logger.LogInformation("Creating Sample Group...");
        sampleGroup = new Group
        {
            Name = "Ingeniería de Software II",
            AccessCode = "SWENG101",
            CreatedAt = DateTime.UtcNow
        };
        await groupsService.CreateAsync(sampleGroup);
    }

    // --- 5. Crear PROYECTO si no existe ---
    var existingProjects = await projectsService.GetAllAsync();
    var sampleProject = existingProjects.FirstOrDefault(p => p.Name == "QuestEval v1.0");
    if (sampleProject == null)
    {
        logger.LogInformation("Creating Sample Project...");
        sampleProject = new Project
        {
            Name = "QuestEval v1.0",
            Description = "Sistema de evaluación de proyectos con MongoDB y .NET 10",
            GroupId = sampleGroup.GroupId!,
            Status = "Active",
            Category = "Integrador",
            TeamMembers = new List<string> { "Kevin Meza", "Kevin Lopez" },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await projectsService.CreateAsync(sampleProject);
    }

    // --- 6. Crear CRITERIOS si no existen ---
    var existingCriteria = await criteriaService.GetAllAsync();
    if (!existingCriteria.Any())
    {
        logger.LogInformation("Creating Sample Criteria...");
        var criteria = new List<Criterion>
        {
            new Criterion { Name = "Legibilidad del Código", Description = "Evalúa que el código siga estándares y sea fácil de leer", MaxScore = 100 },
            new Criterion { Name = "Interfaz de Usuario", Description = "Evalúa la estética y usabilidad de la UI/UX", MaxScore = 100 },
            new Criterion { Name = "Calidad Técnica", Description = "Uso correcto de patrones de diseño y arquitectura", MaxScore = 100 }
        };
        foreach (var c in criteria) await criteriaService.CreateAsync(c);
        existingCriteria = await criteriaService.GetAllAsync();
    }

    // --- 7. Crear EVALUACIONES si no hay suficientes ---
    var existingEvaluations = await evaluationsService.GetAllAsync();
    if (existingEvaluations.Count < 5 && sampleProject != null)
    {
        logger.LogInformation("Creating 5 Sample Evaluations...");
        var students = await usersService.GetAllAsync();
        var evaluators = students.Where(u => u.Role == "Alumno" && u.UserId != studentUser?.UserId).Take(5).ToList();
        
        // Si no hay suficientes alumnos, usar al propio estudiante o al profesor
        if (evaluators.Count < 5) evaluators.Add(profUser!);

        var random = new Random();
        foreach (var evaluator in evaluators)
        {
            var evaluation = new Evaluation
            {
                ProjectId = sampleProject.ProjectId!,
                UserId = evaluator.UserId!,
                EvaluatorRole = evaluator.Role,
                EvaluatorName = evaluator.FullName,
                Details = existingCriteria.Select(c => new EvaluationDetail
                {
                    CriteriaId = c.CriteriaId!,
                    CriterionName = c.Name,
                    Score = random.Next(70, 101)
                }).ToList(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            evaluation.FinalScore = evaluation.Details.Average(d => d.Score);
            await evaluationsService.CreateAsync(evaluation);
        }
    }

        logger.LogInformation("Seeding and initialization complete.");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "FATAL ERROR DURING SEEDING: {Message}", ex.Message);
        if (ex.InnerException != null)
        {
            logger.LogCritical(ex.InnerException, "INNER EXCEPTION: {Message}", ex.InnerException.Message);
        }
        throw;
    }
}

// ==================== INICIAR SERVIDOR ====================
app.Run();
