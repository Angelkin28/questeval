'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Loader2, ArrowLeft, Quote } from 'lucide-react';

const quotes = [
    { text: 'La educación es el arma más poderosa que puedes usar para cambiar el mundo.', author: 'Nelson Mandela' },
    { text: 'El conocimiento es el único bien que crece cuando se comparte.', author: 'Proverbio académico' },
    { text: 'Evaluar no es juzgar, es acompañar el proceso de aprendizaje.', author: 'QuestEval' },
    { text: 'La excelencia no es un acto, sino un hábito cultivado cada día.', author: 'Aristóteles' },
    { text: 'Enseñar es aprender dos veces.', author: 'Joseph Joubert' },
];

const phrases = [
    'Como invitado, puedes explorar proyectos y compartir tu evaluación.',
    'Tu participación es valiosa para enriquecer el aprendizaje.',
    'Califica y comenta con libertad y respeto.',
    'La retroalimentación es un acto de generosidad académica.',
    'Una herramienta construida por y para la comunidad educativa.',
];

export default function GuestAccessPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setQuoteIndex((i) => (i + 1) % quotes.length);
                setPhraseIndex((i) => (i + 1) % phrases.length);
                setFade(true);
            }, 400);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleGuestAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!fullName.trim()) {
            setError('Por favor ingresa tu nombre.');
            setLoading(false);
            return;
        }

        try {
            const response = await api.auth.guestAccess({
                fullName: fullName.trim(),
            });

            // Almacenar datos de sesión
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify({
                userId: response.id,           // MongoDB ObjectId para crear evaluaciones
                guestUserId: response.userId,  // ID incremental como referencia visual
                fullName: response.fullName,
                role: response.role,
                token: response.token,
            }));

            // Redirigir al dashboard de invitados
            router.push('/guest-dashboard');

        } catch (err: any) {
            setError(err.message || 'Error al acceder como invitado. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#F8F7F2] font-sans overflow-hidden">

            {/* ── Panel Izquierdo — Decorativo ── */}
            <div className="hidden lg:flex flex-col justify-between w-[48%] min-h-screen bg-[#1A1A1A] px-16 py-12 relative overflow-hidden">

                {/* Fondo decorativo */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(-45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)`,
                            backgroundSize: '28px 28px',
                        }}
                    />
                </div>

                {/* Logo */}
                <div className="relative flex items-center gap-3">
                    <div className="w-9 h-9 rotate-45 border-2 border-[#D4AF37] flex items-center justify-center">
                        <GraduationCap className="-rotate-45 text-[#D4AF37] w-5 h-5" />
                    </div>
                    <span className="text-white text-sm font-bold tracking-[0.25em] uppercase">QuestEval</span>
                </div>

                {/* Cita central */}
                <div className="relative">
                    <Quote className="w-10 h-10 text-[#D4AF37]/30 mb-6" strokeWidth={1} />
                    <blockquote
                        className="text-white/80 text-2xl font-light leading-relaxed mb-6 max-w-sm transition-opacity duration-400"
                        style={{ opacity: fade ? 1 : 0 }}
                    >
                        "{quotes[quoteIndex].text}"
                    </blockquote>
                    <div className="flex items-center gap-3" style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.4s' }}>
                        <div className="w-8 h-px bg-[#D4AF37]" />
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                            {quotes[quoteIndex].author}
                        </p>
                    </div>

                    {/* Frases institucionales rotativas */}
                    <div className="mt-16 border-t border-white/10 pt-6">
                        <p
                            className="text-white/40 text-sm leading-relaxed italic transition-opacity duration-400"
                            style={{ opacity: fade ? 1 : 0 }}
                        >
                            {phrases[phraseIndex]}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative">
                    <div className="w-12 h-px bg-[#D4AF37]/40 mb-4" />
                    <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">
                        Sistema Institucional · Acceso Invitados
                    </p>
                </div>
            </div>

            {/* ── Panel Derecho — Formulario ── */}
            <div className="flex flex-col flex-1 min-h-screen">

                {/* Barra superior */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                    <Link
                        href="/login"
                        className="flex items-center gap-2 text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Atrás
                    </Link>
                    <p className="text-[10px] text-[#1A1A1A]/30 uppercase tracking-[0.2em]">
                        Acceso para Invitados
                    </p>
                </div>

                {/* Formulario centrado */}
                <div className="flex flex-1 items-center justify-center px-8 py-12">
                    <div className="w-full max-w-md">

                        {/* Cabecera */}
                        <div className="mb-10">
                            <div className="w-12 h-1 bg-[#D4AF37] mb-6" />
                            <h1 className="text-4xl font-semibold text-[#1A1A1A] tracking-tight mb-3">
                                Acceso como Invitado
                            </h1>
                            <p className="text-[#1A1A1A]/45 text-sm leading-relaxed">
                                Ingresa tu nombre para acceder a los proyectos, calificar evaluaciones y dejar tus comentarios.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleGuestAccess} className="space-y-5">

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 block">
                                    Tu Nombre
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Ej: Juan Pérez"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="h-12 bg-white border-[#1A1A1A]/12 focus-visible:ring-[#1A1A1A] rounded-sm px-4 text-sm placeholder:text-[#1A1A1A]/25 transition-all"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-sm px-4 py-3">
                                    <span className="text-xs font-medium">{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-13 mt-2 bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#D4AF37] font-bold uppercase tracking-[0.15em] text-xs rounded-sm shadow-lg transition-all duration-300"
                                style={{ height: '52px' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Continuar como Invitado'
                                )}
                            </Button>

                            <div className="pt-4 border-t border-black/8">
                                <p className="text-[10px] text-[#1A1A1A]/50 text-center leading-relaxed">
                                    Como invitado podrás ver proyectos, calificar y comentar. No necesitas crear una cuenta.
                                </p>
                            </div>
                        </form>

                        <p className="text-center text-[10px] text-[#1A1A1A]/25 uppercase tracking-widest mt-8">
                            ACADEMIC GRADING SYSTEM · © 2024
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
