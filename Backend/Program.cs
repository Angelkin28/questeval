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
<<<<<<< HEAD
        // Agregar URLs del frontend aquí (servidores dev, URLs de producción, etc.)
        policy.WithOrigins("http://localhost:5173", "http://localhost:5248")
              .AllowAnyMethod()    // Permitir GET, POST, PUT, DELETE, etc.
              .AllowAnyHeader();   // Permitir todos los headers (Authorization, Content-Type, etc.)
=======
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
>>>>>>> c6e0590b0c2315ded1dd98ef1a613f074bcc0c5f
    });
});

// ==================== CONFIGURACIÓN DE CONTROLLERS ====================
builder.Services.AddControllers()
    // Preservar nombres de propiedades tal cual (no convertir a camelCase)
    // Los documentos de MongoDB usan PascalCase, así que mantenemos las respuestas JSON consistentes
    .AddJsonOptions(options => options.JsonSerializerOptions.PropertyNamingPolicy = null)
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
app.UseAuthorization();

// 6. Controllers - Mapear solicitudes HTTP a acciones de controller
app.MapControllers();

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
<<<<<<< HEAD
    });
=======
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
>>>>>>> c6e0590b0c2315ded1dd98ef1a613f074bcc0c5f
}

app.Run();
