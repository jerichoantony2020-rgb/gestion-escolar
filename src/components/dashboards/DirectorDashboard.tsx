"use client"

import { useEffect, useState } from "react"
import type { Session } from "next-auth"
import Link from "next/link"
import ModulesOrbit, { type ConstelModule } from "./ModulesOrbit"
import {
  IconEstudiantes, IconDocentes, IconSecciones, IconAsistencia,
  IconTomarAsistencia, IconNoticia, IconActividad, IconGlobo,
  type IconComponent,
} from "@/components/icons"

type Analitica = {
  totalStudents: number
  totalStaff: number
  sections: number
  attendancePct: number | null
}

const stats = [
  { key: "totalStudents", label: "Estudiantes",    Icon: IconEstudiantes, href: "/dashboard/admin/alumnos" },
  { key: "totalStaff",    label: "Docentes",       Icon: IconDocentes,    href: "/dashboard/admin/usuarios" },
  { key: "sections",      label: "Aulas",          Icon: IconSecciones,   href: "/dashboard/admin/aulas" },
  { key: "attendancePct", label: "Asistencia mes", Icon: IconAsistencia,  href: "/dashboard/academico/asistencia", suffix: "%" },
] as const

const modules: (ConstelModule & { requirePayments?: boolean })[] = [
  { href: "/dashboard/academico",  label: "Académico",   icon: "academico",  desc: "Notas, asistencia y conducta", hue: "#1B47D6", active: true },
  { href: "/dashboard/finanzas",   label: "Finanzas",    icon: "finanzas",   desc: "Pagos y recaudación",          hue: "#15803D", requirePayments: true },
  { href: "/dashboard/medico",     label: "Médico",      icon: "medico",     desc: "Fichas de salud",              hue: "#B0301A" },
  { href: "/dashboard/psicologia", label: "Psicología",  icon: "psicologia", desc: "Casos y seguimiento",          hue: "#7C3AED" },
  { href: "/dashboard/biblioteca", label: "Biblioteca",  icon: "biblioteca", desc: "Plan lector",                  hue: "#A5540A" },
  { href: "/dashboard/admin",      label: "Administrar", icon: "admin",      desc: "Usuarios, grados y config",    hue: "#475569" },
  { href: "/dashboard/analitica",  label: "Analítica",   icon: "analitica",  desc: "Reportes e indicadores",       hue: "#0E7490" },
]

const quickLinks: { href: string; label: string; Icon: IconComponent }[] = [
  { href: "/dashboard/academico/asistencia", label: "Tomar asistencia",  Icon: IconTomarAsistencia },
  { href: "/dashboard/admin/alumnos",        label: "Ver alumnos",       Icon: IconEstudiantes },
  { href: "/dashboard/admin/noticias",       label: "Publicar noticia",  Icon: IconNoticia },
  { href: "/dashboard/admin/actividades",    label: "Nueva actividad",   Icon: IconActividad },
  { href: "/inicio",                         label: "Página pública",    Icon: IconGlobo },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

export default function DirectorDashboard({ session }: { session: Session | null }) {
  const name = session?.user?.name?.split(" ")[0] ?? "Director"
  const canViewPayments = session?.user?.canViewPayments ?? false

  const [data, setData] = useState<Analitica | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    fetch("/api/analitica")
      .then(r => (r.ok ? r.json() : Promise.reject(new Error("no-data"))))
      .then(d => { if (alive) setData(d) })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 48px" }}>

      {/* ── Bienvenida: mismo campo azul que el resto de la plataforma ── */}
      <header className="brand-field" style={{
        borderRadius: 22,
        padding: "clamp(26px,4vw,38px) clamp(24px,4vw,40px)",
        marginBottom: 22,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
        overflow: "hidden",
      }}>
        <div style={{ position: "relative" }}>
          {/* El saludo y la fecha dependen de la hora local: el servidor (UTC) y el
              navegador (Perú) producen textos distintos, así que se marcan como
              contenido que sólo el cliente resuelve. */}
          <h1 suppressHydrationWarning style={{ fontSize: "clamp(24px,3.2vw,34px)", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {greeting()}, {name}
          </h1>
          <p suppressHydrationWarning style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-cr.png" alt="" style={{ position: "relative", width: 74, height: 90, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 6px 18px rgba(4,10,36,0.35))" }} />
      </header>

      {/* ── Panel de indicadores ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
        gap: 1, background: "var(--border)", borderRadius: 18, border: "1px solid var(--border)",
        boxShadow: "var(--shadow-1)", overflow: "hidden", marginBottom: 36,
      }}>
        {stats.map((s) => {
          const raw = data ? data[s.key] : null
          const value = raw === null || raw === undefined ? (failed || data ? "—" : null) : `${raw}${"suffix" in s ? s.suffix : ""}`
          return (
            <Link key={s.key} href={s.href} className="stat-cell">
              <span className="stat-icon"><s.Icon size={20} /></span>
              <span>
                <span className="stat-value">
                  {value === null ? <span className="stat-skeleton" aria-hidden="true" /> : value}
                </span>
                <span className="stat-label">{s.label}</span>
              </span>
            </Link>
          )
        })}
      </div>

      {/* ── Módulos ── (el título lo lleva el propio panel) */}
      <section>
        <ModulesOrbit modules={modules.filter(m => !m.requirePayments || canViewPayments)} />
      </section>

      {/* ── Acceso rápido ── */}
      <section style={{ marginTop: 32, paddingTop: 26, borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 14px" }}>
          Acceso rápido
        </h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {quickLinks.map(q => (
            <Link key={q.href} href={q.href} className="quick-link">
              <q.Icon size={16} />
              {q.label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
