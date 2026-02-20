# Documentación de Errores y Arquitectura (QuestEval API)

Además de los errores de validación HTTP de los endpoints, este documento detalla los **errores lógicos (bugs de integridad de datos)** y **problemas arquitectónicos de manejo de procesos** del backend en .NET Core / MongoDB.

---

## 🏗️ Problemas Globales de Arquitectura y Manejo de Procesos

Durante la revisión del código de los Servicios (`Services/`) y Controladores (`Controllers/`), se encontraron los siguientes problemas de arquitectura comunes a toda la aplicación:

### 1. Inmutabilidad Excesiva y Falta de Cascadas (NoSQL sin control a nivel de aplicación)
Al usar MongoDB (NoSQL), la base de datos no tiene llaves foráneas (*Foreign Keys*) automáticas ni eliminaciones en cascada.
* **El Problema:** Actualmente ningún servicio maneja las dependencias. Si llamas al endpoint `DELETE /api/Users/{id}`, el `UsersService` simplemente ejecuta `await _collection.DeleteOneAsync(x => x.Id == id);`.
* **Consecuencia:** Es el equivalente a eliminar una carpeta principal mientras quedan accesos directos por toda la computadora. Quedarán `Memberships`, `Evaluations` de este maestro y `Projects` donde participaba este alumno huérfanos. Las consultas futuras pueden lanzar Null Reference Exceptions o enviar datos irrelevantes al FrontEnd.
* **Solución Arquitectónica:** 
  1. O bien usar "Borrado Lógico" añadiendo una propiedad en `User` llamada `public bool IsDeleted { get; set; } = false;` y simplemente marcarlo en vez de borrar el documento (esto es lo más común y seguro).
  2. O bien inyectar Eventos o crear un "Service Orchestrator" que al borrar un usuario, vaya a borrar las evaluaciones, membresías, etc.

### 2. Condición de Carrera en Autoincrementables (`GetNextIdAsync`)
En todos los servicios hay una función basada en `FindOneAndUpdateAsync` para simular llaves incrementales de SQL (`IncrementalId`).
* **El Problema:** La función `GetNextIdAsync` es invocada desde el servicio durante las creaciones `CreateAsync` de cada modelo. A nivel global se usa para "contar", pero MongoDB no maneja transicionalidad estricta para IDs relacionales si se envían múltiples request concurrentes (ej: registrar 50 alumnos al mismo tiempo). 
* **Solución Arquitectónica:** Deberían enfocarse en usar el `ObjectId` (`Id` de BSON predeterminado) de MongoDB que es garantizado único. Convertir en obsoleto `IncrementalId` o sólo generarlo de forma asincrónica si es absolutamente necesario para propósitos visuales (como "Proyecto #102"), pero nunca usarlo en lugar de `Id` para mapeos.

### 3. Falta de Uso de Transacciones
Para flujos que escriben en más de una colección a la vez.
* **El Problema:** En `GroupsController.Post()`, ocurren dos cosas:
  1. `await _service.CreateAsync(newGroup);`
  2. `await _membershipsService.CreateAsync(new Membership { UserId, GroupId });`
* **Consecuencia:** Si la línea #1 tiene éxito, pero la línea #2 falla (por pérdida de conexión de base de datos o excepción de RAM), nos quedaremos con un Grupo en base de datos al que "nadie" tiene acceso, y nadie es dueño. En SQL, esto se soluciona haciendo `BEGIN TRAN; ... COMMIT;`. 
* **Solución Arquitectónica:** Emplear la característica de [Transacciones Multi-Documento de MongoDB](https://www.mongodb.com/docs/manual/core/transactions/) instanciando una `IClientSessionHandle` usando `using var session = await _mongoClient.StartSessionAsync(); session.StartTransaction();`.

### 4. Responsabilidades Mezcladas y Validaciones Faltantes
* **El Problema:** Los `Controllers` actualmente contienen validaciones mixtas, algunas usando `ModelState.IsValid` (Atributos nativos de C# Dto) y validaciones como `user == null`. Pero otras más pesadas a nivel de negocio simplemente no existen (ej: "Solo el creador del proyecto puede borrar el proyecto").
* **Solución Arquitectónica:** Separar la lógica pesada a los `Services`. Un Controlador sólo debería recibir la petición HTTP, pasarla al servicio, y recibir como retorno un Modelo (200), Falso/Opcional (404) o lanzar una Excepción controlada (400/403). Mover validaciones como *¿El usuario tiene permisos para estar en este grupo?* de los Controllers a los Services.

---

*(Las secciones de API individuales siguen a continuación)*

## 🧑‍💻 1. Users (`/api/Users`)

### 🐛 Errores Lógicos en Backend y Soluciones
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Eliminación Física de Usuarios sin cascada (`DELETE /{id}`)** | Si un usuario es eliminado, sus Membresías, Proyectos (en `TeamMembers`), y Evaluaciones quedan "huérfanos". Cuando la UI intente cargarlos con otro endpoint, podría romper si espera un usuario válido a través del ID. | 💡 **Solución:** Implementar eliminación lógica (`IsDeleted = true`) en lugar de física, **O** al eliminar el usuario, eliminar también en cascada sus `Memberships` y limpiar su ID de los arrays en `Projects` y `Evaluations`. |
| **Aprobación de Maestro Inexistente** | El método `ApproveTeacher` recibe un `TeacherId`. Si se manda un ID que no existe, `UpdateTeacherStatusAsync` puede fallar silenciosamente y aún retornar 200 ya que no interrumpe el proceso. | 💡 **Solución:** Validar que `(await _service.GetByIdAsync(request.TeacherId)) != null` **antes** de actualizar el estado, devolviendo un explícito `404 Not Found`. |
| **Validación de Roles Débil** | Sólo `ApproveTeacher` verifica el rol en el token. El registro de "Maestro" depende unícamente del Enum de string ingresado en el JSON `{ "role": "Profesor" }`. | 💡 **Solución:** Configurar las políticas de Authorize nativas usando `[Authorize(Roles = "Admin, Profesor")]` en endpoints críticos. |

---

## 📋 2. Criteria (`/api/Criteria`)

### 🐛 Errores Lógicos en Backend y Soluciones
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Eliminación y/o Modificación de Criterios en uso (`DELETE / PUT`)** | Si un criterio es eliminado, las Evaluaciones ya hechas que guardaron `CriterionId` no podrán cargar los detalles actualizados. | 💡 **Solución:** Antes de borrar un criterio, inyectar el Servicio de Evaluaciones y revisar si este criterio ya está siendo usado (hay historial de él). Si es así, lanzar respuesta `409 Conflict`. |

---

## 📊 3. Evaluations (`/api/Evaluations`)

### 🐛 Errores Lógicos en Backend y Soluciones (CRÍTICO)
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Falta validación de `ProjectId` y `EvaluatorId` (`POST /`)** | Puedes hacer un POST mandando un `ProjectId` falso. La BD guarda la evaluación, creando una calificación a de un proyecto que "no existe" o hecha por alguién que no existe. | 💡 **Solución:** Validar `if (await _projectsService.GetByIdAsync(request.ProjectId) == null) return BadRequest("El Proyecto no existe.");` Hacer lo mismo con EvaluatorId. |
| **Falta validación de los `Details.CriterionId` (`POST /`)** | El cliente puede enviar IDs de criterios inventados (`CriterionId:` "123"). Se guardará un puntero a nada en la tabla subdocumentos `Details`. | 💡 **Solución:** Obtener todos los IDs de criterios válidos desde BD y que los enviados en `request.Details` hagan 'match'. |
| **Inmutabilidad Incompleta** | Se declara por comentarios que no deberían actualizarse para guardar el historial. Pero no se protegió la ruta de eliminación (`DELETE / {id}`). | 💡 **Solución:** Debería bloquearse (remover) la ruta de eliminación por un alumno, permitiendo borrar evaluaciones solo a un Administrador (`[Authorize(Roles = "Admin")]`). |

---

## 👥 4. Groups (`/api/Groups`)

### 🐛 Errores Lógicos en Backend y Soluciones
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Claves Duplicadas (`POST /` y `PUT /`)** | Se pueden crear múltiples grupos con la misma contraseña (`AccessCode`). En `/join`, el sistema tomará **el primer grupo que coincida**. | 💡 **Solución:** En `GroupsService.CreateAsync`, verificar: `var existing = GetAll().FirstOrDefault(g => g.AccessCode == AccessCode);` Si ya existe, retornar error. |
| **Eliminación Física** | Igual que con Usuarios. Eliminar un Grupo no suprime sus Proyectos ni sus Membresías (`Memberships`), corrompiendo las UI's hijas. | 💡 **Solución:** Al eliminar el Grupo, borrar sus descendientes (`Projects` y `Memberships`) mediante orchestración. |

---

## 🏷️ 5. Memberships (`/api/Memberships`)

### 🐛 Errores Lógicos en Backend y Soluciones
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Inyección de IDs Inexistentes** | `POST /` no interroga si el UserId o GroupId realmente son registros de la base. | 💡 **Solución:** En `MembershipsController.Post`: Validar que `UserId` y `GroupId` existan.  Además la BD de MongoDB debe marcar una validación combinada de índice para evitar duplicados. |

---

## 🚀 6. Projects (`/api/Projects`)

### 🐛 Errores Lógicos en Backend y Soluciones (CRÍTICO)
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Creación de proyectos ajenos / suplantación** | Se usa `request.GroupId` para crear el proyecto. El sistema asume ciegamente que sí le pertenece. | 💡 **Solución:** Recoger el id de usuario `ClaimTypes.NameIdentifier`. Usar `IMembershipsService` para cerciorar que el usuario realmente es miembro del `GroupId` en el que está pidiendo escribir su proyecto. |
| **`TeamMembers` Falsos** | En `TeamMembers`, puedes enviar IDs de gente inventada. | 💡 **Solución:** Recorrer la matriz y confirmar frente a `IUsersService` que cada usuario existe. |

---

## 💬 7. Feedback (`/api/Feedback`)

### 🐛 Errores Lógicos en Backend y Soluciones
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Huérfano de Evaluación** | Permite agregar retroalimentación a un `EvaluationId` que podría no existir. | 💡 **Solución:** Antes del POST de Feedback, pre-asegurar: `if (await _evaluationService.GetByIdAsync(request.EvaluationId) == null) HTTP 404/400;` |

---

## 🗄️ 8. Storage (`/api/Storage`)

### 🐛 Errores Lógicos en Backend y Soluciones
| Problema / Bug (IDs y dependencias) | Consecuencia en el flujo | Solución a implementar en el Controlador / Servicio |
|-------------------------------------|---------------------------|-----------------------------------------------------|
| **Bucket Supuestamente Libre** | Si la API no está protegida mediante Identity/Atributos `[Authorize]`, cualquier BOT puede peticionar y llenar el Bucket de Supabase. | � **Solución:** Agregar el atributo `[Authorize]` a todos los endpoints en el Storage Controller. |
