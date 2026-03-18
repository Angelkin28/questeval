'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';

interface User {
    userId: string;
    fullName: string;
    role: string;
    token: string;
}

interface Criterion {
    id: string;
    name: string;
    description: string;
    maxScore: number;
}

interface EvaluationDetail {
    criterionId: string;
    criterionName: string;
    score: number;
}

interface ProjectDetail {
    id: string;
    name: string;
    description?: string;
    videoUrl?: string;
    teamMembers?: string[];
}

export default function GuestProjectPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scores, setScores] = useState<{ [key: string]: number }>({});
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!userData || !token) {
                router.push('/login');
                return;
            }

            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser.role !== 'Invitado') {
                    router.push('/dashboard');
                    return;
                }
                setUser(parsedUser);

                // Cargar proyecto
                const projectData = await api.projects.getById(projectId);
                setProject(projectData);

                // Cargar criterios del proyecto específico
                const criteriaData = await api.criteria.getByProject(projectId);
                setCriteria(criteriaData);

                // Inicializar scores
                const initialScores: { [key: string]: number } = {};
                criteriaData.forEach((c: Criterion) => {
                    initialScores[c.id] = 0;
                });
                setScores(initialScores);
            } catch (err) {
                console.error('Error loading project:', err);
                setError('Error al cargar el proyecto');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [projectId, router]);

    const handleScoreChange = (criterionId: string, value: number[]) => {
        setScores((prev) => ({
            ...prev,
            [criterionId]: value[0],
        }));
    };

    const handleSubmitEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (!user) throw new Error('Usuario no autenticado');

            const details: EvaluationDetail[] = criteria.map((c) => ({
                criterionId: c.id,
                criterionName: c.name,
                score: scores[c.id] || 0,
            }));

            await api.evaluations.create({
                projectId,
                evaluatorId: user.userId,
                details,
            });

            // Crear feedback si existe
            if (feedback.trim()) {
                await api.feedback.create({
                    projectId,
                    evaluatorId: user.userId,
                    comment: feedback.trim(),
                });
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/guest-dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Error al enviar la evaluación');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F7F2]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4" />
                    <p className="text-[#1A1A1A]/60">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F7F2]">
            {/* Header */}
            <header className="bg-white border-b border-black/5">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        href="/guest-dashboard"
                        className="flex items-center gap-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors font-bold text-xs uppercase"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </Link>
                    <p className="text-[10px] text-[#1A1A1A]/30 uppercase tracking-[0.2em]">
                        Evaluación como Invitado
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-8 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-green-700 text-sm">Evaluación enviada exitosamente</p>
                            <p className="text-xs text-green-600">Serás redirigido al dashboard...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-8 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Project Info */}
                {project && (
                    <div className="bg-white rounded-sm border border-black/5 p-8 mb-8">
                        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">
                            {project.name}
                        </h1>
                        {project.description && (
                            <p className="text-[#1A1A1A]/60 mb-6 leading-relaxed">
                                {project.description}
                            </p>
                        )}

                        {project.videoUrl && (() => {
                            const isDirectVideo = project.videoUrl.includes('.supabase.co/storage') ||
                                /\.(mp4|webm|mov|avi)(\?|$)/i.test(project.videoUrl);
                            return isDirectVideo ? (
                                <div className="mb-6 rounded-sm overflow-hidden bg-black">
                                    <video
                                        src={project.videoUrl}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full max-h-[420px] block"
                                    />
                                </div>
                            ) : (
                                <div className="mb-6 rounded-sm overflow-hidden bg-black/5">
                                    <iframe
                                        width="100%"
                                        height="400"
                                        src={project.videoUrl}
                                        title="Project Video"
                                        className="border-0 rounded-sm"
                                        allowFullScreen
                                    />
                                </div>
                            );
                        })()}

                        {project.teamMembers && project.teamMembers.length > 0 && (
                            <div className="border-t border-black/5 pt-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-3">
                                    Equipo
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {project.teamMembers.map((member, idx) => (
                                        <span
                                            key={idx}
                                            className="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-sm text-xs font-bold"
                                        >
                                            {member}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Evaluation Form */}
                <form onSubmit={handleSubmitEvaluation} className="space-y-8">
                    {/* Criteria */}
                    {criteria.length > 0 && (
                        <div className="bg-white rounded-sm border border-black/5 p-8">
                            <h2 className="text-lg font-bold text-[#1A1A1A] mb-6 uppercase tracking-wide">
                                Calificación por Criterios
                            </h2>

                            <div className="space-y-8">
                                {criteria.map((criterion) => (
                                    <div key={criterion.id} className="border-b border-black/5 pb-8 last:border-0 last:pb-0">
                                        <div className="mb-4">
                                            <h3 className="font-bold text-[#1A1A1A] text-sm mb-1">
                                                {criterion.name}
                                            </h3>
                                            {criterion.description && (
                                                <p className="text-xs text-[#1A1A1A]/60">
                                                    {criterion.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <Slider
                                                value={[scores[criterion.id] || 0]}
                                                onValueChange={(value) =>
                                                    handleScoreChange(criterion.id, value)
                                                }
                                                min={0}
                                                max={criterion.maxScore}
                                                step={0.5}
                                                className="w-full"
                                            />
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[#1A1A1A]/40">0</span>
                                                <span className="font-bold text-[#D4AF37]">
                                                    {scores[criterion.id]?.toFixed(1) || '0'}/{criterion.maxScore}
                                                </span>
                                                <span className="text-[#1A1A1A]/40">{criterion.maxScore}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    <div className="bg-white rounded-sm border border-black/5 p-8">
                        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4 uppercase tracking-wide">
                            Comentarios y Sugerencias
                        </h2>
                        <p className="text-xs text-[#1A1A1A]/50 mb-4">
                            Comparte feedback constructivo que ayude a mejorar este proyecto.
                        </p>

                        <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Escribe tus comentarios aquí..."
                            className="min-h-32 bg-white border-[#1A1A1A]/12 focus-visible:ring-[#D4AF37] rounded-sm p-4 text-sm placeholder:text-[#1A1A1A]/25"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 h-12 bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#D4AF37] font-bold uppercase tracking-[0.15em] text-xs rounded-sm flex items-center justify-center gap-2 transition-all"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar Evaluación
                                </>
                            )}
                        </Button>

                        <Link
                            href="/guest-dashboard"
                            className="h-12 px-8 bg-white border border-black/5 text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/15 font-bold uppercase tracking-[0.15em] text-xs rounded-sm flex items-center justify-center transition-all"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
