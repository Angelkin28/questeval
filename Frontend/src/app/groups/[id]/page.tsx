'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, Mail, UserPlus, Copy, Check, BookOpen, GraduationCap, Layout, ClipboardCheck } from 'lucide-react';
import { api, Group, UserResponse, Project } from '@/lib/api';

export default function GroupDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<UserResponse[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'projects'>('members');

    const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');

    useEffect(() => {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const userData = JSON.parse(userJson);
            const roleLower = userData.role?.toLowerCase();
            const isTeacher = roleLower === 'maestro' || roleLower === 'profesor';
            setUserRole(isTeacher ? 'teacher' : 'student');
        }

        const fetchDetails = async () => {
            if (!id) return;
            try {
                const [groupData, membersData, projectsData] = await Promise.all([
                    api.groups.getById(id),
                    api.groups.getMembers(id),
                    api.groups.getProjects(id)
                ]);
                setGroup(groupData);
                setMembers(membersData);
                setProjects(projectsData);
            } catch (error) {
                console.error('Error loading group details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    const copyCode = () => {
        if (group?.accessCode) {
            navigator.clipboard.writeText(group.accessCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (!group) return <div className="p-8 text-center text-red-500">Grupo no encontrado</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
                <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="font-bold text-lg leading-tight">{group.name}</h1>
                    <p className="text-xs text-muted-foreground">
                        {members.length} miembros • {projects.length} proyectos
                    </p>
                </div>
            </header>

            <main className="px-4 py-6">
                {/* Access Code Card */}
                <Card className="mb-6 bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Código de Acceso</p>
                            <p className="text-2xl font-mono font-bold tracking-widest">{group.accessCode}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="flex border-b border-border mb-6">
                    <button
                        className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('members')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            Miembros
                        </div>
                    </button>
                    <button
                        className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'projects'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('projects')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Layout className="w-4 h-4" />
                            Proyectos
                        </div>
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'members' ? (
                    <div className="space-y-3 animate-fade-in">
                        {members.length === 0 ? (
                            <p className="text-muted-foreground text-sm italic text-center py-8">Aún no hay miembros en este grupo.</p>
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                                        {member.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{member.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-[10px] bg-secondary px-2 py-1 rounded-full uppercase font-bold text-muted-foreground">
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        {projects.length === 0 ? (
                            <div className="text-center py-8 bg-secondary/20 rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground text-sm mb-2">No hay proyectos entregados aún.</p>
                                <p className="text-xs text-muted-foreground">Los estudiantes deben crear sus proyectos.</p>
                            </div>
                        ) : (
                            projects.map((project) => (
                                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg">{project.name}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'Completed' ? 'bg-yellow-100 text-yellow-700' :
                                                project.status === 'Evaluated' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {project.status === 'Active' ? 'En Progreso' :
                                                    project.status === 'Completed' ? 'Pendiente' : 'Evaluado'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {project.description}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => router.push(`/project/${project.id}`)}>
                                                Ver Detalles
                                            </Button>
                                            {userRole === 'teacher' && (
                                                <Button size="sm" onClick={() => router.push(`/rubric?projectId=${project.id}`)}>
                                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                                    Evaluar
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
