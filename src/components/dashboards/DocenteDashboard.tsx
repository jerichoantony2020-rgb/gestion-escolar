"use client"

import type { Session } from "next-auth"
import ModulesOrbit, { type ConstelModule } from "./ModulesOrbit"

const modules: ConstelModule[] = [
  { href: "/dashboard/academico/notas",      label: "Notas",      icon: "notas",           desc: "Registrar calificaciones", hue: "#8FB0FF", active: true },
  { href: "/dashboard/academico/asistencia", label: "Asistencia", icon: "tomarAsistencia", desc: "Marcar y consultar",       hue: "#6FE0A0" },
  { href: "/dashboard/academico/conducta",   label: "Conducta",   icon: "conducta",        desc: "Incidencias del aula",     hue: "#FFC978" },
  { href: "/dashboard/psicologia",           label: "Psicología", icon: "psicologia",      desc: "Derivar un alumno",        hue: "#C4A9FF" },
  { href: "/dashboard/biblioteca",           label: "Plan lector", icon: "biblioteca",     desc: "Lecturas y avances",       hue: "#7FE3D0" },
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

      <header style={{
        borderRadius: 22,
        background: "linear-gradient(135deg, #0D1E3A 0%, #16306B 58%, #1A33CC 100%)",
        padding: "clamp(26px,4vw,38px) clamp(24px,4vw,40px)",
        marginBottom: 36,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
        boxShadow: "0 2px 6px rgba(13,30,58,0.10), 0 18px 40px rgba(13,30,58,0.20)",
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 88% 18%, rgba(240,200,0,.14), transparent 45%), radial-gradient(circle at 70% 120%, rgba(71,181,232,.16), transparent 50%)",
        }} />
        <div style={{ position: "relative" }}>
          <h1 suppressHydrationWarning style={{ fontSize: "clamp(24px,3.2vw,34px)", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {greeting()}, {name}
          </h1>
          <p suppressHydrationWarning style={{ fontSize: 14, color: "rgba(255,255,255,0.68)", margin: 0 }}>
            {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-cr.png" alt="" style={{ position: "relative", width: 74, height: 90, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 6px 18px rgba(240,200,0,0.22))" }} />
      </header>

      <section>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#8A9ABB", textTransform: "uppercase", margin: "0 0 8px", textAlign: "center" }}>
          Tus herramientas
        </h2>
        <ModulesOrbit modules={modules} />
      </section>

    </div>
  )
}
