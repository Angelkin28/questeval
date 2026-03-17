'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, CriterionResponse } from '@/lib/api';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Loader2
} from 'lucide-react';

export default function EditCriteriaPage() {
    const router = useRouter();
    const [criteria, setCriteria] = useState<CriterionResponse[]>([]);

    // Protección de rol: solo Profesor y Admin
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/login'); return; }
        const parsed = JSON.parse(userData);
        if (parsed.role !== 'Profesor' && parsed.role !== 'Admin') {
            router.push('/dashboard');
        }
    }, [router]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxScore: 0
    });
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const data = await api.criteria.getAll();
            setCriteria(data);
        } catch (error) {
            console.error('Error fetching criteria:', error);
            // alert('Error al cargar criterios');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (c: CriterionResponse) => {
        setEditingId(c.id);
        setFormData({
            name: c.name,
            description: c.description,
            maxScore: c.maxScore
        });
        setIsCreating(false);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            maxScore: 10
        });
        setIsCreating(true);
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este criterio?')) return;

        try {
            await api.criteria.delete(id);
            setCriteria(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting criterion:', error);
            alert('Error al eliminar criterio');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isCreating) {
                const newCriterion = await api.criteria.create(formData);
                setCriteria(prev => [...prev, newCriterion]);
                setIsCreating(false);
            } else if (editingId) {
                await api.criteria.update(editingId, formData);
                setCriteria(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } : c));
                setEditingId(null);
            }
        } catch (error) {
            console.error('Error saving criterion:', error);
            alert('Error al guardar criterio');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Gestión de Rúbrica" showBack />

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold">Criterios de Evaluación</h1>
                    {!isCreating && !editingId && (
                        <Button onClick={handleCreate} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Criterio
                        </Button>
                    )}
                </div>

                {/* Formulario de Creación/Edición */}
                {(isCreating || editingId) && (
                    <Card className="mb-6 border-primary/20 bg-primary/5 animate-fade-in">
                        <CardContent className="p-4">
                            <h2 className="font-semibold mb-4 text-primary">
                                {isCreating ? 'Nuevo Criterio' : 'Editar Criterio'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Nombre</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="ej. Innovación"
                                        className="bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Descripción</label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        placeholder="Describe qué se evalúa..."
                                        className="bg-background resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Puntaje Máximo</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={formData.maxScore}
                                        onChange={e => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button type="button" variant="ghost" onClick={handleCancel} disabled={submitting}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Guardar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Lista de Criterios */}
                <div className="space-y-3">
                    {criteria.length === 0 ? (
                        <div className="text-center py-10 bg-secondary/20 rounded-lg border-2 border-dashed">
                            <p className="text-muted-foreground">No hay criterios definidos.</p>
                        </div>
                    ) : (
                        criteria.map(c => (
                            <Card key={c.id} className={`transition-opacity ${editingId === c.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                <CardContent className="p-4 flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold">{c.name}</h3>
                                            <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                {c.maxScore} pts
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{c.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(c)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" onClick={() => handleDelete(c.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}

                    {criteria.length > 0 && (
                        <div className="mt-6 p-4 bg-secondary rounded text-center">
                            <p className="font-bold text-lg">
                                Total: {criteria.reduce((sum, c) => sum + c.maxScore, 0)} puntos
                            </p>
                            <p className="text-xs text-muted-foreground">La suma ideal debería ser 100.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
