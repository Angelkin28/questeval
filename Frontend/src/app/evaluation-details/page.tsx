'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Award,
    TrendingUp,
    FileText,
    Star,
    CheckCircle2
} from 'lucide-react';

interface Criterio {
    nombre: string;
    descripcion: string;
    calificacion: number;
    puntajeMaximo: number;
}

export default function EvaluacionDetallePage() {
    const router = useRouter();

    const [evaluacion] = useState({
        proyecto: 'Sistema de Gestión Escolar',
        calificacionFinal: 95,
        estado: 'Aprobado',
        rango: 'Top 5%',
        evaluador: 'Dr. García López',
        fecha: '15 Febrero 2026',
        comentarios: 'Excelente desempeño académico. El proyecto demuestra un dominio sobresaliente de los conceptos y una implementación de alta calidad.',
    });

    const [criterios] = useState<Criterio[]>([
        {
            nombre: 'Arquitectura',
            descripcion: 'Modularidad y escalabilidad',
            calificacion: 9.0,
            puntajeMaximo: 10,
        },
        {
            nombre: 'Funcionalidad',
            descripcion: 'Cumplimiento de requisitos',
            calificacion: 8.5,
            puntajeMaximo: 10,
        },
        {
            nombre: 'UX / UI',
            descripcion: 'Experiencia de usuario y estética',
            calificacion: 7.0,
            puntajeMaximo: 10,
        },
        {
            nombre: 'Calidad de Código',
            descripcion: 'Clean code y documentación',
            calificacion: 9.5,
            puntajeMaximo: 10,
        },
    ]);

    const getBarWidth = (calificación: number, max: number) => {
        return `${(calificacion / max) * 100}%`;
    };

    const getCalificacionColor = (calificación: number) => {
        if (calificacion >= 9) return 'text-green-600';
        if (calificacion >= 7) return 'text-primary';
        return 'text-yellow-600';
    };

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold">Detalle de Criterios</h1>
                        <p className="text-xs text-muted-foreground">Evaluación Completa</p>
                    </div>
                </div>
            </header>

            <main className="px-4 py-6">
                {/* Título del Proyecto */}
                <div className="mb-6 animate-fade-in">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                        Proyecto 2
                    </p>
                    <h2 className="text-3xl font-bold title-serif mb-4">
                        {evaluacion.proyecto}
                    </h2>
                    <p className="text-sm text-muted-foreground italic">
                        Evaluación final de arquitectura y despliegue.
                    </p>
                </div>

                {/* Calificación Total */}
                <Card className="mb-6 bg-gradient-to-br from-primary/5 to-chart-1/5 border-primary/20 shadow-lg animate-fade-in">
                    <CardContent className="p-6 text-center">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                            Calificación Total
                        </p>
                        <div className="relative inline-block">
                            <div className="text-7xl font-bold text-primary title-serif mb-2">
                                {evaluacion.calificacionFinal}
                            </div>
                            <div className="absolute -top-2 -right-8">
                                <Award className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-primary mt-3">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-semibold uppercase tracking-wide">
                                Sobresaliente
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Rango y Estado */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <Card className="shadow-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                                Rango
                            </p>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <span className="text-lg font-bold title-serif">{evaluacion.rango}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm animate-fade-in" style={{ animationDelay: '150ms' }}>
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                                Estado
                            </p>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="text-lg font-bold title-serif text-green-600">{evaluacion.estado}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Desglose de Evaluación */}
                <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-4 uppercase tracking-wide">
                        Desglose de Evaluación
                    </h3>
                    <div className="space-y-4">
                        {criterios.map((criterio, index) => (
                            <Card
                                key={index}
                                className="shadow-sm animate-fade-in"
                                style={{ animationDelay: `${200 + index * 50}ms` }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-semibold mb-1 flex items-center gap-2">
                                                <Star className="w-4 h-4 text-primary" />
                                                {criterio.nombre}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {criterio.descripcion}
                                            </p>
                                        </div>
                                        <div className={`text-2xl font-bold title-serif ml-4 ${getCalificacionColor(criterio.calificacion)}`}>
                                            {criterio.calificacion.toFixed(1)}
                                        </div>
                                    </div>

                                    {/* Barra de Progreso */}
                                    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-chart-1 rounded-full transition-all duration-500"
                                            style={{ width: getBarWidth(criterio.calificacion, criterio.puntajeMaximo) }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Comentarios del Revisor */}
                <Card className="mb-6 shadow-md animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-primary" />
                            Comentarios del Revisor
                        </h3>
                        <div className="bg-secondary/30 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {evaluacion.comentarios}
                            </p>
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold">{evaluacion.evaluador}</span> • {evaluacion.fecha}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Botón Ver Análisis Detallado */}
                <Button
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold uppercase tracking-wide mb-4"
                    onClick={() => router.push('/analisis-detallado')}
                >
                    Ver Análisis Detallado →
                </Button>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-8">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>
        </div>
    );
}
