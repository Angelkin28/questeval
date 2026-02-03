# QuestEval - Project Architecture

This project follows **Clean Architecture** principles.

## 📂 Project Structure

### `src/domain`
The core of the application. Contains enterprise logic and types.
- **`entities/`**: `Usuario`, `Rol`, `Alumno`, `Proyecto`, `Criterio`, `Evaluación`, `Calificación`.
- Pure business rules, no dependencies on outer layers.

### `src/application`
Orchestration of domain logic.
- **`use-cases/`**: `RegistrarEvaluacion`, `CalcularCalificacion`, `ConsultarResultados`, etc.
- **`interfaces/`**: Repository definitions (ports) to be implemented by Infrastructure.

### `src/infrastructure`
Implementation of interfaces defined in Application.
- **`database/`**: MySQL connection and configuration.
- **`repositories/`**: Concrete implementations of repositories.
- **`auth/`**: JWT authentication implementation.

### `src/presentation`
Entry points and UI.
- **`api/`**: REST Controllers/Routes.
- **`web/`**: Web Application.
- **`mobile/`**: Mobile Application code.
- **`kiosk/`**: Kiosk Mode specific code.

---

## Dependency Rule
`Presentation` -> `Infrastructure` -> `Application` -> `Domain`
(Dependencies point inwards).
