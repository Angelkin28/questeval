'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Search,
    MoreHorizontal,
    LayoutGrid,
    Users,
    UserCircle,
    Home as HomeIcon,
    Award,
    Lock,
    CheckCircle2,
    X,
    BookOpen
} from 'lucide-react';
import { api, Project, Group } from '@/lib/api';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import TeacherDashboard from './components/TeacherDashboard';

export default function DashboardPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
    const [userName, setUserName] = useState('Usuario');
    const [userEnrollment, setUserEnrollment] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Modal para unirse a grupo
    const [joinModal, setJoinModal] = useState<Group | null>(null);
    const [accessCode, setAccessCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState('');
    const [joinSuccess, setJoinSuccess] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userJson = localStorage.getItem('user');
                if (!userJson) {
                    router.push('/login');
                    return;
                }

                const userData = JSON.parse(userJson);
                setUserName(userData.fullName || 'Usuario');
                // userId es la matrícula incremental devuelta por el backend
                setUserEnrollment(userData.userId || userData.enrollment || '');
                const roleLower = userData.role?.toLowerCase();
                const isTeacher = roleLower === 'maestro' || roleLower === 'profesor';
                setUserRole(isTeacher ? 'teacher' : 'student');

                if (isTeacher) {
                    const apiProjects = await api.projects.getAll();
                    setProjects(apiProjects);
                } else {
                    const [apiProjects, allGroupsData, myGroupsData] = await Promise.all([
                        api.projects.getMyProjects(),
                        api.groups.getAll(),
                        api.groups.getMyGroups(),
                    ]);
                    setProjects(apiProjects);
                    setAllGroups(allGroupsData);
                    setMyGroupIds(new Set(myGroupsData.map((g: Group) => g.id)));
                }
            } catch (error) {
                console.error('Error cargando dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleJoinGroup = async () => {
        if (!joinModal || !accessCode.trim()) return;
        setJoinLoading(true);
        setJoinError('');
        try {
            await api.groups.join(accessCode.trim());
            setMyGroupIds(prev => new Set([...prev, joinModal.id]));
            setJoinSuccess(`Te uniste a "${joinModal.name}" exitosamente.`);
            setAccessCode('');
            setTimeout(() => {
                setJoinModal(null);
                setJoinSuccess('');
            }, 2000);
        } catch (e: any) {
            setJoinError(e.message || 'Código de acceso incorrecto.');
        } finally {
            setJoinLoading(false);
        }
    };

    const [filter, setFilter] = useState<'All' | 'Integrative' | 'Videogames'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [groupSearch, setGroupSearch] = useState('');

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

                {/* ===== GRUPOS DISPONIBLES ===== */}
                <div className="mt-14 animate-fade-in" style={{ animationDelay: '250ms' }}>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                        <div>
                            <h2 className="text-4xl font-bold title-serif">Grupos Disponibles</h2>
                            <p className="text-muted-foreground mt-1">Únete a un grupo con su clave de acceso.</p>
                        </div>
                        <div className="relative w-full sm:w-60">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar grupo..."
                                value={groupSearch}
                                onChange={e => setGroupSearch(e.target.value)}
                                className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-28 rounded-xl bg-secondary/40 animate-pulse" />
                            ))}
                        </div>
                    ) : allGroups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).length === 0 ? (
                        <div className="py-14 text-center bg-secondary/20 rounded-xl border-2 border-dashed">
                            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                            <p className="text-muted-foreground">No hay grupos disponibles aún.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allGroups
                                .filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                                .map(group => {
                                    const isMember = myGroupIds.has(group.id);
                                    return (
                                        <div
                                            key={group.id}
                                            className="bg-card border border-border/50 rounded-xl p-5 flex items-center justify-between gap-3 hover:border-primary/30 hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate">{group.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(group.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {isMember ? (
                                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 shrink-0">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Miembro
                                                </span>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 border-primary/30 hover:bg-primary/5 shrink-0 text-xs"
                                                    onClick={() => { setJoinModal(group); setJoinError(''); setAccessCode(''); }}
                                                >
                                                    <Lock className="w-3 h-3" />
                                                    Unirse
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </main>

            {/* ===== MODAL UNIRSE A GRUPO ===== */}
            {joinModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-lg">Unirse al Grupo</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{joinModal.name}</p>
                            </div>
                            <button onClick={() => setJoinModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {joinSuccess ? (
                            <div className="flex flex-col items-center gap-3 py-4 text-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                                <p className="font-medium text-green-600">{joinSuccess}</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Ingresa la clave de acceso proporcionada por tu maestro para unirte a este grupo.
                                </p>
                                <Input
                                    placeholder="Clave de acceso..."
                                    value={accessCode}
                                    onChange={e => { setAccessCode(e.target.value); setJoinError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleJoinGroup()}
                                    className="mb-3"
                                    autoFocus
                                />
                                {joinError && (
                                    <p className="text-sm text-red-500 mb-3">{joinError}</p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setJoinModal(null)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1 gap-2"
                                        onClick={handleJoinGroup}
                                        disabled={!accessCode.trim() || joinLoading}
                                    >
                                        {joinLoading ? 'Verificando...' : 'Confirmar'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

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
