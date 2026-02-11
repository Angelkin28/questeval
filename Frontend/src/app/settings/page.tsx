'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Settings,
    Bell,
    Moon,
    Globe,
    ShieldCheck,
    Smartphone,
    Save,
    ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert('Configuración guardada correctamente');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Configuración" showBack />

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="flex items-center gap-3 mb-8 animate-fade-in">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold title-serif">Preferencias</h1>
                        <p className="text-sm text-muted-foreground">Gestiona cómo interactúas con QuestEval</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* General Section */}
                    <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">General</h2>
                        <Card>
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Notificaciones Push</p>
                                            <p className="text-xs text-muted-foreground">Recibir alertas de nuevas evaluaciones</p>
                                        </div>
                                    </div>
                                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                                </div>
                                <div className="flex items-center justify-between p-4 border-b">
                                    <div className="flex items-center gap-3">
                                        <Moon className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Modo Oscuro</p>
                                            <p className="text-xs text-muted-foreground">Ajustar la apariencia del sistema</p>
                                        </div>
                                    </div>
                                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                                </div>
                                <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Idioma</p>
                                            <p className="text-xs text-muted-foreground">Español (Latinoamérica)</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Security Section */}
                    <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">Seguridad</h2>
                        <Card>
                            <CardContent className="p-0">
                                <button className="w-full flex items-center justify-between p-4 border-b hover:bg-secondary/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                                        <p className="text-sm font-medium">Cambiar Contraseña</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                                        <p className="text-sm font-medium">Dispositivos Vinculados</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="pt-4 flex gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
                        <Button
                            className="flex-1 bg-black text-white hover:bg-black/90 font-bold uppercase tracking-widest text-xs h-12"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 font-bold uppercase tracking-widest text-xs h-12"
                            onClick={() => router.back()}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
