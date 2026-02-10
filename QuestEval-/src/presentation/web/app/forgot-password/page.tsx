'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Loader2, ArrowLeft, Landmark, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simular envío de correo
        await new Promise(resolve => setTimeout(resolve, 2000));

        setLoading(false);
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-[#F8F7F2] flex flex-col items-center justify-between py-12 px-4 font-sans text-foreground">
            {/* Logo Superior */}
            <div className="flex flex-col items-center animate-fade-in relative w-full max-w-[400px]">
                <button
                    onClick={() => router.push('/login')}
                    className="absolute left-0 top-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center mb-3">
                    <Landmark className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h1 className="text-xl font-bold tracking-[0.2em] uppercase">
                    QUESTEVAL
                </h1>
            </div>

            {/* Tarjeta Central */}
            <Card className="w-full max-w-[400px] border-none shadow-sm bg-white mt-8 animate-fade-in duration-700">
                <CardContent className="pt-10 pb-10 px-8">
                    {!submitted ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold title-serif mb-2 tracking-tight">
                                    Recuperar Acceso
                                </h2>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
                                    Ingresa tu correo institucional o matrícula
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                        MATRÍCULA / CORREO
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="ID de Académico"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 bg-white border-muted-foreground/20 focus-visible:ring-foreground rounded-lg px-4 text-sm placeholder:text-muted-foreground/50"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg transition-transform active:scale-[0.98]"
                                    disabled={loading || !email}
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'ENVIAR INSTRUCCIONES'
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold title-serif mb-2">
                                ¡Correo Enviado!
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                Hemos enviado las instrucciones de recuperación a <strong>{email}</strong>.
                            </p>
                            <Button
                                onClick={() => router.push('/login')}
                                className="w-full h-12 bg-outline border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-colors"
                                variant="outline"
                            >
                                VOLVER AL LOGIN
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex flex-col items-center mt-8 animate-fade-in duration-1000 delay-200">
                <div className="w-12 h-12 rounded-full bg-[#EAE8E0] flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-white fill-white drop-shadow-sm" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
                    ACADEMIC GRADING SYSTEM © 2024
                </p>
            </div>
        </div>
    );
}
