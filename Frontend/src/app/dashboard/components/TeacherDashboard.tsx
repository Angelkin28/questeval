'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Users,
    ClipboardCheck,
    BookOpen,
    GraduationCap,
    Loader2,
    QrCode,
    X
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { api, Group } from '@/lib/api';

interface TeacherDashboardProps {
    user: any;
}

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [pendingProjects, setPendingProjects] = useState<any[]>([]);
    const [totalStudents, setTotalStudents] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState<{ token: string, expiresAt: string } | null>(null);
    const [loadingQr, setLoadingQr] = useState(false);
    const [selectedProjectName, setSelectedProjectName] = useState('');

    const handleGenerateQR = async (projectId: string, projectName: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevenir navegación
        setLoadingQr(true);
        setSelectedProjectName(projectName);
        try {
            const data = await api.projects.generateQR(projectId);
            setQrData({ token: data.qrToken, expiresAt: data.expiresAt });
            setShowQrModal(true);
        } catch (error) {
            console.error("Error al generar QR", error);
            alert("No se pudo generar el código QR");
        } finally {
            setLoadingQr(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch groups and all projects to filter pending ones
                // Ideally backend should provide endpoint for pending reviews
                const [myGroups, allProjects] = await Promise.all([
                    api.groups.getMyGroups(),
                    api.projects.getAll() // This returns ALL projects. We should filter by my groups.
                ]);
                setGroups(myGroups);

                // Contar el total de alumnos únicos en todos mis grupos
                const allMemberIds = new Set<string>();
                let studentCount = 0;
                for (const group of myGroups) {
                    try {
                        const members = await api.groups.getMembers(group.id);
                        members.forEach(m => {
                            const role = m.role?.toLowerCase();
                            if ((role === 'alumno' || role === 'student') && !allMemberIds.has(m.id)) {
                                allMemberIds.add(m.id);
                                studentCount++;
                            }
                        });
                    } catch { }
                }
                setTotalStudents(studentCount);

                // Filter projects that belong to my groups AND are status 'Completed'
                const myGroupIds = new Set(myGroups.map(g => g.id));
                const pending = allProjects.filter(p =>
                    myGroupIds.has(p.groupId!) && p.status === 'Completed'
                );
                setPendingProjects(pending);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold title-serif text-primary">Hola, {user.name.split(' ')[0]}</h1>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tus grupos y evaluaciones académicas.
                    </p>
                </div>
                <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-md"
                    onClick={() => router.push('/groups/new')}
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Grupo
                </Button>
            </div>

            {/* Stats Cards (Placeholders for now) */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase">Mis Grupos</p>
                            <p className="text-2xl font-bold title-serif">{groups.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-secondary/50 border-secondary shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase">Total Alumnos</p>
                            <p className="text-2xl font-bold title-serif">
                                {totalStudents === null ? '...' : totalStudents}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mis Grupos */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold title-serif flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        Mis Grupos Recientes
                    </h2>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/groups')}>Ver Todos</Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-8 bg-secondary/20 rounded-lg border-dashed border-2">
                        <p className="text-muted-foreground text-sm">No tienes grupos activos.</p>
                        <Button variant="link" onClick={() => router.push('/groups/new')}>Crear uno ahora</Button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {groups.slice(0, 3).map((grupo) => (
                            <Card key={grupo.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/groups/${grupo.id}`)}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">{grupo.name}</h3>
                                        <p className="text-xs text-muted-foreground font-mono">Código: {grupo.accessCode}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">Ver Detalles</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Entregas Recientes (Por Calificar) */}
            <div>
                <h2 className="text-lg font-bold title-serif mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Por Calificar ({pendingProjects.length})
                </h2>
                <div className="space-y-3">
                    {pendingProjects.length === 0 ? (
                        <Card className="opacity-70 border-dashed bg-secondary/10">
                            <CardContent className="p-8 text-center text-sm text-muted-foreground">
                                <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                No hay entregas pendientes para calificar.
                            </CardContent>
                        </Card>
                    ) : (
                        pendingProjects.map((project) => (
                            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-yellow-500" onClick={() => router.push(`/rubric?projectId=${project.id}`)}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-base">{project.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {project.category} • {groups.find(g => g.id === project.groupId)?.name || 'Grupo Desconocido'}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="secondary" className="text-xs h-8">
                                        Calificar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 ml-2 border-primary/20 text-primary hover:bg-primary/10"
                                        onClick={(e) => handleGenerateQR(project.id, project.name, e)}
                                        disabled={loadingQr}
                                    >
                                        <QrCode className="w-4 h-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Código QR */}
            {showQrModal && qrData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm border border-border">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-primary/5 rounded-t-2xl">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-primary" />
                                Código de Evaluación
                            </h3>
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            <p className="text-center font-medium mb-6 text-foreground/90">
                                {selectedProjectName}
                            </p>
                            <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
                                <QRCode
                                    value={qrData.token}
                                    size={200}
                                    level="M"
                                />
                            </div>
                            <div className="w-full bg-secondary/50 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                                    Válido hasta
                                </p>
                                <p className="text-sm font-bold text-primary">
                                    {new Date(qrData.expiresAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
