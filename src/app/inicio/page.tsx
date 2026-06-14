"use client"

import Link from "next/link"
import Image from "next/image"

export default function InicioPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            CR
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>I.E.P.</p>
            <p className="text-sm font-bold leading-tight" style={{ color: "var(--fg)" }}>Cristo Reina</p>
          </div>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors"
        >
          Iniciar sesión
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 gap-6">
        <div className="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-2xl">
            CR
          </div>
        </div>

        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--fg)" }}>
            Plataforma Institucional
          </h1>
          <p className="text-lg" style={{ color: "var(--muted)" }}>
            I.E.P. Cristo Reina — Ate-Vitarte, Lima
          </p>
          <p className="text-base" style={{ color: "var(--muted)" }}>
            Sistema integral de gestión académica para docentes, directivos y familias.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-lg"
          >
            Acceder al sistema
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 max-w-2xl w-full">
          {[
            { icon: "📚", label: "Gestión académica" },
            { icon: "📋", label: "Asistencia QR" },
            { icon: "💰", label: "Pagos y finanzas" },
            { icon: "👨‍👩‍👧", label: "Portal familiar" },
            { icon: "🏥", label: "Ficha médica" },
            { icon: "📖", label: "Biblioteca" },
          ].map((f) => (
            <div
              key={f.label}
              className="p-4 rounded-xl border text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-xs font-medium" style={{ color: "var(--fg)" }}>{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-4 text-xs border-t" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
        © 2026 I.E.P. Cristo Reina — UGEL 06 Ate-Vitarte
      </footer>
    </main>
  )
}
