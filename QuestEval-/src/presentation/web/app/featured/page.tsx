'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Search,
    Users,
    ArrowRight,
    Star
} from 'lucide-react';

interface ProyectoDestacado {
    id: string;
    nombre: string;
    categoria: 'Integrador' | 'Videojuegos';
    calificacion: number;
    estado: string;
    equipo: string;
    descripcion: string;
    miembros: number;
    imagen?: string;
    periodo: string;
}

export default function ProyectosDestacadosPage() {
    const router = useRouter();
    const [categoriaActiva, setCategoriaActiva] = useState<'Integrador' | 'Videojuegos'>('Videojuegos');

    const [proyectosDestacados] = useState<ProyectoDestacado[]>([
        {
            id: '1',
            nombre: 'Quest Quest: The RPG',
            categoria: 'Videojuegos',
            calificacion: 88,
            estado: 'FINALIZADO',
            equipo: 'FANTASY DEV TEAM',
            descripcion: 'Un juego de rol clásico con mecánicas de combate por turnos y una narrativa rica inspirada en...',
            miembros: 3,
            periodo: '2024-B',
        },
        {
            id: '2',
            nombre: 'Cyber Runner 2077',
            categoria: 'Videojuegos',
            calificacion: 92,
            estado: 'EN REVISIÓN',
            equipo: 'NEON PIXELS',
            descripcion: 'Plataformas de acción rápida en un entorno cyberpunk con música y synthwave generativa.',
            miembros: 2,
            periodo: '2024-B',
        },
        {
            id: '3',
            nombre: 'Nebula Quest',
            categoria: 'Videojuegos',
            calificacion: 95,
            estado: 'EVALUADO',
            equipo: 'SPACE EXPLORERS',
            descripcion: 'Aventura espacial con exploración de planetas y combate estratégico.',
            miembros: 4,
            periodo: '2024-B',
        },
        {
            id: '4',
            nombre: 'Pixel Dungeon',
            categoria: 'Videojuegos',
            calificacion: 82,
            estado: 'EVALUADO',
            equipo: 'RETRO GAMES',
            descripcion: 'Roguelike clásico con gráficos pixel art y mazmorras procedurales.',
            miembros: 3,
            periodo: '2024-A',
        },
    ]);

    const proyectosFiltrados = proyectosDestacados.filter(p => p.categoria === categoriaActiva);

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'FINALIZADO':
                return 'bg-green-600 text-white';
            case 'EN REVISIÓN':
                return 'bg-yellow-600 text-white';
            case 'EVALUADO':
                return 'bg-blue-600 text-white';
            default:
                return 'bg-secondary text-secondary-foreground';
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-lg">Óolale Mobile</span>
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

                {/* Título de Sección */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold title-serif">Proyectos Destacados</h2>
                    <span className="text-sm font-semibold text-primary">{proyectosFiltrados[0]?.periodo}</span>
                </div>

                {/* Lista de Proyectos Destacados */}
                <div className="space-y-4">
                    {proyectosFiltrados.map((proyecto, index) => (
                        <Card
                            key={proyecto.id}
                            className="overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => router.push('/proyecto')}
                        >
                            <CardContent className="p-0">
                                {/* Imagen/Banner del Proyecto */}
                                <div className="relative h-48 bg-gradient-to-br from-primary/20 via-chart-1/20 to-chart-2/20 flex items-center justify-center overflow-hidden">
                                    {/* Efecto de fondo según el proyecto */}
                                    {proyecto.nombre.includes('Quest Quest') && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-orange-800/40 to-yellow-700/40"></div>
                                    )}
                                    {proyecto.nombre.includes('Cyber Runner') && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-blue-800/40 to-purple-700/40"></div>
                                    )}
                                    {proyecto.nombre.includes('Nebula') && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-800/40 to-purple-700/40"></div>
                                    )}
                                    {proyecto.nombre.includes('Pixel') && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-emerald-800/40 to-teal-700/40"></div>
                                    )}

                                    {/* Badge de Estado */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getEstadoColor(proyecto.estado)}`}>
                                            {proyecto.estado}
                                        </span>
                                    </div>

                                    {/* Calificación */}
                                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full">
                                        <span className="text-lg font-bold title-serif">{proyecto.calificacion}</span>
                                        <span className="text-xs">/100</span>
                                    </div>

                                    {/* Icono de Play */}
                                    <div className="relative z-10 w-16 h-16 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                                        <Star className="w-8 h-8 text-primary" fill="currentColor" />
                                    </div>
                                </div>

                                {/* Información del Proyecto */}
                                <div className="p-5">
                                    <h3 className="text-xl font-bold title-serif mb-2">
                                        {proyecto.nombre}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <Users className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                                            {proyecto.equipo}
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {proyecto.descripcion}
                                    </p>

                                    {/* Avatares de Miembros */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {Array.from({ length: proyecto.miembros }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 bg-primary/20 border-2 border-card rounded-full flex items-center justify-center"
                                                >
                                                    <span className="text-xs font-semibold text-primary">
                                                        {String.fromCharCode(65 + i)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            size="sm"
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                                        >
                                            Ver Detalles
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-12">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>
        </div>
    );
}
