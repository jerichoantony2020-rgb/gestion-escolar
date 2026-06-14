"use client"

import type { Session } from "next-auth"
import Link from "next/link"

export default function DocenteDashboard({ session }: { session: Session | null }) {
  const name = session?.user?.name?.split(" ")[0] ?? "Docente"

  const quickLinks = [
    { href: "/dashboard/academico/notas",      label: "Registrar notas",      icon: "📝" },
    { href: "/dashboard/academico/asistencia", label: "Tomar asistencia",     icon: "✅" },
    { href: "/dashboard/academico/conducta",   label: "Conducta",             icon: "📋" },
    { href: "/dashboard/biblioteca",           label: "Plan lector",          icon: "📖" },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
          Hola, {name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Panel docente — {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border p-5 hover:border-primary-400 transition-all group"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="text-3xl mb-3">{l.icon}</div>
            <p className="font-semibold text-sm group-hover:text-primary-500 transition-colors" style={{ color: "var(--fg)" }}>
              {l.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Anuncios placeholder */}
      <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--fg)" }}>Anuncios recientes</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Sin anuncios por ahora.</p>
      </div>
    </div>
  )
}
