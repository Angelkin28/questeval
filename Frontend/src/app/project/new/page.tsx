'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/layout/Header';
import {
    ArrowLeft,
    Upload,
    Users,
    CheckCircle2,
    Video,
    Image as ImageIcon,
    Save,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, Group, UserResponse } from '@/lib/api';
import { useEffect } from 'react';

export default function NewProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State (Español)
    const [formData, setFormData] = useState({
        name: '',
        category: 'Integrador' as 'Integrador' | 'Videojuegos',
        description: '',
        videoUrl: '',
        coverImage: null as File | null,
        teamMembers: [] as string[],
        comprehensionQuestions: [] as { question: string, answer: string }[]
    });



    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [groupMembers, setGroupMembers] = useState<UserResponse[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [questionError, setQuestionError] = useState('');

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const myGroups = await api.groups.getMyGroups();
                setGroups(myGroups);
                if (myGroups.length > 0) {
                    setSelectedGroupId(myGroups[0].id);
                }

                // Get current user for auto-add and locking
                const userJson = localStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    setCurrentUser(user);
                    if (user.fullName && formData.teamMembers.length === 0) {
                        setFormData(prev => ({
                            ...prev,
                            teamMembers: [user.fullName]
                        }));
                    }
                }
            } catch (err) {
                console.error("Error loading groups or user", err);
            }
        };
        fetchGroups();
    }, []);

    // Fetch members when group changes for the search/suggestions
    useEffect(() => {
        const fetchMembers = async () => {
            if (!selectedGroupId) return;
            try {
                const members = await api.groups.getMembers(selectedGroupId);
                // Filter only students and not the current user (already added)
                const students = members.filter(m =>
                    m.role === 'Alumno' &&
                    m.fullName !== currentUser?.fullName
                );
                setGroupMembers(students);
            } catch (err) {
                console.error("Error fetching group members", err);
            }
        };
        fetchMembers();
    }, [selectedGroupId, currentUser]);

    const [memberInput, setMemberInput] = useState('');
    const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddMember = (name?: string) => {
        const memberName = name || memberInput.trim();
        if (memberName && !formData.teamMembers.includes(memberName)) {
            setFormData(prev => ({
                ...prev,
                teamMembers: [...prev.teamMembers, memberName]
            }));
            setMemberInput('');
        }
    };

    const handleRemoveMember = (index: number) => {
        const memberName = formData.teamMembers[index];
        // Don't allow removing yourself
        if (currentUser && memberName === currentUser.fullName) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.filter((_, i) => i !== index)
        }));
    };

    const handleAddQuestion = () => {
        if (newQuestion.question.trim() && newQuestion.answer.trim()) {
            if (formData.comprehensionQuestions.length >= 10) {
                setQuestionError('Máximo 10 preguntas permitidas.');
                setTimeout(() => setQuestionError(''), 3000);
                return;
            }
            setQuestionError('');
            setFormData(prev => ({
                ...prev,
                comprehensionQuestions: [...prev.comprehensionQuestions, { ...newQuestion }]
            }));
            setNewQuestion({ question: '', answer: '' });
        }
    };

    const handleRemoveQuestion = (index: number) => {
        setFormData(prev => ({
            ...prev,
            comprehensionQuestions: prev.comprehensionQuestions.filter((_, i) => i !== index)
        }));
        if (formData.comprehensionQuestions.length <= 10) {
            setQuestionError('');
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            let coverImageUrl = '';

            // Subir imagen si existe
            if (formData.coverImage) {
                try {
                    const uploadResult = await api.storage.upload(formData.coverImage);
                    coverImageUrl = uploadResult.url;
                } catch (uploadError) {
                    console.error('Error al subir imagen:', uploadError);
                    // Podríamos mostrar un toast de error pero permitimos continuar sin imagen
                    // o lanzar el error para detener el proceso
                }
            }

            // Llamada real a la API
            if (!selectedGroupId) {
                alert('Debes seleccionar un grupo para este proyecto.');
                setIsLoading(false);
                return;
            }

            await api.projects.create({
                name: formData.name,
                description: formData.description,
                category: formData.category,
                status: 'In Progress',
                videoUrl: formData.videoUrl,
                thumbnailUrl: coverImageUrl,
                groupId: selectedGroupId,
                teamMembers: formData.teamMembers,
                comprehensionQuestions: formData.comprehensionQuestions
            });

            router.push('/dashboard');
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            // Fallback para demo si falla la API (comentado para forzar uso real)
            // setTimeout(() => router.push('/dashboard'), 1500);
            alert('Error al crear proyecto. Revisa la consola.');
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <Header title="Nuevo Proyecto" showBack />

            <main className="px-4 py-6">
                {/* Steps Indicator */}
                <div className="flex justify-between mb-8 px-2 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-10 transform -translate-y-1/2 mx-4" />
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex flex-col items-center bg-background px-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                                step >= s ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted text-muted-foreground"
                            )}>
                                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            <span className="text-[10px] mt-1 font-medium text-muted-foreground text-center">
                                {s === 1 ? 'Detalles' : s === 2 ? 'Multimedia' : s === 3 ? 'Preguntas' : 'Revisar'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <Card>
                            <CardContent className="p-5">
                                <h2 className="text-lg font-semibold mb-4">Información del Proyecto</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Nombre del Proyecto</label>
                                        <Input
                                            name="name"
                                            placeholder="ej. Sistema EcoTrack"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Grupo Académico</label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={selectedGroupId}
                                            onChange={(e) => setSelectedGroupId(e.target.value)}
                                        >
                                            <option value="" disabled>Selecciona un grupo</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name} ({g.accessCode})</option>
                                            ))}
                                        </select>
                                        {groups.length === 0 && (
                                            <p className="text-xs text-destructive mt-1">
                                                No estás inscrito en ningún grupo. Únete a uno primero.
                                            </p>
                                        )}
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
                                            name="description"
                                            placeholder="Describe el objetivo principal y funciones..."
                                            className="min-h-[100px] resize-none"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 2: Media */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <Card>
                            <CardContent className="p-5">
                                <h2 className="text-lg font-semibold mb-4">Recursos Multimedia</h2>

                                <div className="space-y-6">
                                    {/* Video URL */}
                                    <div>
                                        <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                                            <Video className="w-4 h-4" />
                                            URL del Video Demo
                                        </label>
                                        <Input
                                            name="videoUrl"
                                            placeholder="https://youtube.com/..."
                                            value={formData.videoUrl}
                                            onChange={handleInputChange}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Pega el enlace a tu video demo (YouTube, Vimeo, Drive).
                                        </p>
                                    </div>

                                    {/* Cover Image Upload */}
                                    <div>
                                        <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            Imagen de Portada
                                        </label>
                                        <label
                                            htmlFor="project-image"
                                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors cursor-pointer block"
                                        >
                                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-sm font-medium">Clic para subir imagen</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                                            <input
                                                id="project-image"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        setFormData(p => ({ ...p, coverImage: e.target.files![0] }));
                                                    }
                                                }}
                                            />
                                        </label>
                                        {formData.coverImage && (
                                            <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                                                <CheckCircle2 className="w-4 h-4" />
                                                {formData.coverImage.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Comprehension Questions */}
                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <Card>
                            <CardContent className="p-5">
                                <h2 className="text-lg font-semibold mb-2">Preguntas de Comprensión</h2>
                                <p className="text-xs text-muted-foreground mb-6">
                                    Agrega hasta 10 preguntas clave sobre tu proyecto para que el evaluador las considere.
                                </p>

                                <div className="space-y-4 mb-6 p-4 bg-secondary/20 rounded-lg border border-border">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Pregunta</label>
                                        <Input
                                            placeholder="¿Cuál es el problema principal que resuelve?"
                                            value={newQuestion.question}
                                            onChange={(e) => setNewQuestion(p => ({ ...p, question: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Respuesta</label>
                                        <Textarea
                                            placeholder="Resuelve la falta de..."
                                            className="min-h-[80px] resize-none"
                                            value={newQuestion.answer}
                                            onChange={(e) => setNewQuestion(p => ({ ...p, answer: e.target.value }))}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddQuestion}
                                        className="w-full gap-2"
                                        disabled={!newQuestion.question.trim() || !newQuestion.answer.trim()}
                                    >
                                        <Save className="w-4 h-4" />
                                        Agregar Pregunta ({formData.comprehensionQuestions.length}/10)
                                    </Button>
                                    {questionError && (
                                        <p className="text-destructive text-sm font-medium mt-2 animate-bounce flex items-center gap-1">
                                            <span>⚠️</span> {questionError}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold">Preguntas Agregadas</h3>
                                    {formData.comprehensionQuestions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">No has agregado preguntas aún.</p>
                                    ) : (
                                        formData.comprehensionQuestions.map((q, idx) => (
                                            <div key={idx} className="bg-secondary/40 p-3 rounded-md border border-border relative group">
                                                <button
                                                    onClick={() => handleRemoveQuestion(idx)}
                                                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                                <p className="text-sm font-bold pr-6">P{idx + 1}: {q.question}</p>
                                                <p className="text-xs text-muted-foreground mt-1">R: {q.answer}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 4: Team and Review */}
                {step === 4 && (
                    <div className="space-y-4 animate-fade-in">
                        <Card>
                            <CardContent className="p-5">
                                <h2 className="text-lg font-semibold mb-4">Miembros del Equipo</h2>

                                <div className="relative group/search">
                                    <div className="flex gap-2 mb-4">
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

                                    {/* Suggestions List */}
                                    {memberInput.trim() && groupMembers.filter(m =>
                                        m.fullName.toLowerCase().includes(memberInput.toLowerCase())
                                    ).length > 0 && (
                                            <div className="absolute top-12 left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                                {groupMembers.filter(m =>
                                                    m.fullName.toLowerCase().includes(memberInput.toLowerCase())
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
                                                        <span className="text-[10px] text-muted-foreground ml-auto">({member.enrollment})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {formData.teamMembers.map((member, idx) => (
                                        <div key={idx} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            <span>{member}</span>
                                            {currentUser?.fullName !== member && (
                                                <button onClick={() => handleRemoveMember(idx)} className="hover:text-destructive text-lg leading-none">
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {formData.teamMembers.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">No hay miembros agregados.</p>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-semibold mb-2">Resumen</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-muted-foreground">Proyecto:</span> {formData.name || '-'}</p>
                                        <p><span className="text-muted-foreground">Categoría:</span> {formData.category}</p>
                                        <p><span className="text-muted-foreground">Preguntas:</span> {formData.comprehensionQuestions.length}</p>
                                        <p><span className="text-muted-foreground">Miembros:</span> {formData.teamMembers.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex gap-3">
                    {step > 1 && (
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                            Atrás
                        </Button>
                    )}

                    {step < 4 ? (
                        <Button onClick={nextStep} className="flex-1" disabled={!formData.name && step === 1}>
                            Siguiente Paso <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Enviar Proyecto
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
}

