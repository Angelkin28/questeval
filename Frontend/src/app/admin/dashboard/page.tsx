'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users, Trash2, Loader2, AlertCircle, ShieldCheck,
    GraduationCap, BookOpen, Search, RefreshCw, Activity
} from 'lucide-react';
import { api } from '@/lib/api';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
    avatarUrl?: string;
}

interface LogEntry {
    time: string;
    action: string;
    detail: string;
    type: 'delete' | 'info' | 'warning';
}

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'Todos' | 'Alumno' | 'Profesor'>('Todos');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'usuarios' | 'logs'>('usuarios');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/login'); return; }
        const parsed = JSON.parse(userData);
        if (parsed.role !== 'Admin') {
            router.push('/dashboard');
            return;
        }
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const allUsers = await api.users.getAll();
            // Filtrar solo alumnos y profesores (no admins ni invitados)
            const filteredUsers = allUsers.filter(
                (u: any) => u.role === 'Alumno' || u.role === 'Profesor'
            );
            setUsers(filteredUsers as User[]);
            addLog('info', 'Lista de usuarios cargada', `${filteredUsers.length} usuarios encontrados.`);
        } catch (e) {
            setError('No se pudieron cargar los usuarios. Verifica que el backend esté activo.');
            addLog('warning', 'Error al cargar usuarios', 'Fallo la conexión con el backend.');
        } finally {
            setLoading(false);
        }
    };

    const addLog = (type: LogEntry['type'], action: string, detail: string) => {
        const entry: LogEntry = {
            time: new Date().toLocaleTimeString('es-MX'),
            action,
            detail,
            type,
        };
        setLogs(prev => [entry, ...prev].slice(0, 50));
    };

    const handleDeleteClick = (user: User) => {
        setConfirmDelete(user);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeletingId(confirmDelete.id);
        setConfirmDelete(null);
        try {
            await api.users.deleteUser(confirmDelete.id);
            setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
            setSuccessMsg(`Usuario "${confirmDelete.fullName}" eliminado correctamente.`);
            addLog('delete', 'Usuario eliminado', `${confirmDelete.fullName} (${confirmDelete.role}) — ${confirmDelete.email}`);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (e) {
            setError(`No se pudo eliminar a "${confirmDelete.fullName}". Intenta de nuevo.`);
            addLog('warning', 'Error al eliminar usuario', confirmDelete.email);
            setTimeout(() => setError(''), 5000);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchRole = roleFilter === 'Todos' || u.role === roleFilter;
        const term = searchTerm.toLowerCase();
        const matchSearch = u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
        return matchRole && matchSearch;
    });

    const totalAlumnos = users.filter(u => u.role === 'Alumno').length;
    const totalProfesores = users.filter(u => u.role === 'Profesor').length;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Panel de Administración" showBack={false} />

            <main className="px-4 py-8 max-w-6xl mx-auto space-y-6 animate-fade-in">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <ShieldCheck className="w-7 h-7 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Gestiona los usuarios del sistema y revisa el historial de actividad.
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                        {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Mensajes de feedback */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
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
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{loading ? '...' : totalAlumnos}</div>
                            <p className="text-xs text-muted-foreground mt-1">Estudiantes registrados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Profesores</CardTitle>
                            <BookOpen className="w-4 h-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{loading ? '...' : totalProfesores}</div>
                            <p className="text-xs text-muted-foreground mt-1">Docentes registrados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border">
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'usuarios'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Usuarios</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'logs'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Logs de Actividad <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{logs.length}</span></span>
                    </button>
                </div>

                {/* Tab: Usuarios */}
                {activeTab === 'usuarios' && (
                    <div className="space-y-4">
                        {/* Filtros */}
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
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === role
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
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

                        {/* Tabla de usuarios */}
                        <Card>
                            <CardContent className="p-0 overflow-hidden">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-sm">Cargando usuarios...</p>
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                        <Users className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">No se encontraron usuarios.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                                <tr>
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
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${user.role === 'Profesor'
                                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                                    {user.fullName.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="font-medium">{user.fullName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{user.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'Profesor'
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                                {user.role === 'Profesor' ? <BookOpen className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                                            {new Date(user.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleDeleteClick(user)}
                                                                disabled={deletingId === user.id}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 font-medium text-xs transition-colors disabled:opacity-50"
                                                            >
                                                                {deletingId === user.id ? (
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                )}
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
                            Mostrando {filteredUsers.length} de {users.length} usuarios
                        </p>
                    </div>
                )}

                {/* Tab: Logs */}
                {activeTab === 'logs' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Historial de Actividad
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">{logs.length} entradas registradas esta sesión</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            {logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                    <Activity className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">No hay actividad registrada aún.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                                    {logs.map((log, i) => (
                                        <div key={i} className="flex items-start gap-4 px-6 py-3 hover:bg-muted/20 transition-colors">
                                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'delete' ? 'bg-red-500' : log.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{log.action}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${log.type === 'delete' ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400' : log.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400'}`}>
                                                        {log.type === 'delete' ? 'Eliminar' : log.type === 'warning' ? 'Alerta' : 'Info'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

            </main>

            {/* Modal de confirmación de eliminación */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-border animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
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
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
