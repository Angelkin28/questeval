'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Play,
    Users,
    Calendar,
    CheckCircle2,
    FileText,
    Star,
    Award
} from 'lucide-react';

export default function ProyectoDetallePage() {
    const router = useRouter();
    const [proyecto] = useState({
        nombre: 'Óolale Mobile',
        subtitulo: 'INTEGRACIÓN DE SISTEMAS',
        categoria: 'Proyecto Integrador',
        fecha: '2026',
        calificacion: 92,
        estado: 'EVALUACIÓN ACTUAL',
        equipo: [
            { nombre: 'Jorge García', rol: 'Desarrollador Full Stack' },
            { nombre: 'María López', rol: 'Diseñadora UX/UI' },
            { nombre: 'Carlos Ruiz', rol: 'Backend Developer' },
        ],
        competencias: [
            'Desarrollo de Software',
            'Integración de Sistemas',
            'Trabajo en Equipo',
            'Gestión de Proyectos',
        ],
        descripcion: 'Sistema integral de gestión académica que permite la evaluación de proyectos mediante rúbricas digitales, facilitando el seguimiento del progreso estudiantil.',
    });

    const [otrosProyectos] = useState([
        {
            id: '1',
            nombre: 'Sistema Logístico V2',
            categoria: 'INTEGRACIÓN Y FINALIZADO',
            calificacion: 88,
        },
        {
            id: '2',
            nombre: 'Arquitectura Microservicios',
            categoria: 'INTEGRACIÓN Y FINALIZADO',
            calificacion: 95,
        },
    ]);

    return (
        <div className="min-h-screen bg-background pb-8">
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
                {/* Título del Proyecto */}
                <div className="mb-6 animate-fade-in">
                    <h1 className="text-4xl font-bold title-serif mb-2 leading-tight">
                        {proyecto.nombre}
                    </h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">
                        {proyecto.subtitulo}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-6">
                    <Button className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                        Integrador
                    </Button>
                    <Button className="rounded-full px-6 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        Videojuegos
                    </Button>
                </div>

                {/* Card Principal del Proyecto */}
                <Card className="mb-6 shadow-lg animate-fade-in">
                    <CardContent className="p-5">
                        {/* Estado y Calificación */}
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-xs font-semibold text-primary/70 uppercase tracking-wide">
                                {proyecto.estado}
                            </span>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-primary title-serif">
                                    {proyecto.calificacion}
                                    <span className="text-lg text-muted-foreground">/100</span>
                                </div>
                            </div>
                        </div>

                        {/* Nombre y Categoría */}
                        <h2 className="text-2xl font-bold title-serif mb-1">
                            {proyecto.nombre}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            {proyecto.categoria} • {proyecto.fecha}
                        </p>

                        {/* Video/Thumbnail */}
                        <div className="relative bg-muted rounded-lg overflow-hidden mb-4 aspect-video flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20"></div>
                            <button className="relative z-10 w-16 h-16 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
                            </button>
                        </div>

                        {/* Competencias Alcanzadas */}
                        <div className="flex items-center gap-2 text-primary mb-4">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                                Competencias Alcanzadas
                            </span>
                            <ArrowLeft className="w-3 h-3 rotate-180" />
                        </div>

                        {/* Botones de Acción */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => router.push('/rubrica')}
                                className="bg-foreground text-background hover:bg-foreground/90 h-12"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Ver Rúbrica
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12"
                            >
                                <Award className="w-4 h-4 mr-2" />
                                Competencias
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Descripción */}
                <Card className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Descripción del Proyecto
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {proyecto.descripcion}
                        </p>
                    </CardContent>
                </Card>

                {/* Equipo */}
                <Card className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Equipo del Proyecto
                        </h3>
                        <div className="space-y-3">
                            {proyecto.equipo.map((miembro, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-primary font-semibold text-sm">
                                            {miembro.nombre.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{miembro.nombre}</p>
                                        <p className="text-xs text-muted-foreground">{miembro.rol}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Otros Proyectos */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-4 text-lg">Otros Proyectos</h3>
                    <div className="space-y-3">
                        {otrosProyectos.map((p, index) => (
                            <Card
                                key={p.id}
                                className="hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
                                style={{ animationDelay: `${300 + index * 100}ms` }}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Star className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-1">{p.nombre}</h4>
                                        <p className="text-xs text-muted-foreground uppercase">
                                            {p.categoria}
                                        </p>
                                    </div>
                                    <div className="text-2xl font-bold text-primary title-serif">
                                        {p.calificacion}
                                        <span className="text-xs text-muted-foreground">/100</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-8">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>
        </div>
    );
}
