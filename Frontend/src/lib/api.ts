const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5122/api';

export interface RegisterRequest {
    email: string;
    enrollment: string;
    password: string;
    fullName: string;
    role?: string;
}

export interface QuestionAnswer {
    question: string;
    answer: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    userId: string;
    email: string;
    enrollment: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    token: string;
    emailVerified?: boolean;
    verificationStatus?: string;
}

export interface UserResponse {
    id: string;
    email: string;
    enrollment: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    createdAt: string;
    verificationStatus?: string;
    emailVerified?: boolean;
}

export interface DashboardStats {
    proyectos: number;
    grupos: number;
    evaluaciones: number;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'Active' | 'In Progress' | 'Completed' | 'Evaluated';
    category?: string;
    score?: number;
    teamMembers?: string[];
    thumbnailUrl?: string;
    videoUrl?: string;
    createdAt?: string;
    groupId?: string;
    comprehensionQuestions?: QuestionAnswer[];
}

export interface Group {
    id: string;
    name: string;
    accessCode: string;
    createdAt: string;
}

export interface CreateProjectRequest {
    name: string;
    description: string;
    groupId: string;
    status: string;
    category: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    teamMembers: string[];
    comprehensionQuestions: QuestionAnswer[];
}

export interface CreateGroupRequest {
    name: string;
    accessCode: string;
}



// ... (interfaces) 
export interface CreateGroupRequest {
    name: string;
    accessCode: string;
}

export interface UpdateGroupRequest {
    name: string;
    accessCode: string;
}

export interface CriterionResponse {
    id: string;
    criteriaId?: string;
    projectId?: string;
    name: string;
    description: string;
    maxScore: number;
}

export interface EvaluationDetailRequest {
    criterionId: string;
    criterionName: string;
    score: number;
}

export interface CreateEvaluationRequest {
    projectId: string;
    evaluatorId: string; // Should be handled by backend from token ideally, but reusing DTO for now
    details: EvaluationDetailRequest[];
}

export interface EvaluationDetailResponse {
    criterionId: string;
    criterionName: string;
    score: number;
}

export interface EvaluationResponse {
    id: string;
    projectId: string;
    evaluatorId: string;
    finalScore: number;
    details: EvaluationDetailResponse[];
    createdAt: string;
}

export interface GuestAccessRequest {
    fullName: string;
}

export interface GuestAccessResponse {
    id: string;
    fullName: string;
    role: string;
    token: string;
    userId?: string;
}

export const api = {
    auth: {
        // ... (login and register existing code)
        login: async (data: LoginRequest): Promise<LoginResponse> => {
            const response = await fetch(`${API_URL}/Users/login`, { // Capitalized 'Users' to match controller convention if needed, or keep lowercase
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                // El backend retorna ProblemDetails con campo 'detail'
                throw new Error(error.detail || error.message || 'Error al iniciar sesión');
            }

            return response.json();
        },

        register: async (data: RegisterRequest): Promise<UserResponse> => {
            const response = await fetch(`${API_URL}/Users/register`, { // Matching [HttpPost("register")] in Controller
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let errorMessage = 'Error al registrarse';
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.detail || error.title || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        },

        guestAccess: async (data: GuestAccessRequest): Promise<GuestAccessResponse> => {
            const response = await fetch(`${API_URL}/Users/guest-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let errorMessage = 'Error al acceder como invitado';
                try {
                    const error = await response.json();
                    errorMessage = error.message || JSON.stringify(error) || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        },
    },

    users: {
        getAll: async (): Promise<UserResponse[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Users`, { headers });
            if (!response.ok) throw new Error('Error al obtener usuarios');
            return response.json();
        },

        deleteUser: async (id: string): Promise<void> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Users/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!response.ok) throw new Error('Error al eliminar usuario');
        }
    },

    projects: {
        getAll: async (): Promise<Project[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/Projects`, { headers });

            if (!response.ok) {
                throw new Error('Error al obtener proyectos');
            }
            return response.json();
        },

        getMyProjects: async (): Promise<Project[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                const response = await fetch(`${API_URL}/Projects/mine`, { headers });
                // Retornar [] ante cualquier error (404, 401, etc.)
                if (!response.ok) return [];
                return response.json();
            } catch {
                return [];
            }
        },

        getById: async (id: string): Promise<Project> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/Projects/${id}`, { headers });

            if (!response.ok) {
                throw new Error('Error al obtener el proyecto');
            }
            return response.json();
        },

        create: async (project: CreateProjectRequest): Promise<Project> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/Projects`, {
                method: 'POST',
                headers,
                body: JSON.stringify(project)
            });

            if (!response.ok) {
                throw new Error('Error al crear proyecto');
            }
            return response.json();
        },

        generateQR: async (id: string): Promise<{ qrToken: string, expiresAt: string }> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/Projects/${id}/qr`, { headers });

            if (!response.ok) {
                throw new Error('Error al generar Token QR del proyecto');
            }
            return response.json();
        }
    },

    dashboard: {
        getStats: async (): Promise<DashboardStats> => {
            try {
                // Using the specific controllers
                const token = localStorage.getItem('token');
                const headers: HeadersInit = {};

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const [projectsRes, groupsRes, evaluationsRes] = await Promise.all([
                    fetch(`${API_URL}/Projects`, { headers }).catch(() => null),
                    fetch(`${API_URL}/Groups`, { headers }).catch(() => null),
                    fetch(`${API_URL}/Evaluations`, { headers }).catch(() => null)
                ]);

                // Safe parsing
                const projects = projectsRes?.ok ? await projectsRes.json() : [];
                const groups = groupsRes?.ok ? await groupsRes.json() : [];
                const evaluations = evaluationsRes?.ok ? await evaluationsRes.json() : [];

                // Assuming API returns lists directly
                return {
                    proyectos: Array.isArray(projects) ? projects.length : 0,
                    grupos: Array.isArray(groups) ? groups.length : 0,
                    evaluaciones: Array.isArray(evaluations) ? evaluations.length : 0,
                };
            } catch (error) {
                console.error('Error fetching stats:', error);
                return { proyectos: 0, grupos: 0, evaluaciones: 0 };
            }
        }
    },

    groups: {
        getAll: async (): Promise<Group[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Groups`, { headers });
            if (!response.ok) throw new Error('Error al obtener grupos');
            return response.json();
        },

        getMyGroups: async (): Promise<Group[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Groups/mine`, { headers });
            if (!response.ok) throw new Error('Error al obtener mis grupos');
            return response.json();
        },

        create: async (data: CreateGroupRequest): Promise<Group> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Groups`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.title || `Error al crear grupo (${response.status})`);
            }
            return response.json();
        },

        getById: async (id: string): Promise<Group> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Groups/${id}`, { headers });
            if (!response.ok) throw new Error('Error al obtener grupo');
            return response.json();
        },

        getMembers: async (id: string): Promise<UserResponse[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Groups/${id}/members`, { headers });
            if (!response.ok) throw new Error('Error al obtener miembros');
            return response.json();
        },

        getProjects: async (id: string): Promise<Project[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Groups/${id}/projects`, { headers });
            if (!response.ok) throw new Error('Error al obtener proyectos del grupo');
            return response.json();
        },

        join: async (accessCode: string): Promise<void> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Assuming there's an endpoint like POST /Groups/join
            const response = await fetch(`${API_URL}/Groups/join`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ accessCode }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Error al unirse al grupo' }));
                throw new Error(error.message || 'Error al unirse al grupo');
            }
        },

        joinAsTeacher: async (groupId: string): Promise<void> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Groups/${groupId}/join-teacher`, {
                method: 'POST',
                headers,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Error al unirse al grupo' }));
                throw new Error(error.message || 'Error al unirse al grupo');
            }
        }
    },

    evaluations: {
        getAll: async (): Promise<any[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Evaluations`, { headers });
            if (!response.ok) throw new Error('Error al obtener evaluaciones');
            return response.json();
        },
        getByProject: async (projectId: string): Promise<EvaluationResponse[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Evaluations/project/${projectId}`, { headers });
            if (!response.ok) throw new Error('Error al obtener evaluaciones del proyecto');
            return response.json();
        },
        create: async (data: CreateEvaluationRequest): Promise<EvaluationResponse> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Mapear nombres de campo al formato que espera el backend
            const body = {
                projectId: data.projectId,
                userId: data.evaluatorId,           // backend espera "userId" no "evaluatorId"
                details: data.details.map(d => ({
                    criteriaId: d.criterionId,      // backend espera "criteriaId" no "criterionId"
                    criterionName: d.criterionName,
                    score: d.score,
                })),
            };

            const response = await fetch(`${API_URL}/Evaluations`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(errBody.detail || errBody.title || errBody.message || 'Error al crear evaluación');
            }
            return response.json();
        }
    },

    criteria: {
        getAll: async (): Promise<CriterionResponse[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Criteria`, { headers });
            if (!response.ok) throw new Error('Error al obtener criterios');
            return response.json();
        },
        getByProject: async (projectId: string): Promise<CriterionResponse[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Criteria?projectId=${projectId}`, { headers });
            if (!response.ok) throw new Error('Error al obtener criterios del proyecto');
            return response.json();
        },
        create: async (data: Omit<CriterionResponse, 'id'>): Promise<CriterionResponse> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Criteria`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Error al crear criterio');
            return response.json();
        },
        update: async (id: string, data: Omit<CriterionResponse, 'id'>): Promise<void> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Criteria/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Error al actualizar criterio');
        },
        delete: async (id: string): Promise<void> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Criteria/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!response.ok) throw new Error('Error al eliminar criterio');
        }
    },

    storage: {
        upload: async (file: File): Promise<{ url: string }> => {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/Storage/upload`, {
                method: 'POST',
                headers,
                // No enviar Header Content-Type, fetch lo pone automáticamente con el boundary
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Error al subir archivo' }));
                throw new Error(error.message || 'Error al subir archivo');
            }
            return response.json();
        }
    },

    feedback: {
        create: async (data: { projectId: string; evaluatorId: string; comment: string }): Promise<void> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Feedback`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Error al crear feedback');
        },
        getByProject: async (projectId: string): Promise<any[]> => {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/Feedback/project/${projectId}`, { headers });
            if (!response.ok) throw new Error('Error al obtener feedback');
            return response.json();
        }
    }
};


