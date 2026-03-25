'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Calendar,
    TrendingUp,
    Award,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';

interface Evaluation {
    id: string;
    project: string;
    score: number;
    date: string;
    status: 'Completada' | 'Pendiente' | 'En Revisión';
    evaluator: string;
    comments?: string;
}

export default function EvaluationsPage() {
    const router = useRouter();

    const [evaluaciones] = useState<Evaluation[]>([
        {
            id: '1',
            project: 'Óolale Móvil',
            score: 92,
            date: '15 Feb 2026',
            status: 'Completada',
            evaluator: 'Dr. García López',
            comments: 'Excelente trabajo en la integración del sistema.',
        },
        {
            id: '2',
            project: 'Analizador de Algoritmos Avanzados',
            score: 88,
            date: '10 Feb 2026',
            status: 'Completada',
            evaluator: 'Dra. Martínez Ruiz',
            comments: 'Muy buen análisis de complejidad.',
        },
        {
            id: '3',
            project: 'Sistema Logístico V2',
            score: 0,
            date: '20 Feb 2026',
            status: 'Pendiente',
            evaluator: 'Dr. Torres Sánchez',
        },
        {
            id: '4',
            project: 'Desarrollo de Microservicios',
            score: 95,
            date: '5 Feb 2026',
            status: 'Completada',
            evaluator: 'Dr. García López',
            comments: 'Implementación sobresaliente de arquitectura.',
        },
        {
            id: '5',
            project: 'Arquitectura Microservicios',
            score: 0,
            date: '25 Feb 2026',
            status: 'En Revisión',
            evaluator: 'Dra. Martínez Ruiz',
        },
    ]);

    const promedioGeneral = Math.round(
        evaluaciones
            .filter(e => e.status === 'Completada')
            .reduce((sum, e) => sum + e.score, 0) /
        evaluaciones.filter(e => e.status === 'Completada').length
    );

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'Completada':
                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case 'Pendiente':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'En Revisión':
                return <AlertCircle className="w-4 h-4 text-blue-600" />;
            default:
                return null;
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'Completada':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'Pendiente':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'En Revisión':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            default:
                return 'bg-secondary text-secondary-foreground';
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
                <button onClick={() => router.push('/dashboard')} className="hover:bg-secondary rounded-full p-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">Q</span>
                    </div>
                    <span className="font-semibold text-lg">Mis Evaluaciones</span>
                </div>
            </header>

            <main className="px-4 py-6">
                {/* Título */}
                <div className="mb-6 animate-fade-in">
                    <h1 className="text-4xl font-bold title-serif mb-2">Evaluaciones</h1>
                    <p className="text-sm text-muted-foreground">
                        Historial completo de tus evaluaciones académicas.
                    </p>
                </div>

                {/* Estadísticas Generales */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <Card className="shadow-sm animate-fade-in">
                        <CardContent className="p-4 text-center">
                            <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold text-primary title-serif">
                                {promedioGeneral}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Promedio</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm animate-fade-in" style={{ animationDelay: '50ms' }}>
                        <CardContent className="p-4 text-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-foreground title-serif">
                                {evaluaciones.filter(e => e.status === 'Completada').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Completadas</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <CardContent className="p-4 text-center">
                            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-foreground title-serif">
                                {evaluaciones.filter(e => e.status === 'Pendiente').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Lista de Evaluaciones */}
                <div className="space-y-4">
                    {evaluaciones.map((evaluacion, index) => (
                        <Card
                            key={evaluacion.id}
                            className="shadow-md hover:shadow-lg transition-all cursor-pointer animate-fade-in"
                            style={{ animationDelay: `${150 + index * 50}ms` }}
                            onClick={() => evaluacion.status === 'Completada' && router.push('/evaluation-details')}
                        >
                            <CardContent className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getEstadoColor(evaluacion.status)} flex items-center gap-1`}>
                                                {getEstadoIcon(evaluacion.status)}
                                                {evaluacion.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold title-serif mb-1">
                                            {evaluacion.project}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>{evaluacion.date}</span>
                                            <span>•</span>
                                            <span>{evaluacion.evaluator}</span>
                                        </div>
                                    </div>

                                    {evaluacion.status === 'Completada' && (
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-primary title-serif">
                                                {evaluacion.score}
                                            </div>
                                            <p className="text-xs text-muted-foreground">/100</p>
                                        </div>
                                    )}
                                </div>

                                {/* Comentarios */}
                                {evaluacion.comments && (
                                    <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-muted-foreground">
                                                {evaluacion.comments}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Acción según estado */}
                                {evaluacion.status === 'Pendiente' && (
                                    <Button
                                        className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push('/rubric');
                                        }}
                                    >
                                        Iniciar Evaluación
                                    </Button>
                                )}

                                {evaluacion.status === 'En Revisión' && (
                                    <div className="mt-3 text-center text-sm text-muted-foreground">
                                        <TrendingUp className="w-4 h-4 inline mr-1" />
                                        En proceso de revisión por el evaluador
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-12">
                    <p>QuestEval / Validación Académica © 2024</p>
                </div>
            </main>
        </div>
    );
}
