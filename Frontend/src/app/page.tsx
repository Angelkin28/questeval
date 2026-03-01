'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ChevronRight, BookOpen, Users, BarChart3, Shield } from 'lucide-react';

const features = [
  { icon: BookOpen, label: 'Evaluaciones', desc: 'Crea y gestiona rúbricas de evaluación académica con precisión.' },
  { icon: Users, label: 'Grupos', desc: 'Organiza a tus alumnos en grupos y equipos de trabajo.' },
  { icon: BarChart3, label: 'Análisis', desc: 'Visualiza el desempeño académico con reportes detallados.' },
  { icon: Shield, label: 'Seguro', desc: 'Acceso controlado por roles: Admin, Profesor y Alumno.' },
];

export default function HomePage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#F8F7F2] font-sans overflow-hidden">

      {/* ── Panel Izquierdo — Marca (pantallas lg+) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] min-h-screen bg-[#1A1A1A] px-16 py-12 relative overflow-hidden">

        {/* Decoración de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)`,
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        {/* Logo superior */}
        <div
          className={`relative flex items-center gap-3 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
        >
          <div className="w-9 h-9 rotate-45 border-2 border-[#D4AF37] flex items-center justify-center">
            <GraduationCap className="-rotate-45 text-[#D4AF37] w-5 h-5" />
          </div>
          <span className="text-white text-sm font-bold tracking-[0.25em] uppercase">QuestEval</span>
        </div>

        {/* Contenido central */}
        <div className={`relative transition-all duration-1000 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-5">
            Sistema de Evaluación Académica
          </p>
          <h1 className="text-white text-5xl xl:text-6xl font-light leading-[1.1] mb-6 tracking-tight">
            Evalúa con<br />
            <span className="font-semibold text-[#D4AF37]">precisión</span><br />
            y confianza.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm mb-12">
            Plataforma institucional para la gestión integral de evaluaciones, rúbricas y seguimiento académico.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="group flex flex-col gap-2 p-4 border border-white/8 rounded-sm hover:border-[#D4AF37]/30 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer izquierdo */}
        <div className={`relative transition-all duration-1000 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-px bg-[#D4AF37]/40 mb-4" />
          <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">
            V.2.4.0 · Institutional Access · © 2024
          </p>
        </div>
      </div>

      {/* ── Panel Derecho — CTA ── */}
      <div className="flex flex-1 min-h-screen">

        {/* Formulario / CTA */}
        <div className="flex flex-col items-center justify-center flex-1 px-8 py-12 relative">

          {/* Logo visible solo en mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-8 h-8 rotate-45 border-2 border-[#1A1A1A] flex items-center justify-center">
              <GraduationCap className="-rotate-45 text-[#1A1A1A] w-4 h-4" />
            </div>
            <span className="text-[#1A1A1A] text-sm font-bold tracking-[0.25em] uppercase">QuestEval</span>
          </div>

          <div className={`w-full max-w-sm transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            <div className="mb-10">
              <div className="w-12 h-1 bg-[#D4AF37] mb-6" />
              <h2 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-3">
                Bienvenido
              </h2>
              <p className="text-[#1A1A1A]/50 text-sm leading-relaxed">
                Accede al sistema con tus credenciales institucionales para continuar.
              </p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="group w-full flex items-center justify-between h-14 px-6 bg-[#1A1A1A] text-white hover:bg-[#D4AF37] transition-all duration-300 font-bold uppercase tracking-[0.15em] text-xs shadow-lg mb-4"
            >
              <span>Acceder al Sistema</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            <button
              onClick={() => router.push('/register')}
              className="group w-full flex items-center justify-between h-12 px-6 border border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all duration-300 font-bold uppercase tracking-[0.15em] text-xs"
            >
              <span>Solicitar Registro</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            <p className="text-center text-[10px] text-[#1A1A1A]/30 uppercase tracking-widest mt-10">
              Acceso restringido · Solo personal autorizado
            </p>
          </div>
        </div>

        {/* ── Panel Decorativo — visible solo en md y cuando no hay panel lg izquierdo ── */}
        <div className="hidden md:flex lg:hidden w-[45%] min-h-screen bg-[#1A1A1A] flex-col justify-between px-10 py-12 relative overflow-hidden">
          {/* Fondo con patrón */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)`,
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          {/* Círculo decorativo grande */}
          <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full border border-[#D4AF37]/10" />
          <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full border border-[#D4AF37]/15" />

          {/* Logo */}
          <div className={`relative flex items-center gap-3 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <div className="w-9 h-9 rotate-45 border-2 border-[#D4AF37] flex items-center justify-center">
              <GraduationCap className="-rotate-45 text-[#D4AF37] w-5 h-5" />
            </div>
            <span className="text-white text-sm font-bold tracking-[0.25em] uppercase">QuestEval</span>
          </div>

          {/* Contenido central decorativo */}
          <div className={`relative transition-all duration-1000 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-4">
              Sistema de Evaluación
            </p>
            <h2 className="text-white text-3xl font-light leading-tight mb-4">
              Evalúa con<br />
              <span className="font-semibold text-[#D4AF37]">precisión.</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Plataforma institucional para la gestión de evaluaciones y rúbricas académicas.
            </p>

            {/* Features verticales condensadas */}
            <div className="flex flex-col gap-3">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center border border-[#D4AF37]/30 rounded-sm">
                    <Icon className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.5} />
                  </div>
                  <span className="text-white/50 text-xs uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`relative transition-all duration-1000 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-8 h-px bg-[#D4AF37]/40 mb-3" />
            <p className="text-white/20 text-[9px] uppercase tracking-[0.2em]">
              V.2.4.0 · © 2024
            </p>
          </div>

          {/* Elemento decorativo inferior */}
          <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full border border-[#D4AF37]/8" />
        </div>

      </div>
    </div>
  );
}
