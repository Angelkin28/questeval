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
    Users,
    CheckCircle2,
    Trophy,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Images,
} from 'lucide-react';

export default function ProjectDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [galleryIndex, setGalleryIndex] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const projectData = await api.projects.getById(id);
                setProject(projectData);
                if (projectData.status === 'Evaluated' || projectData.status === 'Completed') {
                    try {
                        const evaluations = await api.evaluations.getByProject(id);
                        if (evaluations && evaluations.length > 0) {
                            setEvaluation(evaluations[evaluations.length - 1]);
                        }
                    } catch { /* sin evaluaciones */ }
                }
            } catch (error) {
                console.error("Error fetching project", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetails();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    );

    if (!project) return <div className="p-8 text-center">Proyecto no encontrado</div>;

    const gallery = project.galleryImages?.filter(Boolean) ?? [];
    const hasVideo = !!project.videoUrl;
    const isDirectVideo = hasVideo && (
        project.videoUrl!.includes('.supabase.co/storage') ||
        /\.(mp4|webm|mov|avi)(\?|$)/i.test(project.videoUrl!)
    );

    return (
        <div className="min-h-screen bg-[#F8F7F2] pb-20">
            <Header title="Detalles del Proyecto" showBack />

            {/* ── BANNER ── */}
            <div className="relative w-full h-52 sm:h-72 md:h-80 bg-gradient-to-br from-secondary to-muted overflow-hidden">
                {project.thumbnailUrl ? (
                    <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className="w-20 h-20 text-muted-foreground/20" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow ${project.category === 'Integrador' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>
                        {project.category}
                    </span>
                </div>

                {/* Status badge */}
                <div className="absolute bottom-4 left-4">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        project.status === 'Evaluated' ? 'bg-blue-500/90 text-white' :
                        project.status === 'Completed' ? 'bg-green-500/90 text-white' :
                        'bg-yellow-500/90 text-black'
                    }`}>
                        {project.status === 'Evaluated' ? 'Evaluado' :
                         project.status === 'Completed' ? 'Entregado' : 'En Progreso'}
                    </span>
                </div>
            </div>

            <main className="container mx-auto px-4 py-6 max-w-5xl">

                {/* ── TITLE + TEAM ── */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2 title-serif">{project.name}</h1>
                    <p className="text-muted-foreground leading-relaxed mb-4">{project.description}</p>

                    {project.teamMembers && project.teamMembers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {project.teamMembers.map((m, i) => (
                                <span key={i} className="bg-secondary px-3 py-1 rounded-full text-sm font-medium">
                                    {m}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── VIDEO + GALLERY ── */}
                {(hasVideo || gallery.length > 0) && (
                    <div className={`grid gap-4 mb-6 ${hasVideo && gallery.length > 0 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>

                        {/* Video */}
                        {hasVideo && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Video className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Video Promocional</span>
                                </div>
                                {isDirectVideo ? (
                                    <div className="rounded-xl overflow-hidden border border-border shadow-md bg-black">
                                        <video
                                            src={project.videoUrl}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full h-auto block"
                                        />
                                    </div>
                                ) : (
                                    <Button variant="outline" className="gap-2 w-full" onClick={() => window.open(project.videoUrl, '_blank')}>
                                        <Video className="w-4 h-4 text-red-500" />
                                        Ver Video Demo
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Gallery Carousel */}
                        {gallery.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Images className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Galería</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{galleryIndex + 1} / {gallery.length}</span>
                                </div>
                                <div className="relative rounded-xl overflow-hidden border border-border shadow-md bg-black aspect-video">
                                    <img
                                        src={gallery[galleryIndex]}
                                        alt={`Imagen ${galleryIndex + 1}`}
                                        className="w-full h-full object-contain"
                                    />
                                    {gallery.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length)}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setGalleryIndex(i => (i + 1) % gallery.length)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                            {/* Dots */}
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {gallery.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setGalleryIndex(i)}
                                                        className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {/* Thumbnails */}
                                {gallery.length > 1 && (
                                    <div className="flex gap-2 mt-2">
                                        {gallery.map((src, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setGalleryIndex(i)}
                                                className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${i === galleryIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                <img src={src} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── COMPREHENSION QUESTIONS ── */}
                {project.comprehensionQuestions && project.comprehensionQuestions.length > 0 && (
                    <Card className="mb-6 shadow-sm border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-bold">Preguntas de Comprensión</h2>
                            </div>
                            <div className="space-y-3">
                                {project.comprehensionQuestions.map((q, idx) => (
                                    <div key={idx} className="p-4 bg-secondary/20 rounded-lg border border-border">
                                        <p className="font-bold text-sm mb-1 text-primary">P{idx + 1}: {q.question}</p>
                                        <p className="text-sm text-foreground/90">{q.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── EVALUATION RESULTS ── */}
                {evaluation ? (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-bold">Resultados de Evaluación</h2>
                        </div>
                        <Card className={`mb-6 border-l-4 ${evaluation.finalScore >= 70 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Calificación Final</p>
                                        <div className={`text-5xl font-bold title-serif ${evaluation.finalScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                            {evaluation.finalScore}
                                            <span className="text-lg text-muted-foreground font-normal ml-1">/ 100</span>
                                        </div>
                                    </div>
                                    {evaluation.finalScore >= 70 ? (
                                        <div className="bg-green-100 p-4 rounded-full">
                                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                                        </div>
                                    ) : (
                                        <span className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded-full border border-red-200">
                                            No Aprobado
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">Desglose por Criterio</h3>
                                    {evaluation.details.map((detail, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-secondary/30 px-3 py-2 rounded-lg">
                                            <span className="text-sm font-medium">{detail.criterionName}</span>
                                            <span className="font-mono font-bold text-primary text-sm">{detail.score} pts</span>
                                        </div>
                                    ))}
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
