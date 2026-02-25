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
        // En desarrollo, permitimos cualquier origen para facilitar las pruebas móviles/web
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:5248", "http://localhost:4200", "http://localhost:4201")
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
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

    // --- 4. Crear GRUPOS si no existen ---
    var existingGroups = await groupsService.GetAllAsync();
    var integradorGroup = existingGroups.FirstOrDefault(g => g.AccessCode == "INT2026");
    if (integradorGroup == null)
    {
        integradorGroup = new Group { Name = "Integrador 2026", AccessCode = "INT2026", CreatedAt = DateTime.UtcNow };
        await groupsService.CreateAsync(integradorGroup);
    }
    
    var videoGamesGroup = existingGroups.FirstOrDefault(g => g.AccessCode == "VG2026");
    if (videoGamesGroup == null)
    {
        videoGamesGroup = new Group { Name = "Videojuegos 2026", AccessCode = "VG2026", CreatedAt = DateTime.UtcNow };
        await groupsService.CreateAsync(videoGamesGroup);
    }

    // --- 5. Crear CRITERIOS si no existen ---
    var existingCriteria = await criteriaService.GetAllAsync();
    if (!existingCriteria.Any())
    {
        logger.LogInformation("Creating Sample Criteria...");
        var criteria = new List<Criterion>
        {
            new Criterion { Name = "Planificación y Organización", Description = "Evalúa la estructura y tiempos", MaxScore = 15 },
            new Criterion { Name = "Investigación y Fundamentación", Description = "Bases teóricas y estado del arte", MaxScore = 15 },
            new Criterion { Name = "Desarrollo Técnico", Description = "Implementación y código", MaxScore = 25 },
            new Criterion { Name = "Innovación y Creatividad", Description = "Originalidad de la propuesta", MaxScore = 15 },
            new Criterion { Name = "Documentación", Description = "Reporte y manuales", MaxScore = 10 },
            new Criterion { Name = "Presentación y Defensa", Description = "Pitch y respuestas", MaxScore = 20 }
        };
        foreach (var c in criteria) await criteriaService.CreateAsync(c);
        existingCriteria = await criteriaService.GetAllAsync();
    }

    // --- 6. Crear PROYECTOS si no existen ---
    var existingProjects = await projectsService.GetAllAsync();
    
    // Proyectos Integrador
    var integradorProjects = new List<Project>
    {
        new Project 
        { 
            Name = "Ólale Mobile - Auditoría de Compliance", 
            Description = "Aplicación móvil para auditoría automatizada de cumplimiento legal.",
            Status = "PENDIENTE",
            Category = "Integrador",
            GroupId = integradorGroup.GroupId!,
            ThumbnailUrl = "https://picsum.photos/id/1/400/300",
            ComprehensionQuestions = new List<QuestionAnswer>
            {
                new() { 
                    Question = "¿Cuál es el objetivo principal de Ólale Mobile?", 
                    Options = new List<string> { "Automatizar auditorías", "Vender seguros", "Crear juegos", "Chat social" },
                    CorrectAnswerIndex = 0,
                    Answer = "Automatizar auditorías." 
                },
                new() { 
                    Question = "¿Qué plataforma principal utiliza?", 
                    Options = new List<string> { "React Native", "Flutter", "Swift", "Kotlin" },
                    CorrectAnswerIndex = 1,
                    Answer = "Flutter." 
                }
            }
        },
        new Project 
        { 
            Name = "Sistema de Gestión Escolar", 
            Description = "Plataforma integral para gestión académica.",
            Status = "EVALUADO",
            Category = "Integrador",
            GroupId = integradorGroup.GroupId!,
            ThumbnailUrl = "https://picsum.photos/id/2/400/300"
        },
        new Project 
        { 
            Name = "App de Delivery Local", 
            Description = "Entrega a domicilio para negocios locales.",
            Status = "EVALUADO",
            Category = "Integrador",
            GroupId = integradorGroup.GroupId!,
            ThumbnailUrl = "https://picsum.photos/id/3/400/300"
        }
    };

    foreach (var p in integradorProjects)
    {
        if (!existingProjects.Any(ex => ex.Name == p.Name))
        {
            await projectsService.CreateAsync(p);
        }
    }

    // Proyectos Videojuegos
    var vgProjects = new List<Project>
    {
        new Project 
        { 
            Name = "Space Defenders 3D", 
            Description = "Juego de disparos espacial 3D.",
            Status = "EVALUADO",
            Category = "Videojuegos",
            GroupId = videoGamesGroup.GroupId!,
            ThumbnailUrl = "https://picsum.photos/id/4/400/300"
        },
        new Project 
        { 
            Name = "Puzzle Quest Adventures", 
            Description = "Aventura narrativa de puzzles.",
            Status = "EVALUADO",
            Category = "Videojuegos",
            GroupId = videoGamesGroup.GroupId!,
            ThumbnailUrl = "https://picsum.photos/id/5/400/300"
        },
        new Project 
        { 
            Name = "Racing Legends", 
            Description = "Simulador de carreras alta velocidad.",
            Status = "PENDIENTE",
            Category = "Videojuegos",
            GroupId = videoGamesGroup.GroupId!,
            ThumbnailUrl = "https://picsum.photos/id/6/400/300"
        }
    };

    foreach (var p in vgProjects)
    {
        if (!existingProjects.Any(ex => ex.Name == p.Name))
        {
            await projectsService.CreateAsync(p);
        }
    }

    logger.LogInformation("Seeding and initialization complete.");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "FATAL ERROR DURING SEEDING: {Message}", ex.Message);
        throw;
    }
}

// ==================== INICIAR SERVIDOR ====================
app.Run();
