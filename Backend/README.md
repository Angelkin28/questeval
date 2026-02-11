# Backend - QuestEval API

API RESTful para gestión de evaluaciones de proyectos estudiantiles, construida con **ASP.NET Core** y **MongoDB**.

---

## 📋 Tabla de Contenidos

1. [Estructura del Proyecto](#-estructura-del-proyecto)
2. [Arquitectura](#-arquitectura)
3. [Componentes Principales](#-componentes-principales)
4. [Configuración](#-configuración)
5. [Ejecución](#-ejecución)
6. [Endpoints API](#-endpoints-api)
7. [Agregar Nueva Entidad](#-agregar-nueva-entidad)
8. [Mejores Prácticas](#-mejores-prácticas)

---

## 🏗️ Estructura del Proyecto

```
Backend/
├── Controllers/          # Endpoints de la API REST
│   ├── CriteriaController.cs
│   ├── EvaluationsController.cs
│   ├── FeedbackController.cs
│   ├── GroupsController.cs
│   ├── MembershipsController.cs
│   ├── ProjectsController.cs
│   └── UsersController.cs
│
├── Services/             # Lógica de negocio y acceso a datos
│   ├── Interfaces/       # Contratos de servicios (interfaces)
│   │   ├── ICriteriaService.cs
│   │   ├── IGroupsService.cs
│   │   ├── IUsersService.cs
│   │   ├── IProjectsService.cs
│   │   ├── IEvaluationsService.cs
│   │   ├── IMembershipsService.cs
│   │   └── IFeedbackService.cs
│   ├── CriteriaService.cs
│   ├── GroupsService.cs
│   ├── UsersService.cs
│   ├── ProjectsService.cs
│   ├── EvaluationsService.cs
│   ├── MembershipsService.cs
│   └── FeedbackService.cs
│
├── Models/               # Modelos de datos (MongoDB)
│   └── MongoModels.cs    # 7 entidades: User, Group, Membership, Project, Criterion, Evaluation, Feedback
│
├── DTOs/                 # Data Transfer Objects (Request/Response)
│   ├── DTOs.cs           # CriterionDTO, GroupDTO, ProjectDTO, etc.
│   └── UserDTOs.cs       # RegisterDTO, LoginDTO, UserResponseDTO
│
├── Middlewares/          # Middleware personalizado
│   └── GlobalExceptionHandler.cs  # Manejo global de errores
│
├── Helpers/              # Utilidades y helpers
│   └── ValidationHelper.cs        # Validación de ObjectIds de MongoDB
│
├── Tests/                # Scripts de testing
│   └── test-api.js       # 28+ tests automatizados con Node.js
│
├── Properties/
│   └── launchSettings.json
│
├── Program.cs            # Punto de entrada y configuración
├── Backend.csproj        # Configuración del proyecto .NET
├── appsettings.json      # Configuración de producción
└── appsettings.Development.json  # Configuración de desarrollo
```

---

## 🔧 Arquitectura

El proyecto sigue el patrón **Repository + Service Layer**:

```
┌─────────────┐
│   Cliente   │  (Frontend, Postman, etc.)
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────┐
│  Controllers/   │  ← Recibe requests, valida, retorna responses
│  (API Layer)    │     Decorado con [ApiController], [Route]
└────────┬────────┘
         │ Llama métodos
         ▼
┌─────────────────┐
│   Services/     │  ← Lógica de negocio
│  (Business)     │     Implementa interfaces (IXxxService)
└────────┬────────┘
         │ Accede a base de datos
         ▼
┌─────────────────┐
│  MongoDB.Driver │  ← Operaciones CRUD en MongoDB
│  (Data Access)  │     IMongoCollection<T>
└─────────────────┘
```

### Flujo de una Request

1. **Cliente** hace HTTP Request → `POST /api/Criteria`
2. **Controller** (`CriteriaController`) recibe la request
3. **Validación** automática con `[Required]`, `[StringLength]`, etc.
4. **Controller** llama al **Service** (`ICriteriaService.CreateAsync`)
5. **Service** ejecuta lógica de negocio y accede a MongoDB
6. **Respuesta** se serializa a JSON y se retorna al cliente

---

## 🤔 ¿Por Qué Esta Arquitectura?

### Problema Inicial: Código Monolítico

Antes teníamos **1 servicio gigante** (`QuestEvalService`) que manejaba TODAS las entidades:

```csharp
// ❌ ANTES: Un servicio para todo
public class QuestEvalService
{
    public Task<List<User>> GetUsersAsync() { }
    public Task<List<Group>> GetGroupsAsync() { }
    public Task<List<Project>> GetProjectsAsync() { }
    public Task<List<Criterion>> GetCriteriaAsync() { }
    // ... 20+ métodos mezclados
}
```

**Problemas:**
- ❌ Difícil de mantener (138 líneas, muchas responsabilidades)
- ❌ Imposible de testear parcialmente
- ❌ Cambios en Users afectan código de Projects
- ❌ Controllers acoplados a la implementación

### Solución: Separación por Responsabilidad

**Ahora tenemos 7 servicios específicos:**

```csharp
// ✅ AHORA: Un servicio por entidad
public class CriteriaService : ICriteriaService { }    // Solo criterios
public class GroupsService : IGroupsService { }         // Solo grupos
public class UsersService : IUsersService { }           // Solo usuarios
// ... cada uno enfocado en UNA cosa
```

### Ventajas de Esta Arquitectura

#### 1. **Separación de Responsabilidades (SOLID)**
```
✅ Cada clase tiene UNA razón para cambiar
✅ CriteriaService solo cambia si cambian los criterios
✅ UsersService solo cambia si cambia la lógica de usuarios
```

#### 2. **Testeable y Mockable**
```csharp
// Fácil crear mocks para testing
var mockService = new Mock<ICriteriaService>();
mockService.Setup(s => s.GetAllAsync()).ReturnsAsync(fakeCriteria);

var controller = new CriteriaController(mockService.Object);
// Testear controller sin tocar MongoDB
```

#### 3. **Desacoplamiento (Dependency Injection)**
```csharp
// Controller no sabe QUÉ implementación recibe
public CriteriaController(ICriteriaService service)  // ✅ Depende de interface
{
    _service = service;  // Puede ser CriteriaService, MockService, CachedService...
}
```

#### 4. **Escalabilidad**
```
Agregar nueva entidad = Copiar patrón existente
1. ITasksService (interface)
2. TasksService (implementation)
3. TasksController
4. Registrar en Program.cs
```

#### 5. **Mantenibilidad**
```
Cambio en CriteriaService:
- ✅ Solo afecta CriteriaController
- ✅ Otros 6 servicios NO se afectan
- ✅ Tests aislados por servicio
```

#### 6. **Reutilización**
```csharp
// Misma interface, diferentes implementaciones
public class CriteriaService : ICriteriaService { }       // MongoDB
public class CachedCriteriaService : ICriteriaService { } // Con cache
public class MockCriteriaService : ICriteriaService { }   // Para tests
```

### Comparación con Alternativas

| Enfoque | Ventajas | Desventajas |
|---------|----------|-------------|
| **Código en Controllers** | Simple, directo | ❌ No testeable, lógica mezclada con HTTP |
| **Servicio Monolítico** | Un solo archivo | ❌ Difícil mantener, cambios riesgosos |
| **Services con Interfaces** ✅ | Testeable, desacoplado, escalable | Más archivos inicialmente |

### ¿Por Qué Interfaces Separadas?

**Carpeta `Services/Interfaces/`:**
```
✅ Documentación clara de "qué hace" cada servicio
✅ Controllers solo ven contratos, no implementaciones
✅ Fácil cambiar implementación sin tocar controllers
✅ IntelliSense muestra documentación de la interface
```

**Ejemplo práctico:**
```csharp
// Interface documenta QUÉ hace
/// <summary>
/// Obtiene todos los criterios de evaluación.
/// </summary>
Task<List<Criterion>> GetAllAsync();

// Implementación documenta CÓMO lo hace
// - Se conecta a MongoDB
// - Usa índice en campo Name
// - Cache de 5 minutos
```

### Adecuado para QuestEval

Esta arquitectura es ideal para QuestEval porque:

1. **Múltiples Entidades Relacionadas**
   - 7 entidades (User, Group, Project, Criterion, Evaluation, Membership, Feedback)
   - Cada una con lógica de negocio específica

2. **Evolución Independiente**
   - Sistema de evaluaciones puede cambiar sin afectar gestión de grupos
   - Agregar nuevos criterios no afecta proyectos existentes

3. **Testing Crítico**
   - Las evaluaciones son inmutables (no se pueden modificar)
   - Los tests deben garantizar integridad de calificaciones

4. **Trabajo en Equipo**
   - Un developer trabaja en Evaluations
   - Otro en Groups
   - No hay conflictos de merge

---

## 🧩 Componentes Principales

### 1. **Controllers** (Capa de Presentación)

Responsabilidades:
- Definir rutas HTTP (`[Route("api/[controller]")]`)
- Validar datos de entrada (`ModelState`)
- Llamar servicios apropiados
- Retornar códigos HTTP correctos (200, 201, 400, 404, 500)
- Documentar con XML comments para Swagger

**Ejemplo:**
```csharp
[HttpPost]
public async Task<ActionResult<Criterion>> Create([FromBody] CriterionDTO dto)
{
    // Validación
    if (!ModelState.IsValid)
        return BadRequest(ModelState);
    
    // Lógica de negocio
    var criterion = new Criterion { Name = dto.Name, MaxScore = dto.MaxScore };
    await _service.CreateAsync(criterion);
    
    // Respuesta
    return CreatedAtAction(nameof(Get), new {id = criterion.Id}, criterion);
}
```

### 2. **Services** (Capa de Negocio)

**Arquitectura de 2 Capas:**
- **Interfaces** (`Services/Interfaces/`) - Contratos que definen qué hace cada servicio
- **Implementaciones** (`Services/`) - Código que implementa la lógica de negocio

Responsabilidades:
- Implementar lógica de negocio
- Acceder a MongoDB mediante `IMongoCollection<T>`
- Encapsular operaciones CRUD
- Mantener separación de responsabilidades

**Patrón Interface + Implementation:**
```csharp
// Interface (contrato) - Backend/Services/Interfaces/ICriteriaService.cs
public interface ICriteriaService
{
    Task<List<Criterion>> GetAllAsync();
    Task<Criterion?> GetByIdAsync(string id);
    Task CreateAsync(Criterion criterion);
    Task UpdateAsync(string id, Criterion criterion);
    Task DeleteAsync(string id);
}

// Implementación - Backend/Services/CriteriaService.cs
public class CriteriaService : ICriteriaService
{
    private readonly IMongoCollection<Criterion> _collection;
    
    public CriteriaService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Criterion>(settings.Value.CriteriaCollectionName);
    }
    
    public async Task<List<Criterion>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();
    
    // ... otros métodos
}
```

**Beneficios:**
- ✅ Testeable (fácil mockear interfaces)
- ✅ Desacoplado (controller no conoce MongoDB directamente)
- ✅ Reutilizable (múltiples controllers pueden usar el mismo service)
- ✅ Mantenible (cambiar implementación sin afectar controllers)

### 3. **Models** (Entidades de MongoDB)

Definiciones de las 7 colecciones:

| Modelo | Descripción | Campos Clave |
|--------|-------------|--------------|
| **User** | Usuarios del sistema | Email (único), Password (hash), Role |
| **Group** | Grupos de estudiantes | Name, AccessCode (único) |
| **Membership** | Relación User-Group | UserId, GroupId, JoinedAt |
| **Project** | Proyectos de estudiantes | Name, GroupId, Status |
| **Criterion** | Criterio de evaluación | Name, Description, MaxScore |
| **Evaluation** | Evaluación de proyecto | ProjectId, EvaluatorId, Criteria[], FinalScore |
| **Feedback** | Retroalimentación | EvaluationId, ProviderId, Comments |

**Características:**
- Decorados con `[BsonElement]` para mapeo MongoDB
- `Id` como string (MongoDB ObjectId)
- Timestamps: `CreatedAt`, `UpdatedAt`

### 4. **DTOs** (Data Transfer Objects)

Objetos para transferencia de datos entre cliente y servidor.

**Propósito:**
- ✅ Ocultar campos internos (password hash)
- ✅ Validación con DataAnnotations
- ✅ Controlar qué datos acepta/retorna la API

**Ejemplo:**
```csharp
public class CriterionDTO
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, ErrorMessage = "Name max 100 chars")]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(1, 1000, ErrorMessage = "MaxScore debe estar entre 1 y 1000")]
    public int MaxScore { get; set; }
}
```

### 5. **Middlewares**

#### GlobalExceptionHandler
Captura excepciones no manejadas y retorna respuestas RFC 7807.

**Antes (sin handler):**
```json
{
  "error": "Object reference not set to instance of object",
  "stackTrace": "at Backend.Controllers..."  // ❌ Expone implementación
}
```

**Después (con handler):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "An error occurred",
  "status": 500,
  "detail": "Internal server error. Please contact support."
}
```

### 6. **Helpers**

#### ValidationHelper
Valida IDs de MongoDB antes de queries.

```csharp
if (!ValidationHelper.IsValidObjectId(id))
    return NotFound("Invalid ID format");
```

---

## ⚙️ Configuración

### appsettings.json

```json
{
  "QuestEvalDatabase": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "QuestEvalDB",
    "UsersCollectionName": "users",
    "GroupsCollectionName": "groups",
    "MembershipsCollectionName": "memberships",
    "ProjectsCollectionName": "projects",
    "CriteriaCollectionName": "criteria",
    "EvaluationsCollectionName": "evaluations",
    "FeedbackCollectionName": "feedback"
  }
}
```

### Dependency Injection (Program.cs)

Todos los servicios se registran con **Scoped lifetime**:

```csharp
// Un servicio por entidad
builder.Services.AddScoped<ICriteriaService, CriteriaService>();
builder.Services.AddScoped<IGroupsService, GroupsService>();
builder.Services.AddScoped<IUsersService, UsersService>();
// ... etc
```

**Scoped = una instancia por HTTP request** (recomendado para DB operations)

---

## 🚀 Ejecución

### Prerrequisitos

1. **.NET 10 SDK** instalado
2. **MongoDB** corriendo en `localhost:27017` (o configurar ConnectionString)
3. **Node.js** (solo para tests con `test-api.js`)

### Comandos

```bash
# Compilar
dotnet build Backend/Backend.csproj

# Ejecutar servidor (desarrollo)
cd Backend
dotnet run

# Salida:
# info: Microsoft.Hosting.Lifetime[14]
#       Now listening on: https://localhost:7001
#       Now listening on: http://localhost:5000

# Ejecutar tests
node Backend/Tests/test-api.js
```

### Acceder a Swagger UI

```
https://localhost:7001/swagger
```

Swagger proporciona:
- Documentación interactiva de todos los endpoints
- Pruebas directas desde el navegador
- Esquemas de request/response

---

## 🔌 Endpoints API

### Criteria (Criterios)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/Criteria` | Obtener todos los criterios |
| GET | `/api/Criteria/{id}` | Obtener criterio por ID |
| POST | `/api/Criteria` | Crear nuevo criterio |
| PUT | `/api/Criteria/{id}` | Actualizar criterio |
| DELETE | `/api/Criteria/{id}` | Eliminar criterio |

### Groups (Grupos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/Groups` | Obtener todos los grupos |
| GET | `/api/Groups/{id}` | Obtener grupo por ID |
| POST | `/api/Groups` | Crear nuevo grupo |
| PUT | `/api/Groups/{id}` | Actualizar grupo |
| DELETE | `/api/Groups/{id}` | Eliminar grupo |

### Users (Usuarios)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/Users/register` | Registrar nuevo usuario |
| POST | `/api/Users/login` | Autenticar usuario |
| GET | `/api/Users` | Obtener todos los usuarios |
| GET | `/api/Users/{id}` | Obtener usuario por ID |
| PUT | `/api/Users/{id}` | Actualizar usuario |
| DELETE | `/api/Users/{id}` | Eliminar usuario |

### Projects, Evaluations, Memberships, Feedback

Cada entidad sigue el mismo patrón CRUD estándar.

**Documentación completa:** Ver Swagger UI o `mejoras_backend.md`

---

## ➕ Agregar Nueva Entidad

Sigue estos pasos para agregar una nueva entidad (ejemplo: **Task**):

### 1. Crear el Modelo

```csharp
// Backend/Models/MongoModels.cs
public class Task
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;
    
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Done
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 2. Crear el DTO

```csharp
// Backend/DTOs/TaskDTO.cs
public class TaskDTO
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
}
```

### 3. Crear el Service

```csharp
// Backend/Services/ITasksService.cs
public interface ITasksService
{
    Task<List<Task>> GetAllAsync();
    Task<Task?> GetByIdAsync(string id);
    Task CreateAsync(Task task);
    Task UpdateAsync(string id, Task task);
    Task DeleteAsync(string id);
}

// Backend/Services/TasksService.cs
public class TasksService : ITasksService
{
    private readonly IMongoCollection<Task> _collection;
    
    public TasksService(IOptions<QuestEvalDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        _collection = database.GetCollection<Task>(settings.Value.TasksCollectionName);
    }
    
    // Implementar métodos...
}
```

### 4. Crear el Controller

```csharp
// Backend/Controllers/TasksController.cs
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITasksService _service;
    
    public TasksController(ITasksService service)
    {
        _service = service;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Task>>> GetAll()
    {
        var tasks = await _service.GetAllAsync();
        return Ok(tasks);
    }
    
    // Implementar otros métodos (GET by ID, POST, PUT, DELETE)...
}
```

### 5. Registrar Service en Program.cs

```csharp
builder.Services.AddScoped<ITasksService, TasksService>();
```

### 6. Agregar configuración en appsettings.json

```json
{
  "QuestEvalDatabase": {
    "TasksCollectionName": "tasks",
    // ... otros campos
  }
}
```

### 7. Actualizar QuestEvalDatabaseSettings

```csharp
public class QuestEvalDatabaseSettings
{
    public string TasksCollectionName { get; set; } = "tasks";
    // ... otros campos
}
```

---

## ✅ Mejores Prácticas

### 1. **Validación en Múltiples Capas**

```csharp
// DTO - Validación de formato
[Required]
[StringLength(100)]
public string Name { get; set; }

// Controller - Validación de negocio
if (!ValidationHelper.IsValidObjectId(id))
    return BadRequest("Invalid ID format");

// Service - Validación de existencia
var existing = await _collection.Find(x => x.Email == email).FirstOrDefaultAsync();
if (existing != null)
    throw new InvalidOperationException("Email already exists");
```

### 2. **Usar DTOs para Input/Output**

❌ **Mal** - Exponer modelo directamente:
```csharp
[HttpPost]
public async Task<User> Register(User user) // ❌ Permite modificar cualquier campo
```

✅ **Bien** - Usar DTO específico:
```csharp
[HttpPost]
public async Task<UserResponseDTO> Register(RegisterDTO dto) // ✅ Solo acepta campos permitidos
```

### 3. **Documentar con XML Comments**

```csharp
/// <summary>
/// Crea un nuevo criterio de evaluación.
/// </summary>
/// <param name="dto">Datos del criterio (Name, MaxScore)</param>
/// <returns>El criterio creado con su ID de MongoDB</returns>
/// <response code="201">Criterio creado exitosamente</response>
/// <response code="400">Datos inválidos</response>
[HttpPost]
public async Task<ActionResult<Criterion>> Create([FromBody] CriterionDTO dto)
```

### 4. **Manejo de Errores Consistente**

```csharp
// GlobalExceptionHandler captura excepciones
// Retorna RFC 7807 ProblemDetails
// Logging automático con contexto
```

### 5. **Usar Timestamps**

```csharp
// Al crear
var project = new Project
{
    Name = dto.Name,
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};

// Al actualizar
project.UpdatedAt = DateTime.UtcNow;
```

### 6. **Índices de MongoDB**

```javascript
// Crear índices en MongoDB para performance
db.users.createIndex({ "Email": 1 }, { unique: true })
db.groups.createIndex({ "AccessCode": 1 }, { unique: true })
db.memberships.createIndex({ "UserId": 1, "GroupId": 1 }, { unique: true })
```

---

## 📚 Recursos Adicionales

- **Documentación completa:** `mejoras_backend.md`
- **Esquema de BD:** `README_DATABASE.md`
- **Swagger UI:** `https://localhost:7001/swagger`
- **Tests automatizados:** `Backend/Tests/test-api.js`

---

## 🎯 Estado Actual

✅ **Arquitectura Refactorizada (Febrero 2026):**
- Servicio monolítico `QuestEvalService` eliminado
- 7 Servicios específicos + 7 Interfaces en carpeta dedicada
- Controllers desacoplados usando inyección de dependencias
- Documentación 100% en español (XML comments)
- Métodos estandarizados (GetAllAsync, GetByIdAsync, CreateAsync, UpdateAsync, DeleteAsync)

✅ **Completo:**
- 7 Controllers con validación completa
- 7 Services (Interface + Implementation separados)
- GlobalExceptionHandler para manejo consistente de errores
- ValidationHelper para validación de ObjectIds
- Swagger con documentación XML completa en español
- 28+ tests automatizados

🔜 **Próximas mejoras (ver `mejoras_backend.md`):**
- JWT Authentication
- BCrypt para passwords
- Paginación en endpoints
- Rate limiting
- Soft deletes
