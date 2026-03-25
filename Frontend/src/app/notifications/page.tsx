'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    Clock,
    MessageSquare,
    AlertCircle,
    MoreVertical
} from 'lucide-react';

interface Notificacion {
    id: string;
    tipo: 'evaluación' | 'recordatorio' | 'mensaje' | 'sistema';
    titulo: string;
    mensaje: string;
    fecha: string;
    leido: boolean;
}

export default function NotificacionesPage() {
    const router = useRouter();

    // Datos simulados (luego conectarías con una API real)
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
        {
            id: '1',
            tipo: 'evaluación',
            titulo: 'Proyecto Evaluado',
            mensaje: 'Tu proyecto "Óolale" ha sido calificado con 92 puntos.',
            fecha: 'Hace 2 horas',
            leido: false,
        },
        {
            id: '2',
            tipo: 'mensaje',
            titulo: 'Nuevo comentario en Grupo',
            mensaje: 'María López comentó en "Desarrollo de Microservicios".',
            fecha: 'Hace 5 horas',
            leido: true,
        },
        {
            id: '3',
            tipo: 'recordatorio',
            titulo: 'Entrega Pendiente',
            mensaje: 'Recuerda subir tus avances del proyecto Integrador antes del viernes.',
            fecha: 'Ayer',
            leido: true,
        },
        {
            id: '4',
            tipo: 'sistema',
            titulo: 'Actualización del Sistema',
            mensaje: 'QuestEval v2.4.0 ya está disponible con nuevas funciones.',
            fecha: 'Hace 2 días',
            leido: true,
        },
    ]);

    const marcarComoLeido = (id: string) => {
        setNotificaciones(prev =>
            prev.map(n => (n.id === id ? { ...n, leido: true } : n))
        );
    };

    const marcarTodoLeido = () => {
        setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    };

    const getIcono = (tipo: string) => {
        switch (tipo) {
            case 'evaluación': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'recordatorio': return <Clock className="w-5 h-5 text-orange-500" />;
            case 'mensaje': return <MessageSquare className="w-5 h-5 text-blue-500" />;
            default: return <AlertCircle className="w-5 h-5 text-primary" />;
        }
    };

    const getBgColor = (tipo: string) => {
        switch (tipo) {
            case 'evaluación': return 'bg-green-500/10';
            case 'recordatorio': return 'bg-orange-500/10';
            case 'mensaje': return 'bg-blue-500/10';
            default: return 'bg-primary/10';
        }
    };

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold">Notificaciones</h1>
                        <p className="text-xs text-muted-foreground">Centro de novedades</p>
                    </div>
                </div>
                <button
                    onClick={marcarTodoLeido}
                    className="text-xs font-semibold text-primary hover:underline"
                >
                    Marcar todo leído
                </button>
            </header>

            <main className="px-4 py-6">
                {/* Lista de Notificaciones */}
                {notificaciones.length === 0 ? (
                    <div className="text-center py-12 animate-fade-in">
                        <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-semibold mb-1">Todo está tranquilo</h3>
                        <p className="text-muted-foreground text-sm">
                            No tienes notificaciones nuevas por ahora.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notificaciones.map((notif, index) => (
                            <Card
                                key={notif.id}
                                className={`transition-colors cursor-pointer animate-fade-in hover:shadow-md ${!notif.leido ? 'bg-card border-l-4 border-l-primary' : 'bg-background/50 border-border'
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={() => marcarComoLeido(notif.id)}
                            >
                                <CardContent className="p-4 flex gap-4">
                                    {/* Icono */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notif.tipo)}`}>
                                        {getIcono(notif.tipo)}
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-semibold truncate ${!notif.leido ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {notif.titulo}
                                            </h3>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {notif.fecha}
                                            </span>
                                        </div>
                                        <p className={`text-xs line-clamp-2 ${!notif.leido ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                                            {notif.mensaje}
                                        </p>
                                    </div>

                                    {/* Indicador no leído */}
                                    {!notif.leido && (
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0 animate-pulse" />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-8">
                    <p>QuestEval / Centro de Notificaciones</p>
                </div>
            </main>
        </div>
    );
}
