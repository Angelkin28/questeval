# README Postman Cambios

## Mejoras Implementadas

### 1. Sistema de IDs Incrementales

Se implementó un sistema de **IDs incrementales** para todas las entidades del sistema. Cada documento en MongoDB ahora tiene **dos IDs**:

| Campo | Tipo | Descripción |
|---|---|---|
| `_id` | ObjectId | ID nativo de MongoDB (se genera automáticamente, **no se toca**) |
| `IncrementalId` | String | ID corto incremental (`"1"`, `"2"`, `"3"`...) |

#### Entidades con IncrementalId:
- ✅ **Usuarios** (Alumnos, Profesores, Admin)
- ✅ **Grupos**
- ✅ **Proyectos**
- ✅ **Criterios de Evaluación**
- ✅ **Evaluaciones**
- ✅ **Feedback**
- ✅ **Membresías**

#### Comportamiento de los IDs:
- Los IDs **nunca se reutilizan**. Si se elimina el usuario con `IncrementalId: "2"`, el siguiente usuario creado tendrá `IncrementalId: "4"` (no "2").
- El contador se almacena en la colección `database_counters` de MongoDB.
- Al iniciar el servidor, se asignan `IncrementalId` automáticamente a los documentos existentes que no lo tengan.

### 2. Verificación de Usuarios

- Los usuarios existentes se marcan como verificados (`EmailVerified: true`, `VerificationStatus: "approved"`) durante la inicialización del servidor.
- Los nuevos usuarios registrados siguen el flujo normal de verificación.

---

## Pruebas en Postman

### URL Base
```
http://localhost:5122
```

### Swagger (Documentación interactiva)
```
http://localhost:5122/swagger
```

---

### Endpoints de Usuarios

#### Registrar un nuevo usuario
```
POST /api/users/register
Content-Type: application/json

{
    "email": "alumno1@test.com",
    "password": "123456",
    "fullName": "Alumno Test",
    "role": "Alumno"
}
```

**Respuesta esperada (201):**
```json
{
    "id": "67a3b5c8d1e2f3a4b5c6d7e8",
    "incrementalId": "1",
    "email": "alumno1@test.com",
    "fullName": "Alumno Test",
    "role": "Alumno"
}
```

#### Login
```
POST /api/users/login
Content-Type: application/json

{
    "email": "admin@questeval.com",
    "password": "Admin123!"
}
```

**Respuesta esperada (200):**
```json
{
    "userId": "67a3b5c8...",
    "incrementalId": "1",
    "email": "admin@questeval.com",
    "fullName": "Admin",
    "role": "Admin",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "emailVerified": true,
    "verificationStatus": "approved"
}
```

#### Obtener todos los usuarios
```
GET /api/users
```

#### Obtener un usuario por ID
```
GET /api/users/{id}
```
> Nota: Usa el `_id` de MongoDB (ObjectId), no el IncrementalId.

---

### Endpoints de Grupos

#### Crear un grupo
```
POST /api/groups
Content-Type: application/json

{
    "name": "Grupo A",
    "accessCode": "ABC123"
}
```

#### Obtener todos los grupos
```
GET /api/groups
```

#### Obtener un grupo por ID
```
GET /api/groups/{id}
```

#### Actualizar un grupo
```
PUT /api/groups/{id}
Content-Type: application/json

{
    "name": "Grupo A Modificado",
    "accessCode": "XYZ789"
}
```

#### Eliminar un grupo
```
DELETE /api/groups/{id}
```

---

### Endpoints de Criterios

#### Crear un criterio
```
POST /api/criteria
Content-Type: application/json

{
    "name": "Funcionalidad",
    "description": "El proyecto cumple con los requisitos funcionales",
    "maxScore": 10
}
```

#### Obtener todos los criterios
```
GET /api/criteria
```

#### Obtener un criterio por ID
```
GET /api/criteria/{id}
```

#### Actualizar un criterio
```
PUT /api/criteria/{id}
Content-Type: application/json

{
    "name": "Funcionalidad Actualizada",
    "description": "Descripción actualizada",
    "maxScore": 15
}
```

#### Eliminar un criterio
```
DELETE /api/criteria/{id}
```

---

### Endpoints de Evaluaciones

#### Crear una evaluación
```
POST /api/evaluations
Content-Type: application/json

{
    "projectId": "{id_del_proyecto}",
    "evaluatorId": "{id_del_evaluador}",
    "finalScore": 85.5,
    "details": [
        {
            "criterionId": "{id_del_criterio}",
            "criterionName": "Funcionalidad",
            "score": 9
        }
    ]
}
```

#### Obtener todas las evaluaciones
```
GET /api/evaluations
```

#### Obtener evaluaciones por proyecto
```
GET /api/evaluations/project/{projectId}
```

#### Eliminar una evaluación
```
DELETE /api/evaluations/{id}
```

---

### Endpoints de Feedback

#### Crear un feedback
```
POST /api/feedback
Content-Type: application/json

{
    "evaluationId": "{id_de_la_evaluacion}",
    "comment": "Buen trabajo, pero mejorar la documentación",
    "isPublic": true
}
```

#### Obtener todos los feedbacks
```
GET /api/feedback
```

#### Eliminar un feedback
```
DELETE /api/feedback/{id}
```

---

## Ejemplo de Documento en MongoDB

```json
{
    "_id": ObjectId("67a3b5c8d1e2f3a4b5c6d7e8"),
    "IncrementalId": "1",
    "Name": "Grupo A",
    "AccessCode": "ABC123",
    "CreatedAt": "2026-02-18T00:00:00Z"
}
```

## Notas Importantes

1. **Los endpoints usan el `_id` de MongoDB** (ObjectId) en las rutas, no el `IncrementalId`.
2. **El `IncrementalId` se asigna automáticamente** al crear un nuevo documento — no necesitas enviarlo en el body.
3. **Los IDs nunca se reutilizan** — si borras un registro, su ID no se vuelve a asignar.
4. **Al iniciar el servidor**, los documentos existentes que no tengan `IncrementalId` lo recibirán automáticamente.
5. **El usuario Admin** se recrea cada vez que se inicia el servidor con las credenciales: `admin@questeval.com` / `Admin123!`.
