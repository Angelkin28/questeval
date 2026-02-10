'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    LayoutGrid,
    Users,
    UserCircle,
    Home as HomeIcon,
    Award
} from 'lucide-react';
import { api, Project } from '@/lib/api';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import TeacherDashboard from './components/TeacherDashboard';

export default function DashboardPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
    const [userName, setUserName] = useState('Usuario');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Obtener datos del usuario de localStorage
                const userJson = localStorage.getItem('user');
                if (userJson) {
                    const userData = JSON.parse(userJson);
                    setUserName(userData.fullName || 'Usuario');
                    setUserRole(userData.role?.toLowerCase() === 'maestro' ? 'teacher' : 'student');
                }

                // 2. Obtener proyectos de la API
                const apiProjects = await api.projects.getAll();
                setProjects(apiProjects);
            } catch (error) {
                console.error('Error cargando dashboard:', error);
                // Fallback a mock data si falla la API (opcional, por ahora lo dejamos vacío)
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const [filter, setFilter] = useState<'All' | 'Integrative' | 'Videogames'>('All');

    // Mapeo de categorías para visualización
    const categoryMap = {
        'Integrador': 'Integrative',
        'Videojuegos': 'Videogames'
    };

    // Filtrado
    const filteredProjects = filter === 'All'
        ? projects
        : projects.filter(p => categoryMap[p.category as keyof typeof categoryMap] === filter);

    if (userRole === 'teacher') {
        return (
            <div className="min-h-screen bg-background pb-20">
                <Header title="QuestEval" />
                <main className="container mx-auto px-4 py-8">
                    <TeacherDashboard user={{ name: 'Profesor X' }} />
                </main>
                {/* Bottom Navigation (Mobile) - Teacher */}
                <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around z-50 md:hidden">
                    <button className="flex flex-col items-center gap-1 text-primary">
                        <HomeIcon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Inicio</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => router.push('/groups')}>
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Grupos</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => router.push('/rubric')}>
                        <Award className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Rúbrica</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => router.push('/profile')}>
                        <UserCircle className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Perfil</span>
                    </button>
                </nav>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="QuestEval" />

            <main className="container mx-auto px-4 py-6">
                {/* Welcome Section */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2 title-serif">Hola, {userName.split(' ')[0]} 👋</h1>
                    <p className="text-muted-foreground">Aquí tienes el resumen de tus proyectos actuales.</p>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between animate-fade-in" style={{ animationDelay: '100ms' }}>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar proyectos..."
                            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-secondary p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => setFilter('All')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'All' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('Integrative')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'Integrative' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Integrador
                        </button>
                        <button
                            onClick={() => setFilter('Videogames')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'Videogames' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Videojuegos
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>

                    {/* New Project Card */}
                    <button
                        onClick={() => router.push('/project/new')}
                        className="group border-2 border-dashed border-muted-foreground/25 rounded-xl flex flex-col items-center justify-center p-8 hover:border-primary hover:bg-primary/5 transition-all h-[280px]"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Crear Nuevo Proyecto</h3>
                        <p className="text-sm text-muted-foreground mt-2 text-center max-w-[200px]">Inicia un proyecto Integrador o de Videojuegos</p>
                    </button>

                    {/* Project Cards */}
                    {filteredProjects.map((project, idx) => (
                        <Card key={project.id || idx} className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer border-border/50 bg-card">
                            <div className="h-32 bg-secondary relative overflow-hidden">
                                {project.thumbnailUrl ? (
                                    <div
                                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                        style={{ backgroundImage: `url(${project.thumbnailUrl})` }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                                        <LayoutGrid className="w-10 h-10 text-muted-foreground/50" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${project.category === 'Integrador' ? 'bg-blue-500/20 text-blue-700' : 'bg-purple-500/20 text-purple-700'
                                        }`}>
                                        {project.category}
                                    </span>
                                </div>
                            </div>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{project.name}</h3>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                    {project.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex -space-x-2">
                                        {[...Array(1)].map((_, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold">
                                                U
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                        <span className={`w-2 h-2 rounded-full ${project.status === 'Completed' ? 'bg-green-500' :
                                            project.status === 'In Progress' ? 'bg-yellow-500' : 'bg-gray-400'
                                            }`} />
                                        {project.status === 'In Progress' ? 'En Progreso' : project.status === 'Completed' ? 'Completado' : project.status}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {projects.length === 0 && !isLoading && (
                        <div className="col-span-full py-20 text-center bg-secondary/20 rounded-xl border-2 border-dashed">
                            <p className="text-muted-foreground">Aún no tienes proyectos. ¡Crea el primero!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around z-50 md:hidden">
                <button className="flex flex-col items-center gap-1 text-primary">
                    <HomeIcon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Inicio</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => router.push('/groups')}>
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Grupos</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => router.push('/profile')}>
                    <UserCircle className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Perfil</span>
                </button>
            </nav>
        </div>
    );
}
