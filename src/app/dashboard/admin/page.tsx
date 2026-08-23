import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!["director", "admin", "coordinador"].includes(role ?? "")) redirect("/dashboard")

  const sections = [
    { href: "/dashboard/admin/alumnos",   icon: "👩‍🎓", label: "Alumnos",         desc: "Matrícula y datos de estudiantes" },
    { href: "/dashboard/admin/usuarios",  icon: "👥",  label: "Usuarios",         desc: "Docentes y personal" },
    { href: "/dashboard/admin/apoderados", icon: "👨‍👩‍👧", label: "Apoderados",       desc: "Cuentas del portal familiar" },
    { href: "/dashboard/admin/aulas",     icon: "🏫",  label: "Niveles y Aulas",  desc: "Inicial, Primaria, Secundaria y aulas polígrado" },
    { href: "/dashboard/admin/cursos",    icon: "📚",  label: "Cursos",           desc: "Materias y escala de notas por nivel" },
    { href: "/dashboard/admin/competencias", icon: "🧭", label: "Competencias",   desc: "Nombre del curso que ve el apoderado en cada competencia" },
    { href: "/dashboard/admin/anuncios",  icon: "📢",  label: "Anuncios",         desc: "Comunicados institucionales" },
    { href: "/dashboard/admin/config",    icon: "⚙️",  label: "Configuración",    desc: "Datos del colegio y plantillas" },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Administración</h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Configuración y gestión institucional</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border p-5 hover:border-primary-400 transition-all group"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="text-3xl mb-3">{s.icon}</div>
            <p className="font-semibold text-sm group-hover:text-primary-500 transition-colors" style={{ color: "var(--fg)" }}>
              {s.label}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
