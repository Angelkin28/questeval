'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, Project, EvaluationResponse } from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    LayoutGrid,
    Video,
    ArrowLeft,
    Users,
    CheckCircle2,
    Trophy,
    MessageSquare
} from 'lucide-react';

export default function ProjectDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;

            try {
                const projectData = await api.projects.getById(id);
                setProject(projectData);

                // Fetch evaluations if project is evaluated
                if (projectData.status === 'Evaluated' || projectData.status === 'Completed') {
                    try {
                        const evaluations = await api.evaluations.getByProject(id);
                        if (evaluations && evaluations.length > 0) {
                            // Assuming we show the latest one or the only one
                            setEvaluation(evaluations[evaluations.length - 1]);
                        }
                    } catch (evalErr) {
                        console.error("Error fetching evaluations", evalErr);
                    }
                }
            } catch (error) {
                console.error("Error fetching project", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (!project) return <div className="p-8 text-center">Proyecto no encontrado</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Detalles del Proyecto" showBack />

            <main className="container mx-auto px-4 py-6">

                {/* Project Header Card */}
                <Card className="mb-6 overflow-hidden shadow-lg border-border/50">
                    <div className="h-48 bg-secondary relative">
                        {project.thumbnailUrl ? (
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${project.thumbnailUrl})` }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                                <LayoutGrid className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                        )}
                        <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${project.category === 'Integrador' ? 'bg-blue-500/80 text-white' : 'bg-purple-500/80 text-white'
                                }`}>
                                {project.category}
                            </span>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold mb-2 title-serif">{project.name}</h1>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            {project.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            {project.videoUrl && (
                                <Button variant="outline" className="gap-2" onClick={() => window.open(project.videoUrl, '_blank')}>
                                    <Video className="w-4 h-4 text-red-500" />
                                    Ver Video Demo
                                </Button>
                            )}
                            {project.teamMembers && project.teamMembers.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-md">
                                    <Users className="w-4 h-4" />
                                    <span>{project.teamMembers.join(', ')}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-muted-foreground">Estatus:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                project.status === 'Evaluated' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {project.status === 'Active' ? 'En Progreso' :
                                    project.status === 'Completed' ? 'Entregado' : 'Evaluado'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Evaluation Results Section */}
                {evaluation ? (
                    <div className="animate-fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-bold">Resultados de Evaluación</h2>
                        </div>

                        <Card className={`mb-6 border-l-4 ${evaluation.finalScore >= 70 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Calificación Final</p>
                                        <div className={`text-4xl font-bold title-serif ${evaluation.finalScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                            {evaluation.finalScore} <span className="text-lg text-muted-foreground font-normal">/ 100</span>
                                        </div>
                                    </div>
                                    {evaluation.finalScore >= 70 ? (
                                        <div className="bg-green-100 p-3 rounded-full">
                                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                                        </div>
                                    ) : (
                                        <div className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded-full">
                                            No Aprobado
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm mb-2">Desglose por Criterio</h3>
                                    {evaluation.details.map((detail, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-secondary/30 p-2 rounded">
                                            <span className="text-sm font-medium">{detail.criterionName}</span>
                                            <span className="font-mono font-bold text-primary">{detail.score} pts</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Placeholder for Feedback if we had a field for it in the Request/Response */}
                                {/* Currently EvaluationResponse does not have feedback field, only score details */}
                                <div className="mt-6 pt-4 border-t border-border">
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="text-sm font-semibold mb-1">Comentarios del Evaluador</p>
                                            <p className="text-sm text-muted-foreground italic">
                                                "¡Buen trabajo! El proyecto cumple con la mayoría de los requisitos. Se sugiere mejorar la interfaz de usuario en la próxima iteración."
                                                {/* Hardcoded for now as API doesn't return feedback string yet */}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    project.status === 'Completed' && (
                        <Card className="bg-blue-50/50 border-blue-200">
                            <CardContent className="p-6 text-center">
                                <p className="text-blue-800 font-medium">Este proyecto ha sido entregado y está esperando evaluación.</p>
                            </CardContent>
                        </Card>
                    )
                )}

            </main>
        </div>
    );
}
