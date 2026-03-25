'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, Project, CreateProjectRequest, Group, UserResponse } from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Save,
    Loader2,
    X,
    Users,
    MessageSquare,
    Video,
} from 'lucide-react';
import { isVideoUrl, isVideoFile } from '@/lib/mediaUtils';

export default function EditProjectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Integrador' as 'Integrador' | 'Videojuegos',
        videoUrl: '',
        thumbnailUrl: '',
        galleryImages: [] as string[],
        objectives: [] as string[],
        technologies: [] as string[],
        teamMembers: [] as string[],
        comprehensionQuestions: [] as { question: string; answer: string }[],
        groupId: '',
        status: 'Completed',
    });

    const [objectiveInput, setObjectiveInput] = useState('');
    const [technologyInput, setTechnologyInput] = useState('');
    const [memberInput, setMemberInput] = useState('');
    const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });
    const [groupMembers, setGroupMembers] = useState<UserResponse[]>([]);

    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverVideo, setCoverVideo] = useState<File | null>(null);
    const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const userJson = localStorage.getItem('user');
                if (userJson) setCurrentUser(JSON.parse(userJson));

                const project = await api.projects.getById(id);
                setFormData({
                    name: project.name || '',
                    description: project.description || '',
                    category: (project.category as 'Integrador' | 'Videojuegos') || 'Integrador',
                    videoUrl: project.videoUrl || '',
                    thumbnailUrl: project.thumbnailUrl || '',
                    galleryImages: project.galleryImages || [],
                    objectives: project.objectives || [],
                    technologies: project.technologies || [],
                    teamMembers: project.teamMembers || [],
                    comprehensionQuestions: project.comprehensionQuestions || [],
                    groupId: project.groupId || '',
                    status: project.status || 'Completed',
                });

                // Load group members for suggestions
                if (project.groupId) {
                    try {
                        const members = await api.groups.getMembers(project.groupId);
                        setGroupMembers(members.filter(m => m.role === 'Alumno'));
                    } catch { /* ignore */ }
                }
            } catch (err) {
                setError('No se pudo cargar el proyecto');
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            let finalVideoUrl = formData.videoUrl;
            let finalThumbnailUrl = formData.thumbnailUrl;
            let finalGalleryImages = [...formData.galleryImages];

            if (coverImage) {
                const uploadResult = await api.storage.upload(coverImage);
                finalThumbnailUrl = uploadResult.url;
            }

            if (coverVideo) {
                setIsUploading(true);
                setUploadProgress(0);
                const videoResult = await api.storage.uploadVideo(coverVideo, setUploadProgress);
                finalVideoUrl = videoResult.url;
                setIsUploading(false);
            }

            for (const img of newGalleryImages) {
                let resultUrl = '';
                if (isVideoFile(img)) {
                    const result = await api.storage.uploadVideo(img, setUploadProgress);
                    resultUrl = result.url;
                } else {
                    const result = await api.storage.upload(img);
                    resultUrl = result.url;
                }
                finalGalleryImages.push(resultUrl);
            }

            // Sort before saving so videos appear first
            finalGalleryImages.sort((a, b) => {
                const aIsVideo = isVideoUrl(a) ? 1 : 0;
                const bIsVideo = isVideoUrl(b) ? 1 : 0;
                return bIsVideo - aIsVideo;
            });

            await api.projects.update(id, {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                status: formData.status,
                videoUrl: finalVideoUrl || undefined,
                thumbnailUrl: finalThumbnailUrl || undefined,
                galleryImages: finalGalleryImages,
                objectives: formData.objectives,
                technologies: formData.technologies,
                groupId: formData.groupId,
                teamMembers: formData.teamMembers,
                comprehensionQuestions: formData.comprehensionQuestions,
            });
            router.push(`/project/${id}`);
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleAddMember = (name?: string) => {
        const memberName = name || memberInput.trim();
        if (memberName && !formData.teamMembers.includes(memberName)) {
            setFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, memberName] }));
            setMemberInput('');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    );

    if (error && !formData.name) return (
        <div className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => router.back()}>Volver</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Editar Proyecto" showBack />

            <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">

                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Basic Info */}
                <Card>
                    <CardContent className="p-5 space-y-4">
                        <h2 className="text-lg font-semibold">Información del Proyecto</h2>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Nombre del Proyecto</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                placeholder="Nombre del proyecto"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Categoría</label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.category === 'Integrador' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setFormData(p => ({ ...p, category: 'Integrador' }))}
                                >
                                    Integrador
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.category === 'Videojuegos' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setFormData(p => ({ ...p, category: 'Videojuegos' }))}
                                >
                                    Videojuegos
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Descripción</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                placeholder="Descripción del proyecto"
                                className="min-h-[100px] resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Foto de Portada</label>
                            {formData.thumbnailUrl && !coverImage && (
                                <img src={formData.thumbnailUrl} alt="Portada actual" className="h-20 rounded mb-2" />
                            )}
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) setCoverImage(e.target.files[0]);
                                }}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Video Promocional
                            </label>

                            {/* Preview: new file selected takes priority, otherwise show existing */}
                            {coverVideo ? (
                                <div className="rounded-xl overflow-hidden border border-border mb-3 bg-black relative">
                                    <video
                                        src={URL.createObjectURL(coverVideo)}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full max-h-56 block"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCoverVideo(null)}
                                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/90 transition-colors"
                                    >✕</button>
                                    <div className="bg-black/60 text-white text-xs px-3 py-1 font-medium">
                                        {coverVideo.name} — {(coverVideo.size / (1024 * 1024)).toFixed(1)} MB
                                    </div>
                                </div>
                            ) : formData.videoUrl ? (
                                <div className="rounded-xl overflow-hidden border border-border mb-3 bg-black">
                                    <video
                                        src={formData.videoUrl}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full max-h-56 block"
                                    />
                                    <p className="text-xs text-muted-foreground px-3 py-1.5 truncate">
                                        Video actual guardado
                                    </p>
                                </div>
                            ) : null}

                            {/* Upload area */}
                            <label
                                htmlFor="edit-project-video"
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-5 text-center hover:bg-secondary/20 transition-colors cursor-pointer block mb-2"
                            >
                                <Video className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    {coverVideo ? 'Cambiar video' : formData.videoUrl ? 'Reemplazar video' : 'Subir video'}
                                </p>
                                <p className="text-xs text-muted-foreground">MP4, WebM, MOV — máx. 500 MB</p>
                                <input
                                    id="edit-project-video"
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 500 * 1024 * 1024) {
                                            alert(`El video supera 500 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
                                            e.target.value = '';
                                            return;
                                        }
                                        setCoverVideo(file);
                                        setFormData(p => ({ ...p, videoUrl: '' }));
                                    }}
                                />
                            </label>

                            {/* Optional URL override */}
                            <Input
                                value={formData.videoUrl}
                                onChange={(e) => {
                                    setFormData(p => ({ ...p, videoUrl: e.target.value }));
                                    if (e.target.value) setCoverVideo(null);
                                }}
                                placeholder="O pega una URL de video..."
                            />

                            {isUploading && (
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Subiendo video...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-1.5">
                                        <div
                                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Imágenes de Galería Nuevas</label>
                            {formData.galleryImages.length > 0 && (
                                <div className="flex gap-2 mb-2 overflow-auto">
                                    {formData.galleryImages.map((src, i) => (
                                        <div key={i} className="relative aspect-square h-16 bg-black rounded overflow-hidden">
                                            {isVideoUrl(src) ? (
                                                <video src={src} className="w-full h-full object-cover opacity-80" />
                                            ) : (
                                                <img src={src} className="w-full h-full object-cover opacity-80" />
                                            )}
                                            {isVideoUrl(src) && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Video className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => setFormData(p => ({...p, galleryImages: p.galleryImages.filter((_, idx)=>idx!==i)}))} 
                                                className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Input
                                type="file"
                                accept="image/*,video/mp4,video/webm,video/quicktime"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setNewGalleryImages(Array.from(e.target.files));
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Objectives */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <h2 className="text-lg font-semibold">Objetivos</h2>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Agregar objetivo..."
                                value={objectiveInput}
                                onChange={(e) => setObjectiveInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = objectiveInput.trim();
                                        if (val) {
                                            setFormData(p => ({ ...p, objectives: [...p.objectives, val] }));
                                            setObjectiveInput('');
                                        }
                                    }
                                }}
                            />
                            <Button size="sm" variant="outline" onClick={() => {
                                const val = objectiveInput.trim();
                                if (val) {
                                    setFormData(p => ({ ...p, objectives: [...p.objectives, val] }));
                                    setObjectiveInput('');
                                }
                            }}>+</Button>
                        </div>
                        {formData.objectives.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {formData.objectives.map((obj, i) => (
                                    <span key={i} className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                                        {obj}
                                        <button onClick={() => setFormData(p => ({ ...p, objectives: p.objectives.filter((_, idx) => idx !== i) }))} className="hover:text-destructive ml-0.5">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Technologies */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <h2 className="text-lg font-semibold">Tecnologías / Herramientas</h2>
                        <div className="flex gap-2">
                            <Input
                                placeholder="ej. React, Unity, Python..."
                                value={technologyInput}
                                onChange={(e) => setTechnologyInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = technologyInput.trim();
                                        if (val) {
                                            setFormData(p => ({ ...p, technologies: [...p.technologies, val] }));
                                            setTechnologyInput('');
                                        }
                                    }
                                }}
                            />
                            <Button size="sm" variant="outline" onClick={() => {
                                const val = technologyInput.trim();
                                if (val) {
                                    setFormData(p => ({ ...p, technologies: [...p.technologies, val] }));
                                    setTechnologyInput('');
                                }
                            }}>+</Button>
                        </div>
                        {formData.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {formData.technologies.map((tech, i) => (
                                    <span key={i} className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                                        {tech}
                                        <button onClick={() => setFormData(p => ({ ...p, technologies: p.technologies.filter((_, idx) => idx !== i) }))} className="hover:text-destructive ml-0.5">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4" /> Miembros del Equipo
                        </h2>

                        <div className="relative">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Buscar compañero del grupo..."
                                    value={memberInput}
                                    onChange={(e) => setMemberInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                />
                                <Button onClick={() => handleAddMember()} size="icon">
                                    <Users className="w-4 h-4" />
                                </Button>
                            </div>

                            {memberInput.trim() && groupMembers.filter(m =>
                                m.fullName.toLowerCase().includes(memberInput.toLowerCase()) &&
                                !formData.teamMembers.includes(m.fullName)
                            ).length > 0 && (
                                <div className="absolute top-12 left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {groupMembers.filter(m =>
                                        m.fullName.toLowerCase().includes(memberInput.toLowerCase()) &&
                                        !formData.teamMembers.includes(m.fullName)
                                    ).map((member) => (
                                        <button
                                            key={member.id}
                                            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm flex items-center gap-2 transition-colors"
                                            onClick={() => handleAddMember(member.fullName)}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                {member.fullName.charAt(0)}
                                            </div>
                                            <span>{member.fullName}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {formData.teamMembers.map((member, idx) => (
                                <div key={idx} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    <span>{member}</span>
                                    {currentUser?.fullName !== member && (
                                        <button
                                            onClick={() => setFormData(p => ({ ...p, teamMembers: p.teamMembers.filter((_, i) => i !== idx) }))}
                                            className="hover:text-destructive text-lg leading-none"
                                        >×</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Comprehension Questions */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Preguntas de Comprensión
                        </h2>

                        <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border">
                            <Input
                                placeholder="Pregunta..."
                                value={newQuestion.question}
                                onChange={(e) => setNewQuestion(p => ({ ...p, question: e.target.value }))}
                            />
                            <Textarea
                                placeholder="Respuesta..."
                                className="min-h-[60px] resize-none"
                                value={newQuestion.answer}
                                onChange={(e) => setNewQuestion(p => ({ ...p, answer: e.target.value }))}
                            />
                            <Button
                                size="sm"
                                className="w-full"
                                disabled={!newQuestion.question.trim() || !newQuestion.answer.trim() || formData.comprehensionQuestions.length >= 10}
                                onClick={() => {
                                    setFormData(p => ({
                                        ...p,
                                        comprehensionQuestions: [...p.comprehensionQuestions, { ...newQuestion }]
                                    }));
                                    setNewQuestion({ question: '', answer: '' });
                                }}
                            >
                                Agregar Pregunta ({formData.comprehensionQuestions.length}/10)
                            </Button>
                        </div>

                        {formData.comprehensionQuestions.length > 0 && (
                            <div className="space-y-2">
                                {formData.comprehensionQuestions.map((q, idx) => (
                                    <div key={idx} className="bg-secondary/40 p-3 rounded-md border border-border relative group">
                                        <button
                                            onClick={() => setFormData(p => ({
                                                ...p,
                                                comprehensionQuestions: p.comprehensionQuestions.filter((_, i) => i !== idx)
                                            }))}
                                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <p className="text-sm font-bold pr-6">P{idx + 1}: {q.question}</p>
                                        <p className="text-xs text-muted-foreground mt-1">R: {q.answer}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button
                        className="flex-1 gap-2"
                        onClick={handleSave}
                        disabled={saving || !formData.name.trim()}
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Guardar Cambios</>
                        )}
                    </Button>
                </div>
            </main>
        </div>
    );
}
