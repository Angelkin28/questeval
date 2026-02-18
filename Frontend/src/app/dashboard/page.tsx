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
    Award,
    ArrowLeft
} from 'lucide-react';
import { api, Project } from '@/lib/api';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import TeacherDashboard from './components/TeacherDashboard';

export default function DashboardPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
    const [userName, setUserName] = useState('Usuario');
    const [userEnrollment, setUserEnrollment] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Obtener datos del usuario de localStorage
                const userJson = localStorage.getItem('user');
                if (!userJson) {
                    router.push('/login');
                    return;
                }

                const userData = JSON.parse(userJson);

                if (userData.verificationStatus === 'pending') {
                    router.push('/waiting-approval');
                    return;
                }

                setUserName(userData.fullName || 'Usuario');
                setUserEnrollment(userData.enrollment || '');
                const roleLower = userData.role?.toLowerCase();
                const isTeacher = roleLower === 'maestro' || roleLower === 'profesor';
                setUserRole(isTeacher ? 'teacher' : 'student');

                // 2. Obtener proyectos de la API
                if (isTeacher) {
                    const apiProjects = await api.projects.getAll();
                    setProjects(apiProjects);
                } else {
                    const apiProjects = await api.projects.getMyProjects();
                    setProjects(apiProjects);
                }
            } catch (error) {
                console.error('Error cargando dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const [filter, setFilter] = useState<'All' | 'Integrative' | 'Videogames'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Mapeo de categorías para visualización
    const categoryMap = {
        'Integrador': 'Integrative',
        'Videojuegos': 'Videogames'
    };

    // Filtrado combinado: Categoría + Buscador
    const filteredProjects = projects.filter(p => {
        const matchesFilter = filter === 'All' || categoryMap[p.category as keyof typeof categoryMap] === filter;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        return matchesFilter && matchesSearch;
    });

    if (userRole === 'teacher') {
        return (
            <div className="min-h-screen bg-background pb-20">
                <Header title="QuestEval" />
                <main className="container mx-auto px-4 py-8">
                    <TeacherDashboard user={{ name: userName }} />
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
                {/* User Info Card Section */}
                <div className="mb-10 animate-fade-in">
                    <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40 rounded-l-2xl" />
                        <div className="w-14 h-14 bg-secondary/80 rounded-full flex items-center justify-center text-primary shrink-0">
                            <UserCircle className="w-8 h-8" />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <p className="text-xl font-bold">
                                    Alumno: <span className="text-primary/90">{userName}</span>
                                </p>
                                <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                    <p className="text-xs font-bold text-primary uppercase tracking-tight">
                                        Matrícula: <span className="text-foreground">{userEnrollment || 'N/A'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col gap-4 mb-10 sm:flex-row sm:items-center sm:justify-between animate-fade-in" style={{ animationDelay: '100ms' }}>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        <Button
                            variant={filter === 'All' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('All')}
                            className="rounded-full px-6"
                        >
                            Mis Proyectos
                        </Button>
                        <Button
                            variant={filter === 'Integrative' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('Integrative')}
                            className="rounded-full px-6"
                        >
                            Integrador
                        </Button>
                        <Button
                            variant={filter === 'Videogames' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('Videogames')}
                            className="rounded-full px-6"
                        >
                            Videojuegos
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar proyectos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                        />
                    </div>
                </div>

                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <div>
                        <h2 className="text-4xl font-bold title-serif">Proyectos</h2>
                        <p className="text-muted-foreground mt-1">Revisa tus calificaciones y progresos académicos.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push('/groups/join')}
                            variant="outline"
                            className="gap-2 border-primary/20 hover:bg-primary/5"
                        >
                            <Users className="w-4 h-4" />
                            Unirse a un Grupo
                        </Button>
                        <Button
                            onClick={() => router.push('/project/new')}
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Crear Proyecto
                        </Button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    {/* Project Cards */}
                    {filteredProjects.map((project, idx) => (
                        <Card key={project.id || idx} onClick={() => router.push(`/project/${project.id}`)} className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer border-border/50 bg-card">
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

                    {filteredProjects.length === 0 && searchQuery && (
                        <div className="col-span-full py-10 text-center">
                            <p className="text-muted-foreground italic">No se encontraron proyectos que coincidan con "{searchQuery}".</p>
                        </div>
                    )}

                    {projects.length === 0 && !isLoading && (
                        <div className="col-span-full py-20 text-center bg-secondary/20 rounded-xl border-2 border-dashed">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">Aún no tienes proyectos asignados.</p>
                            <Button
                                onClick={() => router.push('/project/new')}
                                variant="link"
                                className="mt-2 text-primary"
                            >
                                Crear mi primer proyecto
                            </Button>
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
