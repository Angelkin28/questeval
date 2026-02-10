'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    HelpCircle,
    Search,
    MessageCircle,
    FileText,
    Video,
    Mail,
    ChevronRight,
    ExternalLink
} from 'lucide-react';

export default function HelpPage() {
    const router = useRouter();

    const faqs = [
        { q: "¿Cómo subo mi proyecto?", a: "Ve al Dashboard y haz clic en 'Crear Nuevo Proyecto'. Sigue los pasos hasta completar Multimedia." },
        { q: "¿Qué pasa si olvido mi matrícula?", a: "Debes contactar al administrador del sistema o al departamento de servicios escolares." },
        { q: "¿Cómo veo mi puntaje?", a: "En la tarjeta de tu proyecto dentro del Dashboard aparecerá el estatus 'Evaluado' con tu nota final." },
        { q: "¿Quién evalúa los proyectos?", a: "Los maestros asignados al gremio o categoría correspondiente." }
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Centro de Ayuda" showBack />

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Search Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold title-serif mb-2">¿Cómo podemos ayudarte?</h1>
                    <p className="text-muted-foreground mb-6">Encuentra guías y respuestas rápidas para QuestEval</p>

                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar ayuda..."
                            className="pl-10 h-12 bg-white border-muted-foreground/20 rounded-xl shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Quick Access */}
                    <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <Card className="hover:border-primary transition-colors cursor-pointer group">
                            <CardContent className="p-5 flex flex-col items-center text-center">
                                <FileText className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-primary" />
                                <p className="text-sm font-bold uppercase tracking-wider">Manuales</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:border-primary transition-colors cursor-pointer group">
                            <CardContent className="p-5 flex flex-col items-center text-center">
                                <Video className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-primary" />
                                <p className="text-sm font-bold uppercase tracking-wider">Tutoriales</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* FAQ Section */}
                    <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-1">Preguntas Frecuentes</h2>
                        <Card>
                            <CardContent className="p-0">
                                {faqs.map((faq, i) => (
                                    <div key={i} className="p-4 border-b last:border-0">
                                        <p className="text-sm font-bold mb-1">{faq.q}</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Section */}
                    <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-1">Soporte Directo</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-4 bg-black text-white rounded-xl shadow-lg hover:bg-black/90 transition-all">
                                <div className="flex items-center gap-3">
                                    <MessageCircle className="w-5 h-5 text-white/70" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold">Chat de Soporte</p>
                                        <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium">Respuesta inmediata</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 bg-white border border-muted-foreground/20 rounded-xl hover:bg-secondary/50 transition-all">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold">Enviar Correo</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Respuesta en 24h</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* External Link */}
                    <div className="text-center pt-8 opacity-50">
                        <a href="#" className="text-xs flex items-center justify-center gap-2 hover:underline">
                            Documentación oficial del sistema <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
