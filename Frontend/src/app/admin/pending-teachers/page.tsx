'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Check, X, Search, Loader2, AlertCircle,
    UserCheck, ShieldCheck
} from 'lucide-react';

interface PendingTeacher {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
}

export default function PendingTeachersPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<PendingTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        // Verificar si es admin (esto debería validarse mejor con contexto/token)
        // const userData = localStorage.getItem('user');
        // if (!userData || JSON.parse(userData).role !== 'Admin') {
        //   router.push('/login');
        //   return;
        // }

        fetchTeachers();
    }, [router]);

    const fetchTeachers = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5122/api/Users/pending-teachers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Error al cargar maestros');
            const data = await response.json();
            setTeachers(data);
        } catch (err) {
            setError('No se pudieron cargar las solicitudes pendientes.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (teacherId: string, status: 'approved' | 'rejected') => {
        setActionLoading(teacherId);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:5122/api/Users/approve-teacher', { // Use relative URL or env var in real app
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ teacherId, status }),
            });

            if (!response.ok) throw new Error('Error al procesar la solicitud');

            // Actualizar la lista localmente
            setTeachers(prev => prev.filter(t => t.id !== teacherId));

            // Mostrar toast o mensaje de éxito (opcional)

        } catch (err) {
            alert('Error: No se pudo completar la acción.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-purple-600" />
                            Panel de Administración
                        </h1>
                        <p className="text-gray-500 mt-2">Gestión de solicitudes de profesores</p>
                    </div>

                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Users className="w-4 h-4" />
                        Pendientes: <span className="text-purple-600 font-bold">{teachers.length}</span>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 mb-6">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-gray-500" />
                            Solicitudes de Ingreso
                        </h2>
                        <button
                            onClick={fetchTeachers}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                        >
                            Actualizar lista
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                            Cargando solicitudes...
                        </div>
                    ) : teachers.length === 0 ? (
                        <div className="p-16 text-center text-gray-500">
                            <UserCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-lg font-medium">No hay solicitudes pendientes</p>
                            <p className="text-sm">Todo está al día por aquí.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Profesor</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Fecha Solicitud</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {teachers.map((teacher) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{teacher.fullName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                                                {teacher.email}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {new Date(teacher.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 flex justify-center gap-3">
                                                <button
                                                    onClick={() => handleAction(teacher.id, 'approved')}
                                                    disabled={actionLoading === teacher.id}
                                                    className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-sm disabled:opacity-50"
                                                >
                                                    {actionLoading === teacher.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    Aprobar
                                                </button>

                                                <button
                                                    onClick={() => handleAction(teacher.id, 'rejected')}
                                                    disabled={actionLoading === teacher.id}
                                                    className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm disabled:opacity-50"
                                                >
                                                    {actionLoading === teacher.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <X className="w-4 h-4" />
                                                    )}
                                                    Rechazar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
