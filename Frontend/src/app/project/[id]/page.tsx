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
    Target,
    Wrench,
    FileText,
    Pencil,
    Trash2,
} from 'lucide-react';
import { isVideoUrl } from '@/lib/mediaUtils';

export default function ProjectDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [galleryIndex, setGalleryIndex] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const projectData = await api.projects.getById(id);
                setProject(projectData);

                // Check ownership
                const userJson = localStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    const role = user.role?.toLowerCase();
                    if (role === 'profesor' || role === 'maestro' || role === 'admin') {
                        setIsOwner(true);
                    } else if (user.fullName && projectData.teamMembers?.some(
                        (m: string) => m.toLowerCase() === user.fullName.toLowerCase()
                    )) {
                        setIsOwner(true);
                    }
                }

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

    // Sort gallery so videos appear first
    const gallery = (project.galleryImages?.filter(Boolean) ?? []).sort((a, b) => {
        const aIsVideo = isVideoUrl(a) ? 1 : 0;
        const bIsVideo = isVideoUrl(b) ? 1 : 0;
        return bIsVideo - aIsVideo;
    });

    const hasVideo = !!project.videoUrl;
    const isDirectVideo = hasVideo && (
        project.videoUrl!.includes('.supabase.co/storage') ||
        /\.(mp4|webm|mov|avi)(\?|$)/i.test(project.videoUrl!)
    );

    return (
        <div className="min-h-screen bg-[#F8F7F2] pb-20">
            <Header title="Detalles del Proyecto" showBack />

            {/* ── HERO BANNER ── */}
            <div className="relative w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                {project.thumbnailUrl ? (
                    <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className="w-20 h-20 text-white/20" />
                    </div>
                )}

                {/* Strong gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

                {/* Category badge top-right */}
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg ${
                        project.category === 'Integrador' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                    }`}>
                        {project.category}
                    </span>
                </div>

                {/* Title + description + team over the banner */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-5 pt-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-end justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white title-serif leading-tight mb-1 drop-shadow-lg">
                                    {project.name}
                                </h1>
                                {project.description && (
                                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2 mb-2 max-w-xl">
                                        {project.description}
                                    </p>
                                )}
                                {project.teamMembers && project.teamMembers.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-white/60" />
                                        {project.teamMembers.map((m, i) => (
                                            <span key={i} className="bg-white/15 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium border border-white/20">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="shrink-0">
                                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow ${
                                    project.status === 'Evaluated' ? 'bg-blue-500/90 text-white' :
                                    project.status === 'Completed' ? 'bg-yellow-400/90 text-black' :
                                    'bg-yellow-400/90 text-black'
                                }`}>
                                    {project.status === 'Evaluated' ? 'Evaluado' :
                                     project.status === 'Completed' ? 'Pendiente' : 'En Progreso'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-6 max-w-5xl">

                {/* ── OWNER ACTIONS ── */}
                {isOwner && (
                    <div className="flex items-center justify-end gap-3 mb-6 animate-fade-in">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => router.push(`/project/${id}/edit`)}
                        >
                            <Pencil className="w-4 h-4" />
                            Editar Proyecto
                        </Button>
                        <Button
                            variant="destructive"
                            className="gap-2"
                            disabled={deleting}
                            onClick={async () => {
                                if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) return;
                                setDeleting(true);
                                try {
                                    await api.projects.delete(id);
                                    router.push('/dashboard');
                                } catch (err: any) {
                                    alert(err.message || 'Error al eliminar');
                                    setDeleting(false);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </div>
                )}

                {/* ── DESCRIPTION (below banner) ── */}
                <Card className="mb-6 shadow-sm border-border/50">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Descripción</h2>
                        </div>
                        {project.description ? (
                            <p className="text-foreground leading-relaxed text-sm">{project.description}</p>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">Por el momento no hay descripción.</p>
                        )}
                    </CardContent>
                </Card>

                {/* ── OBJECTIVES + TECHNOLOGIES ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="shadow-sm border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4 text-primary" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Objetivos</h2>
                            </div>
                            {project.objectives && project.objectives.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {project.objectives.map((obj, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                            <span>{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">Por el momento no hay objetivos.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Wrench className="w-4 h-4 text-primary" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Herramientas &amp; Tecnologías</h2>
                            </div>
                            {project.technologies && project.technologies.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {project.technologies.map((tech, i) => (
                                        <span key={i} className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full font-medium">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">Por el momento no hay herramientas registradas.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── VIDEO + GALLERY ── */}
                <div className="space-y-6 mb-6">
                    {/* Video full-width */}
                    {hasVideo ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Video className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Video Promocional</span>
                            </div>
                            {isDirectVideo ? (
                                <div className="rounded-2xl overflow-hidden border border-border shadow-md bg-black">
                                    <video
                                        src={project.videoUrl}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full max-h-[420px] block"
                                    />
                                </div>
                            ) : (
                                <Button variant="outline" className="gap-2 w-full" onClick={() => window.open(project.videoUrl, '_blank')}>
                                    <Video className="w-4 h-4 text-red-500" />
                                    Ver Video Demo
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Card className="shadow-sm border-border/50">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Video className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Video Promocional</span>
                                </div>
                                <p className="text-muted-foreground italic text-sm">Por el momento no hay video.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Gallery Carousel full-width */}
                    {gallery.length > 0 ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Images className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Galería</span>
                                <span className="text-xs text-muted-foreground font-medium ml-1 bg-secondary px-2 py-0.5 rounded-full">
                                    {galleryIndex + 1} / {gallery.length}
                                </span>
                            </div>

                            {/* Main carousel image */}
                            <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-black aspect-video w-full">
                                {isVideoUrl(gallery[galleryIndex]) ? (
                                    <video
                                        key={`vid-${galleryIndex}`}
                                        src={gallery[galleryIndex]}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full h-full object-contain transition-opacity duration-300"
                                    />
                                ) : (
                                    <img
                                        key={`img-${galleryIndex}`}
                                        src={gallery[galleryIndex]}
                                        alt={`Imagen ${galleryIndex + 1}`}
                                        className="w-full h-full object-contain transition-opacity duration-300"
                                    />
                                )}
                                {gallery.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-lg"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setGalleryIndex(i => (i + 1) % gallery.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-lg"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                        {/* Dots */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                            {gallery.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setGalleryIndex(i)}
                                                    className={`rounded-full transition-all duration-200 ${i === galleryIndex ? 'bg-white w-5 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white/80'}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails strip */}
                            {gallery.length > 1 && (
                                <div className="flex gap-2 mt-3">
                                    {gallery.map((src, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setGalleryIndex(i)}
                                            className={`flex-1 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 relative ${
                                                i === galleryIndex
                                                    ? 'border-primary shadow-md scale-[1.03]'
                                                    : 'border-transparent opacity-55 hover:opacity-90 hover:scale-[1.02]'
                                            }`}
                                        >
                                            {isVideoUrl(src) ? (
                                                <>
                                                    <video src={src} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                        <Video className="w-5 h-5 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <img src={src} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Card className="shadow-sm border-border/50">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Images className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Galería</span>
                                </div>
                                <p className="text-muted-foreground italic text-sm">Por el momento no hay imágenes.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── COMPREHENSION QUESTIONS ── */}
                <Card className="mb-6 shadow-sm border-border/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold">Preguntas de Comprensión</h2>
                        </div>
                        {project.comprehensionQuestions && project.comprehensionQuestions.length > 0 ? (
                            <div className="space-y-3">
                                {project.comprehensionQuestions.map((q, idx) => (
                                    <div key={idx} className="p-4 bg-secondary/20 rounded-lg border border-border">
                                        <p className="font-bold text-sm mb-1 text-primary">P{idx + 1}: {q.question}</p>
                                        <p className="text-sm text-foreground/90">{q.answer}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">Por el momento no hay preguntas.</p>
                        )}
                    </CardContent>
                </Card>

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
                                        <div className="text-xs mt-3 flex items-center gap-1.5 font-medium">
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                {evaluation.evaluatorRole || 'Invitado'}
                                            </span>
                                            <span className="text-muted-foreground">Por {evaluation.evaluatorName || 'Anónimo'}</span>
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
