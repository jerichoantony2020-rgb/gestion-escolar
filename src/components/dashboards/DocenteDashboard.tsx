"use client"

import type { Session } from "next-auth"
import Link from "next/link"
import ModulesOrbit, { type ConstelModule } from "./ModulesOrbit"

const modules: ConstelModule[] = [
  { href: "/dashboard/academico/notas",      label: "Notas",      icon: "notas",           desc: "Registrar calificaciones", hue: "#1B47D6", active: true },
  { href: "/dashboard/academico/asistencia", label: "Registro de asistencia", icon: "tomarAsistencia", desc: "Consultar y exportar", hue: "#15803D" },
  { href: "/dashboard/academico/conducta",   label: "Conducta",   icon: "conducta",        desc: "Incidencias del aula",     hue: "#A5540A" },
  { href: "/dashboard/psicologia",           label: "Psicología", icon: "psicologia",      desc: "Derivar un alumno",        hue: "#7C3AED" },
  { href: "/dashboard/biblioteca",           label: "Plan lector", icon: "biblioteca",     desc: "Lecturas y avances",       hue: "#A5540A" },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

export default function DocenteDashboard({ session }: { session: Session | null }) {
  const name = session?.user?.name?.split(" ")[0] ?? "Docente"

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 48px" }}>

      <header className="brand-field" style={{
        borderRadius: 22,
        padding: "clamp(26px,4vw,38px) clamp(24px,4vw,40px)",
        marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
        overflow: "hidden", position: "relative",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 88% 18%, rgba(240,200,0,.14), transparent 45%), radial-gradient(circle at 70% 120%, rgba(71,181,232,.16), transparent 50%)",
        }} />
        <div style={{ position: "relative" }}>
          <h1 suppressHydrationWarning style={{ fontSize: "clamp(24px,3.2vw,34px)", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {greeting()}, {name}
          </h1>
          <p suppressHydrationWarning style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-cr.png" alt="" style={{ position: "relative", width: 74, height: 90, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 6px 18px rgba(240,200,0,0.22))" }} />
      </header>

      {/* Es lo que el docente hace todos los días y casi siempre desde el
          celular: va primero y ocupa el ancho completo. */}
      <Link href="/dashboard/asistencia" className="accion-mayor">
        <span className="accion-mayor-ic">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
            <path d="M7 12h10" />
          </svg>
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="accion-mayor-t">Tomar asistencia</span>
          <span className="accion-mayor-d">Escanea el código del alumno o búscalo por su nombre</span>
        </span>
        <svg className="accion-mayor-go" width="21" height="21" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </Link>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 8px", textAlign: "center" }}>
          Tus herramientas
        </h2>
        <ModulesOrbit modules={modules} />
      </section>

    </div>
  )
}
