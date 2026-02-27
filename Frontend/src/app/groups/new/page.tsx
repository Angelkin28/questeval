'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { api } from '@/lib/api';
import Header from '@/components/layout/Header';

export default function NewGroupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setAccessCode(result);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !accessCode) return;

        setLoading(true);
        try {
            const newGroup = await api.groups.create({ name, accessCode });
            // Ir al detalle del grupo recién creado
            router.push(`/groups/${newGroup.id}`);
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Error al crear grupo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
                <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">Nuevo Grupo</span>
                </div>
            </header>

            <main className="px-4 py-6">
                <Card className="max-w-lg mx-auto shadow-md">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre del Grupo</label>
                                <Input
                                    placeholder="Ej. Matemáticas Avanzadas"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Código de Acceso</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Código único"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                        required
                                        maxLength={10}
                                    />
                                    <Button type="button" variant="outline" onClick={generateCode}>
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Comparte este código con los estudiantes para que se unan.</p>
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}
                            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                                {loading ? 'Creando...' : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Crear Grupo
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
