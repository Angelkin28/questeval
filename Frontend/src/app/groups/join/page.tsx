'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { Users, ArrowRight, Loader2 } from 'lucide-react';

export default function JoinGroupPage() {
    const router = useRouter();
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.groups.join(accessCode);
            router.push('/groups');
        } catch (err: any) {
            setError(err.message || 'Error al unirse al grupo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Unirse a Grupo" showBack />

            <main className="px-4 py-8 flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md shadow-lg border-primary/20 bg-card">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-center title-serif">Ingresa el Código</h1>
                            <p className="text-sm text-muted-foreground text-center mt-2">
                                Pídele a tu profesor el código de acceso del grupo.
                            </p>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Código de 6 caracteres (ej. A1B2C3)"
                                    className="text-center text-lg uppercase tracking-widest font-mono h-14"
                                    maxLength={8}
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-destructive text-sm text-center font-medium bg-destructive/10 p-2 rounded">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-bold shadow-md"
                                disabled={loading || accessCode.length < 3}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Unirse al Grupo
                                        <ArrowRight className="w-5 h-5 ml-2" />
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
