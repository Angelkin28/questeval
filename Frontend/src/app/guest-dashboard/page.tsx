'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Star, MessageSquare, AlertCircle } from 'lucide-react';

interface User {
    userId: string;
    fullName: string;
    role: string;
    token: string;
}

interface ProjectCard {
    id: string;
    name: string;
    description?: string;
    status: string;
    thumbnailUrl?: string;
    score?: number;
    teamMembers?: string[];
}

export default function GuestDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [projects, setProjects] = useState<ProjectCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!userData || !token) {
                router.push('/login');
                return;
            }

            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser.role !== 'Invitado') {
                    router.push('/dashboard');
                    return;
                }
                setUser(parsedUser);

                // Cargar proyectos
                const allProjects = await api.projects.getAll();
                setProjects(allProjects);
            } catch (err) {
                console.error('Error loading guest dashboard:', err);
                setError('Error al cargar los datos');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F7F2]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4" />
                    <p className="text-[#1A1A1A]/60">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F7F2]">
            {/* Header */}
            <header className="bg-white border-b border-black/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-[#D4AF37]" />
                        <div>
                            <h1 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide">
                                QuestEval Invitado
                            </h1>
                            <p className="text-xs text-[#1A1A1A]/50">Bienvenido, {user?.fullName}</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-sm px-4 h-9 text-xs font-bold uppercase"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Intro Card */}
                <div className="bg-white rounded-sm border border-black/5 p-6 mb-12">
                    <div className="flex gap-4">
                        <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="font-bold text-[#1A1A1A] mb-2">Acceso de Invitado</h2>
                            <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">
                                Como invitado, puedes explorar todos los proyectos disponibles, calificar con criterios específicos y dejar tus comentarios y sugerencias. Tu participación es valiosa para enriquecer el proceso de evaluación.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-8 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Projects Grid */}
                <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 uppercase tracking-wide">
                        Proyectos Disponibles
                    </h2>

                    {projects.length === 0 ? (
                        <div className="bg-white rounded-sm border border-black/5 p-12 text-center">
                            <p className="text-[#1A1A1A]/50 text-sm">
                                No hay proyectos disponibles en este momento.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/guest-project/${project.id}`}
                                    className="bg-white rounded-sm border border-black/5 hover:border-[#D4AF37]/30 hover:shadow-md transition-all group"
                                >
                                    {/* Thumbnail */}
                                    {project.thumbnailUrl && (
                                        <div className="w-full h-40 bg-gradient-to-br from-[#D4AF37]/20 to-black/5 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={project.thumbnailUrl}
                                                alt={project.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-[#1A1A1A] text-sm mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                                            {project.name}
                                        </h3>

                                        {project.description && (
                                            <p className="text-xs text-[#1A1A1A]/50 line-clamp-2 mb-4">
                                                {project.description}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-[#1A1A1A]/40">
                                            {project.score !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-[#D4AF37]" />
                                                    <span>{project.score}/5</span>
                                                </div>
                                            )}
                                            {project.teamMembers && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs">👥 {project.teamMembers.length}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mt-4 pt-4 border-t border-black/5">
                                            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                                                Ver Proyecto
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-sm border border-black/5 p-6">
                        <Star className="w-5 h-5 text-[#D4AF37] mb-3" />
                        <h3 className="font-bold text-[#1A1A1A] text-sm mb-2">Califica Proyectos</h3>
                        <p className="text-xs text-[#1A1A1A]/50">
                            Evalúa cada proyecto usando criterios específicos y proporciona una puntuación justa.
                        </p>
                    </div>

                    <div className="bg-white rounded-sm border border-black/5 p-6">
                        <MessageSquare className="w-5 h-5 text-[#D4AF37] mb-3" />
                        <h3 className="font-bold text-[#1A1A1A] text-sm mb-2">Deja Comentarios</h3>
                        <p className="text-xs text-[#1A1A1A]/50">
                            Comparte feedback constructivo y sugerencias que ayuden al crecimiento.
                        </p>
                    </div>

                    <div className="bg-white rounded-sm border border-black/5 p-6">
                        <Home className="w-5 h-5 text-[#D4AF37] mb-3" />
                        <h3 className="font-bold text-[#1A1A1A] text-sm mb-2">Explora Libremente</h3>
                        <p className="text-xs text-[#1A1A1A]/50">
                            Accede a todos los proyectos sin necesidad de registro o contraseña.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
