'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Loader2, Home as HomeIcon, Landmark } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '', // Se usará como matrícula
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.auth.login({
                email: formData.email,
                password: formData.password
            });
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response));
            router.push('/dashboard');
        } catch (err: any) {
            // Demo fallback si falla API
            if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
                // Guardar un usuario genérico basado en la matrícula ingresada
                const demoUser = {
                    userId: 'demo-123',
                    email: formData.email,
                    enrollment: 'D2024001',
                    fullName: formData.email.includes('@') ? formData.email.split('@')[0] : 'Usuario Demo',
                    role: formData.email.toLowerCase().includes('maestro') ? 'Maestro' : 'Alumno',
                    token: 'demo-token'
                };
                localStorage.setItem('user', JSON.stringify(demoUser));
                localStorage.setItem('token', 'demo-token');
                router.push('/dashboard');
                return;
            }
            setError('Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F7F2] flex flex-col items-center justify-between py-12 px-4 font-sans text-foreground">
            {/* Logo Superior */}
            <div className="flex flex-col items-center animate-fade-in">
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
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold title-serif mb-3 tracking-tight">
                            Identificación
                        </h2>
                        <p className="text-sm text-muted-foreground mx-auto max-w-[240px] leading-relaxed">
                            Ingresa tus credenciales para acceder al sistema de gremios
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                MATRÍCULA
                            </label>
                            <Input
                                name="email"
                                type="text"
                                placeholder="ID de Académico"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-12 bg-white border-muted-foreground/20 focus-visible:ring-foreground rounded-lg px-4 text-sm placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                CONTRASEÑA
                            </label>
                            <Input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="h-12 bg-white border-muted-foreground/20 focus-visible:ring-foreground rounded-lg px-4 text-base tracking-widest"
                            />
                        </div>

                        {error && (
                            <div className="text-destructive text-xs text-center font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold uppercase tracking-wider text-xs rounded-lg mt-4 shadow-lg transition-transform active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'INGRESAR'
                            )}
                        </Button>

                        <div className="text-center pt-4 flex flex-col gap-3">
                            <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground font-bold transition-colors">
                                ¿Olvido su contraseña?
                            </Link>
                            <Link
                                href="/register"
                                className="text-[10px] uppercase tracking-widest text-foreground font-bold border-b border-foreground/20 hover:border-foreground pb-0.5 transition-colors inline-block mx-auto"
                            >
                                Registrarse
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex flex-col items-center mt-8 animate-fade-in duration-1000 delay-200">
                <div className="w-16 h-16 rounded-full bg-[#EAE8E0] flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-white fill-white drop-shadow-sm" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
                    ACADEMIC GRADING SYSTEM © 2024
                </p>
            </div>
        </div>
    );
}
