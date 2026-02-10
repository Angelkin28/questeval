'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Image as ImageIcon,
    Play,
    Download,
    ZoomIn,
    X
} from 'lucide-react';

interface MediaItem {
    id: string;
    tipo: 'imagen' | 'video';
    titulo: string;
    url?: string;
    descripcion?: string;
}

export default function GaleriaProyectoPage() {
    const router = useRouter();
    const [itemSeleccionado, setItemSeleccionado] = useState<MediaItem | null>(null);

    const [mediaItems] = useState<MediaItem[]>([
        {
            id: '1',
            tipo: 'video',
            titulo: 'Project Demo (Español)',
            descripcion: 'Demostración completa del proyecto',
        },
        {
            id: '2',
            tipo: 'imagen',
            titulo: 'Diseño Interior 1',
            descripcion: 'Vista del diseño de interiores',
        },
        {
            id: '3',
            tipo: 'imagen',
            titulo: 'Diseño Interior 2',
            descripcion: 'Cocina moderna',
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
                    <span className="font-semibold text-lg">Galería del Proyecto</span>
                </div>
            </header>

            <main className="px-4 py-6">
                {/* Título */}
                <div className="mb-6 animate-fade-in">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                        Project Gallery
                    </p>
                    <h2 className="text-3xl font-bold title-serif mb-2">
                        Óolale Mobile
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Multimedia y recursos visuales del proyecto
                    </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        AUDITORY
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        COMPLIANCE
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        UAT READY
                    </span>
                </div>

                {/* Grid de Media */}
                <div className="space-y-4 mb-6">
                    {mediaItems.map((item, index) => (
                        <Card
                            key={item.id}
                            className="shadow-md hover:shadow-lg transition-all cursor-pointer animate-fade-in"
                            style={{ animationDelay: `${150 + index * 50}ms` }}
                            onClick={() => setItemSeleccionado(item)}
                        >
                            <CardContent className="p-0">
                                {item.tipo === 'video' ? (
                                    <div className="relative bg-muted aspect-video flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20"></div>
                                        <div className="relative z-10">
                                            <div className="w-16 h-16 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center mb-2">
                                                <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
                                            </div>
                                            <p className="text-center text-sm font-medium text-foreground">
                                                {item.titulo}
                                            </p>
                                        </div>
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                            8:00 / 12:35
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                            HD
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative bg-secondary aspect-video flex items-center justify-center">
                                        <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                            <p className="text-white text-sm font-medium">{item.titulo}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Descripción del Proyecto */}
                <Card className="mb-6 shadow-sm animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-3 uppercase tracking-wide text-sm">
                            Auditory & Compliance Findings
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            Óolale Mobile optimiza procesos de Auditoría y Cumplimiento. Se validó satisfactoriamente el diseño <span className="font-semibold">UAT</span> enfocado en eficiencia operativa y usabilidad técnica, cumpliendo con los estándares de seguridad requeridos para la fase de producción.
                        </p>
                    </CardContent>
                </Card>

                {/* Botón Ver Más */}
                <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => router.push('/proyecto')}
                >
                    Ver Detalles del Proyecto
                </Button>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-12">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>

            {/* Modal de Vista Previa */}
            {itemSeleccionado && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setItemSeleccionado(null)}
                >
                    <div className="relative w-full max-w-4xl">
                        <button
                            onClick={() => setItemSeleccionado(null)}
                            className="absolute -top-12 right-0 text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="bg-card rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            {itemSeleccionado.tipo === 'video' ? (
                                <div className="relative bg-muted aspect-video flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20"></div>
                                    <div className="relative z-10">
                                        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-4">
                                            <Play className="w-12 h-12 text-primary-foreground ml-2" fill="currentColor" />
                                        </div>
                                        <p className="text-center text-lg font-medium">
                                            {itemSeleccionado.titulo}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative bg-secondary aspect-video flex items-center justify-center">
                                    <ImageIcon className="w-32 h-32 text-muted-foreground/50" />
                                </div>
                            )}

                            <div className="p-4 bg-card">
                                <h3 className="font-semibold mb-2">{itemSeleccionado.titulo}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {itemSeleccionado.descripcion}
                                </p>
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-2">
                                        <ZoomIn className="w-4 h-4" />
                                        Ver en Pantalla Completa
                                    </Button>
                                    <Button variant="outline" className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Descargar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
