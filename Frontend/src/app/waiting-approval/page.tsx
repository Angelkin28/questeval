'use client';

import Link from 'next/link';
import { Clock, CheckCircle } from 'lucide-react';

export default function WaitingApprovalPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center">
                <div className="bg-yellow-100 p-5 rounded-full inline-flex mb-6 animate-pulse">
                    <Clock className="w-12 h-12 text-yellow-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">Solicitud en Revisión</h1>

                <div className="space-y-4 text-gray-600 mb-8">
                    <p className="text-lg">
                        ¡Gracias por regístrate en <span className="font-bold text-purple-600">QuestEval</span>!
                    </p>
                    <p>
                        Tu cuenta de <strong>Profesor</strong> ha sido creada y verifieda, pero requiere aprobación de un administrador antes de que puedas acceder a la plataforma.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <p className="flex items-center justify-center gap-2 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Email verificado correctamente
                        </p>
                        <p className="mt-1">
                            Recibirás una notificación una vez que tu cuenta sea aprobada.
                        </p>
                    </div>
                </div>

                <Link
                    href="/login"
                    className="inline-block w-full bg-white border-2 border-purple-600 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
                >
                    Volver al Inicio de Sesión
                </Link>
            </div>
        </div>
    );
}
