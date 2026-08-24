import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { MODULE_ICONS, type IconName } from "@/components/icons"

const secciones: { href: string; label: string; desc: string; icon: IconName; tile: string }[] = [
  { href: "/dashboard/admin/alumnos",      label: "Alumnos",             desc: "Matrícula, datos y fichas de los estudiantes",           icon: "estudiantes", tile: "#1B47D6" },
  { href: "/dashboard/admin/usuarios",     label: "Usuarios",            desc: "Docentes y personal, y qué aula y curso dicta cada uno", icon: "docentes",    tile: "#475569" },
  { href: "/dashboard/admin/apoderados",   label: "Apoderados",          desc: "Cuentas y códigos de acceso del portal familiar",        icon: "portal",      tile: "#0E7490" },
  { href: "/dashboard/admin/aulas",        label: "Niveles y aulas",     desc: "Inicial, Primaria, Secundaria y aulas polígrado",        icon: "secciones",   tile: "#15803D" },
  { href: "/dashboard/admin/cursos",       label: "Cursos",              desc: "Materias y escala de calificación por nivel",            icon: "academico",   tile: "#7C3AED" },
  { href: "/dashboard/admin/competencias", label: "Competencias",        desc: "Nombre del curso que ve el apoderado en cada competencia", icon: "notas",     tile: "#A5540A" },
  { href: "/dashboard/admin/anuncios",     label: "Anuncios",            desc: "Comunicados institucionales",                            icon: "noticia",     tile: "#B0301A" },
  { href: "/dashboard/admin/config",       label: "Configuración",       desc: "Datos del colegio y plantillas de WhatsApp",              icon: "admin",       tile: "#475569" },
]

function Chevron() {
  return (
    <svg className="index-row-go" width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!["director", "admin", "coordinador"].includes(role ?? "")) redirect("/dashboard")

  return (
    <>
      <div className="brand-field page-head">
        <div className="page-head-inner">
          <Link href="/dashboard" className="page-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Inicio
          </Link>
          <h1>Administración</h1>
          <p>Configuración y gestión institucional</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 48px" }}>
        <div className="index-list">
          {secciones.map(s => {
            const Icon = MODULE_ICONS[s.icon]
            return (
              <Link key={s.href} href={s.href} className="index-row"
                style={{ ["--tile" as string]: s.tile }}>
                <span className="tile"><Icon size={21} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="index-row-name" style={{ display: "block" }}>{s.label}</span>
                  <span className="index-row-desc" style={{ display: "block" }}>{s.desc}</span>
                </span>
                <Chevron />
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
