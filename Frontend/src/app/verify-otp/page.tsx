'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ArrowRight, RefreshCw, Mail } from 'lucide-react';

// Se necesita envolver en Suspense para useSearchParams en Next.js App Router
const VerifyOtpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const role = searchParams.get('role');

  // Estado para cada uno de los 6 dígitos
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (index: number, value: string) => {
    // Solo permitir números
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir retroceso para borrar y mover foco atrás
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlResendCode = async () => {
    if (!email) {
      setError('No se encontró el email para reenviar el código.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5122/api/Users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al reenviar código');
      }

      setSuccess('Código reenviado exitosamente. Revisa tu correo.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');

    if (otpCode.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos.');
      return;
    }

    if (!email) {
      setError('Email no válido.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5122/api/Users/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otpCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Código incorrecto o expirado');
      }

      setSuccess('¡Verificación exitosa!');

      // Redirigir según el rol
      setTimeout(() => {
        // Todos los roles van al login directamente; el backend ya los aprueba automáticamente
        router.push('/login?verified=true');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div className="text-center mb-8">
        <div className="bg-purple-100 p-4 rounded-full inline-flex mb-4">
          <ShieldCheck className="w-10 h-10 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificación de Email</h1>
        <p className="text-gray-600">
          Hemos enviado un código de 6 dígitos a <br />
          <span className="font-medium text-purple-600">{email || 'tu correo'}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 mb-8">
          {digits.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 text-center">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Verificar Email
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={handlResendCode}
          disabled={loading}
          className="text-sm text-gray-500 hover:text-purple-600 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <Mail className="w-4 h-4" />
          ¿No recibiste el código? Reenviar
        </button>
      </div>
    </div>
  );
};

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-purple-600 font-medium">Cargando verificación...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
