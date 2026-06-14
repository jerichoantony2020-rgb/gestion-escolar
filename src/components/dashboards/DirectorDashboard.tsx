"use client"

import type { Session } from "next-auth"
import Link from "next/link"

export default function DirectorDashboard({ session }: { session: Session | null }) {
  const name = session?.user?.name?.split(" ")[0] ?? "Director"

  const stats = [
    { label: "Estudiantes",   value: "—", icon: "👩‍🎓", href: "/dashboard/admin/alumnos" },
    { label: "Docentes",      value: "—", icon: "👩‍🏫", href: "/dashboard/admin/usuarios" },
    { label: "Secciones",     value: "—", icon: "🏫", href: "/dashboard/admin/secciones" },
    { label: "Asistencia hoy",value: "—", icon: "✅", href: "/dashboard/academico/asistencia" },
  ]

  const modules = [
    { href: "/dashboard/academico",  label: "Académico",  icon: "📚", desc: "Notas, asistencia y conducta" },
    { href: "/dashboard/finanzas",   label: "Finanzas",   icon: "💰", desc: "Pagos y recaudación", requirePayments: true },
    { href: "/dashboard/medico",     label: "Médico",     icon: "🏥", desc: "Fichas de salud" },
    { href: "/dashboard/biblioteca", label: "Biblioteca", icon: "📖", desc: "Plan lector" },
    { href: "/dashboard/admin",      label: "Administrar",icon: "⚙️", desc: "Usuarios, grados y config" },
    { href: "/dashboard/analitica",  label: "Analítica",  icon: "📊", desc: "Reportes e indicadores" },
  ]

  const canViewPayments = session?.user?.canViewPayments ?? false

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
          Buenos días, {name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Panel de dirección — I.E.P. Cristo Reina
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border p-4 hover:border-primary-300 transition-colors"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-xl font-bold" style={{ color: "var(--fg)" }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Module grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>
          Módulos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {modules
            .filter((m) => !m.requirePayments || canViewPayments)
            .map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-xl border p-5 hover:border-primary-400 hover:shadow-sm transition-all group"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="text-3xl mb-3">{m.icon}</div>
                <p className="font-semibold text-sm group-hover:text-primary-500 transition-colors" style={{ color: "var(--fg)" }}>
                  {m.label}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{m.desc}</p>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
