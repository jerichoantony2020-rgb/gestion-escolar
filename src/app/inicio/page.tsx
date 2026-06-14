"use client"

import Link from "next/link"
import Image from "next/image"
import {
  BookOpen,
  ClipboardList,
  DollarSign,
  Users,
  Heart,
  Book,
} from "lucide-react"

const modules = [
  {
    icon: BookOpen,
    title: "Gestión Académica",
    desc: "Notas, conducta, actas y libros de calificaciones digitales por bimestre.",
  },
  {
    icon: ClipboardList,
    title: "Asistencia",
    desc: "Control de asistencia diaria con código QR por aula y nivel educativo.",
  },
  {
    icon: DollarSign,
    title: "Finanzas",
    desc: "Registro de pagos, pensiones y conceptos de cobro con historial completo.",
  },
  {
    icon: Users,
    title: "Portal Familiar",
    desc: "Acceso para padres de familia a notas, asistencia y comunicados del colegio.",
  },
  {
    icon: Heart,
    title: "Ficha Médica",
    desc: "Historial de salud, alergias, vacunas y atenciones de cada alumno.",
  },
  {
    icon: Book,
    title: "Biblioteca",
    desc: "Catálogo digital, registro de préstamos y acervo del colegio.",
  },
]

export default function InicioPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Navegación ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0">
              <Image
                src="/logo-cr.svg"
                alt="Escudo I.E.P. Cristo Reina"
                fill
                className="object-contain"
              />
            </div>
            <div className="leading-none">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">I.E.P.</p>
              <p className="text-sm font-bold text-slate-800">Cristo Reina</p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: "#1A33CC" }}
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #060D3A 0%, #0C1A6B 45%, #1A33CC 100%)",
        }}
      >
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #F0C800 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Gold bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, transparent 0%, #F0C800 30%, #F0C800 70%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="text-white space-y-7">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "#F0C800" }}
            >
              UGEL N.&deg; 06 &bull; Ate-Vitarte, Lima
            </p>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight">
                Plataforma{" "}
                <span style={{ color: "#F0C800" }}>Institucional</span>
              </h1>
              <p className="text-lg text-blue-200 leading-relaxed max-w-md">
                Sistema integral de gestión escolar para la I.E.P. Cristo Reina.
                Conecta directivos, docentes y familias en un solo lugar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-slate-900 transition-all hover:brightness-105 active:scale-[0.97] shadow-lg"
                style={{ background: "#F0C800" }}
              >
                Acceder al sistema
              </Link>
              <a
                href="#modulos"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-white border transition-all hover:bg-white/10 active:scale-[0.97]"
                style={{ borderColor: "rgba(255,255,255,0.35)" }}
              >
                Ver módulos
              </a>
            </div>
          </div>

          {/* Right: shield */}
          <div className="flex justify-center md:justify-end">
            <div
              className="relative w-60 h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"
              style={{
                filter:
                  "drop-shadow(0 0 60px rgba(240,200,0,0.25)) drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
              }}
            >
              <Image
                src="/logo-cr.svg"
                alt="Escudo Oficial I.E.P. Cristo Reina"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Módulos ──────────────────────────────────────────────────── */}
      <section id="modulos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 max-w-lg">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              Módulos del sistema
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Herramientas diseñadas para cubrir cada área de la gestión escolar,
              desde la academia hasta el bienestar del alumno.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod) => (
              <div
                key={mod.title}
                className="group p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  background: "#F6F9FF",
                  borderColor: "#E4EBFF",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#A0B4FF"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E4EBFF"
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#EEF2FF" }}
                >
                  <mod.icon size={20} style={{ color: "#1A33CC" }} strokeWidth={1.8} />
                </div>
                <h3 className="font-bold text-slate-800 mb-1.5 text-sm">{mod.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Banda institucional ──────────────────────────────────────── */}
      <section
        className="py-14"
        style={{
          background: "linear-gradient(135deg, #060D3A 0%, #0C1A6B 60%, #1535A8 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center md:text-left">
          <div className="md:border-r md:pr-8" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: "#F0C800" }}
            >
              Institución
            </p>
            <p className="font-bold text-lg">I.E.P. Cristo Reina</p>
            <p className="text-blue-200 text-sm mt-1">
              Educación Inicial, Primaria y Secundaria
            </p>
          </div>
          <div className="md:border-r md:px-8" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: "#F0C800" }}
            >
              Dependencia
            </p>
            <p className="font-bold text-lg">UGEL N.&deg; 06</p>
            <p className="text-blue-200 text-sm mt-1">Ate-Vitarte, Lima, Peru</p>
          </div>
          <div className="md:pl-8">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: "#F0C800" }}
            >
              Acceso
            </p>
            <p className="font-bold text-lg">Solo personal autorizado</p>
            <p className="text-blue-200 text-sm mt-1">
              Contacte a direccion para obtener credenciales
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-7" style={{ background: "#040A2B" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 shrink-0">
              <Image
                src="/logo-cr.svg"
                alt="Logo Cristo Reina"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-slate-400">
              I.E.P. Cristo Reina &bull; UGEL 06 Ate-Vitarte
            </p>
          </div>
          <p className="text-xs text-slate-600">
            &copy; 2026 I.E.P. Cristo Reina. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
