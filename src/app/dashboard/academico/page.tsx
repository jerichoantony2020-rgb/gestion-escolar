export default function AcademicoPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Módulo Académico</h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Gestión de notas, asistencia y conducta</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/academico/notas-area", icon: "📝", label: "Registro de notas",    desc: "Notas por competencia (formato MINEDU: AD/A/B/C)" },
          { href: "/dashboard/academico/asistencia", icon: "✅", label: "Asistencia",            desc: "Control diario con código QR" },
          { href: "/dashboard/academico/conducta",   icon: "📋", label: "Conducta",              desc: "Registro de incidencias y logros" },
          { href: "/dashboard/academico/boletin",    icon: "🎓", label: "Consultar notas",       desc: "Busca un alumno y ve su libreta o su detalle numérico" },
        ].map((m) => (
          <a
            key={m.href}
            href={m.href}
            className="rounded-xl border p-5 hover:border-primary-400 transition-all group"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="text-3xl mb-3">{m.icon}</div>
            <p className="font-semibold text-sm group-hover:text-primary-500 transition-colors" style={{ color: "var(--fg)" }}>
              {m.label}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{m.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
