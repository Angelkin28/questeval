'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/layout/Header';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Star,
    MessageSquare,
    Send,
    Save
} from 'lucide-react';

import { api } from '@/lib/api';
import { useEffect } from 'react';

interface Criterio {
    id: string;
    nombre: string;
    descripcion: string;
    puntajeMaximo: number;
    puntajeAsignado: number;
}

function RubricaContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId') ?? undefined;
    const [project, setProject] = useState<any>(null);

    const [guardando, setGuardando] = useState(false);
    const [comentarios, setComentarios] = useState('');
    const [criterios, setCriterios] = useState<Criterio[]>([]);
    const [loading, setLoading] = useState(true);
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [problemaReportado, setProblemaReportado] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) {
                alert('No se especificó un proyecto para evaluar');
                router.push('/dashboard');
                return;
            }

            try {
                const [projectData, criteriaData] = await Promise.all([
                    api.projects.getById(projectId),
                    api.criteria.getAll()
                ]);

                if (projectData) setProject(projectData);

                if (criteriaData && criteriaData.length > 0) {
                    setCriterios(criteriaData.map(c => ({
                        id: c.id,
                        nombre: c.name,
                        descripcion: c.description,
                        puntajeMaximo: c.maxScore,
                        puntajeAsignado: 0 // Initialize at 0
                    })));
                } else {
                    // Fallback if no criteria in backend
                    setCriterios([
                        { id: '1', nombre: 'Funcionalidad', descripcion: 'Cumple requisitos', puntajeMaximo: 25, puntajeAsignado: 0 },
                        { id: '2', nombre: 'Diseño', descripcion: 'Buena interfaz', puntajeMaximo: 25, puntajeAsignado: 0 },
                        { id: '3', nombre: 'Código', descripcion: 'Limpio y ordenado', puntajeMaximo: 25, puntajeAsignado: 0 },
                        { id: '4', nombre: 'Innovación', descripcion: 'Creatividad', puntajeMaximo: 25, puntajeAsignado: 0 },
                    ]);
                }

            } catch (error) {
                console.error("Error fetching data", error);
                alert("Error cargando datos de evaluación");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId, router]);

    const calificacionTotal = criterios.reduce((sum, c) => sum + c.puntajeAsignado, 0);
    const puntajeMaximoTotal = criterios.reduce((sum, c) => sum + c.puntajeMaximo, 0);

    const handleSliderChange = (id: string, value: number[]) => {
        setCriterios(criterios.map(c =>
            c.id === id ? { ...c, puntajeAsignado: value[0] } : c
        ));
    };

    const handleGuardar = async () => {
        if (!projectId) return;

        const userData = localStorage.getItem('user');
        if (!userData) {
            alert('Sesión expirada, inicia sesión nuevamente.');
            router.push('/login');
            return;
        }
        const currentUser = JSON.parse(userData);
        const evaluatorId = currentUser.userId ?? currentUser.id;

        setGuardando(true);
        try {
            await api.evaluations.create({
                projectId: projectId,
                evaluatorId,
                details: criterios.map(c => ({
                    criterionId: c.id,
                    criterionName: c.nombre,
                    score: c.puntajeAsignado
                }))
            });

            alert('Evaluación guardada exitosamente');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error saving evaluation', error);
            alert(error?.message || 'Error al guardar evaluación');
        } finally {
            setGuardando(false);
        }
    };

    const handleEnviarReporte = async () => {
        if (!problemaReportado.trim()) return;
        // Simular envío de reporte
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProblemaReportado('');
        setMostrarReporte(false);
        alert('Reporte enviado correctamente.');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Cargando rúbrica...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <Header title="Rúbrica Digital" showBack />

            <main className="px-4 py-6">
                {/* Header Contextual del Proyecto */}
                <div className="flex items-center justify-between mb-6 animate-fade-in">
                    <div>
                        <h2 className="text-xl font-bold title-serif">{project?.name || 'Cargando...'}</h2>
                        <p className="text-sm text-muted-foreground">{project?.category || 'Evaluación de Proyecto'}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-primary title-serif">
                            {calificacionTotal}
                            <span className="text-sm text-muted-foreground">/{puntajeMaximoTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Instrucciones */}
                <Card className="mb-6 bg-primary/5 border-primary/20 animate-fade-in shadow-sm">
                    <CardContent className="p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Instrucciones</p>
                            <p className="text-xs text-muted-foreground">
                                Desliza los controles para asignar el puntaje de cada criterio. La calificación final se calcula automáticamente.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Criterios */}
                <div className="space-y-4 mb-8">
                    {criterios.map((criterio, index) => (
                        <Card
                            key={criterio.id}
                            className="shadow-md hover:shadow-lg transition-all border-border/60 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg flex items-center gap-2 mb-1">
                                            <Star className="w-4 h-4 text-primary" />
                                            {criterio.nombre}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {criterio.descripcion}
                                        </p>
                                    </div>
                                    <div className="text-right pl-4">
                                        <span className="text-2xl font-bold text-primary block leading-none">
                                            {criterio.puntajeAsignado}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            de {criterio.puntajeMaximo} pts
                                        </span>
                                    </div>
                                </div>

                                <Slider
                                    value={[criterio.puntajeAsignado]}
                                    onValueChange={(val: number[]) => handleSliderChange(criterio.id, val)}
                                    max={criterio.puntajeMaximo}
                                    step={1}
                                    className="py-4"
                                />

                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                                    <span>Deficiente (0)</span>
                                    <span>Excelente ({criterio.puntajeMaximo})</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Resumen Final */}
                <Card className={`mb-6 border-2 shadow-lg animate-fade-in ${calificacionTotal >= 70 ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                    <CardContent className="p-6 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                            Estatus Final
                        </p>
                        <div className="flex items-center justify-center gap-3 mb-1">
                            {calificacionTotal >= 70 ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            )}
                            <span className={`text-2xl font-bold title-serif ${calificacionTotal >= 70 ? 'text-green-700' : 'text-red-700'}`}>
                                {calificacionTotal >= 70 ? 'Aprobado' : 'No Aprobado'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Calificación mínima aprobatoria: 70/100
                        </p>
                    </CardContent>
                </Card>

                {/* Comentarios */}
                <div className="mb-8 animate-fade-in">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Retroalimentación
                    </h3>
                    <Textarea
                        placeholder="Escribe tus observaciones generales, fortalezas y áreas de mejora..."
                        className="min-h-[120px] bg-card p-4 text-base"
                        value={comentarios}
                        onChange={(e) => setComentarios(e.target.value)}
                    />
                </div>

                {/* Acciones */}
                <div className="space-y-3">
                    <Button
                        size="lg"
                        className="w-full text-base font-bold shadow-lg h-14"
                        onClick={handleGuardar}
                        disabled={guardando}
                    >
                        {guardando ? 'Guardando...' : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Guardar Evaluación
                            </>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => setMostrarReporte(!mostrarReporte)}
                    >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Reportar Problema con la Rúbrica
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground text-xs"
                        onClick={() => router.push('/rubric/edit')}
                    >
                        Gestionar Criterios (Profesor)
                    </Button>
                </div>

                {/* Modal de Reporte (Inline) */}
                {mostrarReporte && (
                    <div className="mt-4 p-4 border border-destructive/30 bg-destructive/5 rounded-lg animate-in slide-in-from-top-2">
                        <h4 className="font-bold text-destructive mb-2 flex items-center gap-2">Reportar Incidencia</h4>
                        <Textarea
                            placeholder="Describe el error en la rúbrica..."
                            className="bg-background mb-3"
                            value={problemaReportado}
                            onChange={(e) => setProblemaReportado(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={handleEnviarReporte}
                            >
                                Enviar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setMostrarReporte(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function RubricaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Cargando rúbrica...</p></div>}>
            <RubricaContent />
        </Suspense>
    );
}
