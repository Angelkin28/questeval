'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Users,
    ClipboardCheck,
    BookOpen,
    GraduationCap
} from 'lucide-react';

interface TeacherDashboardProps {
    user: any;
}

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
    const router = useRouter();

    // Mock Data (Español)
    const [grupos] = useState([
        { id: 1, nombre: 'DSM - 2A', alumnos: 24, entregados: 18, pendientes: 6 },
        { id: 2, nombre: 'DSM - 2B', alumnos: 22, entregados: 20, pendientes: 2 },
        { id: 3, nombre: 'Videojuegos - 5A', alumnos: 15, entregados: 15, pendientes: 0 },
    ]);

    const [entregasRecientes] = useState([
        { id: 1, proyecto: 'Sistema de Gestión', alumno: 'Juan Pérez', grupo: 'DSM-2A', fecha: 'Hoy, 10:30 AM' },
        { id: 2, proyecto: 'App Móvil React', alumno: 'María López', grupo: 'DSM-2B', fecha: 'Ayer, 4:15 PM' },
        { id: 3, proyecto: 'Juego Unity 2D', alumno: 'Carlos Ruiz', grupo: 'Videojuegos-5A', fecha: 'Ayer, 2:00 PM' },
    ]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold title-serif text-primary">Panel de Profesor</h1>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tus grupos y evaluaciones académicas.
                    </p>
                </div>
                <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-md"
                    onClick={() => router.push('/evaluations/new')} // Ruta interna en inglés
                >
                    <Plus className="w-4 h-4" />
                    Nueva Asignación
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase">Pendientes</p>
                            <p className="text-2xl font-bold title-serif">8</p>
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
                            <p className="text-2xl font-bold title-serif">61</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mis Grupos */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold title-serif flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        Mis Grupos
                    </h2>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/groups')}>Ver Todos</Button>
                </div>
                <div className="grid gap-3">
                    {grupos.map((grupo) => (
                        <Card key={grupo.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/groups/${grupo.id}`)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">{grupo.nombre}</h3>
                                    <p className="text-xs text-muted-foreground">{grupo.alumnos} Alumnos</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-medium ${grupo.pendientes > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                        {grupo.pendientes} Pendientes
                                    </div>
                                    <div className="w-24 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(grupo.entregados / grupo.alumnos) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {grupo.entregados}/{grupo.alumnos} Entregados
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Entregas Recientes (Para Calificar) */}
            <div>
                <h2 className="text-lg font-bold title-serif mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Por Calificar
                </h2>
                <div className="space-y-3">
                    {entregasRecientes.map((entrega) => (
                        <Card key={entrega.id} className="cursor-pointer hover:border-primary transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold">{entrega.proyecto}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {entrega.alumno} • <span className="text-primary/80">{entrega.grupo}</span>
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-foreground text-background hover:bg-foreground/90"
                                    onClick={() => router.push('/rubric')}
                                >
                                    Evaluar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
