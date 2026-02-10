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
import { api } from '@/lib/api';

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
        teamMembers: [] as string[]
    });

    const [memberInput, setMemberInput] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddMember = () => {
        if (memberInput.trim()) {
            setFormData(prev => ({
                ...prev,
                teamMembers: [...prev.teamMembers, memberInput.trim()]
            }));
            setMemberInput('');
        }
    };

    const handleRemoveMember = (index: number) => {
        setFormData(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // Llamada real a la API
            await api.projects.create({
                name: formData.name,
                description: formData.description,
                category: formData.category,
                status: 'In Progress',
                videoUrl: formData.videoUrl,
                // Nota: La subida de imagen real requeriría un endpoint de S3 o similar.
                // Por ahora enviamos los datos textuales.
            });

            router.push('/dashboard');
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            // Fallback para demo si falla la API
            setTimeout(() => router.push('/dashboard'), 1500);
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <Header title="Nuevo Proyecto" showBack />

            <main className="px-4 py-6">
                {/* Steps Indicator */}
                <div className="flex justify-between mb-8 px-2 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-10 transform -translate-y-1/2 mx-4" />
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center bg-background px-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                                step >= s ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted text-muted-foreground"
                            )}>
                                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            <span className="text-[10px] mt-1 font-medium text-muted-foreground">
                                {s === 1 ? 'Detalles' : s === 2 ? 'Multimedia' : 'Revisar'}
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

                {/* Step 3: Team and Review */}
                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <Card>
                            <CardContent className="p-5">
                                <h2 className="text-lg font-semibold mb-4">Miembros del Equipo</h2>

                                <div className="flex gap-2 mb-4">
                                    <Input
                                        placeholder="Agregar miembro (Nombre o Matrícula)"
                                        value={memberInput}
                                        onChange={(e) => setMemberInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                    />
                                    <Button onClick={handleAddMember} size="icon">
                                        <Users className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {formData.teamMembers.map((member, idx) => (
                                        <div key={idx} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            <span>{member}</span>
                                            <button onClick={() => handleRemoveMember(idx)} className="hover:text-destructive">
                                                ×
                                            </button>
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

                    {step < 3 ? (
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
