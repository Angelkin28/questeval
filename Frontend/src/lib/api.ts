const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5122/api';

export interface RegisterRequest {
    email: string;
    enrollment: string;
    password: string;
    fullName: string;
    role?: string;
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
}

export interface UserResponse {
    id: string;
    email: string;
    enrollment: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    createdAt: string;
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
    status: 'In Progress' | 'Completed' | 'Evaluated';
    category?: 'Integrador' | 'Videojuegos'; // Assuming categories based on frontend
    score?: number;
    teamId?: string;
    thumbnailUrl?: string; // For images
    videoUrl?: string;     // For videos
    createdAt?: string;
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
                const error = await response.json();
                throw new Error(error.message || 'Error al iniciar sesión');
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
                // Handle specific error formats from ASP.NET Core
                let errorMessage = 'Error al registrarse';
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

        create: async (project: Omit<Project, 'id'>): Promise<Project> => {
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
    }
};
