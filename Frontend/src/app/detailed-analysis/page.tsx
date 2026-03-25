'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Search,
    TrendingUp,
    Award,
    Target,
    CheckCircle2
} from 'lucide-react';

interface ProyectoAnalisis {
    id: string;
    nombre: string;
    categoria: string;
    calificacion: number;
    nivel: string;
}

export default function AnalisisDetalladoPage() {
    const router = useRouter();
    const [categoriaActiva, setCategoriaActiva] = useState<'Integrador' | 'Videojuegos'>('Videojuegos');

    const [analisis] = useState({
        promedioGeneral: 9.5,
        rango: 'Legendario',
        estado: 'Aprobado',
        totalProyectos: 3,
    });

    const [proyectos] = useState<ProyectoAnalisis[]>([
        {
            id: '1',
            nombre: 'Quest: Shadow RPG',
            categoria: 'Mecánicas y Narrativa',
            calificacion: 9.8,
            nivel: 'SOBRESALIENTE',
        },
        {
            id: '2',
            nombre: 'Neon Pulse Platformer',
            categoria: 'Diseño de Niveles',
            calificacion: 8.5,
            nivel: 'MUY BIEN',
        },
        {
            id: '3',
            nombre: 'Zen Space VR',
            categoria: 'Inmersión y UX',
            calificacion: 9.2,
            nivel: 'NOTABLE',
        },
    ]);

    const getCalificacionColor = (calificación: number) => {
        if (calificacion >= 9.5) return 'text-green-500';
        if (calificacion >= 8.5) return 'text-primary';
        if (calificacion >= 7.0) return 'text-yellow-500';
        return 'text-orange-500';
    };

    const getIconoCategoria = (nombre: string) => {
        if (nombre.includes('Shadow')) return '⚔️';
        if (nombre.includes('Neon')) return '🚗';
        if (nombre.includes('Zen')) return '🎮';
        return '📦';
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-lg">Análisis</span>
                </div>
                <button className="hover:bg-secondary rounded-full p-2 transition-colors">
                    <Search className="w-5 h-5" />
                </button>
            </header>

            <main className="px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-3 mb-6">
                    <Button
                        onClick={() => setCategoriaActiva('Integrador')}
                        className={`rounded-full px-6 ${categoriaActiva === 'Integrador'
                                ? 'bg-foreground text-background hover:bg-foreground/90'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        Integrador
                    </Button>
                    <Button
                        onClick={() => setCategoriaActiva('Videojuegos')}
                        className={`rounded-full px-6 ${categoriaActiva === 'Videojuegos'
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        Videojuegos
                    </Button>
                </div>

                {/* Gráfico Circular de Calificación */}
                <Card className="mb-6 shadow-lg animate-fade-in">
                    <CardContent className="p-8 text-center">
                        {/* Círculo de Progreso */}
                        <div className="relative inline-flex items-center justify-center mb-4">
                            <svg className="w-48 h-48 transform -rotate-90">
                                {/* Círculo de fondo */}
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="hsl(var(--secondary))"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                {/* Círculo de progreso */}
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${(analisis.promedioGeneral / 10) * 553} 553`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            {/* Número central */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-6xl font-bold text-primary title-serif">
                                    {analisis.promedioGeneral}
                                </div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                                    Puntos
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            Promedio General de la Categoría
                        </p>

                        {/* Rango y Estado */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-primary/10 rounded-lg p-3">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Award className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-semibold text-primary uppercase">Rango</span>
                                </div>
                                <p className="text-lg font-bold title-serif">{analisis.rango}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-semibold text-green-600 uppercase">Estado</span>
                                </div>
                                <p className="text-lg font-bold title-serif text-green-600">{analisis.estado}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Desglose de Proyectos */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold uppercase tracking-wide">Desglose de Proyectos</h2>
                        <span className="text-xs font-semibold text-primary">{analisis.totalProyectos} TOTALES</span>
                    </div>

                    <div className="space-y-3">
                        {proyectos.map((proyecto, index) => (
                            <Card
                                key={proyecto.id}
                                className="shadow-sm hover:shadow-md transition-all cursor-pointer animate-fade-in"
                                style={{ animationDelay: `${100 + index * 50}ms` }}
                                onClick={() => router.push('/evaluación-detalle')}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Icono */}
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                            {getIconoCategoria(proyecto.nombre)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm mb-1">{proyecto.nombre}</h3>
                                            <p className="text-xs text-muted-foreground">{proyecto.categoria}</p>
                                        </div>

                                        {/* Calificación */}
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold title-serif ${getCalificacionColor(proyecto.calificacion)}`}>
                                                {proyecto.calificacion}
                                            </div>
                                            <p className="text-xs text-muted-foreground uppercase">{proyecto.nivel}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Botón Ver Más Análisis */}
                <Button
                    variant="outline"
                    className="w-full h-12 gap-2"
                    onClick={() => router.push('/evaluaciones')}
                >
                    <TrendingUp className="w-5 h-5" />
                    Ver Historial Completo
                </Button>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-12">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>
        </div>
    );
}
