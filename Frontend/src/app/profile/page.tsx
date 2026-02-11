'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type UserResponse, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    Award,
    Edit2,
    Save,
    X,
    LogOut,
    Shield
} from 'lucide-react';

export default function PerfilPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserResponse | null>(null);
    const [editando, setEditando] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
    });
    const [stats, setStats] = useState({ proyectos: 0, grupos: 0, promedio: 89 });

    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setAvatar(userData.avatarUrl || null);
            setFormData({
                fullName: userData.fullName || '',
                email: userData.email || '',
            });
            // ... (fetchStats existing code)
            const fetchStats = async () => {
                try {
                    const dashboardStats = await api.dashboard.getStats();
                    setStats({
                        proyectos: dashboardStats.proyectos || 0,
                        grupos: dashboardStats.grupos || 0,
                        promedio: 89 // This one might still be static if not in API
                    });
                } catch (e) {
                    console.error("Error fetching profile stats", e);
                }
            };
            fetchStats();
        } else {
            router.push('/');
        }
    }, [router]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatar(base64String);
                // In a real app, you'd upload this to the server
                if (user) {
                    const updatedUser = { ...user, avatarUrl: base64String };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    // Optional: Call update user API
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGuardar = () => {
        // ... (handleGuardar existing code)
        if (user) {
            const updatedUser = { ...user, ...formData, avatarUrl: avatar || undefined };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
        setEditando(false);
    };

    const handleCancelar = () => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
            });
            setAvatar(user.avatarUrl || null);
        }
        setEditando(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
                <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">Q</span>
                    </div>
                    <span className="font-semibold text-lg">Mi Perfil</span>
                </div>
            </header>

            <main className="px-4 py-6">
                {/* Avatar y Nombre */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                            {avatar ? (
                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-primary-foreground">
                                    {user.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                                </span>
                            )}
                        </div>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute bottom-0 right-0 bg-white border border-border rounded-full p-1.5 shadow-sm cursor-pointer hover:bg-secondary transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </label>
                    </div>
                    <h1 className="text-2xl font-bold title-serif mb-1">
                        {user.fullName}
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Shield className="w-4 h-4" />
                        {user.role || 'Estudiante'}
                    </p>
                </div>

                {/* Información del Perfil */}
                <Card className="mb-6 shadow-md animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">Información Personal</h2>
                            {!editando && (
                                <Button
                                    onClick={() => setEditando(true)}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Editar
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Nombre Completo */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-2">
                                    <User className="w-3 h-3" />
                                    Nombre Completo
                                </label>
                                {editando ? (
                                    <Input
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="h-10"
                                    />
                                ) : (
                                    <p className="text-sm font-medium">{user.fullName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-2">
                                    <Mail className="w-3 h-3" />
                                    Correo Electrónico
                                </label>
                                {editando ? (
                                    <Input
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-10"
                                        type="email"
                                    />
                                ) : (
                                    <p className="text-sm font-medium">{user.email}</p>
                                )}
                            </div>

                            {/* Rol */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-2">
                                    <Shield className="w-3 h-3" />
                                    Rol
                                </label>
                                <p className="text-sm font-medium">{user.role || 'Estudiante'}</p>
                            </div>

                            {/* Fecha de Registro (simulada) */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-2">
                                    <Calendar className="w-3 h-3" />
                                    Miembro desde
                                </label>
                                <p className="text-sm font-medium">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Enero 2026'}
                                </p>
                            </div>
                        </div>

                        {/* Botones de Edición */}
                        {editando && (
                            <div className="flex gap-2 mt-6">
                                <Button
                                    onClick={handleGuardar}
                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Guardar Cambios
                                </Button>
                                <Button
                                    onClick={handleCancelar}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancelar
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Estadísticas */}
                <Card className="mb-6 shadow-md animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <CardContent className="p-5">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-primary" />
                            Estadísticas
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary title-serif">{stats.proyectos}</div>
                                <p className="text-xs text-muted-foreground mt-1">Proyectos</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary title-serif">{stats.grupos}</div>
                                <p className="text-xs text-muted-foreground mt-1">Grupos</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary title-serif">{stats.promedio}</div>
                                <p className="text-xs text-muted-foreground mt-1">Promedio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Acciones */}
                <div className="space-y-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <Button
                        variant="outline"
                        className="w-full h-12"
                        onClick={() => alert('Funcionalidad próximamente')}
                    >
                        Cambiar Contraseña
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-12 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-12">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>
        </div>
    );
}
