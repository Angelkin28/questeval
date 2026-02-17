'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header'; // Assuming this exists, based on other pages
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        pendingTeachers: 0,
        totalUsers: 0, // Placeholder
        activeProjects: 0 // Placeholder
    });
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // For now, we only have an endpoint for pending teachers that returns a list
                // We can fetch that list to get the count.
                // Later we should add a dedicated stats endpoint for admin.
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Reuse the existing API call structure or make a direct fetch if api.ts doesn't have it yet
                // checking api.ts... it doesn't seem to have getPendingTeachers exposed yet in the `api` object directly 
                // but we can add it or fetch directly. Let's fetch directly for now to be quick, 
                // or better, extend api.ts in a future step. For now, direct fetch with auth header.

                // Fetch all users to get stats and teacher list
                try {
                    const allUsers = await api.users.getAll();
                    const teacherList = allUsers.filter(u => u.role === 'Profesor');
                    setTeachers(teacherList);

                    // Update stats
                    // Pending teachers endpoint still returns just pending, but we could also filter from allUsers if we wanted
                    // For now let's keep the existing pending logic or fetch both
                    const pendingTeachersCount = teacherList.filter(t => t.verificationStatus === 'pending').length;

                    setStats(prev => ({
                        ...prev,
                        totalUsers: allUsers.length,
                        pendingTeachers: pendingTeachersCount
                    }));
                } catch (e) {
                    console.error("Error fetching users", e);
                }

                // If previous fetch for pending-teachers specific endpoint is needed, keep it, 
                // but since we have allUsers now, filtering is better if the GetAll includes status.
                // Assuming GetAll returns status. Let's rely on that.

            } catch (error) {
                console.error("Error fetching admin stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [router]);

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Panel de Administración" showBack={false} />

            <main className="px-4 py-8 max-w-6xl mx-auto space-y-8 animate-fade-in">

                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bienvenido, Administrador</h1>
                        <p className="text-muted-foreground mt-1">
                            Gestiona usuarios, evaluaciones y configuraciones del sistema.
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                        {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Quick Actions / Alerts */}
                {stats.pendingTeachers > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-medium text-amber-900 dark:text-amber-400">Solicitudes Pendientes</h3>
                            <p className="text-sm text-amber-800/80 dark:text-amber-500/80 mt-1">
                                Hay <strong>{stats.pendingTeachers}</strong> profesores esperando aprobación para acceder al sistema.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200"
                            onClick={() => router.push('/admin/pending-teachers')}
                        >
                            Revisar
                        </Button>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/pending-teachers')}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Profesores Pendientes</CardTitle>
                            <Users className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{loading ? "..." : stats.pendingTeachers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Requieren verificación manual
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="opacity-75">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">-</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Alumnos y Profesores activos
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="opacity-75">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Evaluaciones</CardTitle>
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">-</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Realizadas este ciclo
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Teachers List Section */}
                <div className="mt-8 animate-fade-in delay-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Profesores Registrados</h2>
                        <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                            Total: {teachers.length}
                        </span>
                    </div>

                    <Card>
                        <CardContent className="p-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Nombre</th>
                                            <th className="px-6 py-4 font-medium">Email</th>
                                            <th className="px-6 py-4 font-medium">Estado</th>
                                            <th className="px-6 py-4 font-medium">Fecha Registro</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {teachers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                    No hay profesores registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            teachers.map((teacher) => (
                                                <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {teacher.fullName.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        {teacher.fullName}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">{teacher.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${teacher.verificationStatus === 'approved'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : teacher.verificationStatus === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {teacher.verificationStatus === 'approved' ? 'Aprobado' :
                                                                teacher.verificationStatus === 'pending' ? 'Pendiente' : 'Rechazado'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {new Date(teacher.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Navigation Menu */}
                <h2 className="text-xl font-semibold mt-8 mb-4">Gestión del Sistema</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        className="group flex items-center p-4 border rounded-xl hover:bg-secondary/40 transition-colors cursor-pointer"
                        onClick={() => router.push('/admin/pending-teachers')}
                    >
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">Aprobar Maestros</h3>
                            <p className="text-sm text-muted-foreground">Revisar y validar registros de nuevos docentes.</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    {/* Placeholder for future features */}
                    <div className="group flex items-center p-4 border rounded-xl hover:bg-secondary/40 transition-colors cursor-not-allowed opacity-60">
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">Rubricas Globales</h3>
                            <p className="text-sm text-muted-foreground">Configurar criterios de evaluación estándar.</p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
