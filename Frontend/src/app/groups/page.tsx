'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Users,
    UserPlus,
    Crown,
    Mail,
    Calendar,
    MoreVertical,
    Loader2
} from 'lucide-react';
import { api, Group } from '@/lib/api';

export default function GruposPage() {
    const router = useRouter();
    const [grupos, setGrupos] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrupos = async () => {
            try {
                // El Profesor ve TODOS los grupos (los crea y gestiona)
                // El Alumno ve solo los grupos a los que pertenece
                const userData = localStorage.getItem('user');
                const role = userData ? JSON.parse(userData).role : '';

                const data = (role === 'Profesor' || role === 'Admin')
                    ? await api.groups.getAll()
                    : await api.groups.getMyGroups();

                setGrupos(data);
            } catch (error) {
                console.error('Error fetching groups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGrupos();
    }, []);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
                <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">Q</span>
                    </div>
                    <span className="font-semibold text-lg">QuestEval</span>
                </div>
            </header>

            <main className="px-4 py-6">
                {/* Título */}
                <div className="mb-6 animate-fade-in">
                    <h1 className="text-4xl font-bold title-serif mb-2">Mis Grupos</h1>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tus equipos de trabajo y proyectos colaborativo
                    </p>
                </div>

                {/* Botón Acciones */}
                <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in">
                    <Button
                        className="h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => router.push('/groups/new')}
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Crear Grupo
                    </Button>
                    <Button
                        className="h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                        onClick={() => router.push('/groups/join')}
                    >
                        <Users className="w-5 h-5 mr-2" />
                        Unirme a Grupo
                    </Button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    /* Lista de Grupos */
                    <div className="space-y-4">
                        {grupos.length === 0 ? (
                            <div className="text-center py-10 bg-secondary/20 rounded-xl border-2 border-dashed">
                                <p className="text-muted-foreground">No tienes grupos asignados.</p>
                            </div>
                        ) : (
                            grupos.map((grupo, index) => (
                                <Card
                                    key={grupo.id}
                                    className="shadow-md hover:shadow-lg transition-all cursor-pointer animate-fade-in"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                    onClick={() => router.push(`/groups/${grupo.id}`)}
                                >
                                    <CardContent className="p-5">
                                        {/* Header del Grupo */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold title-serif mb-1">
                                                    {grupo.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Código de acceso: <span className="font-mono bg-secondary px-1 rounded">{grupo.accessCode}</span>
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Creado: {new Date(grupo.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button className="hover:bg-secondary rounded-full p-2 transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Miembros (Placeholder count as we don't have count in list API yet) */}
                                        <div className="flex items-center gap-2 mt-4">
                                            <Users className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">
                                                Ver detalles para miembros
                                            </span>
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
