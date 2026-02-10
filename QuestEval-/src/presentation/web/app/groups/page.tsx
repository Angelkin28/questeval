'use client';

import { useState } from 'react';
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
    MoreVertical
} from 'lucide-react';

interface Miembro {
    id: string;
    nombre: string;
    email: string;
    rol: 'Líder' | 'Miembro';
    avatar?: string;
}

interface Grupo {
    id: string;
    nombre: string;
    proyecto: string;
    miembros: Miembro[];
    fechaCreacion: string;
}

export default function GruposPage() {
    const router = useRouter();

    const [grupos] = useState<Grupo[]>([
        {
            id: '1',
            nombre: 'Equipo Óolale',
            proyecto: 'Óolale Mobile - Integración de Sistemas',
            fechaCreacion: '15 Enero 2026',
            miembros: [
                { id: '1', nombre: 'Jorge García', email: 'jorge.garcia@uni.edu', rol: 'Líder' },
                { id: '2', nombre: 'María López', email: 'maria.lopez@uni.edu', rol: 'Miembro' },
                { id: '3', nombre: 'Carlos Ruiz', email: 'carlos.ruiz@uni.edu', rol: 'Miembro' },
            ],
        },
        {
            id: '2',
            nombre: 'Dev Squad',
            proyecto: 'Sistema Logístico V2',
            fechaCreacion: '10 Enero 2026',
            miembros: [
                { id: '4', nombre: 'Ana Martínez', email: 'ana.martinez@uni.edu', rol: 'Líder' },
                { id: '5', nombre: 'Luis Torres', email: 'luis.torres@uni.edu', rol: 'Miembro' },
            ],
        },
    ]);

    const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);

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
                        Gestiona tus equipos de trabajo y proyectos colaborativos
                    </p>
                </div>

                {/* Botón Crear Grupo */}
                <Button
                    className="w-full mb-6 h-12 bg-primary text-primary-foreground hover:bg-primary/90 animate-fade-in"
                    onClick={() => alert('Funcionalidad próximamente')}
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Crear Nuevo Grupo
                </Button>

                {/* Lista de Grupos */}
                <div className="space-y-4">
                    {grupos.map((grupo, index) => (
                        <Card
                            key={grupo.id}
                            className="shadow-md hover:shadow-lg transition-all cursor-pointer animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => setGrupoSeleccionado(grupo)}
                        >
                            <CardContent className="p-5">
                                {/* Header del Grupo */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold title-serif mb-1">
                                            {grupo.nombre}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {grupo.proyecto}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>Creado: {grupo.fechaCreacion}</span>
                                        </div>
                                    </div>
                                    <button className="hover:bg-secondary rounded-full p-2 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Miembros */}
                                <div className="flex items-center gap-2 mt-4">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">
                                        {grupo.miembros.length} miembros
                                    </span>

                                    {/* Avatares de miembros */}
                                    <div className="flex -space-x-2 ml-2">
                                        {grupo.miembros.slice(0, 3).map((miembro) => (
                                            <div
                                                key={miembro.id}
                                                className="w-8 h-8 bg-primary/20 border-2 border-card rounded-full flex items-center justify-center"
                                            >
                                                <span className="text-xs font-semibold text-primary">
                                                    {miembro.nombre.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                        ))}
                                        {grupo.miembros.length > 3 && (
                                            <div className="w-8 h-8 bg-secondary border-2 border-card rounded-full flex items-center justify-center">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    +{grupo.miembros.length - 3}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Modal/Detalle del Grupo Seleccionado */}
                {grupoSeleccionado && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
                        onClick={() => setGrupoSeleccionado(null)}
                    >
                        <Card
                            className="w-full max-w-lg max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CardContent className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold title-serif mb-1">
                                            {grupoSeleccionado.nombre}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {grupoSeleccionado.proyecto}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setGrupoSeleccionado(null)}
                                        className="hover:bg-secondary rounded-full p-2 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Miembros del Grupo */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        Miembros del Equipo ({grupoSeleccionado.miembros.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {grupoSeleccionado.miembros.map((miembro) => (
                                            <div
                                                key={miembro.id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                            >
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-primary font-semibold">
                                                        {miembro.nombre.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{miembro.nombre}</p>
                                                        {miembro.rol === 'Líder' && (
                                                            <Crown className="w-4 h-4 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{miembro.email}</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-medium text-primary uppercase">
                                                    {miembro.rol}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="space-y-2">
                                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Invitar Miembro
                                    </Button>
                                    <Button variant="outline" className="w-full">
                                        Ver Proyecto Asociado
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-12">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>
        </div>
    );
}
