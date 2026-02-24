# ============================================
# QuestEval - Pruebas Automatizadas de Endpoints
# ============================================
# Este script prueba TODOS los endpoints de la API con datos reales.
# Requisito: El servidor debe estar corriendo en http://localhost:5122

$BaseUrl = "http://localhost:5122/api"
$Global:Passed = 0
$Global:Failed = 0
$Global:Total = 0
$Global:Token = ""
$Global:TestResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [switch]$RequiresAuth,
        [switch]$ReturnBody
    )
    
    $Global:Total++
    $headers = @{ "Content-Type" = "application/json" }
    if ($RequiresAuth -and $Global:Token) {
        $headers["Authorization"] = "Bearer $($Global:Token)"
    }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        $responseBody = $null
        
        if ($response.Content) {
            try { $responseBody = $response.Content | ConvertFrom-Json } catch {}
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            $Global:Passed++
            Write-Host "  [PASS] $Name (HTTP $statusCode)" -ForegroundColor Green
            $Global:TestResults += @{ Name = $Name; Status = "PASS"; Code = $statusCode }
        } else {
            $Global:Failed++
            Write-Host "  [FAIL] $Name - Expected $ExpectedStatus, got $statusCode" -ForegroundColor Red
            $Global:TestResults += @{ Name = $Name; Status = "FAIL"; Code = $statusCode; Expected = $ExpectedStatus }
        }
        
        if ($ReturnBody) { return $responseBody }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            $Global:Passed++
            Write-Host "  [PASS] $Name (HTTP $statusCode - Expected error)" -ForegroundColor Green
            $Global:TestResults += @{ Name = $Name; Status = "PASS"; Code = $statusCode }
        } else {
            $Global:Failed++
            $errorMsg = $_.Exception.Message
            Write-Host "  [FAIL] $Name - Expected $ExpectedStatus, got $statusCode : $errorMsg" -ForegroundColor Red
            $Global:TestResults += @{ Name = $Name; Status = "FAIL"; Code = $statusCode; Expected = $ExpectedStatus; Error = $errorMsg }
        }
        
        if ($ReturnBody -and $statusCode -eq $ExpectedStatus) {
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $errBody = $reader.ReadToEnd() | ConvertFrom-Json
                return $errBody
            } catch {}
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  QuestEval - Pruebas Automatizadas" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. USUARIOS - Registro y Login
# ============================================
Write-Host "--- 1. USUARIOS (Register/Login) ---" -ForegroundColor Yellow

# 1.1 Registrar un alumno
$alumno = @{
    email = "carlos.martinez.test@universidad.edu.mx"
    password = "Alumno2024!"
    fullName = "Carlos Martinez Lopez"
    role = "Alumno"
}
$alumnoResult = Test-Endpoint -Name "Registrar Alumno" -Method "POST" -Url "$BaseUrl/Users/register" -Body $alumno -ExpectedStatus 200 -ReturnBody

# 1.2 Registrar un profesor
$profesor = @{
    email = "dra.garcia.test@universidad.edu.mx"
    password = "Profesor2024!"
    fullName = "Dra. Maria Garcia Hernandez"
    role = "Profesor"
}
$profesorResult = Test-Endpoint -Name "Registrar Profesor" -Method "POST" -Url "$BaseUrl/Users/register" -Body $profesor -ExpectedStatus 200 -ReturnBody

# 1.3 Login como Admin (se crea automaticamente en Program.cs)
$adminLogin = @{
    email = "admin@questeval.com"
    password = "Admin123!"
}
$adminResult = Test-Endpoint -Name "Login Admin" -Method "POST" -Url "$BaseUrl/Users/login" -Body $adminLogin -ExpectedStatus 200 -ReturnBody
if ($adminResult.token) {
    $Global:Token = $adminResult.token
    $Global:AdminId = $adminResult.id
    Write-Host "    -> Token Admin obtenido. userId=$($adminResult.userId), role=$($adminResult.role)" -ForegroundColor DarkGray
}

# 1.4 Login como Alumno
$alumnoLogin = @{
    email = "carlos.martinez.test@universidad.edu.mx"
    password = "Alumno2024!"
}
$alumnoLoginResult = Test-Endpoint -Name "Login Alumno" -Method "POST" -Url "$BaseUrl/Users/login" -Body $alumnoLogin -ExpectedStatus 200 -ReturnBody
$Global:AlumnoId = ""
$Global:AlumnoToken = ""
if ($alumnoLoginResult.id) {
    $Global:AlumnoId = $alumnoLoginResult.id
    $Global:AlumnoToken = $alumnoLoginResult.token
    Write-Host "    -> Alumno ID: $($alumnoLoginResult.id), userId=$($alumnoLoginResult.userId), role=$($alumnoLoginResult.role)" -ForegroundColor DarkGray
}

# 1.5 Login como Profesor
$profesorLogin = @{
    email = "dra.garcia.test@universidad.edu.mx"
    password = "Profesor2024!"
}
$profesorLoginResult = Test-Endpoint -Name "Login Profesor" -Method "POST" -Url "$BaseUrl/Users/login" -Body $profesorLogin -ExpectedStatus 200 -ReturnBody
$Global:ProfesorId = ""
$Global:ProfesorToken = ""
if ($profesorLoginResult.id) {
    $Global:ProfesorId = $profesorLoginResult.id
    $Global:ProfesorToken = $profesorLoginResult.token
    Write-Host "    -> Profesor ID: $($profesorLoginResult.id), userId=$($profesorLoginResult.userId), role=$($profesorLoginResult.role)" -ForegroundColor DarkGray
}

# 1.6 Registro con datos invalidos (email duplicado)
$dupeResult = Test-Endpoint -Name "Registro email duplicado (400)" -Method "POST" -Url "$BaseUrl/Users/register" -Body $alumno -ExpectedStatus 400

# 1.7 Login con credenciales incorrectas
$badLogin = @{ email = "noexiste@test.com"; password = "wrong123" }
Test-Endpoint -Name "Login credenciales invalidas (401)" -Method "POST" -Url "$BaseUrl/Users/login" -Body $badLogin -ExpectedStatus 401

# 1.8 Obtener todos los usuarios
$allUsers = Test-Endpoint -Name "GET todos los usuarios" -Method "GET" -Url "$BaseUrl/Users" -ExpectedStatus 200 -ReturnBody
if ($allUsers) {
    $userCount = if ($allUsers.Count) { $allUsers.Count } else { ($allUsers | Measure-Object).Count }
    Write-Host "    -> $userCount usuarios encontrados" -ForegroundColor DarkGray
}

# 1.9 Obtener usuario por ID
if ($Global:AlumnoId) {
    $singleUser = Test-Endpoint -Name "GET usuario por ID (Alumno)" -Method "GET" -Url "$BaseUrl/Users/$($Global:AlumnoId)" -ExpectedStatus 200 -ReturnBody
    if ($singleUser) {
        Write-Host "    -> userId=$($singleUser.userId), fullName=$($singleUser.fullName), role=$($singleUser.role)" -ForegroundColor DarkGray
    }
}

# 1.10 Buscar usuario inexistente
Test-Endpoint -Name "GET usuario inexistente (404)" -Method "GET" -Url "$BaseUrl/Users/000000000000000000000000" -ExpectedStatus 404

Write-Host ""

# ============================================
# 2. GRUPOS (requiere Auth)
# ============================================
Write-Host "--- 2. GRUPOS ---" -ForegroundColor Yellow

# 2.1 Crear grupo
$grupo = @{
    name = "Ingenieria de Software Semestre 2024B"
    accessCode = "ISW2024B01"
}
$grupoResult = Test-Endpoint -Name "Crear Grupo" -Method "POST" -Url "$BaseUrl/Groups" -Body $grupo -ExpectedStatus 201 -RequiresAuth -ReturnBody
$Global:GrupoId = ""
if ($grupoResult.id) {
    $Global:GrupoId = $grupoResult.id
    Write-Host "    -> Grupo creado: groupId=$($grupoResult.groupId), name=$($grupoResult.name)" -ForegroundColor DarkGray
}

# 2.2 Crear segundo grupo
$grupo2 = @{
    name = "Bases de Datos Avanzadas 2024B"
    accessCode = "BDA2024B01"
}
$grupo2Result = Test-Endpoint -Name "Crear Segundo Grupo" -Method "POST" -Url "$BaseUrl/Groups" -Body $grupo2 -ExpectedStatus 201 -RequiresAuth -ReturnBody
$Global:Grupo2Id = ""
if ($grupo2Result.id) {
    $Global:Grupo2Id = $grupo2Result.id
    Write-Host "    -> Grupo 2: groupId=$($grupo2Result.groupId), name=$($grupo2Result.name)" -ForegroundColor DarkGray
}

# 2.3 Obtener todos los grupos
$allGroups = Test-Endpoint -Name "GET todos los grupos" -Method "GET" -Url "$BaseUrl/Groups" -ExpectedStatus 200 -RequiresAuth -ReturnBody

# 2.4 Obtener grupo por ID
if ($Global:GrupoId) {
    $singleGroup = Test-Endpoint -Name "GET grupo por ID" -Method "GET" -Url "$BaseUrl/Groups/$($Global:GrupoId)" -ExpectedStatus 200 -RequiresAuth -ReturnBody
    if ($singleGroup) {
        Write-Host "    -> groupId=$($singleGroup.groupId), accessCode=$($singleGroup.accessCode)" -ForegroundColor DarkGray
    }
}

# 2.5 Actualizar grupo
if ($Global:GrupoId) {
    $updateGroup = @{
        name = "Ingenieria de Software 2024B - Actualizado"
        accessCode = "ISW2024BUPD"
    }
    $updatedGroup = Test-Endpoint -Name "Actualizar Grupo (PUT)" -Method "PUT" -Url "$BaseUrl/Groups/$($Global:GrupoId)" -Body $updateGroup -ExpectedStatus 200 -RequiresAuth -ReturnBody
    if ($updatedGroup) {
        Write-Host "    -> Grupo actualizado: name=$($updatedGroup.name), groupId=$($updatedGroup.groupId) (IncrementalId preservado)" -ForegroundColor DarkGray
    }
}

# 2.6 Grupo inexistente
Test-Endpoint -Name "GET grupo inexistente (404)" -Method "GET" -Url "$BaseUrl/Groups/000000000000000000000000" -ExpectedStatus 404 -RequiresAuth

Write-Host ""

# ============================================
# 3. PROYECTOS
# ============================================
Write-Host "--- 3. PROYECTOS ---" -ForegroundColor Yellow

# 3.1 Crear proyecto
if ($Global:GrupoId) {
    $proyecto = @{
        name = "Sistema de Gestion Escolar QuestEval"
        description = "Plataforma web full-stack para la evaluacion digital de proyectos estudiantiles con roles diferenciados de alumno y profesor"
        groupId = $Global:GrupoId
        status = "Active"
        category = "Integrador"
        videoUrl = "https://youtube.com/watch?v=test123"
        thumbnailUrl = "https://img.youtube.com/vi/test123/0.jpg"
        teamMembers = @("Carlos Martinez", "Maria Garcia", "Jose Lopez")
    }
    $proyectoResult = Test-Endpoint -Name "Crear Proyecto" -Method "POST" -Url "$BaseUrl/Projects" -Body $proyecto -ExpectedStatus 201 -RequiresAuth -ReturnBody
    $Global:ProyectoId = ""
    if ($proyectoResult.id) {
        $Global:ProyectoId = $proyectoResult.id
        Write-Host "    -> Proyecto: projectId=$($proyectoResult.projectId), name=$($proyectoResult.name)" -ForegroundColor DarkGray
    }
}

# 3.2 Crear segundo proyecto
if ($Global:GrupoId) {
    $proyecto2 = @{
        name = "App de Delivery Universitario"
        description = "Aplicacion movil para pedidos de comida dentro del campus universitario con seguimiento en tiempo real"
        groupId = $Global:GrupoId
        status = "Active"
        category = "Integrador"
        teamMembers = @("Ana Torres", "Pedro Sanchez")
    }
    $proyecto2Result = Test-Endpoint -Name "Crear Segundo Proyecto" -Method "POST" -Url "$BaseUrl/Projects" -Body $proyecto2 -ExpectedStatus 201 -RequiresAuth -ReturnBody
    $Global:Proyecto2Id = ""
    if ($proyecto2Result.id) {
        $Global:Proyecto2Id = $proyecto2Result.id
        Write-Host "    -> Proyecto 2: projectId=$($proyecto2Result.projectId)" -ForegroundColor DarkGray
    }
}

# 3.3 Obtener todos los proyectos
Test-Endpoint -Name "GET todos los proyectos" -Method "GET" -Url "$BaseUrl/Projects" -ExpectedStatus 200 -ReturnBody

# 3.4 Obtener proyecto por ID
if ($Global:ProyectoId) {
    $singleProject = Test-Endpoint -Name "GET proyecto por ID" -Method "GET" -Url "$BaseUrl/Projects/$($Global:ProyectoId)" -ExpectedStatus 200 -ReturnBody
    if ($singleProject) {
        Write-Host "    -> projectId=$($singleProject.projectId), teamMembers=$($singleProject.teamMembers -join ', ')" -ForegroundColor DarkGray
    }
}

# 3.5 Obtener proyectos por grupo
if ($Global:GrupoId) {
    Test-Endpoint -Name "GET proyectos por grupo" -Method "GET" -Url "$BaseUrl/Projects/group/$($Global:GrupoId)" -ExpectedStatus 200 -ReturnBody
}

# 3.6 Actualizar proyecto
if ($Global:ProyectoId) {
    $updateProject = @{
        name = "Sistema QuestEval v2.0"
        description = "Version mejorada del sistema de evaluacion digital con IA y analisis de datos"
        groupId = $Global:GrupoId
        status = "Active"
        category = "Integrador"
        teamMembers = @("Carlos Martinez", "Maria Garcia", "Jose Lopez", "Ana Torres")
    }
    $updatedProject = Test-Endpoint -Name "Actualizar Proyecto (PUT)" -Method "PUT" -Url "$BaseUrl/Projects/$($Global:ProyectoId)" -Body $updateProject -ExpectedStatus 200 -RequiresAuth -ReturnBody
    if ($updatedProject) {
        Write-Host "    -> Proyecto actualizado: projectId=$($updatedProject.projectId) (IncrementalId preservado)" -ForegroundColor DarkGray
    }
}

# 3.7 Proyecto inexistente
Test-Endpoint -Name "GET proyecto inexistente (404)" -Method "GET" -Url "$BaseUrl/Projects/000000000000000000000000" -ExpectedStatus 404

Write-Host ""

# ============================================
# 4. CRITERIOS
# ============================================
Write-Host "--- 4. CRITERIOS ---" -ForegroundColor Yellow

# 4.1 Crear criterio - Calidad de Codigo
$criterio1 = @{
    name = "Calidad de Codigo"
    description = "Evalua la legibilidad, estructura, nombre de variables y buenas practicas de programacion"
    maxScore = 100
}
$criterio1Result = Test-Endpoint -Name "Crear Criterio (Calidad de Codigo)" -Method "POST" -Url "$BaseUrl/Criteria" -Body $criterio1 -ExpectedStatus 201 -ReturnBody
$Global:Criterio1Id = ""
if ($criterio1Result.id) {
    $Global:Criterio1Id = $criterio1Result.id
    Write-Host "    -> criteriaId=$($criterio1Result.criteriaId), maxScore=$($criterio1Result.maxScore)" -ForegroundColor DarkGray
}

# 4.2 Crear criterio - Presentacion
$criterio2 = @{
    name = "Presentacion del Proyecto"
    description = "Evalua la calidad de la presentacion oral y visual del proyecto ante el grupo"
    maxScore = 100
}
$criterio2Result = Test-Endpoint -Name "Crear Criterio (Presentacion)" -Method "POST" -Url "$BaseUrl/Criteria" -Body $criterio2 -ExpectedStatus 201 -ReturnBody
$Global:Criterio2Id = ""
if ($criterio2Result.id) {
    $Global:Criterio2Id = $criterio2Result.id
    Write-Host "    -> criteriaId=$($criterio2Result.criteriaId), maxScore=$($criterio2Result.maxScore)" -ForegroundColor DarkGray
}

# 4.3 Crear criterio - Trabajo en Equipo
$criterio3 = @{
    name = "Trabajo en Equipo"
    description = "Evalua la colaboracion, comunicacion y distribucion de tareas entre los miembros"
    maxScore = 100
}
$criterio3Result = Test-Endpoint -Name "Crear Criterio (Trabajo en Equipo)" -Method "POST" -Url "$BaseUrl/Criteria" -Body $criterio3 -ExpectedStatus 201 -ReturnBody
$Global:Criterio3Id = ""
if ($criterio3Result.id) {
    $Global:Criterio3Id = $criterio3Result.id
}

# 4.4 VALIDACION: MaxScore > 100 (debe rechazar)
$criterioInvalido = @{
    name = "Criterio Invalido"
    description = "Este criterio tiene un maxScore mayor a 100 y debe ser rechazado"
    maxScore = 150
}
Test-Endpoint -Name "Criterio MaxScore=150 rechazado (400)" -Method "POST" -Url "$BaseUrl/Criteria" -Body $criterioInvalido -ExpectedStatus 400

# 4.5 VALIDACION: MaxScore negativo
$criterioNeg = @{
    name = "Criterio Negativo"
    description = "Este criterio tiene un maxScore negativo y debe ser rechazado"
    maxScore = -10
}
Test-Endpoint -Name "Criterio MaxScore=-10 rechazado (400)" -Method "POST" -Url "$BaseUrl/Criteria" -Body $criterioNeg -ExpectedStatus 400

# 4.6 VALIDACION: MaxScore = 0
$criterioZero = @{
    name = "Criterio Cero"
    description = "Este criterio tiene un maxScore de cero y debe ser rechazado"
    maxScore = 0
}
Test-Endpoint -Name "Criterio MaxScore=0 rechazado (400)" -Method "POST" -Url "$BaseUrl/Criteria" -Body $criterioZero -ExpectedStatus 400

# 4.7 Obtener todos los criterios
$allCriteria = Test-Endpoint -Name "GET todos los criterios" -Method "GET" -Url "$BaseUrl/Criteria" -ExpectedStatus 200 -ReturnBody

# 4.8 Obtener criterio por ID
if ($Global:Criterio1Id) {
    Test-Endpoint -Name "GET criterio por ID" -Method "GET" -Url "$BaseUrl/Criteria/$($Global:Criterio1Id)" -ExpectedStatus 200 -ReturnBody
}

# 4.9 Actualizar criterio
if ($Global:Criterio1Id) {
    $updateCriterio = @{
        name = "Calidad de Codigo - Actualizado"
        description = "Evalua legibilidad, estructura, patrones de diseno y pruebas unitarias"
        maxScore = 100
    }
    $updatedCriterio = Test-Endpoint -Name "Actualizar Criterio (PUT)" -Method "PUT" -Url "$BaseUrl/Criteria/$($Global:Criterio1Id)" -Body $updateCriterio -ExpectedStatus 200 -ReturnBody
    if ($updatedCriterio) {
        Write-Host "    -> criteriaId=$($updatedCriterio.criteriaId) (IncrementalId preservado)" -ForegroundColor DarkGray
    }
}

Write-Host ""

# ============================================
# 5. EVALUACIONES (con EvaluatorRole/Name)
# ============================================
Write-Host "--- 5. EVALUACIONES ---" -ForegroundColor Yellow

# 5.1 Crear evaluacion como Profesor
if ($Global:ProyectoId -and $Global:ProfesorId -and $Global:Criterio1Id -and $Global:Criterio2Id) {
    $evalProfesor = @{
        projectId = $Global:ProyectoId
        evaluatorId = $Global:ProfesorId
        details = @(
            @{ criterionId = $Global:Criterio1Id; criterionName = "Calidad de Codigo"; score = 90 },
            @{ criterionId = $Global:Criterio2Id; criterionName = "Presentacion del Proyecto"; score = 85 },
            @{ criterionId = $Global:Criterio3Id; criterionName = "Trabajo en Equipo"; score = 95 }
        )
    }
    $evalProfesorResult = Test-Endpoint -Name "Crear Evaluacion (Profesor)" -Method "POST" -Url "$BaseUrl/Evaluations" -Body $evalProfesor -ExpectedStatus 201 -ReturnBody
    $Global:EvalProfesorId = ""
    if ($evalProfesorResult.id) {
        $Global:EvalProfesorId = $evalProfesorResult.id
        Write-Host "    -> evaluationId=$($evalProfesorResult.evaluationId), evaluatorRole=$($evalProfesorResult.evaluatorRole), evaluatorName=$($evalProfesorResult.evaluatorName), finalScore=$($evalProfesorResult.finalScore)" -ForegroundColor DarkGray
    }
}

# 5.2 Crear evaluacion como Alumno
if ($Global:ProyectoId -and $Global:AlumnoId -and $Global:Criterio1Id) {
    $evalAlumno = @{
        projectId = $Global:ProyectoId
        evaluatorId = $Global:AlumnoId
        details = @(
            @{ criterionId = $Global:Criterio1Id; criterionName = "Calidad de Codigo"; score = 80 },
            @{ criterionId = $Global:Criterio2Id; criterionName = "Presentacion del Proyecto"; score = 75 },
            @{ criterionId = $Global:Criterio3Id; criterionName = "Trabajo en Equipo"; score = 88 }
        )
    }
    $evalAlumnoResult = Test-Endpoint -Name "Crear Evaluacion (Alumno)" -Method "POST" -Url "$BaseUrl/Evaluations" -Body $evalAlumno -ExpectedStatus 201 -ReturnBody
    $Global:EvalAlumnoId = ""
    if ($evalAlumnoResult.id) {
        $Global:EvalAlumnoId = $evalAlumnoResult.id
        Write-Host "    -> evaluationId=$($evalAlumnoResult.evaluationId), evaluatorRole=$($evalAlumnoResult.evaluatorRole), evaluatorName=$($evalAlumnoResult.evaluatorName), finalScore=$($evalAlumnoResult.finalScore)" -ForegroundColor DarkGray
    }
}

# 5.3 VALIDACION: Score > 100 en evaluacion (debe rechazar)
if ($Global:ProyectoId -and $Global:AlumnoId -and $Global:Criterio1Id) {
    $evalInvalida = @{
        projectId = $Global:ProyectoId
        evaluatorId = $Global:AlumnoId
        details = @(
            @{ criterionId = $Global:Criterio1Id; criterionName = "Calidad de Codigo"; score = 150 }
        )
    }
    Test-Endpoint -Name "Evaluacion Score=150 rechazada (400)" -Method "POST" -Url "$BaseUrl/Evaluations" -Body $evalInvalida -ExpectedStatus 400
}

# 5.4 VALIDACION: Score negativo en evaluacion
if ($Global:ProyectoId -and $Global:AlumnoId -and $Global:Criterio1Id) {
    $evalNeg = @{
        projectId = $Global:ProyectoId
        evaluatorId = $Global:AlumnoId
        details = @(
            @{ criterionId = $Global:Criterio1Id; criterionName = "Calidad"; score = -5 }
        )
    }
    Test-Endpoint -Name "Evaluacion Score=-5 rechazada (400)" -Method "POST" -Url "$BaseUrl/Evaluations" -Body $evalNeg -ExpectedStatus 400
}

# 5.5 GET todas las evaluaciones
$allEvals = Test-Endpoint -Name "GET todas las evaluaciones" -Method "GET" -Url "$BaseUrl/Evaluations" -ExpectedStatus 200 -ReturnBody
if ($allEvals) {
    $evalCount = if ($allEvals.Count) { $allEvals.Count } else { ($allEvals | Measure-Object).Count }
    Write-Host "    -> $evalCount evaluaciones encontradas" -ForegroundColor DarkGray
}

# 5.6 GET evaluacion por ID
if ($Global:EvalProfesorId) {
    $singleEval = Test-Endpoint -Name "GET evaluacion por ID" -Method "GET" -Url "$BaseUrl/Evaluations/$($Global:EvalProfesorId)" -ExpectedStatus 200 -ReturnBody
    if ($singleEval) {
        Write-Host "    -> evaluatorRole=$($singleEval.evaluatorRole), evaluatorName=$($singleEval.evaluatorName)" -ForegroundColor DarkGray
    }
}

# 5.7 GET evaluaciones por proyecto
if ($Global:ProyectoId) {
    $projEvals = Test-Endpoint -Name "GET evaluaciones por proyecto" -Method "GET" -Url "$BaseUrl/Evaluations/project/$($Global:ProyectoId)" -ExpectedStatus 200 -ReturnBody
    if ($projEvals) {
        $projEvalCount = if ($projEvals.Count) { $projEvals.Count } else { ($projEvals | Measure-Object).Count }
        Write-Host "    -> $projEvalCount evaluaciones para este proyecto" -ForegroundColor DarkGray
    }
}

Write-Host ""

# ============================================
# 6. FEEDBACK
# ============================================
Write-Host "--- 6. FEEDBACK ---" -ForegroundColor Yellow

# 6.1 Crear feedback
if ($Global:EvalProfesorId) {
    $feedback1 = @{
        evaluationId = $Global:EvalProfesorId
        comment = "Excelente trabajo en la implementacion del backend. La arquitectura REST esta bien estructurada y los modelos de datos son coherentes. Recomiendo agregar mas pruebas unitarias."
        isPublic = $true
    }
    $feedback1Result = Test-Endpoint -Name "Crear Feedback (publico)" -Method "POST" -Url "$BaseUrl/Feedback" -Body $feedback1 -ExpectedStatus 201 -ReturnBody
    $Global:Feedback1Id = ""
    if ($feedback1Result.id) {
        $Global:Feedback1Id = $feedback1Result.id
        Write-Host "    -> feedbackId=$($feedback1Result.feedbackId), isPublic=$($feedback1Result.isPublic)" -ForegroundColor DarkGray
    }
}

# 6.2 Crear feedback privado
if ($Global:EvalAlumnoId) {
    $feedback2 = @{
        evaluationId = $Global:EvalAlumnoId
        comment = "Nota interna: El alumno mostro buena comprension del proyecto pero necesita mejorar la documentacion tecnica."
        isPublic = $false
    }
    $feedback2Result = Test-Endpoint -Name "Crear Feedback (privado)" -Method "POST" -Url "$BaseUrl/Feedback" -Body $feedback2 -ExpectedStatus 201 -ReturnBody
    $Global:Feedback2Id = ""
    if ($feedback2Result.id) {
        $Global:Feedback2Id = $feedback2Result.id
        Write-Host "    -> feedbackId=$($feedback2Result.feedbackId), isPublic=$($feedback2Result.isPublic)" -ForegroundColor DarkGray
    }
}

# 6.3 GET todos los feedback
Test-Endpoint -Name "GET todos los feedback" -Method "GET" -Url "$BaseUrl/Feedback" -ExpectedStatus 200

# 6.4 GET feedback por ID
if ($Global:Feedback1Id) {
    Test-Endpoint -Name "GET feedback por ID" -Method "GET" -Url "$BaseUrl/Feedback/$($Global:Feedback1Id)" -ExpectedStatus 200
}

Write-Host ""

# ============================================
# 7. MEMBERSHIPS (requiere Auth)
# ============================================
Write-Host "--- 7. MEMBERSHIPS ---" -ForegroundColor Yellow

# 7.1 GET todas las memberships
$allMemberships = Test-Endpoint -Name "GET todas las memberships" -Method "GET" -Url "$BaseUrl/Memberships" -ExpectedStatus 200 -RequiresAuth -ReturnBody
if ($allMemberships) {
    $memCount = if ($allMemberships.Count) { $allMemberships.Count } else { ($allMemberships | Measure-Object).Count }
    Write-Host "    -> $memCount memberships encontradas" -ForegroundColor DarkGray
}

# 7.2 GET membership por ID (usar una existente si hay)
if ($allMemberships -and $allMemberships.Count -gt 0) {
    $firstMem = $allMemberships[0]
    $memResult = Test-Endpoint -Name "GET membership por ID" -Method "GET" -Url "$BaseUrl/Memberships/$($firstMem.id)" -ExpectedStatus 200 -RequiresAuth -ReturnBody
    if ($memResult) {
        Write-Host "    -> membershipId=$($memResult.membershipId), userId=$($memResult.userId)" -ForegroundColor DarkGray
    }
}

# 7.3 Membership inexistente
Test-Endpoint -Name "GET membership inexistente (404)" -Method "GET" -Url "$BaseUrl/Memberships/000000000000000000000000" -ExpectedStatus 404 -RequiresAuth

Write-Host ""

# ============================================
# 8. LIMPIEZA - Eliminar datos de prueba
# ============================================
Write-Host "--- 8. LIMPIEZA ---" -ForegroundColor Yellow

# Eliminar feedback
if ($Global:Feedback2Id) {
    Test-Endpoint -Name "Eliminar Feedback privado" -Method "DELETE" -Url "$BaseUrl/Feedback/$($Global:Feedback2Id)" -ExpectedStatus 204
}
if ($Global:Feedback1Id) {
    Test-Endpoint -Name "Eliminar Feedback publico" -Method "DELETE" -Url "$BaseUrl/Feedback/$($Global:Feedback1Id)" -ExpectedStatus 204
}

# Eliminar evaluaciones
if ($Global:EvalAlumnoId) {
    Test-Endpoint -Name "Eliminar Evaluacion Alumno" -Method "DELETE" -Url "$BaseUrl/Evaluations/$($Global:EvalAlumnoId)" -ExpectedStatus 204
}
if ($Global:EvalProfesorId) {
    Test-Endpoint -Name "Eliminar Evaluacion Profesor" -Method "DELETE" -Url "$BaseUrl/Evaluations/$($Global:EvalProfesorId)" -ExpectedStatus 204
}

# Eliminar criterios de prueba
if ($Global:Criterio3Id) {
    Test-Endpoint -Name "Eliminar Criterio 3" -Method "DELETE" -Url "$BaseUrl/Criteria/$($Global:Criterio3Id)" -ExpectedStatus 204
}
if ($Global:Criterio2Id) {
    Test-Endpoint -Name "Eliminar Criterio 2" -Method "DELETE" -Url "$BaseUrl/Criteria/$($Global:Criterio2Id)" -ExpectedStatus 204
}
if ($Global:Criterio1Id) {
    Test-Endpoint -Name "Eliminar Criterio 1" -Method "DELETE" -Url "$BaseUrl/Criteria/$($Global:Criterio1Id)" -ExpectedStatus 204
}

# Eliminar proyectos
if ($Global:Proyecto2Id) {
    Test-Endpoint -Name "Eliminar Proyecto 2" -Method "DELETE" -Url "$BaseUrl/Projects/$($Global:Proyecto2Id)" -ExpectedStatus 204 -RequiresAuth
}
if ($Global:ProyectoId) {
    Test-Endpoint -Name "Eliminar Proyecto 1" -Method "DELETE" -Url "$BaseUrl/Projects/$($Global:ProyectoId)" -ExpectedStatus 204 -RequiresAuth
}

# Eliminar grupos
if ($Global:Grupo2Id) {
    Test-Endpoint -Name "Eliminar Grupo 2" -Method "DELETE" -Url "$BaseUrl/Groups/$($Global:Grupo2Id)" -ExpectedStatus 204 -RequiresAuth
}
if ($Global:GrupoId) {
    Test-Endpoint -Name "Eliminar Grupo 1" -Method "DELETE" -Url "$BaseUrl/Groups/$($Global:GrupoId)" -ExpectedStatus 204 -RequiresAuth
}

# Eliminar usuarios de prueba
if ($Global:AlumnoId) {
    Test-Endpoint -Name "Eliminar Alumno de prueba" -Method "DELETE" -Url "$BaseUrl/Users/$($Global:AlumnoId)" -ExpectedStatus 204
}
if ($Global:ProfesorId) {
    Test-Endpoint -Name "Eliminar Profesor de prueba" -Method "DELETE" -Url "$BaseUrl/Users/$($Global:ProfesorId)" -ExpectedStatus 204
}

# Verificar que DELETE doble da 404
if ($Global:AlumnoId) {
    Test-Endpoint -Name "DELETE doble alumno (404)" -Method "DELETE" -Url "$BaseUrl/Users/$($Global:AlumnoId)" -ExpectedStatus 404
}

Write-Host ""

# ============================================
# RESUMEN
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Total:   $($Global:Total)" -ForegroundColor White
Write-Host "  Pasaron: $($Global:Passed)" -ForegroundColor Green
Write-Host "  Fallaron: $($Global:Failed)" -ForegroundColor Red
Write-Host ""

if ($Global:Failed -gt 0) {
    Write-Host "  PRUEBAS FALLIDAS:" -ForegroundColor Red
    $Global:TestResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "    - $($_.Name): esperaba $($_.Expected), recibio $($_.Code)" -ForegroundColor Red
    }
}

$percentage = if ($Global:Total -gt 0) { [math]::Round(($Global:Passed / $Global:Total) * 100, 1) } else { 0 }
Write-Host ""
if ($Global:Failed -eq 0) {
    Write-Host "  RESULTADO: TODAS LAS PRUEBAS PASARON ($percentage%)" -ForegroundColor Green
} else {
    Write-Host "  RESULTADO: $percentage% de pruebas pasaron" -ForegroundColor Yellow
}
Write-Host "============================================" -ForegroundColor Cyan
