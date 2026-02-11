'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    setTimeout(() => setMostrar(true), 100);
  }, []);

  const handleAcceder = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] flex flex-col items-center justify-between p-8 font-sans text-foreground transition-colors duration-1000">
      {/* Espaciador Superior */}
      <div className="flex-1"></div>

      {/* Contenido Central */}
      <div
        className={`flex flex-col items-center justify-center transition-all duration-1000 ${mostrar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
      >
        {/* LOGO: Diamante con Birrete y Cruz Dorada */}
        <div className="mb-8 relative w-48 h-48 flex items-center justify-center">
          {/* Líneas de Cruz Doradas */}
          <div className="absolute w-full h-2 bg-[#D4AF37]"></div>
          <div className="absolute h-full w-2 bg-[#D4AF37]"></div>

          {/* Diamante Negro Central */}
          <div className="relative z-10 w-24 h-24 bg-[#1A1A1A] rotate-45 border-4 border-[#D4AF37] flex items-center justify-center shadow-lg">
            {/* Icono Birrete (rotado -45 para quedar derecho) */}
            <GraduationCap className="-rotate-45 text-white w-12 h-12" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-5xl md:text-6xl font-normal mb-2 tracking-[0.05em] title-serif text-center">
          QUESTEVAL
        </h1>

        {/* Subtítulo Dorado */}
        <p className="text-sm md:text-base text-[#D4AF37] uppercase tracking-[0.2em] text-center font-bold mb-4">
          SISTEMA DE EVALUACIÓN ACADÉMICA
        </p>

        {/* Línea Divisoria Dorada */}
        <div className="w-24 h-1 bg-[#D4AF37] mb-24"></div>

        {/* Botón de Acceso */}
        <Button
          onClick={handleAcceder}
          className="w-full max-w-[320px] h-14 bg-[#1A1A1A] text-white hover:bg-black font-bold uppercase tracking-[0.2em] text-sm shadow-xl transition-all rounded-none"
          style={{ borderRadius: '2px' }}
        >
          ACCEDER AL SISTEMA
        </Button>
      </div>

      {/* Espaciador Inferior */}
      <div className="flex-1"></div>

      {/* Footer */}
      <div
        className={`text-center pb-4 transition-all duration-1000 delay-500 ${mostrar ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em] font-medium">
          V.2.4.0 • INSTITUTIONAL ACCESS
        </p>
      </div>
    </div>
  );
}
