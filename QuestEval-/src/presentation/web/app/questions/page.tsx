'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft,
    FileText,
    CheckCircle2,
    Send,
    AlertCircle
} from 'lucide-react';

interface Pregunta {
    id: number;
    pregunta: string;
    placeholder: string;
    respuesta: string;
}

export default function PreguntasCompresionPage() {
    const router = useRouter();
    const [enviando, setEnviando] = useState(false);

    const [preguntas, setPreguntas] = useState<Pregunta[]>([
        {
            id: 1,
            pregunta: '¿Cuál es el propósito principal de Óolale Mobile?',
            placeholder: 'Responde aquí...',
            respuesta: '',
        },
        {
            id: 2,
            pregunta: '¿Qué licencia es la más utilizada en el proyecto?',
            placeholder: 'Ej. MIT, Apache...',
            respuesta: '',
        },
        {
            id: 3,
            pregunta: '¿Cómo beneficia el diseño UAT a la eficiencia operativa?',
            placeholder: 'Analiza los beneficios...',
            respuesta: '',
        },
        {
            id: 4,
            pregunta: '¿Qué hallazgo de auditoría fue el más crítico?',
            placeholder: '',
            respuesta: '',
        },
        {
            id: 5,
            pregunta: 'Define el rol del "Compliance" en esta aplicación.',
            placeholder: '',
            respuesta: '',
        },
        {
            id: 6,
            pregunta: '¿Qué tecnologías se usaron para el seguimiento en tiempo real?',
            placeholder: '',
            respuesta: '',
        },
        {
            id: 7,
            pregunta: '¿Cómo se integra la validación de requerimientos técnicos?',
            placeholder: '',
            respuesta: '',
        },
        {
            id: 8,
            pregunta: '¿A qué público objetivo está dirigida la herramienta?',
            placeholder: '',
            respuesta: '',
        },
        {
            id: 9,
            pregunta: '¿Cuál es la versión actual del sistema?',
            placeholder: '',
            respuesta: '',
        },
        {
            id: 10,
            pregunta: '¿Menciona una mejora futura planificada.',
            placeholder: '',
            respuesta: '',
        },
    ]);

    const handleRespuestaChange = (id: number, valor: string) => {
        setPreguntas(preguntas.map(p =>
            p.id === id ? { ...p, respuesta: valor } : p
        ));
    };

    const handleEnviar = async () => {
        setEnviando(true);
        // Simular envío
        await new Promise(resolve => setTimeout(resolve, 2000));
        setEnviando(false);
        router.push('/evaluacion-detalle');
    };

    const preguntasRespondidas = preguntas.filter(p => p.respuesta.trim() !== '').length;
    const progreso = (preguntasRespondidas / preguntas.length) * 100;

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="hover:bg-secondary rounded-full p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold">Preguntas de Comprensión</h1>
                        <p className="text-xs text-muted-foreground">
                            {preguntasRespondidas}/{preguntas.length} respondidas
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold text-primary">
                        {Math.round(progreso)}%
                    </div>
                </div>
            </header>

            <main className="px-4 py-6">
                {/* Título */}
                <div className="mb-6 animate-fade-in">
                    <h2 className="text-3xl font-bold title-serif mb-2">
                        Preguntas de Comprensión
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Responde las siguientes preguntas sobre el proyecto Óolale Mobile
                    </p>
                </div>

                {/* Barra de Progreso */}
                <Card className="mb-6 shadow-sm animate-fade-in">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Progreso
                            </span>
                            <span className="text-xs font-semibold text-primary">
                                {preguntasRespondidas} de {preguntas.length}
                            </span>
                        </div>
                        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-chart-1 rounded-full transition-all duration-500"
                                style={{ width: `${progreso}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Instrucciones */}
                <Card className="mb-6 bg-primary/5 border-primary/20 animate-fade-in">
                    <CardContent className="p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Instrucciones</p>
                            <p className="text-xs text-muted-foreground">
                                Responde cada pregunta de manera clara y concisa. Tus respuestas serán evaluadas por el profesor.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Preguntas */}
                <div className="space-y-4 mb-6">
                    {preguntas.map((pregunta, index) => (
                        <Card
                            key={pregunta.id}
                            className="shadow-sm animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-primary">{pregunta.id}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-sm mb-3">
                                            {pregunta.pregunta}
                                        </h3>
                                        <Textarea
                                            placeholder={pregunta.placeholder || 'Escribe tu respuesta aquí...'}
                                            value={pregunta.respuesta}
                                            onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                                            className="min-h-[100px] resize-none"
                                        />
                                        {pregunta.respuesta.trim() !== '' && (
                                            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>Respondida</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Botón Enviar */}
                <Button
                    onClick={handleEnviar}
                    disabled={enviando || preguntasRespondidas === 0}
                    className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 font-semibold uppercase tracking-wide text-base shadow-lg"
                >
                    {enviando ? (
                        <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            Enviando Evaluación...
                        </span>
                    ) : (
                        <>
                            <Send className="w-5 h-5 mr-2" />
                            Enviar Evaluación
                        </>
                    )}
                </Button>

                {preguntasRespondidas < preguntas.length && (
                    <p className="text-center text-xs text-muted-foreground mt-3">
                        Faltan {preguntas.length - preguntasRespondidas} preguntas por responder
                    </p>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground italic mt-12">
                    <p>QuestEval / valid of Academic Achievement © 2024</p>
                </div>
            </main>
        </div>
    );
}
