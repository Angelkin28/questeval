'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users, Trash2, Loader2, AlertCircle, ShieldCheck,
    GraduationCap, BookOpen, Search, RefreshCw, Activity,
    LayoutGrid, ChevronDown, ClipboardCheck
} from 'lucide-react';
import { api, Project } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5122/api';

interface User {
    id: string;
    userId?: string;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
}

interface AdminGroup {
    id: string;
    groupId?: string;
    name: string;
    accessCode: string;
    teacherId?: string;
    teacherName?: string;
    teacherEmail?: string;
    studentCount: number;
    totalMembers: number;
    createdAt: string;
}

interface ActivityLog {
    id: string;
    action: string;
    detail: string;
    category: string;
    actorName?: string;
    targetName?: string;
    createdAt: string;
}

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<AdminGroup[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [professors, setProfessors] = useState<User[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'Todos' | 'Alumno' | 'Profesor'>('Todos');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'usuarios' | 'grupos' | 'proyectos' | 'logs'>('usuarios');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [changeTeacherModal, setChangeTeacherModal] = useState<AdminGroup | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [savingTeacher, setSavingTeacher] = useState(false);
    const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<AdminGroup | null>(null);
    const [deletingGroup, setDeletingGroup] = useState(false);

    // Projects state
    const [adminProjects, setAdminProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [confirmDeleteProject, setConfirmDeleteProject] = useState<Project | null>(null);
    const [deletingProject, setDeletingProject] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/login'); return; }
        const parsed = JSON.parse(userData);
        if (parsed.role !== 'Admin') { router.push('/dashboard'); return; }
        fetchUsers();
    }, [router]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const allUsers = await api.users.getAll();
            const filtered = allUsers.filter((u: any) => u.role === 'Alumno' || u.role === 'Profesor');
            setUsers(filtered as User[]);
            setProfessors(filtered.filter((u: any) => u.role === 'Profesor') as User[]);
        } catch {
            setError('No se pudieron cargar los usuarios. Verifica que el backend esté activo.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchGroups = useCallback(async () => {
        setLoadingGroups(true);
        try {
            const res = await fetch(`${API_URL}/Admin/groups`, { headers: authHeaders() });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.detail || errBody.title || `Error al cargar grupos (${res.status})`);
            }
            setGroups(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingGroups(false);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const res = await fetch(`${API_URL}/Admin/logs?limit=100`, { headers: authHeaders() });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.detail || errBody.title || `Error al cargar logs (${res.status})`);
            }
            setLogs(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    const fetchAllProjects = useCallback(async () => {
        setLoadingProjects(true);
        try {
            // Fetch ALL projects without group filtering (admin view)
            const res = await fetch(`${API_URL}/Projects`, { headers: authHeaders() });
            if (!res.ok) throw new Error(`Error al cargar proyectos (${res.status})`);
            const data = await res.json();
            setAdminProjects(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'grupos') fetchGroups();
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'proyectos') fetchAllProjects();
    }, [activeTab, fetchGroups, fetchLogs, fetchAllProjects]);

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeletingId(confirmDelete.id);
        setConfirmDelete(null);
        try {
            await api.users.deleteUser(confirmDelete.id);
            setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
            setSuccessMsg(`Usuario "${confirmDelete.fullName}" eliminado correctamente.`);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch {
            setError(`No se pudo eliminar a "${confirmDelete.fullName}".`);
            setTimeout(() => setError(''), 5000);
        } finally {
            setDeletingId(null);
        }
    };


    const handleDeleteGroup = async () => {
        if (!confirmDeleteGroup) return;
        setDeletingGroup(true);
        try {
            const res = await fetch(`${API_URL}/Admin/groups/${confirmDeleteGroup.id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.detail || `Error al eliminar grupo (${res.status})`);
            }
            setConfirmDeleteGroup(null);
            setSuccessMsg(`Grupo "${confirmDeleteGroup.name}" eliminado correctamente.`);
            await fetchGroups();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al eliminar el grupo');
        } finally {
            setDeletingGroup(false);
        }
    };

    const handleChangeTeacher = async () => {
        if (!changeTeacherModal || !selectedTeacherId) return;
        setSavingTeacher(true);
        try {
            const res = await fetch(`${API_URL}/Admin/groups/${changeTeacherModal.id}/teacher`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ teacherId: selectedTeacherId })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Error al cambiar el maestro');
            }
            const data = await res.json();
            setSuccessMsg(data.message);
            setChangeTeacherModal(null);
            fetchGroups();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (e: any) {
            setError(e.message);
            setTimeout(() => setError(''), 5000);
        } finally {
            setSavingTeacher(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!confirmDeleteProject) return;
        setDeletingProject(true);
        try {
            const res = await fetch(`${API_URL}/Projects/${confirmDeleteProject.id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.detail || `Error al eliminar proyecto (${res.status})`);
            }
            setConfirmDeleteProject(null);
            setSuccessMsg(`Proyecto "${confirmDeleteProject.name}" eliminado de raíz.`);
            await fetchAllProjects();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al eliminar el proyecto');
            setTimeout(() => setError(''), 5000);
        } finally {
            setDeletingProject(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchRole = roleFilter === 'Todos' || u.role === roleFilter;
        const term = searchTerm.toLowerCase();
        return matchRole && (u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    });

    const filteredProjects = adminProjects.filter(p => {
        const term = projectSearch.toLowerCase();
        return p.name.toLowerCase().includes(term) ||
            (p.description?.toLowerCase().includes(term) ?? false) ||
            (p.category?.toLowerCase().includes(term) ?? false);
    });

    const totalAlumnos = users.filter(u => u.role === 'Alumno').length;
    const totalProfesores = users.filter(u => u.role === 'Profesor').length;

    const logCategoryColor = (cat: string) => {
        if (cat === 'delete') return 'bg-red-500';
        if (cat === 'warning') return 'bg-amber-500';
        if (cat === 'auth') return 'bg-blue-500';
        return 'bg-green-500';
    };

    const logBadgeColor = (cat: string) => {
        if (cat === 'delete') return 'bg-red-100 text-red-600';
        if (cat === 'warning') return 'bg-amber-100 text-amber-600';
        if (cat === 'auth') return 'bg-blue-100 text-blue-600';
        return 'bg-green-100 text-green-600';
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Panel de Administración" showBack={false} />

            <main className="px-4 py-8 max-w-6xl mx-auto space-y-6 animate-fade-in">

                {/* Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <ShieldCheck className="w-7 h-7 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
                        </div>
                        <p className="text-muted-foreground text-sm">Gestiona usuarios, grupos y revisa el historial de actividad.</p>
                    </div>
                    <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                        {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Feedback */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                        ✅ {successMsg}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
                            <Users className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{loading ? '...' : users.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Alumnos y Profesores activos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Alumnos</CardTitle>
                            <GraduationCap className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{loading ? '...' : totalAlumnos}</div>
                            <p className="text-xs text-muted-foreground mt-1">Estudiantes registrados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Profesores</CardTitle>
                            <BookOpen className="w-4 h-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-600">{loading ? '...' : totalProfesores}</div>
                            <p className="text-xs text-muted-foreground mt-1">Docentes registrados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border">
                    {([
                        { key: 'usuarios', label: 'Usuarios', icon: Users },
                        { key: 'grupos', label: 'Grupos', icon: LayoutGrid },
                        { key: 'proyectos', label: 'Proyectos', icon: ClipboardCheck },
                        { key: 'logs', label: 'Actividad', icon: Activity },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            <span className="flex items-center gap-2">
                                <Icon className="w-4 h-4" /> {label}
                                {key === 'logs' && logs.length > 0 && (
                                    <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{logs.length}</span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ===================== TAB: USUARIOS ===================== */}
                {activeTab === 'usuarios' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o correo..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="flex gap-2">
                                {(['Todos', 'Alumno', 'Profesor'] as const).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setRoleFilter(role)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === role ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-2">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>

                        </div>

                        <Card>
                            <CardContent className="p-0 overflow-hidden">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-sm">Cargando usuarios...</p>
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                        <Users className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">No se encontraron usuarios.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-4 font-medium">#ID</th>
                                                    <th className="px-6 py-4 font-medium">Usuario</th>
                                                    <th className="px-6 py-4 font-medium">Correo</th>
                                                    <th className="px-6 py-4 font-medium">Rol</th>
                                                    <th className="px-6 py-4 font-medium">Fecha Registro</th>
                                                    <th className="px-6 py-4 font-medium text-center">Eliminar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {filteredUsers.map(user => (
                                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <span className="inline-block font-mono text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                                                                {user.userId ?? '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${user.role === 'Profesor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {user.fullName.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="font-medium">{user.fullName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{user.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'Profesor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {user.role === 'Profesor' ? <BookOpen className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                                            {new Date(user.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => setConfirmDelete(user)}
                                                                disabled={deletingId === user.id}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs transition-colors disabled:opacity-50"
                                                            >
                                                                {deletingId === user.id
                                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    : <Trash2 className="w-3.5 h-3.5" />}
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <p className="text-xs text-muted-foreground text-right">Mostrando {filteredUsers.length} de {users.length} usuarios</p>
                    </div>
                )}

                {/* ===================== TAB: GRUPOS ===================== */}
                {activeTab === 'grupos' && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={fetchGroups} disabled={loadingGroups} className="gap-2">
                                <RefreshCw className={`w-4 h-4 ${loadingGroups ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                        </div>
                        <Card>
                            <CardContent className="p-0 overflow-hidden">
                                {loadingGroups ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-sm">Cargando grupos...</p>
                                    </div>
                                ) : groups.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                        <LayoutGrid className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">No hay grupos registrados.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                                <tr>
                                                    <th className="px-6 py-4 font-medium">Grupo</th>
                                                    <th className="px-6 py-4 font-medium">Código</th>
                                                    <th className="px-6 py-4 font-medium">Maestro Asignado</th>
                                                    <th className="px-6 py-4 font-medium text-center">Alumnos</th>
                                                    <th className="px-6 py-4 font-medium">Fecha</th>
                                                    <th className="px-6 py-4 font-medium text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {groups.map(group => (
                                                    <tr key={group.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-6 py-4 font-medium">{group.name}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono text-xs bg-secondary px-2 py-1 rounded">{group.accessCode}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {group.teacherName ? (
                                                                <div>
                                                                    <p className="font-medium text-sm">{group.teacherName}</p>
                                                                    <p className="text-xs text-muted-foreground">{group.teacherEmail}</p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground italic text-xs">Sin asignar</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                                {group.studentCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                                            {new Date(group.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setChangeTeacherModal(group);
                                                                        setSelectedTeacherId(group.teacherId || '');
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium text-xs transition-colors"
                                                                >
                                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                                    Cambiar Maestro
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDeleteGroup(group)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium text-xs transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <p className="text-xs text-muted-foreground text-right">{groups.length} grupos en total</p>
                    </div>
                )}

                {/* ===================== TAB: PROYECTOS ===================== */}
                {activeTab === 'proyectos' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, categoría o descripción..."
                                    value={projectSearch}
                                    onChange={e => setProjectSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchAllProjects} disabled={loadingProjects} className="gap-2">
                                <RefreshCw className={`w-4 h-4 ${loadingProjects ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="p-0 overflow-hidden">
                                {loadingProjects ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-sm">Cargando proyectos...</p>
                                    </div>
                                ) : filteredProjects.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                        <ClipboardCheck className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">No se encontraron proyectos.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-4 font-medium">#</th>
                                                    <th className="px-6 py-4 font-medium">Proyecto</th>
                                                    <th className="px-6 py-4 font-medium">Categoría</th>
                                                    <th className="px-6 py-4 font-medium">Estado</th>
                                                    <th className="px-6 py-4 font-medium">Equipo</th>
                                                    <th className="px-6 py-4 font-medium">Fecha</th>
                                                    <th className="px-6 py-4 font-medium text-center">Eliminar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {filteredProjects.map((project, idx) => (
                                                    <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <span className="inline-block font-mono text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                                                                {idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {project.thumbnailUrl ? (
                                                                    <img src={project.thumbnailUrl} alt={project.name} className="w-10 h-10 rounded object-cover flex-shrink-0 border border-border" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                                                                        <ClipboardCheck className="w-4 h-4 text-muted-foreground/50" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <p className="font-medium truncate max-w-[200px]">{project.name}</p>
                                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{project.description || 'Sin descripción'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                project.category === 'Integrador' ? 'bg-blue-100 text-blue-700' :
                                                                project.category === 'Videojuegos' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {project.category || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                project.status === 'Evaluated' ? 'bg-green-100 text-green-700' :
                                                                project.status === 'Completed' ? 'bg-yellow-100 text-yellow-700' :
                                                                project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                    project.status === 'Evaluated' ? 'bg-green-500' :
                                                                    project.status === 'Completed' ? 'bg-yellow-500' :
                                                                    project.status === 'In Progress' ? 'bg-blue-500' :
                                                                    'bg-gray-400'
                                                                }`} />
                                                                {project.status === 'Evaluated' ? 'Evaluado' :
                                                                 project.status === 'Completed' ? 'Completado' :
                                                                 project.status === 'In Progress' ? 'En Progreso' : project.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                                {project.teamMembers && project.teamMembers.length > 0 ? (
                                                                    project.teamMembers.slice(0, 2).map((m, i) => (
                                                                        <span key={i} className="text-xs bg-secondary px-1.5 py-0.5 rounded truncate max-w-[120px]">{m}</span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">Sin equipo</span>
                                                                )}
                                                                {project.teamMembers && project.teamMembers.length > 2 && (
                                                                    <span className="text-xs text-muted-foreground">+{project.teamMembers.length - 2}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                                            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => setConfirmDeleteProject(project)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <p className="text-xs text-muted-foreground text-right">
                            Mostrando {filteredProjects.length} de {adminProjects.length} proyectos
                        </p>
                    </div>
                )}

                {/* ===================== TAB: LOGS ===================== */}
                {activeTab === 'logs' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Historial de Actividad
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{logs.length} registros</span>
                                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loadingLogs} className="gap-2">
                                    <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                                    Actualizar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingLogs ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-sm">Cargando actividad...</p>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                    <Activity className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">No hay actividad registrada.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                                    {logs.map((log, i) => (
                                        <div key={log.id || i} className="flex items-start gap-4 px-6 py-3 hover:bg-muted/20 transition-colors">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${logCategoryColor(log.category)}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-sm">{log.detail}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${logBadgeColor(log.category)}`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                                {log.actorName && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">Por: {log.actorName}</p>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">
                                                {new Date(log.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

            </main>

            {/* Modal: Confirmar Eliminación */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-border animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Eliminar Usuario</h3>
                                <p className="text-xs text-muted-foreground">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg px-4 py-3 mb-5 text-sm">
                            <p className="font-medium">{confirmDelete.fullName}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">{confirmDelete.email} · {confirmDelete.role}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                            <button onClick={handleDeleteConfirm} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Sí, eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Confirmar Eliminar Grupo */}
            {confirmDeleteGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-border animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Eliminar Grupo</h3>
                                <p className="text-xs text-muted-foreground">{confirmDeleteGroup.name}</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            ¿Estás seguro de que deseas eliminar este grupo? Se eliminarán también todas las membresías asociadas. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteGroup(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                            <button
                                onClick={handleDeleteGroup}
                                disabled={deletingGroup}
                                className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deletingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Confirmar Eliminar Proyecto */}
            {confirmDeleteProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-md border border-border animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Eliminar Proyecto de Raíz</h3>
                                <p className="text-xs text-muted-foreground">Esta acción eliminará completamente el proyecto</p>
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
                            <p className="font-medium text-red-800">{confirmDeleteProject.name}</p>
                            <p className="text-red-600 text-xs mt-1">
                                {confirmDeleteProject.category || 'Sin categoría'} · {confirmDeleteProject.status} · {confirmDeleteProject.teamMembers?.length || 0} miembro(s)
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-5">
                            ⚠️ Se eliminarán <strong>permanentemente</strong> el proyecto y todos sus datos asociados (evaluaciones, archivos multimedia, etc.). Esta acción <strong>no se puede deshacer</strong>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteProject(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                            <button
                                onClick={handleDeleteProject}
                                disabled={deletingProject}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deletingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Sí, eliminar de raíz
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Cambiar Maestro */}
            {changeTeacherModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-border animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Cambiar Maestro</h3>
                                <p className="text-xs text-muted-foreground">Grupo: {changeTeacherModal.name}</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="text-sm font-medium block mb-2">Seleccionar Profesor</label>
                            <select
                                value={selectedTeacherId}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">-- Seleccionar profesor --</option>
                                {professors.map(p => (
                                    <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setChangeTeacherModal(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                            <button
                                onClick={handleChangeTeacher}
                                disabled={!selectedTeacherId || savingTeacher}
                                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {savingTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
