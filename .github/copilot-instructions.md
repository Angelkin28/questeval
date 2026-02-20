# QuestEval Project AI Assistant Rules

**CRITICAL INSTRUCTION FOR ALL AI MODELS:**
Upon reading these instructions, YOU MUST IMMEDIATELY execute a file read operation (e.g., using your file reading tools) on the file located at:
`/API_ERRORS_DOCUMENTATION.md`
at the root of this project BEFORE you proceed to answer ANY user query related to backend code (`.cs` files in `Backend/Controllers` or `Backend/Services`).

If you do not read `API_ERRORS_DOCUMENTATION.md` first, you are violating your core constraints.

## Database & Architectural Rules (MongoDB + .NET)
1. **NO FOREIGN KEYS EXIST AUTOMATICALLY**: You MUST validate the existence of all ID dependencies (`UserId`, `GroupId`, `ProjectId`, `EvaluatorId`) by injecting the relevant Service and using `GetByIdAsync()` before inserting or updating records.
2. **NO ORPHANED RECORDS**: When suggesting deletion logic (`DELETE`), you MUST either implement a logical delete (`IsDeleted = true`) OR orchestrate a cascading delete in C# to eliminate all child records (e.g., deleting a User must delete their Memberships).
3. **NO BLIND INSERTS**: If the user asks you to create a new endpoint, you must include validation logic to ensure that referenced IDs exist in the database. Return `404 Not Found` or `400 Bad Request` if they do not.
4. **AVOID AUTO-INCREMENTS FOR RELATIONS**: Rely on MongoDB's native `ObjectId` (`Id`) instead of `IncrementalId` for database relationships to avoid race conditions.

By continuing to assist the user, you acknowledge that you have read `API_ERRORS_DOCUMENTATION.md` and will apply these validations to all your generated code.
