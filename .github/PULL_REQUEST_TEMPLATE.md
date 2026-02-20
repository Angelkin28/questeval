## 🚨 Importante: Reglas de la Base de Datos NoSQL y Prevención de Bugs

Antes de autorizar o solicitar la revisión de este Pull Request, **debes confirmar** que este código respeta las reglas de integridad de datos definidas en `API_ERRORS_DOCUMENTATION.md`. En MongoDB (NoSQL) **nosotros controlamos la integridad, no la base de datos**.

Por favor marca todas las casillas que apliquen (pon una `x` dentro de los corchetes `[x]`).

### Validaciones en POST y PUT (Manejo de Llaves Foráneas)
- [ ] Mi código **NO inserta/relaciona IDs a ciegas**. Si mi controlador recibe un `UserId`, `GroupId`, `ProjectId` u otro ID, primero verifiqué contra la base de datos que dicho documento realmente existe.
- [ ] Entiendo que si no compruebo la existencia de esos IDs, el frontend crasheará más tarde al intentar cargar "usuarios fantasma".

### Validaciones en DELETE (Cascadas)
- [ ] Mi código NO hace `_collection.DeleteOneAsync(...)` de una entidad padre (ej: `User` o `Group`) sin antes haber implementado un borrado en cascada para todos los hijos (`Memberships`, `Evaluations`, `Projects`).
- [ ] En su lugar, si no implementé borrado en cascada, he usado un Flag Lógico de eliminación (ej: `IsDeleted = true`).

### Concurrencia y Transaccionalidad
- [ ] He evitado usar `GetNextIdAsync()` (Auto-Incrementables) en la medida de lo posible para referenciar la relación entre tablas, ya que puede generar colisiones masivas concurriendo. Uso el `ObjectId` (`Id` de BSON) de MongoDB que es el garantizado único.
- [ ] Si estoy creando dos cosas dependientes que no pueden vivir la una sin la otra en dos colecciones distintas (Ej: Un "Grupo" y su primer "Miembro Dueño"), lo he envuelto en una **Transaction** o soy consciente del riesgo de que quede el dato huérfano si la memoria falla.

### Detalles de la Implementación General
_Describe brevemente los cambios técnicos y lógicos que hiciste en este PR:_

>
> *(Espacio para descripción)*
>

---

_Si no estás seguro de alguna de las casillas o tu asistente de IA de código generó la línea, revísalo manual o forzosamente leyendo el archivo de documentación de errores de la API primero._
