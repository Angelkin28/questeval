'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Loader2, ArrowLeft, Landmark, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Alumno' as 'Alumno' | 'Profesor'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setLoading(false);
            return;
        }

        const emailLower = formData.email.toLowerCase();
        const emailDomain = emailLower.split('@')[1];
        const isTestEmail = emailLower.endsWith('testquesteval@gmail.com');
        if (!isTestEmail) {
            if (formData.role === 'Alumno' && emailDomain !== 'alumno.utmetropolitana.edu.mx') {
                setError('Los alumnos deben usar su correo Institucional');
                setLoading(false);
                return;
            }
            if (formData.role === 'Profesor' && emailDomain !== 'utmetropolitana.edu.mx') {
                setError('Los Maestros deben usar su correo Institucional');
                setLoading(false);
                return;
            }
        }

        try {
            const derivedEnrollment = formData.role === 'Alumno'
                ? formData.email.split('@')[0]
                : '';

            await api.auth.register({
                email: formData.email,
                enrollment: derivedEnrollment,
                password: formData.password,
                fullName: formData.fullName,
                role: formData.role
            });

            const isTestEmail = formData.email.toLowerCase().endsWith('testquesteval@gmail.com');

            if (isTestEmail) {
                // Cuentas de test ya están verificadas y aprobadas, ir directo al login
                router.push(`/login?registered=true`);
            } else {
                // Enviar OTP automáticamente
                try {
                    await fetch('http://localhost:5122/api/Users/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: formData.email })
                    });
                } catch (otpError) {
                    console.error('Error enviando OTP:', otpError);
                }
                router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}&role=${formData.role}`);
            }
        } catch (err: any) {
            const msg: string = err.message || '';
            if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already exist') || msg.toLowerCase().includes('exist')) {
                setError('Correo ya existente, favor de ingresar uno nuevo');
            } else {
                setError(msg || 'Error al registrarse');
            }
        } finally {
            setLoading(false);
        }
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
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold title-serif mb-2 tracking-tight">
                            Nuevo Registro
                        </h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
                            Únete al sistema de gremios
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                ROL EN EL SISTEMA
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Alumno' })}
                                    className={`flex-1 h-10 text-[10px] font-bold uppercase tracking-widest rounded-lg border-2 transition-all ${formData.role === 'Alumno' ? 'bg-black text-white border-black' : 'bg-transparent text-muted-foreground border-muted-foreground/20'}`}
                                >
                                    Alumno
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Profesor' })}
                                    className={`flex-1 h-10 text-[10px] font-bold uppercase tracking-widest rounded-lg border-2 transition-all ${formData.role === 'Profesor' ? 'bg-black text-white border-black' : 'bg-transparent text-muted-foreground border-muted-foreground/20'}`}
                                >
                                    Maestro
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                NOMBRE COMPLETO
                            </label>
                            <Input
                                name="fullName"
                                type="text"
                                placeholder="Nombre y Apellido"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="h-10 bg-white border-muted-foreground/20 focus-visible:ring-foreground rounded-lg px-4 text-sm placeholder:text-muted-foreground/50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                CORREO INSTITUCIONAL
                            </label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="Correo institucional"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-10 bg-white border-muted-foreground/20 focus-visible:ring-foreground rounded-lg px-4 text-sm placeholder:text-muted-foreground/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                CONTRASEÑA
                            </label>
                            <div className="relative">
                                <Input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Ex. ••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="h-12 bg-white border-muted-foreground/20 focus-visible:ring-foreground rounded-lg px-4 pr-11 text-base tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 pl-1 block">
                                CONFIRMAR CONTRASEÑA
                            </label>
                            <div className="relative">
                                <Input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Ex. ••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="h-12 bg-white border-muted-foreground/20 focus-visible:ring-foreground rounded-lg px-4 pr-11 text-base tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-destructive text-xs text-center font-medium bg-destructive/5 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold uppercase tracking-wider text-xs rounded-lg mt-6 shadow-lg transition-transform active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'REGISTRARME'
                            )}
                        </Button>

                        <div className="text-center pt-4">
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); router.push('/login'); }}
                                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground font-bold transition-colors border-b border-transparent hover:border-foreground pb-0.5"
                            >
                                Ya tengo cuenta <span className="mx-1">→</span> Ingresar
                            </a>
                        </div>
                    </form>
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
